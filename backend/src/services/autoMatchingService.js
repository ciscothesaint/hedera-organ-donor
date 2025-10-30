const Patient = require('../db/models/Patient');
const Match = require('../db/models/Match');
const Appointment = require('../db/models/Appointment');
const { allocateOrgan } = require('../hedera/contractService');

/**
 * Blood Compatibility Matrix
 * Shows which donor blood types each recipient can accept
 */
const BLOOD_COMPATIBILITY = {
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal recipient
    'AB-': ['A-', 'B-', 'AB-', 'O-'],
    'O+': ['O+', 'O-'],
    'O-': ['O-'],
};

/**
 * Find the best matching patient for an organ
 * Priority: Urgency Level (DESC) → Registration Date (ASC)
 *
 * @param {Object} organ - The organ document
 * @returns {Object|null} - Best matching patient or null if no match
 */
async function findBestMatch(organ) {
    try {
        // Get all active patients waiting for this organ type
        const waitlist = await Patient.find({
            'medicalInfo.organType': organ.organInfo.organType,
            'waitlistInfo.isActive': true,
            'matching.isMatched': false,
        }).sort({
            'medicalInfo.urgencyLevel': -1,  // Highest urgency first
            'waitlistInfo.registrationDate': 1, // Oldest registration first
        });

        if (waitlist.length === 0) {
            console.log(`No active patients in waitlist for ${organ.organInfo.organType}`);
            return null;
        }

        // Filter patients by blood compatibility
        const compatiblePatients = waitlist.filter(patient => {
            const recipientBloodType = patient.medicalInfo.bloodType;
            const donorBloodType = organ.organInfo.bloodType;

            const compatibleDonors = BLOOD_COMPATIBILITY[recipientBloodType] || [];
            const isCompatible = compatibleDonors.includes(donorBloodType);

            if (!isCompatible) {
                console.log(`Blood incompatible: Patient ${patient.patientId} (${recipientBloodType}) cannot receive ${donorBloodType} organ`);
            }

            return isCompatible;
        });

        if (compatiblePatients.length === 0) {
            console.log(`No blood-compatible patients found for ${organ.organInfo.bloodType} ${organ.organInfo.organType}`);
            return null;
        }

        // Return the first patient (already sorted by urgency DESC, then registration date ASC)
        const bestMatch = compatiblePatients[0];
        console.log(`Best match found: Patient ${bestMatch.patientId} (Urgency: ${bestMatch.medicalInfo.urgencyLevel}, Blood: ${bestMatch.medicalInfo.bloodType})`);

        return bestMatch;
    } catch (error) {
        console.error('Error finding best match:', error);
        throw error;
    }
}

/**
 * Create a match record in the database
 *
 * @param {Object} organ - The organ document
 * @param {Object} patient - The patient document
 * @returns {Object} - Created match document
 */
async function createMatch(organ, patient) {
    try {
        // Calculate days waiting
        const now = new Date();
        const registrationDate = new Date(patient.waitlistInfo.registrationDate);
        const daysWaiting = Math.max(0, Math.floor((now - registrationDate) / (1000 * 60 * 60 * 24)));

        // Generate unique match ID
        const matchId = `MATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create match document
        const match = new Match({
            matchId,
            organId: organ.organId,
            patientId: patient.patientId,
            matchScore: {
                urgencyLevel: patient.medicalInfo.urgencyLevel,
                daysWaiting,
                bloodCompatibility: true,
            },
            matchDate: now,
            status: 'PENDING',
            expiryTime: organ.timing.expiryTime,
            matchDetails: {
                organType: organ.organInfo.organType,
                organBloodType: organ.organInfo.bloodType,
                patientBloodType: patient.medicalInfo.bloodType,
                hospitalId: patient.hospitalInfo.hospitalId,
            },
        });

        await match.save();

        // Update organ allocation
        organ.allocation.isAllocated = true;
        organ.allocation.allocatedPatientId = patient.patientId;
        organ.timing.allocationTime = now;
        organ.status = 'ALLOCATED';
        await organ.save();

        // Update patient matching
        patient.matching.isMatched = true;
        patient.matching.matchedOrganId = organ.organId;
        patient.matching.matchDate = now;
        await patient.save();

        console.log(`Match created: ${matchId} (Organ: ${organ.organId} → Patient: ${patient.patientId})`);

        return match;
    } catch (error) {
        console.error('Error creating match:', error);
        throw error;
    }
}

/**
 * Create an appointment for the transplant surgery
 *
 * @param {Object} match - The match document
 * @param {Object} organ - The organ document
 * @param {Object} patient - The patient document
 * @returns {Object} - Created appointment document
 */
async function createAppointment(match, organ, patient) {
    try {
        // Generate unique appointment ID
        const appointmentId = `APPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Schedule surgery for 24 hours from now (can be customized)
        const scheduledDate = new Date(Date.now() + (24 * 60 * 60 * 1000));

        // Create appointment document
        const appointment = new Appointment({
            appointmentId,
            matchId: match.matchId,
            organId: organ.organId,
            patientId: patient.patientId,
            hospitalId: patient.hospitalInfo.hospitalId,
            surgeryDetails: {
                scheduledDate,
                estimatedDuration: 4, // Default 4 hours
                surgeonName: 'TBD',
                operatingRoom: 'TBD',
                notes: `Automatic match created for ${organ.organInfo.organType} transplant (Urgency Level: ${patient.medicalInfo.urgencyLevel})`,
            },
            status: 'SCHEDULED',
            createdBy: 'SYSTEM',
        });

        await appointment.save();

        console.log(`Appointment created: ${appointmentId} scheduled for ${scheduledDate.toISOString()}`);

        return appointment;
    } catch (error) {
        console.error('Error creating appointment:', error);
        throw error;
    }
}

/**
 * Main automatic matching function
 * Triggered when an organ is registered
 *
 * @param {Object} organ - The organ document
 * @returns {Object} - Matching result { matched: boolean, match?, appointment? }
 */
async function autoMatchOrgan(organ,client,contractId) {
    try {
        console.log(`\n=== AUTO-MATCHING STARTED for Organ ${organ.organId} ===`);
        console.log(`Organ Type: ${organ.organInfo.organType}, Blood Type: ${organ.organInfo.bloodType}`);

        // Step 1: Find best matching patient
        const patient = await findBestMatch(organ);

        if (!patient) {
            console.log('=== AUTO-MATCHING COMPLETE: No match found ===\n');
            return {
                matched: false,
                message: 'No compatible patient found in waitlist',
            };
        }
        
        // Step 2: Create match record
        await allocateOrgan(client,contractId,organ.organId,patient.patientId)
        const match = await createMatch(organ, patient);

        // Step 3: Create appointment
        const appointment = await createAppointment(match, organ, patient);

        console.log('=== AUTO-MATCHING COMPLETE: Match successful ===');
        console.log(`Match ID: ${match.matchId}`);
        console.log(`Appointment ID: ${appointment.appointmentId}`);
        console.log(`Patient: ${patient.patientId} (${patient.personalInfo.firstName} ${patient.personalInfo.lastName})`);
        console.log(`Surgery Scheduled: ${appointment.surgeryDetails.scheduledDate.toISOString()}\n`);

        return {
            matched: true,
            match: {
                matchId: match.matchId,
                patientId: patient.patientId,
                patientName: `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`,
                urgencyLevel: patient.medicalInfo.urgencyLevel,
                bloodType: patient.medicalInfo.bloodType,
                status: match.status,
            },
            appointment: {
                appointmentId: appointment.appointmentId,
                scheduledDate: appointment.surgeryDetails.scheduledDate,
                hospitalId: appointment.hospitalId,
                status: appointment.status,
            },
        };
    } catch (error) {
        console.error('Auto-matching error:', error);
        throw error;
    }
}

module.exports = {
    findBestMatch,
    createMatch,
    createAppointment,
    autoMatchOrgan,
    BLOOD_COMPATIBILITY,
};
