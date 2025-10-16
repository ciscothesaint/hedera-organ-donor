const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const systemSettingsSchema = new mongoose.Schema({
    // Singleton document - only one settings document should exist
    _id: {
        type: String,
        default: 'system_settings',
    },

    // Emergency finalize password (hashed)
    emergencyFinalizePassword: {
        type: String,
        default: null,
    },

    emergencyFinalizePasswordSetAt: {
        type: Date,
        default: null,
    },

    emergencyFinalizePasswordSetBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
}, {
    timestamps: true,
});

// Method to set/update emergency finalize password
systemSettingsSchema.methods.setEmergencyPassword = async function(password, userId) {
    if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
    }

    const salt = await bcrypt.genSalt(10);
    this.emergencyFinalizePassword = await bcrypt.hash(password, salt);
    this.emergencyFinalizePasswordSetAt = new Date();
    this.emergencyFinalizePasswordSetBy = userId;

    await this.save();

    return {
        message: 'Emergency finalize password set successfully',
        setAt: this.emergencyFinalizePasswordSetAt
    };
};

// Method to verify emergency finalize password
systemSettingsSchema.methods.verifyEmergencyPassword = async function(password) {
    if (!this.emergencyFinalizePassword) {
        throw new Error('Emergency finalize password not set');
    }

    const isValid = await bcrypt.compare(password, this.emergencyFinalizePassword);

    if (!isValid) {
        throw new Error('Invalid emergency finalize password');
    }

    return true;
};

// Method to check if password is set
systemSettingsSchema.methods.isPasswordSet = function() {
    return !!this.emergencyFinalizePassword;
};

// Static method to get or create settings document
systemSettingsSchema.statics.getSettings = async function() {
    let settings = await this.findById('system_settings');

    if (!settings) {
        settings = await this.create({ _id: 'system_settings' });
    }

    return settings;
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
