const express = require('express');
const Organ = require('../db/models/Organ');
const Patient = require('../db/models/Patient');
const { createHederaClient } = require('../hedera/hederaClient');
const { registerOrgan: registerOrganOnChain, allocateOrgan } = require('../hedera/contractService');
const { logOrganMatch } = require('../hedera/topicService');
const { authenticate, authorize } = require('../middleware/auth');
const { validateOrganRegistration, validateOrganAllocation } = require('../middleware/validation');

const router = express.Router();

/**
 * Register a new organ
 * POST /api/organs
 */
router.post('/', authenticate, authorize('canRegisterOrgans'), validateOrganRegistration, async (req, res) => {
    let client;

    try {
        const organ = new Organ(req.body);

        // Calculate expiry time
        organ.timing.expiryTime = new Date(
            organ.timing.harvestTime.getTime() +
            organ.organInfo.viabilityHours * 60 * 60 * 1000
        );

        // Register on blockchain
        client = createHederaClient();
        const contractId = process.env.MATCHING_CONTRACT_ID;

        const result = await registerOrganOnChain(client, contractId, {
            organId: organ.organId,
            organType: organ.organInfo.organType,
            bloodType: organ.organInfo.bloodType,
            weight: organ.organInfo.weight,
            viabilityHours: organ.organInfo.viabilityHours,
        });

        organ.blockchainData = {
            transactionId: result.transactionId,
            contractAddress: contractId,
            registrationTimestamp: new Date(),
        };

        await organ.save();

        res.status(201).json({
            message: 'Organ registered successfully',
            organ,
            blockchain: {
                transactionId: result.transactionId,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (client) await client.close();
    }
});

/**
 * Get all organs (with filters)
 * GET /api/organs
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const { organType, status, bloodType } = req.query;
        const filter = {};

        if (organType) filter['organInfo.organType'] = organType;
        if (status) filter.status = status;
        if (bloodType) filter['organInfo.bloodType'] = bloodType;

        const organs = await Organ.find(filter)
            .sort({ 'timing.harvestTime': -1 });

        res.json({
            count: organs.length,
            organs,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get organ by ID
 * GET /api/organs/:organId
 */
router.get('/:organId', authenticate, async (req, res) => {
    try {
        const organ = await Organ.findOne({ organId: req.params.organId });

        if (!organ) {
            return res.status(404).json({ error: 'Organ not found' });
        }

        res.json({ organ });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get available organs by type
 * GET /api/organs/available/:organType
 */
router.get('/available/:organType', authenticate, async (req, res) => {
    try {
        const organs = await Organ.findAvailableByType(req.params.organType);

        res.json({
            organType: req.params.organType,
            count: organs.length,
            organs,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Find best match for an organ
 * POST /api/organs/:organId/find-match
 */
router.post('/:organId/find-match', authenticate, authorize('canAllocateOrgans'), async (req, res) => {
    try {
        const organ = await Organ.findOne({ organId: req.params.organId });

        if (!organ) {
            return res.status(404).json({ error: 'Organ not found' });
        }

        if (organ.isExpired()) {
            return res.status(400).json({ error: 'Organ has expired' });
        }

        // Get waitlist for this organ type
        const waitlist = await Patient.find({
            'medicalInfo.organType': organ.organInfo.organType,
            'waitlistInfo.isActive': true,
            'matching.isMatched': false,
        }).sort({
            'medicalInfo.urgencyLevel': -1,
            'medicalInfo.medicalScore': -1,
            'waitlistInfo.registrationDate': 1,
        });

        // Simple blood compatibility check
        const bloodCompatibility = {
            'A+': ['A+', 'A-', 'O+', 'O-'],
            'A-': ['A-', 'O-'],
            'B+': ['B+', 'B-', 'O+', 'O-'],
            'B-': ['B-', 'O-'],
            'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            'AB-': ['A-', 'B-', 'AB-', 'O-'],
            'O+': ['O+', 'O-'],
            'O-': ['O-'],
        };

        const compatiblePatients = waitlist.filter(patient => {
            const compatible = bloodCompatibility[patient.medicalInfo.bloodType] || [];
            return compatible.includes(organ.organInfo.bloodType);
        });

        if (compatiblePatients.length === 0) {
            return res.status(404).json({ error: 'No compatible patients found' });
        }

        const bestMatch = compatiblePatients[0];

        res.json({
            message: 'Best match found',
            organ: organ,
            patient: bestMatch,
            compatiblePatientsCount: compatiblePatients.length,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Allocate organ to patient
 * POST /api/organs/allocate
 */
router.post('/allocate', authenticate, authorize('canAllocateOrgans'), validateOrganAllocation, async (req, res) => {
    let client;

    try {
        const { organId, patientId } = req.body;

        const organ = await Organ.findOne({ organId });
        const patient = await Patient.findOne({ patientId });

        if (!organ || !patient) {
            return res.status(404).json({ error: 'Organ or patient not found' });
        }

        if (organ.allocation.isAllocated) {
            return res.status(400).json({ error: 'Organ already allocated' });
        }

        // Allocate on blockchain
        client = createHederaClient();
        const contractId = process.env.MATCHING_CONTRACT_ID;

        const result = await allocateOrgan(client, contractId, organId, patientId);

        // Update organ
        organ.allocation.isAllocated = true;
        organ.allocation.allocatedPatientId = patientId;
        organ.timing.allocationTime = new Date();
        organ.status = 'ALLOCATED';
        await organ.save();

        // Update patient
        patient.matching.isMatched = true;
        patient.matching.matchedOrganId = organId;
        patient.matching.matchDate = new Date();
        await patient.save();

        // Log to HCS
        if (process.env.ORGAN_MATCH_TOPIC_ID) {
            await logOrganMatch(client, process.env.ORGAN_MATCH_TOPIC_ID, {
                organId,
                patientId,
                timestamp: new Date().toISOString(),
            });
        }

        res.json({
            message: 'Organ allocated successfully',
            allocation: {
                organ,
                patient,
                transactionId: result.transactionId,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (client) await client.close();
    }
});

/**
 * Accept organ allocation
 * POST /api/organs/:organId/accept
 */
router.post('/:organId/accept', authenticate, authorize('canAllocateOrgans'), async (req, res) => {
    try {
        const organ = await Organ.findOne({ organId: req.params.organId });

        if (!organ) {
            return res.status(404).json({ error: 'Organ not found' });
        }

        organ.allocation.allocationAccepted = true;
        await organ.save();

        res.json({
            message: 'Allocation accepted',
            organ,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Reject organ allocation
 * POST /api/organs/:organId/reject
 */
router.post('/:organId/reject', authenticate, authorize('canAllocateOrgans'), async (req, res) => {
    try {
        const { reason } = req.body;
        const organ = await Organ.findOne({ organId: req.params.organId });

        if (!organ) {
            return res.status(404).json({ error: 'Organ not found' });
        }

        const patientId = organ.allocation.allocatedPatientId;

        // Reset organ allocation
        organ.allocation.isAllocated = false;
        organ.allocation.allocatedPatientId = null;
        organ.allocation.rejectionReason = reason;
        organ.status = 'AVAILABLE';
        await organ.save();

        // Reset patient matching
        if (patientId) {
            const patient = await Patient.findOne({ patientId });
            if (patient) {
                patient.matching.isMatched = false;
                patient.matching.matchedOrganId = null;
                await patient.save();
            }
        }

        res.json({
            message: 'Allocation rejected',
            organ,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Complete transplant
 * POST /api/organs/:organId/complete
 */
router.post('/:organId/complete', authenticate, authorize('canAllocateOrgans'), async (req, res) => {
    try {
        const organ = await Organ.findOne({ organId: req.params.organId });

        if (!organ) {
            return res.status(404).json({ error: 'Organ not found' });
        }

        organ.status = 'TRANSPLANTED';
        organ.timing.transplantTime = new Date();
        await organ.save();

        // Update patient
        const patient = await Patient.findOne({ patientId: organ.allocation.allocatedPatientId });
        if (patient) {
            patient.matching.transplantCompleted = true;
            patient.matching.transplantDate = new Date();
            patient.waitlistInfo.isActive = false;
            await patient.save();
        }

        res.json({
            message: 'Transplant completed successfully',
            organ,
            patient,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
