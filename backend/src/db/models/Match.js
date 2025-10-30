const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    matchId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    organId: {
        type: String,
        required: true,
        index: true,
    },
    patientId: {
        type: String,
        required: true,
        index: true,
    },
    matchScore: {
        urgencyLevel: {
            type: Number,
            min: 1,
            max: 5,
            required: true,
        },
        daysWaiting: {
            type: Number,
            required: true,
        },
        bloodCompatibility: {
            type: Boolean,
            required: true,
        },
    },
    matchDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'],
        default: 'PENDING',
    },
    expiryTime: {
        type: Date,
        required: true,
    },
    matchDetails: {
        organType: String,
        organBloodType: String,
        patientBloodType: String,
        hospitalId: String,
    },
}, {
    timestamps: true,
});

// Indexes for efficient queries
matchSchema.index({ status: 1, matchDate: -1 });
matchSchema.index({ organId: 1, patientId: 1 });

// Method to check if match is expired
matchSchema.methods.isExpired = function() {
    return new Date() > this.expiryTime;
};

// Static method to find active matches
matchSchema.statics.findActiveMatches = function() {
    return this.find({
        status: { $in: ['PENDING', 'ACCEPTED'] },
        expiryTime: { $gt: new Date() },
    }).sort({ matchDate: -1 });
};

module.exports = mongoose.model('Match', matchSchema);
