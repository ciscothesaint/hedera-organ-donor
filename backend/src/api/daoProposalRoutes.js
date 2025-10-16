const express = require('express');
const Proposal = require('../db/models/Proposal');
const User = require('../db/models/User');
const SystemSettings = require('../db/models/SystemSettings');
const DaoService = require('../services/daoService');
const {
    authenticateDAO,
    authorizeVoter,
    requireDoctorRole,
    allowObserver,
    requireWalletConnected,
    rateLimitProposals
} = require('../middleware/daoAuth');

const router = express.Router();
const daoService = new DaoService();

/**
 * Get all proposals (paginated)
 * GET /api/dao/proposals
 *
 * Query params:
 * - page: page number (default: 1)
 * - limit: items per page (default: 20)
 * - status: filter by status
 * - urgency: filter by urgency level
 * - type: filter by proposal type
 */
// DEBUG: Added logging to track proposalId serialization
router.get('/', authenticateDAO, allowObserver, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            urgency,
            type,
            patientHash
        } = req.query;

        const query = {};

        if (status) query.status = status;
        if (urgency) query.urgencyLevel = urgency;
        if (type) query.proposalType = type;
        if (patientHash) query.patientHash = patientHash;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 }, // Newest first
            lean: false // Include virtuals
        };

        const proposals = await Proposal.find(query)
            .sort(options.sort)
            .limit(options.limit)
            .skip((options.page - 1) * options.limit);

        const total = await Proposal.countDocuments(query);

        // DEBUG: Log proposal IDs being sent to frontend
        console.log('📤 GET /api/dao/proposals - Sending proposals:',
            proposals.map(p => ({
                proposalId: p.proposalId,
                type: typeof p.proposalId,
                _id: p._id
            }))
        );

        res.json({
            proposals,
            pagination: {
                page: options.page,
                limit: options.limit,
                total,
                pages: Math.ceil(total / options.limit)
            }
        });

    } catch (error) {
        console.error('Error fetching proposals:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get active proposals (currently open for voting)
 * GET /api/dao/proposals/active
 */
router.get('/active', authenticateDAO, allowObserver, async (req, res) => {
    try {
        const proposals = await Proposal.getActiveProposals();

        res.json({
            proposals,
            count: proposals.length
        });

    } catch (error) {
        console.error('Error fetching active proposals:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get emergency proposals
 * GET /api/dao/proposals/emergency
 */
router.get('/emergency', authenticateDAO, allowObserver, async (req, res) => {
    try {
        const proposals = await Proposal.getEmergencyProposals();

        res.json({
            proposals,
            count: proposals.length
        });

    } catch (error) {
        console.error('Error fetching emergency proposals:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get my proposals
 * GET /api/dao/proposals/my/created
 */
router.get('/my/created', authenticateDAO, requireDoctorRole, async (req, res) => {
    try {
        const proposals = await Proposal.getProposalsByCreator(
            req.user._id.toString()
        );

        res.json({
            proposals,
            count: proposals.length
        });

    } catch (error) {
        console.error('Error fetching user proposals:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get my voting history
 * GET /api/dao/proposals/my/votes
 */
router.get('/my/votes', authenticateDAO, authorizeVoter, async (req, res) => {
    try {
        const userId = req.user._id.toString();

        // Find all proposals where user has voted
        const proposals = await Proposal.find({
            'votes.voterAddress': userId
        }).sort({ createdAt: -1 });

        // Extract user's vote from each proposal
        const votes = proposals.map(proposal => {
            const userVote = proposal.votes.find(v => v.voterAddress === userId);

            return {
                voteChoice: userVote.voteChoice,
                reasoning: userVote.reasoning,
                votedAt: userVote.timestamp,
                votingPower: userVote.votingPower,
                proposal: {
                    proposalId: proposal.proposalId,
                    proposalType: proposal.proposalType,
                    patientHash: proposal.patientHash,
                    status: proposal.status,
                    urgencyLevel: proposal.urgencyLevel,
                    createdAt: proposal.createdAt,
                    votingDeadline: proposal.votingDeadline
                }
            };
        });

        res.json({
            votes,
            totalVotes: votes.length
        });

    } catch (error) {
        console.error('Error fetching voting history:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get proposal by ID
 * GET /api/dao/proposals/:id
 *
 * IMPORTANT: This route must come AFTER specific routes like /my/votes, /my/created, etc.
 * Otherwise Express will match "my" as the :id parameter
 */
router.get('/:id', authenticateDAO, allowObserver, async (req, res) => {
    try {
        const { id } = req.params;

        const proposal = await Proposal.findOne({ proposalId: parseInt(id) });

        if (!proposal) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        // Check if current user has voted
        const hasVoted = proposal.hasVoted(req.user._id.toString());

        res.json({
            proposal: proposal.toObject(),
            userHasVoted: hasVoted,
            isVotingOpen: proposal.isVotingOpen,
            timeRemaining: proposal.timeRemaining,
            participationRate: proposal.participationRate,
            approvalRate: proposal.approvalRate
        });

    } catch (error) {
        console.error('Error fetching proposal:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Create new proposal
 * POST /api/dao/proposals
 */
router.post('/',
    authenticateDAO,
    requireDoctorRole,
    requireWalletConnected,
    rateLimitProposals,
    async (req, res) => {
        try {
            const {
                proposalType,
                urgencyLevel,
                patientHash,
                currentValue,
                proposedValue,
                reasoning,
                evidenceHash
            } = req.body;

            // Validate required fields
            if (!proposalType || !urgencyLevel || !reasoning) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    required: ['proposalType', 'urgencyLevel', 'reasoning']
                });
            }

            // Validate reasoning length
            if (reasoning.length < 50) {
                return res.status(400).json({
                    error: 'Reasoning must be at least 50 characters'
                });
            }

            // Validate proposal type specific requirements
            if ((proposalType === 'URGENCY_UPDATE' || proposalType === 'PATIENT_REMOVAL') && !patientHash) {
                return res.status(400).json({
                    error: 'Patient hash required for this proposal type'
                });
            }

            if (proposalType === 'URGENCY_UPDATE' && (currentValue === undefined || proposedValue === undefined)) {
                return res.status(400).json({
                    error: 'Current and proposed urgency values required'
                });
            }

            // Create proposal on blockchain
            const result = await daoService.createProposal({
                proposalType,
                urgencyLevel,
                patientHash,
                currentValue,
                proposedValue,
                reasoning,
                evidenceHash: evidenceHash || '',
                creatorId: req.user._id.toString(),
                creatorName: req.user.username,
                creatorHospitalId: req.user.hospitalId || 'DAO'
            });

            // Update user's proposal count
            req.user.daoProfile.totalProposalsCreated += 1;
            await req.user.save();

            const responseData = {
                message: 'Proposal created successfully',
                proposalId: result.proposalId,
                proposal: result.proposal,
                transactionId: result.transactionId,
                votingDeadline: result.votingDeadline
            };

            // DEBUG: Log the exact response being sent to frontend
            console.log('📤 API RESPONSE to frontend:', JSON.stringify({
                proposalId: responseData.proposalId,
                hasProposalId: !!responseData.proposalId,
                proposalIdType: typeof responseData.proposalId
            }, null, 2));

            res.status(201).json(responseData);

        } catch (error) {
            console.error('Error creating proposal:', error);
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * Vote on a proposal
 * POST /api/dao/proposals/:id/vote
 */
router.post('/:id/vote',
    authenticateDAO,
    authorizeVoter,
    requireWalletConnected,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { voteChoice, reasoning } = req.body;

            // Validate vote choice
            if (!['APPROVE', 'REJECT', 'ABSTAIN'].includes(voteChoice)) {
                return res.status(400).json({
                    error: 'Invalid vote choice',
                    allowed: ['APPROVE', 'REJECT', 'ABSTAIN']
                });
            }

            // Validate reasoning
            if (!reasoning || reasoning.length < 20) {
                return res.status(400).json({
                    error: 'Reasoning required (minimum 20 characters) for transparency'
                });
            }

            // Get proposal
            const proposal = await Proposal.findOne({ proposalId: parseInt(id) });

            if (!proposal) {
                return res.status(404).json({ error: 'Proposal not found' });
            }

            // Check if voting is still open
            if (!proposal.isVotingOpen) {
                return res.status(400).json({
                    error: 'Voting period has ended',
                    deadline: proposal.votingDeadline
                });
            }

            // Check if user already voted
            if (proposal.hasVoted(req.user._id.toString())) {
                return res.status(400).json({ error: 'You have already voted on this proposal' });
            }

            // Submit vote to blockchain
            const result = await daoService.submitVote({
                proposalId: parseInt(id),
                voterId: req.user._id.toString(),
                voterName: req.user.username,
                voteChoice,
                reasoning,
                votingPower: req.user.daoProfile.votingPower
            });

            // Update user's vote count
            req.user.daoProfile.totalVotesCast += 1;
            await req.user.save();

            // Get updated proposal from database
            const updatedProposal = await Proposal.findOne({ proposalId: parseInt(id) });

            // Sync vote counts from blockchain to ensure accuracy
            try {
                const blockchainVotes = await daoService.getProposalVotes(parseInt(id));

                // Update database with blockchain data
                updatedProposal.votesFor = blockchainVotes.votesFor;
                updatedProposal.votesAgainst = blockchainVotes.votesAgainst;
                updatedProposal.votesAbstain = blockchainVotes.votesAbstain;
                await updatedProposal.save();

                console.log(`✅ Synced vote counts from blockchain for proposal #${id}`);
            } catch (syncError) {
                console.error('⚠️ Failed to sync vote counts from blockchain:', syncError.message);
                // Continue anyway, database has the vote
            }

            res.json({
                message: 'Vote submitted successfully',
                transactionId: result.transactionId,
                proposal: {
                    id: updatedProposal.proposalId,
                    votesFor: updatedProposal.votesFor,
                    votesAgainst: updatedProposal.votesAgainst,
                    votesAbstain: updatedProposal.votesAbstain,
                    participationRate: updatedProposal.participationRate,
                    approvalRate: updatedProposal.approvalRate
                }
            });

        } catch (error) {
            console.error('Error voting:', error);
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * Get votes for a proposal
 * GET /api/dao/proposals/:id/votes
 */
router.get('/:id/votes', authenticateDAO, allowObserver, async (req, res) => {
    try {
        const { id } = req.params;

        const proposal = await Proposal.findOne({ proposalId: parseInt(id) });

        if (!proposal) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        res.json({
            proposalId: proposal.proposalId,
            votes: proposal.votes,
            summary: {
                votesFor: proposal.votesFor,
                votesAgainst: proposal.votesAgainst,
                votesAbstain: proposal.votesAbstain,
                totalVotingPower: proposal.totalVotingPower,
                participationRate: proposal.participationRate,
                approvalRate: proposal.approvalRate
            }
        });

    } catch (error) {
        console.error('Error fetching votes:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Finalize a proposal (after voting period)
 * POST /api/dao/proposals/:id/finalize
 */
router.post('/:id/finalize', authenticateDAO, async (req, res) => {
    try {
        const { id } = req.params;

        const proposal = await Proposal.findOne({ proposalId: parseInt(id) });

        if (!proposal) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        if (proposal.status !== 'ACTIVE') {
            return res.status(400).json({
                error: 'Proposal already finalized',
                status: proposal.status
            });
        }

        if (new Date() < proposal.votingDeadline) {
            return res.status(400).json({
                error: 'Voting period not yet ended',
                deadline: proposal.votingDeadline
            });
        }

        // Finalize on blockchain
        const result = await daoService.finalizeProposal(parseInt(id));

        res.json({
            message: 'Proposal finalized',
            transactionId: result.transactionId,
            status: proposal.status,
            participationRate: proposal.participationRate,
            approvalRate: proposal.approvalRate
        });

    } catch (error) {
        console.error('Error finalizing proposal:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Emergency finalize a proposal (requires 75% supermajority + password)
 * POST /api/dao/proposals/:id/emergency-finalize
 */
router.post('/:id/emergency-finalize', authenticateDAO, async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        // Verify emergency finalize password
        const settings = await SystemSettings.getSettings();

        if (!password) {
            return res.status(400).json({
                error: 'Emergency finalize password required',
                message: 'Please enter the emergency finalize password'
            });
        }

        try {
            await settings.verifyEmergencyPassword(password);
        } catch (passwordError) {
            return res.status(401).json({
                error: 'Invalid password',
                message: passwordError.message
            });
        }

        const proposal = await Proposal.findOne({ proposalId: parseInt(id) });

        if (!proposal) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        if (proposal.status !== 'ACTIVE') {
            return res.status(400).json({
                error: 'Proposal already finalized',
                status: proposal.status
            });
        }

        // Calculate approval percentage
        const totalVotes = proposal.votesFor + proposal.votesAgainst;
        if (totalVotes === 0) {
            return res.status(400).json({
                error: 'No votes cast yet',
                message: 'Emergency finalization requires at least one vote'
            });
        }

        const approvalPercentage = (proposal.votesFor / totalVotes) * 100;
        if (approvalPercentage < 75) {
            return res.status(400).json({
                error: 'Insufficient supermajority',
                message: 'Emergency finalization requires 75% approval',
                currentApproval: approvalPercentage.toFixed(2) + '%',
                required: '75%'
            });
        }

        // Emergency finalize on blockchain
        const result = await daoService.emergencyFinalizeProposal(parseInt(id));

        // Fetch updated proposal from database
        const updatedProposal = await Proposal.findOne({ proposalId: parseInt(id) });

        res.json({
            message: 'Proposal emergency finalized successfully',
            transactionId: result.transactionId,
            proposal: updatedProposal.toObject(),
            status: updatedProposal.status,
            participationRate: updatedProposal.participationRate,
            approvalRate: updatedProposal.approvalRate,
            approvalPercentage: approvalPercentage.toFixed(2) + '%'
        });

    } catch (error) {
        console.error('Error emergency finalizing proposal:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Execute an approved proposal
 * POST /api/dao/proposals/:id/execute
 */
router.post('/:id/execute', authenticateDAO, requireDoctorRole, async (req, res) => {
    try {
        const { id } = req.params;

        const proposal = await Proposal.findOne({ proposalId: parseInt(id) });

        if (!proposal) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        if (proposal.status !== 'APPROVED') {
            return res.status(400).json({
                error: 'Proposal not approved for execution',
                status: proposal.status
            });
        }

        if (proposal.executedAt) {
            return res.status(400).json({ error: 'Proposal already executed' });
        }

        // Execute on blockchain
        const result = await daoService.executeProposal(parseInt(id));

        res.json({
            message: 'Proposal executed successfully',
            transactionId: result.transactionId,
            executedAt: new Date()
        });

    } catch (error) {
        console.error('Error executing proposal:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
