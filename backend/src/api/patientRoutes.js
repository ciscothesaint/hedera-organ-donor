const express = require('express');
const Patient = require('../db/models/Patient');
const hederaClient = require('../hedera/client');
const { registerPatient: registerOnChain } = require('../hedera/contractService');
const { logPatientRegistration } = require('../hedera/topicService');
const { authenticate, authorize } = require('../middleware/auth');
const { validatePatientRegistration, validateUrgencyUpdate } = require('../middleware/validation');

const router = express.Router();

/**
 * Register a new patient
 * POST /api/patients
 */
router.post('/', authenticate, authorize('canRegisterPatients'), validatePatientRegistration, async (req, res) => {
    try {
        console.log('📋 POST / received:', JSON.stringify(req.body, null, 2));
        const patient = new Patient(req.body);

        // Register on blockchain
        const client = hederaClient.getClient();
        const contractId = process.env.WAITLIST_CONTRACT_ID;

        console.log('🔍 Registering patient on blockchain with data:');
        console.log('  - patientId:', patient.patientId);
        console.log('  - firstName:', patient.personalInfo.firstName);
        console.log('  - lastName:', patient.personalInfo.lastName);
        console.log('  - organType:', patient.medicalInfo.organType);
        console.log('  - urgencyLevel:', patient.medicalInfo.urgencyLevel, '(must be 1-5)');
        console.log('  - medicalScore:', patient.medicalInfo.medicalScore);
        console.log('  - bloodType:', patient.medicalInfo.bloodType);
        console.log('  - weight:', patient.medicalInfo.weight);
        console.log('  - height:', patient.medicalInfo.height);

        const result = await registerOnChain(client, contractId, {
            patientId: patient.patientId,
            firstName: patient.personalInfo.firstName,
            lastName: patient.personalInfo.lastName,
            organType: patient.medicalInfo.organType,
            urgencyLevel: patient.medicalInfo.urgencyLevel,
            medicalScore: patient.medicalInfo.medicalScore,
            bloodType: patient.medicalInfo.bloodType,
            weight: patient.medicalInfo.weight,
            height: patient.medicalInfo.height,
        });

        // Save blockchain data
        patient.blockchainData = {
            transactionId: result.transactionId,
            contractAddress: contractId,
            registrationTimestamp: new Date(),
        };

        await patient.save();

        // Log to HCS
        if (process.env.PATIENT_REGISTRATION_TOPIC_ID) {
            await logPatientRegistration(
                client,
                process.env.PATIENT_REGISTRATION_TOPIC_ID,
                {
                    patientId: patient.patientId,
                    name:`${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`,
                    organType: patient.medicalInfo.organType,
                    timestamp: new Date().toISOString(),
                }
            );
        }

        res.status(201).json({
            message: 'Patient registered successfully',
            patient: patient,
            blockchain: {
                transactionId: result.transactionId,
            },
        });
    } catch (error) {
        console.error('❌ Error in POST /:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get all patients (with filters)
 * GET /api/patients
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const { organType, isActive, urgencyLevel } = req.query;
        const filter = {};

        if (organType) filter['medicalInfo.organType'] = organType;
        if (isActive !== undefined) filter['waitlistInfo.isActive'] = isActive === 'true';
        if (urgencyLevel) filter['medicalInfo.urgencyLevel'] = parseInt(urgencyLevel);

        const patients = await Patient.find(filter)
            .sort({ 'waitlistInfo.registrationDate': 1 });

        res.json({
            count: patients.length,
            patients,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get patient by ID
 * GET /api/patients/:patientId
 */
router.get('/:patientId', authenticate, async (req, res) => {
    try {
        const patient = await Patient.findOne({ patientId: req.params.patientId });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json({ patient });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Update patient urgency
 * PUT /api/patients/:patientId/urgency
 */
router.put('/:patientId/urgency', authenticate, authorize('canUpdateUrgency'), validateUrgencyUpdate, async (req, res) => {
    try {
        const { urgencyLevel } = req.body;
        const patient = await Patient.findOne({ patientId: req.params.patientId });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        const oldUrgency = patient.medicalInfo.urgencyLevel;

        // Update on blockchain
        const client = hederaClient.getClient();
        const contractId = process.env.WAITLIST_CONTRACT_ID;

        const { updateUrgency } = require('../hedera/contractService');
        await updateUrgency(client, contractId, patient.patientId, urgencyLevel);

        // Update in database
        patient.medicalInfo.urgencyLevel = urgencyLevel;
        await patient.save();

        res.json({
            message: 'Urgency updated successfully',
            patient,
            oldUrgency,
            newUrgency: urgencyLevel,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get waitlist for organ type
 * GET /api/patients/waitlist/:organType
 */
router.get('/waitlist/:organType', authenticate, async (req, res) => {
    try {
        const { organType } = req.params;

        const waitlist = await Patient.find({
            'medicalInfo.organType': organType,
            'waitlistInfo.isActive': true,
            'matching.isMatched': false,
        }).sort({
            'medicalInfo.urgencyLevel': -1,
            'medicalInfo.medicalScore': -1,
            'waitlistInfo.registrationDate': 1,
        });

        res.json({
            organType,
            count: waitlist.length,
            waitlist,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Remove patient from waitlist
 * DELETE /api/patients/:patientId
 */
router.delete('/:patientId', authenticate, authorize('canRegisterPatients'), async (req, res) => {
    try {
        const { reason } = req.body;
        const patient = await Patient.findOne({ patientId: req.params.patientId });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        patient.waitlistInfo.isActive = false;
        patient.waitlistInfo.removalReason = reason;
        patient.waitlistInfo.removalDate = new Date();
        await patient.save();

        res.json({
            message: 'Patient removed from waitlist',
            patient,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
