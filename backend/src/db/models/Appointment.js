const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    appointmentId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    matchId: {
        type: String,
        required: true,
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
    hospitalId: {
        type: String,
        required: true,
    },
    surgeryDetails: {
        scheduledDate: {
            type: Date,
            required: true,
        },
        estimatedDuration: {
            type: Number, // in hours
            default: 4,
        },
        surgeonName: {
            type: String,
            default: 'TBD',
        },
        operatingRoom: {
            type: String,
            default: 'TBD',
        },
        notes: {
            type: String,
            default: '',
        },
    },
    status: {
        type: String,
        enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        default: 'SCHEDULED',
    },
    createdBy: {
        type: String,
        default: 'SYSTEM', // System auto-created or user ID
    },
}, {
    timestamps: true,
});

// Indexes for efficient queries
appointmentSchema.index({ status: 1, 'surgeryDetails.scheduledDate': 1 });
appointmentSchema.index({ hospitalId: 1, status: 1 });
appointmentSchema.index({ patientId: 1, status: 1 });

// Method to check if appointment is upcoming
appointmentSchema.methods.isUpcoming = function() {
    return this.status === 'SCHEDULED' && new Date(this.surgeryDetails.scheduledDate) > new Date();
};

// Method to check if appointment is overdue
appointmentSchema.methods.isOverdue = function() {
    return this.status === 'SCHEDULED' && new Date(this.surgeryDetails.scheduledDate) < new Date();
};

// Static method to find upcoming appointments
appointmentSchema.statics.findUpcoming = function(hospitalId = null) {
    const query = {
        status: 'SCHEDULED',
        'surgeryDetails.scheduledDate': { $gt: new Date() },
    };
    if (hospitalId) {
        query.hospitalId = hospitalId;
    }
    return this.find(query).sort({ 'surgeryDetails.scheduledDate': 1 });
};

module.exports = mongoose.model('Appointment', appointmentSchema);
