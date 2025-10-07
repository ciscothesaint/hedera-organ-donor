const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
    hospitalId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
    },
    contactInfo: {
        phone: String,
        email: String,
        emergencyContact: String,
    },
    certification: {
        isAuthorized: {
            type: Boolean,
            default: false,
        },
        certificationNumber: String,
        certificationDate: Date,
        expiryDate: Date,
    },
    capabilities: {
        canProcure: {
            type: Boolean,
            default: false,
        },
        canTransplant: {
            type: Boolean,
            default: false,
        },
        organTypes: [{
            type: String,
            enum: ['HEART', 'LIVER', 'KIDNEY', 'LUNG', 'PANCREAS'],
        }],
    },
    staff: [{
        name: String,
        role: String,
        licenseNumber: String,
    }],
    statistics: {
        totalPatientsRegistered: {
            type: Number,
            default: 0,
        },
        totalOrgansProcured: {
            type: Number,
            default: 0,
        },
        totalTransplantsCompleted: {
            type: Number,
            default: 0,
        },
        successRate: {
            type: Number,
            default: 0,
        },
    },
    blockchainData: {
        walletAddress: String,
        isAuthorizedOnChain: {
            type: Boolean,
            default: false,
        },
    },
}, {
    timestamps: true,
});

// Method to check if hospital is authorized
hospitalSchema.methods.isAuthorizedForOrgan = function(organType) {
    return this.certification.isAuthorized &&
           this.capabilities.organTypes.includes(organType);
};

module.exports = mongoose.model('Hospital', hospitalSchema);
