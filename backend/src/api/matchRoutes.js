const express = require('express');
const Match = require('../db/models/Match');

const Appointment = require('../db/models/Appointment');
const Patient = require('../db/models/Patient');
const Organ = require('../db/models/Organ');
const { authenticate } = require('../middleware/auth');
const autoMatchingService = require('../services/autoMatchingService');
const contractService = require('../hedera/contractService');

const router = express.Router();

/**
 * Get all matches
 * GET /api/matches
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const { status, organType } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (organType) filter['matchDetails.organType'] = organType;

        const matches = await Match.find(filter)
            .sort({ matchDate: -1 })
            .lean();

        // Enrich with patient and organ details
        const enrichedMatches = await Promise.all(matches.map(async (match) => {
            const patient = await Patient.findOne({ patientId: match.patientId })
                .select('patientId personalInfo medicalInfo hospitalInfo')
                .lean();

            const organ = await Organ.findOne({ organId: match.organId })
                .select('organId organInfo hospitalInfo timing')
                .lean();

            return {
                ...match,
                patient: patient ? {
                    patientId: patient.patientId,
                    name: `${patient.personalInfo?.firstName} ${patient.personalInfo?.lastName}`,
                    bloodType: patient.medicalInfo?.bloodType,
                    organType: patient.medicalInfo?.organType,
                    urgencyLevel: patient.medicalInfo?.urgencyLevel,
                    hospitalName: patient.hospitalInfo?.hospitalName,
                } : null,
                organ: organ ? {
                    organId: organ.organId,
                    organType: organ.organInfo?.organType,
                    bloodType: organ.organInfo?.bloodType,
                    weight: organ.organInfo?.weight,
                    hospitalName: organ.hospitalInfo?.hospitalName,
                    harvestTime: organ.timing?.harvestTime,
                    expiryTime: organ.timing?.expiryTime,
                } : null,
            };
        }));

        res.json({
            success: true,
            count: enrichedMatches.length,
            matches: enrichedMatches,
        });
    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get match by ID
 * GET /api/matches/:matchId
 */
router.get('/:matchId', authenticate, async (req, res) => {
    try {
        const match = await Match.findOne({ matchId: req.params.matchId }).lean();

        if (!match) {
            return res.status(404).json({
                success: false,
                error: 'Match not found'
            });
        }

        // Enrich with full details
        const patient = await Patient.findOne({ patientId: match.patientId }).lean();
        const organ = await Organ.findOne({ organId: match.organId }).lean();
        const appointment = await Appointment.findOne({ matchId: match.matchId }).lean();

        res.json({
            success: true,
            match: {
                ...match,
                patient,
                organ,
                appointment,
            },
        });
    } catch (error) {
        console.error('Error fetching match:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Update match status
 * PATCH /api/matches/:matchId
 */
router.patch('/:matchId', authenticate, async (req, res) => {
    try {
        const { status,reason } = req.body;

        if (!['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }

        const match = await Match.findOneAndUpdate(
            { matchId: req.params.matchId },
            { status },
            { new: true }
        );
        if (!match) {
            return res.status(404).json({
                success: false,
                error: 'Match not found'
            });
        } 
        const client = hederaClient.getClient();
          const contractId = process.env.MATCHING_CONTRACT_ID;;
        if(status='ACCEPTED'){
            await contractService.acceptAllocation(client,contractId,`${match.organId, "-", match.patientId}`)
        }
        else if(status=='COMPLETED'){
            await contractService.completeTransplant(client,contractId,`${match.organId, "-", match.patientId}`)
        }
        else if(status=='REJECTED'){
            await contractService.rejectAllocation(client,contractId,`${match.organId, "-", match.patientId}`,reason?reason:"without reason")
        }
       
        if (process.env.ORGAN_MATCH_TOPIC_ID) {
            console.log('found a match')
            const patient = await Patient.findOne({ patientId: match.patientId })
            .select('patientId personalInfo medicalInfo hospitalInfo')
            .lean();
    
            const organ = await Organ.findOne({ organId: match.organId })
                .select('organId organInfo hospitalInfo timing')
                .lean();
            await logOrganMatch(
                client,
                process.env.ORGAN_MATCH_TOPIC_ID,
                {
                    organId:match.organId,
                    organ:{id:match.organId,type:organ.organInfo.organType,bloodType:organ.organInfo.bloodType},
                    patient:{
                        id:match.patientId,
                        name:`${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`
                    },
                    timestamp: new Date().toISOString(),
                }
            );
        }
        
     
       

        res.json({
            success: true,
            message: 'Match status updated',
            match,
        });
    } catch (error) {
        console.error('Error updating match:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get all appointments
 * GET /api/matches/appointments/all
 */
router.get('/appointments/all', authenticate, async (req, res) => {
    try {
        const { status, hospitalId } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (hospitalId) filter.hospitalId = hospitalId;

        const appointments = await Appointment.find(filter)
            .sort({ 'surgeryDetails.scheduledDate': 1 })
            .lean();

        // Enrich with patient and organ details
        const enrichedAppointments = await Promise.all(appointments.map(async (appointment) => {
            const patient = await Patient.findOne({ patientId: appointment.patientId })
                .select('patientId personalInfo medicalInfo')
                .lean();

            const organ = await Organ.findOne({ organId: appointment.organId })
                .select('organId organInfo')
                .lean();

            const match = await Match.findOne({ matchId: appointment.matchId })
                .select('matchId status matchScore')
                .lean();

            return {
                ...appointment,
                patient: patient ? {
                    patientId: patient.patientId,
                    name: `${patient.personalInfo?.firstName} ${patient.personalInfo?.lastName}`,
                    bloodType: patient.medicalInfo?.bloodType,
                    organType: patient.medicalInfo?.organType,
                } : null,
                organ: organ ? {
                    organId: organ.organId,
                    organType: organ.organInfo?.organType,
                    bloodType: organ.organInfo?.bloodType,
                } : null,
                match: match ? {
                    matchId: match.matchId,
                    status: match.status,
                    urgencyLevel: match.matchScore?.urgencyLevel,
                } : null,
            };
        }));

        res.json({
            success: true,
            count: enrichedAppointments.length,
            appointments: enrichedAppointments,
        });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Update appointment status
 * PATCH /api/matches/appointments/:appointmentId
 */
router.patch('/appointments/:appointmentId', authenticate, async (req, res) => {
    try {
        const { status, surgeonName, operatingRoom, notes } = req.body;

        const updateData = {};
        if (status && ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
            updateData.status = status;
        }
        if (surgeonName) updateData['surgeryDetails.surgeonName'] = surgeonName;
        if (operatingRoom) updateData['surgeryDetails.operatingRoom'] = operatingRoom;
        if (notes) updateData['surgeryDetails.notes'] = notes;

        const appointment = await Appointment.findOneAndUpdate(
            { appointmentId: req.params.appointmentId },
            updateData,
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                error: 'Appointment not found'
            });
        }

        res.json({
            success: true,
            message: 'Appointment updated',
            appointment,
        });
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Manually run matching algorithm for all available organs
 * POST /api/matches/run-matching
 */
router.post('/run-matching', authenticate, async (req, res) => {
    try {
        console.log('=== MANUAL MATCHING TRIGGERED ===');

        // Find all available organs (not allocated, not expired)
        const availableOrgans = await Organ.find({
            'allocation.isAllocated': false,
            status: { $in: ['AVAILABLE', 'REGISTERED'] },
            'timing.expiryTime': { $gt: new Date() },
        });

        if (availableOrgans.length === 0) {
            return res.json({
                success: true,
                message: 'No available organs to match',
                results: {
                    total: 0,
                    matched: 0,
                    noMatch: 0,
                    details: [],
                },
            });
        }

        console.log(`Found ${availableOrgans.length} available organs`);

        // Run matching for each organ
        const results = {
            total: availableOrgans.length,
            matched: 0,
            noMatch: 0,
            details: [],
        };

        for (const organ of availableOrgans) {
            try {
                const matchResult = await autoMatchingService.autoMatchOrgan(organ);

                if (matchResult.matched) {
                    results.matched++;
                    results.details.push({
                        organId: organ.organId,
                        organType: organ.organInfo.organType,
                        bloodType: organ.organInfo.bloodType,
                        matched: true,
                        matchId: matchResult.match.matchId,
                        patientId: matchResult.match.patientId,
                        patientName: matchResult.match.patientName,
                        appointmentId: matchResult.appointment.appointmentId,
                    });
                } else {
                    results.noMatch++;
                    results.details.push({
                        organId: organ.organId,
                        organType: organ.organInfo.organType,
                        bloodType: organ.organInfo.bloodType,
                        matched: false,
                        message: matchResult.message,
                    });
                }
            } catch (error) {
                console.error(`Error matching organ ${organ.organId}:`, error);
                results.details.push({
                    organId: organ.organId,
                    organType: organ.organInfo.organType,
                    bloodType: organ.organInfo.bloodType,
                    matched: false,
                    error: error.message,
                });
            }
        }

        console.log('=== MANUAL MATCHING COMPLETE ===');
        console.log(`Total: ${results.total}, Matched: ${results.matched}, No Match: ${results.noMatch}`);

        res.json({
            success: true,
            message: `Matching algorithm completed. ${results.matched} new matches created.`,
            results,
        });
    } catch (error) {
        console.error('Error running matching algorithm:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;

