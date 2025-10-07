const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'COORDINATOR', 'VIEWER'],
        required: true,
    },
    hospitalId: {
        type: String,
        required: function() {
            return this.role !== 'ADMIN';
        },
    },
    profile: {
        firstName: String,
        lastName: String,
        licenseNumber: String,
        specialization: String,
    },
    permissions: {
        canRegisterPatients: {
            type: Boolean,
            default: false,
        },
        canRegisterOrgans: {
            type: Boolean,
            default: false,
        },
        canUpdateUrgency: {
            type: Boolean,
            default: false,
        },
        canAllocateOrgans: {
            type: Boolean,
            default: false,
        },
        canViewAuditLogs: {
            type: Boolean,
            default: false,
        },
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: Date,
}, {
    timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user permissions based on role
userSchema.methods.setRolePermissions = function() {
    switch (this.role) {
        case 'ADMIN':
            this.permissions = {
                canRegisterPatients: true,
                canRegisterOrgans: true,
                canUpdateUrgency: true,
                canAllocateOrgans: true,
                canViewAuditLogs: true,
            };
            break;
        case 'HOSPITAL_ADMIN':
            this.permissions = {
                canRegisterPatients: true,
                canRegisterOrgans: true,
                canUpdateUrgency: true,
                canAllocateOrgans: true,
                canViewAuditLogs: true,
            };
            break;
        case 'DOCTOR':
            this.permissions = {
                canRegisterPatients: true,
                canRegisterOrgans: false,
                canUpdateUrgency: true,
                canAllocateOrgans: false,
                canViewAuditLogs: false,
            };
            break;
        case 'COORDINATOR':
            this.permissions = {
                canRegisterPatients: true,
                canRegisterOrgans: true,
                canUpdateUrgency: false,
                canAllocateOrgans: true,
                canViewAuditLogs: true,
            };
            break;
        case 'VIEWER':
            this.permissions = {
                canRegisterPatients: false,
                canRegisterOrgans: false,
                canUpdateUrgency: false,
                canAllocateOrgans: false,
                canViewAuditLogs: true,
            };
            break;
    }
};

module.exports = mongoose.model('User', userSchema);
