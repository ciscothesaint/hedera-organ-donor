const express = require('express');
const SystemSettings = require('../db/models/SystemSettings');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Set/Update Emergency Finalize Password
 * POST /api/settings/emergency-password
 * Admin only
 */
router.post('/emergency-password', authenticate, async (req, res) => {
    try {
        // Only ADMIN can set emergency finalize password
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Only administrators can set emergency finalize password'
            });
        }

        const { password, confirmPassword } = req.body;

        // Validate password
        if (!password) {
            return res.status(400).json({
                error: 'Password is required'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                error: 'Password must be at least 8 characters long'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                error: 'Passwords do not match'
            });
        }

        // Get or create settings document
        const settings = await SystemSettings.getSettings();

        // Set password
        const result = await settings.setEmergencyPassword(password, req.user._id);

        res.json({
            success: true,
            message: result.message,
            setAt: result.setAt
        });

    } catch (error) {
        console.error('Error setting emergency password:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get Emergency Finalize Password Status
 * GET /api/settings/emergency-password/status
 * Admin only
 */
router.get('/emergency-password/status', authenticate, async (req, res) => {
    try {
        // Only ADMIN can check password status
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Only administrators can check password status'
            });
        }

        // Get settings
        const settings = await SystemSettings.getSettings();

        res.json({
            isSet: settings.isPasswordSet(),
            setAt: settings.emergencyFinalizePasswordSetAt,
            setBy: settings.emergencyFinalizePasswordSetBy
        });

    } catch (error) {
        console.error('Error getting password status:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
