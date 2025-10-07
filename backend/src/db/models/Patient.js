const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    personalInfo: {
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        dateOfBirth: {
            type: Date,
            required: true,
        },
        gender: {
            type: String,
            enum: ['MALE', 'FEMALE', 'OTHER'],
            required: true,
        },
        contactNumber: String,
        email: String,
    },
    medicalInfo: {
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
        urgencyLevel: {
            type: Number,
            min: 1,
            max: 5,
            required: true,
        },
        medicalScore: {
            type: Number,
            required: true,
        },
        weight: {
            type: Number, // in kg
            required: true,
        },
        height: {
            type: Number, // in cm
            required: true,
        },
        diagnosis: String,
        complications: [String],
    },
    hospitalInfo: {
        hospitalId: {
            type: String,
            required: true,
        },
        hospitalName: String,
        attendingPhysician: String,
        hospitalAddress: String,
    },
    blockchainData: {
        transactionId: String,
        contractAddress: String,
        registrationTimestamp: Date,
    },
    waitlistInfo: {
        registrationDate: {
            type: Date,
            default: Date.now,
        },
        currentPosition: Number,
        isActive: {
            type: Boolean,
            default: true,
        },
        removalReason: String,
        removalDate: Date,
    },
    matching: {
        isMatched: {
            type: Boolean,
            default: false,
        },
        matchedOrganId: String,
        matchDate: Date,
        transplantCompleted: {
            type: Boolean,
            default: false,
        },
        transplantDate: Date,
    },
}, {
    timestamps: true,
});

// Indexes for efficient queries
patientSchema.index({ 'medicalInfo.organType': 1, 'waitlistInfo.isActive': 1 });
patientSchema.index({ 'waitlistInfo.registrationDate': 1 });
patientSchema.index({ 'medicalInfo.urgencyLevel': -1 });

// Virtual for full name
patientSchema.virtual('fullName').get(function() {
    return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Method to calculate wait time in days
patientSchema.methods.getWaitTimeDays = function() {
    const now = new Date();
    const diffTime = Math.abs(now - this.waitlistInfo.registrationDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

module.exports = mongoose.model('Patient', patientSchema);
