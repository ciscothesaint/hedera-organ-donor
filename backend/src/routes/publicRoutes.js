const express = require('express');
const router = express.Router();
const PatientService = require('../services/patientService');
const MatchingService = require('../services/matchingService');

const patientService = new PatientService();
const matchingService = new MatchingService();

/**
 * GET /api/public/stats
 * Get public statistics for dashboard
 */
router.get('/stats', async (req, res) => {
    try {
        // Get stats from contracts or database
        const stats = {
            totalPatients: 0,
            activeWaitlist: 0,
            organsAvailable: 0,
            matchesCompleted: 0,
            organTypes: {
                KIDNEY: 0,
                LIVER: 0,
                HEART: 0,
                LUNGS: 0,
                PANCREAS: 0
            }
        };

        // TODO: Query contract for actual stats

        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/public/check-position
 * Check queue position with patient ID
 * (Public endpoint - uses hashing for privacy)
 */
router.post('/check-position', async (req, res) => {
    try {
        const { nationalId } = req.body;

        if (!nationalId) {
            return res.status(400).json({
                success: false,
                error: 'National ID is required'
            });
        }

        // Hash the ID
        const patientHash = patientService.hashPatientId(nationalId);

        // Get position
        const position = await patientService.getQueuePosition(patientHash);

        res.json({
            success: true,
            data: {
                ...position,
                message: 'Your current position in the queue'
            }
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: 'Patient not found or not active in waitlist'
        });
    }
});

/**
 * GET /api/public/waitlist-summary
 * Get summary of all waitlists (no patient details)
 */
router.get('/waitlist-summary', async (req, res) => {
    try {
        const organTypes = ['KIDNEY', 'LIVER', 'HEART', 'LUNGS', 'PANCREAS'];
        const summary = [];

        for (const organType of organTypes) {
            try {
                const waitlist = await patientService.getWaitlist(organType);
                summary.push({
                    organType,
                    count: waitlist.count || 0
                });
            } catch (error) {
                summary.push({
                    organType,
                    count: 0,
                    error: 'Data unavailable'
                });
            }
        }

        res.json({
            success: true,
            data: summary,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/public/blood-compatibility/:recipientType
 * Get compatible donor blood types for a recipient
 */
router.get('/blood-compatibility/:recipientType', async (req, res) => {
    try {
        const recipientType = req.params.recipientType;

        const bloodTypes = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
        const compatible = bloodTypes.filter(donorType =>
            matchingService.isCompatibleBloodType(recipientType, donorType)
        );

        res.json({
            success: true,
            data: {
                recipientType,
                compatibleDonorTypes: compatible
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
