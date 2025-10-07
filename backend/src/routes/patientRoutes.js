const express = require('express');
const router = express.Router();
const PatientService = require('../services/patientService');
const patientService = new PatientService();

/**
 * POST /api/patients/register
 * Register new patient on blockchain waitlist
 */
router.post('/register', async (req, res) => {
    try {
        console.log('📋 Received patient registration request:', JSON.stringify(req.body, null, 2));
        const result = await patientService.registerPatient(req.body);
        res.json({
            success: true,
            data: result,
            message: 'Patient registered successfully'
        });
    } catch (error) {
        console.error('❌ Error registering patient:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/patients/position/:patientHash
 * Get patient's queue position
 */
router.get('/position/:patientHash', async (req, res) => {
    try {
        const position = await patientService.getQueuePosition(
            req.params.patientHash
        );
        res.json({
            success: true,
            data: position
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/patients/hash
 * Get hash for patient ID (for privacy)
 */
router.post('/hash', async (req, res) => {
    try {
        const { nationalId } = req.body;

        if (!nationalId) {
            return res.status(400).json({
                success: false,
                error: 'National ID is required'
            });
        }

        const patientHash = patientService.hashPatientId(nationalId);

        res.json({
            success: true,
            data: {
                nationalId: '***HIDDEN***', // Don't send back the ID
                patientHash
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/patients/urgency
 * Update patient urgency score
 */
router.put('/urgency', async (req, res) => {
    try {
        const result = await patientService.updateUrgency(req.body);
        res.json({
            success: true,
            data: result,
            message: 'Urgency updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/patients/waitlist/:organType
 * Get waitlist for specific organ type
 */
router.get('/waitlist/:organType', async (req, res) => {
    try {
        const waitlist = await patientService.getWaitlist(
            req.params.organType
        );
        res.json({
            success: true,
            data: waitlist
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/patients/:patientHash
 * Deactivate patient (remove from waitlist)
 */
router.delete('/:patientHash', async (req, res) => {
    try {
        const result = await patientService.deactivatePatient(
            req.params.patientHash
        );
        res.json({
            success: true,
            data: result,
            message: 'Patient deactivated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
