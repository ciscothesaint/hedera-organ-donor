const mongoose = require('mongoose');

const organSchema = new mongoose.Schema({
    organId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    organInfo: {
        organType: {
            type: String,
            enum: ['HEART', 'LIVER', 'KIDNEY', 'LUNG', 'PANCREAS'],
            required: true,
        },
        bloodType: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            required: true,
        },
        weight: {
            type: Number, // in grams
            required: true,
        },
        viabilityHours: {
            type: Number,
            required: true,
        },
        quality: {
            type: String,
            enum: ['EXCELLENT', 'GOOD', 'FAIR'],
            default: 'GOOD',
        },
    },
    donorInfo: {
        donorId: String,
        age: Number,
        gender: String,
        causeOfDeath: String,
        medicalHistory: [String],
    },
    hospitalInfo: {
        hospitalId: {
            type: String,
            required: true,
        },
        hospitalName: String,
        procurementTeam: String,
        hospitalAddress: String,
    },
    timing: {
        harvestTime: {
            type: Date,
            required: true,
            default: Date.now,
        },
        expiryTime: {
            type: Date,
            required: true,
        },
        allocationTime: Date,
        transplantTime: Date,
    },
    allocation: {
        isAllocated: {
            type: Boolean,
            default: false,
        },
        allocatedPatientId: String,
        allocationAccepted: {
            type: Boolean,
            default: false,
        },
        rejectionReason: String,
    },
    blockchainData: {
        transactionId: String,
        contractAddress: String,
        registrationTimestamp: Date,
    },
    status: {
        type: String,
        enum: ['AVAILABLE', 'ALLOCATED', 'TRANSPLANTED', 'EXPIRED', 'REJECTED'],
        default: 'AVAILABLE',
    },
}, {
    timestamps: true,
});

// Indexes
organSchema.index({ 'organInfo.organType': 1, status: 1 });
organSchema.index({ 'timing.expiryTime': 1 });
organSchema.index({ 'allocation.isAllocated': 1 });

// Method to check if organ is expired
organSchema.methods.isExpired = function() {
    return new Date() > this.timing.expiryTime;
};

// Method to get remaining viability hours
organSchema.methods.getRemainingHours = function() {
    const now = new Date();
    const diffMs = this.timing.expiryTime - now;
    return Math.max(0, diffMs / (1000 * 60 * 60));
};

// Static method to find available organs by type
organSchema.statics.findAvailableByType = function(organType) {
    return this.find({
        'organInfo.organType': organType,
        status: 'AVAILABLE',
        'allocation.isAllocated': false,
        'timing.expiryTime': { $gt: new Date() },
    }).sort({ 'timing.harvestTime': 1 });
};

module.exports = mongoose.model('Organ', organSchema);
