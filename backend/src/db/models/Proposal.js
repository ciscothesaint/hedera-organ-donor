const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
    // On-chain data
    proposalId: {
        type: Number,
        required: true,
        unique: true,
    },
    blockchainTxId: {
        type: String,
        required: true,
    },

    // Proposal details
    proposalType: {
        type: String,
        enum: ['URGENCY_UPDATE', 'PATIENT_REMOVAL', 'SYSTEM_PARAMETER', 'EMERGENCY_OVERRIDE'],
        required: true,
    },
    urgencyLevel: {
        type: String,
        enum: ['EMERGENCY', 'STANDARD'],
        required: true,
    },

    // Patient information
    patientHash: {
        type: String,
        required: function() {
            return this.proposalType === 'URGENCY_UPDATE' || this.proposalType === 'PATIENT_REMOVAL';
        },
    },
    currentValue: {
        type: Number,
        min: 0,
        max: 100,
    },
    proposedValue: {
        type: Number,
        min: 0,
        max: 100,
    },

    // Justification
    reasoning: {
        type: String,
        required: true,
        minlength: 50, // Require substantial reasoning
    },
    evidenceHash: {
        type: String, // IPFS hash or URL
    },
    evidenceFiles: [{
        fileName: String,
        fileHash: String,
        fileType: String,
        uploadedAt: Date,
    }],

    // Creator information
    creatorAddress: {
        type: String,
        required: true,
    },
    creatorName: {
        type: String,
        required: true,
    },
    creatorHospitalId: {
        type: String,
    },

    // Voting timeline
    createdAt: {
        type: Date,
        default: Date.now,
    },
    votingDeadline: {
        type: Date,
        required: true,
    },
    executionTime: {
        type: Date,
    },

    // Voting results
    votesFor: {
        type: Number,
        default: 0,
    },
    votesAgainst: {
        type: Number,
        default: 0,
    },
    votesAbstain: {
        type: Number,
        default: 0,
    },
    totalVotingPower: {
        type: Number,
        required: true,
    },

    // Quorum and threshold
    quorumRequired: {
        type: Number, // Percentage
        required: true,
    },
    approvalThreshold: {
        type: Number, // Percentage
        required: true,
    },

    // Status
    status: {
        type: String,
        enum: ['PENDING', 'ACTIVE', 'APPROVED', 'REJECTED', 'EXECUTED', 'EXPIRED'],
        default: 'ACTIVE',
    },

    // Individual votes (for transparency)
    votes: [{
        voterAddress: {
            type: String,
            required: true,
        },
        voterName: {
            type: String,
            required: true,
        },
        voteChoice: {
            type: String,
            enum: ['APPROVE', 'REJECT', 'ABSTAIN'],
            required: true,
        },
        votingPower: {
            type: Number,
            required: true,
        },
        reasoning: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        transactionId: String, // Hedera transaction ID
    }],

    // Finalization details
    finalizedAt: {
        type: Date,
    },

    // Execution details
    executedAt: {
        type: Date,
    },
    executionTxId: {
        type: String,
    },
    executionError: {
        type: String,
    },

    // Metadata
    comments: [{
        authorAddress: String,
        authorName: String,
        comment: String,
        timestamp: {
            type: Date,
            default: Date.now,
        },
    }],
}, {
    timestamps: true, // Adds createdAt and updatedAt
});

// Indexes for efficient queries
// Note: proposalId already has unique index from schema definition
proposalSchema.index({ status: 1 });
proposalSchema.index({ creatorAddress: 1 });
proposalSchema.index({ patientHash: 1 });
proposalSchema.index({ votingDeadline: 1 });
proposalSchema.index({ urgencyLevel: 1, status: 1 });

// Virtual for calculating participation rate
proposalSchema.virtual('participationRate').get(function() {
    const totalVotes = this.votesFor + this.votesAgainst + this.votesAbstain;
    return (totalVotes / this.totalVotingPower) * 100;
});

// Virtual for calculating approval rate
proposalSchema.virtual('approvalRate').get(function() {
    const totalVotes = this.votesFor + this.votesAgainst + this.votesAbstain;
    if (totalVotes === 0) return 0;
    return (this.votesFor / totalVotes) * 100;
});

// Virtual for checking if voting is still open
proposalSchema.virtual('isVotingOpen').get(function() {
    return this.status === 'ACTIVE' && new Date() < this.votingDeadline;
});

// Virtual for time remaining
proposalSchema.virtual('timeRemaining').get(function() {
    if (!this.isVotingOpen) return 0;
    return Math.max(0, this.votingDeadline - Date.now());
});

// Method to add a vote
proposalSchema.methods.addVote = function(voteData) {
    this.votes.push(voteData);

    // Update vote counts
    if (voteData.voteChoice === 'APPROVE') {
        this.votesFor += voteData.votingPower;
    } else if (voteData.voteChoice === 'REJECT') {
        this.votesAgainst += voteData.votingPower;
    } else {
        this.votesAbstain += voteData.votingPower;
    }

    return this.save();
};

// Method to check if address has voted
proposalSchema.methods.hasVoted = function(address) {
    return this.votes.some(vote => vote.voterAddress === address);
};

// Method to finalize proposal (check results)
proposalSchema.methods.finalize = function() {
    const participationRate = this.participationRate;
    const approvalRate = this.approvalRate;

    // Check if voting period ended
    if (new Date() > this.votingDeadline) {
        // Check quorum
        if (participationRate < this.quorumRequired) {
            this.status = 'REJECTED';
            this.finalizedAt = new Date();
            return this.save();
        }

        // Check approval threshold
        if (approvalRate >= this.approvalThreshold) {
            this.status = 'APPROVED';
        } else {
            this.status = 'REJECTED';
        }

        this.finalizedAt = new Date();
        return this.save();
    }

    return Promise.resolve(this);
};

// Method to emergency finalize proposal (bypass deadline check)
proposalSchema.methods.emergencyFinalize = function() {
    const totalVotes = this.votesFor + this.votesAgainst;

    if (totalVotes === 0) {
        throw new Error('No votes cast yet');
    }

    const approvalPercentage = (this.votesFor / totalVotes) * 100;

    if (approvalPercentage < 75) {
        throw new Error('Requires 75% supermajority for emergency finalization');
    }

    // Determine outcome based on votes
    if (this.votesFor > this.votesAgainst) {
        this.status = 'APPROVED';
    } else {
        this.status = 'REJECTED';
    }

    // Set finalized timestamp
    this.finalizedAt = new Date();

    return this.save();
};

// Static method to get active proposals
proposalSchema.statics.getActiveProposals = function() {
    return this.find({
        status: 'ACTIVE',
        votingDeadline: { $gt: new Date() },
    }).sort({ votingDeadline: 1 });
};

// Static method to get emergency proposals
proposalSchema.statics.getEmergencyProposals = function() {
    return this.find({
        urgencyLevel: 'EMERGENCY',
        status: 'ACTIVE',
        votingDeadline: { $gt: new Date() },
    }).sort({ votingDeadline: 1 });
};

// Static method to get proposals by patient
proposalSchema.statics.getProposalsByPatient = function(patientHash) {
    return this.find({ patientHash }).sort({ createdAt: -1 });
};

// Static method to get proposals by creator
proposalSchema.statics.getProposalsByCreator = function(creatorAddress) {
    return this.find({ creatorAddress }).sort({ createdAt: -1 });
};

// Ensure virtuals are included in JSON
proposalSchema.set('toJSON', { virtuals: true });
proposalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Proposal', proposalSchema);
