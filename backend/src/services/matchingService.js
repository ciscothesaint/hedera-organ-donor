/**
 * Organ Matching Service
 * Implements the matching algorithm from smart contracts for server-side calculations
 * Based on WaitlistRegistry.sol and MatchingEngine.sol logic
 */

/**
 * Blood type compatibility matrix
 * Key: Recipient blood type
 * Value: Array of compatible donor blood types
 */
const BLOOD_COMPATIBILITY = {
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal recipient
    'AB-': ['A-', 'B-', 'AB-', 'O-'],
    'O+': ['O+', 'O-'],
    'O-': ['O-'], // Universal donor when donating
};

/**
 * Urgency level mapping
 * Used for calculating composite scores
 */
const URGENCY_MULTIPLIER = 1000; // Urgency gets highest priority

/**
 * Check if donor and recipient blood types are compatible
 * @param {string} donorBlood - Donor's blood type (e.g., 'O+')
 * @param {string} recipientBlood - Recipient's blood type (e.g., 'A+')
 * @returns {boolean} True if compatible, false otherwise
 */
function isBloodCompatible(donorBlood, recipientBlood) {
    const compatible = BLOOD_COMPATIBILITY[recipientBlood] || [];
    return compatible.includes(donorBlood);
}

/**
 * Calculate composite score for a patient (waitlist ranking)
 * Formula: (Urgency × 1000) + Medical Score + Wait Time Bonus
 *
 * This matches the smart contract logic in WaitlistRegistry.sol line 137:
 * compositeScore = (patient.urgencyLevel * 1000) + patient.medicalScore + waitTimeBonus
 *
 * @param {Object} patient - Patient object with medical info and waitlist data
 * @returns {number} Composite score for ranking
 */
function calculateCompositeScore(patient) {
    const urgencyLevel = patient.medicalInfo?.urgencyLevel || patient.urgencyLevel || 1;
    const medicalScore = patient.medicalInfo?.medicalScore || patient.medicalScore || 0;
    const registrationDate = patient.waitlistInfo?.registrationDate || patient.registrationDate || new Date();

    // Calculate days waiting
    const now = new Date();
    const regDate = new Date(registrationDate);
    const daysWaiting = Math.max(0, Math.floor((now - regDate) / (1000 * 60 * 60 * 24)));

    // Composite score formula (matches smart contract)
    const compositeScore = (urgencyLevel * URGENCY_MULTIPLIER) + medicalScore + daysWaiting;

    return compositeScore;
}

/**
 * Calculate match score between an organ and a patient
 * This implements the simplified version from MatchingEngine.sol
 *
 * @param {Object} organ - Organ object with type, blood type, etc.
 * @param {Object} patient - Patient object with medical info
 * @returns {Object} Match result with score and breakdown
 */
function calculateMatchScore(organ, patient) {
    const breakdown = {
        bloodCompatible: false,
        urgencyPoints: 0,
        medicalScorePoints: 0,
        waitTimePoints: 0,
        totalScore: 0,
    };

    // Extract data from organ and patient
    const donorBlood = organ.organInfo?.bloodType || organ.bloodType;
    const recipientBlood = patient.medicalInfo?.bloodType || patient.bloodType;
    const urgencyLevel = patient.medicalInfo?.urgencyLevel || patient.urgencyLevel || 1;
    const medicalScore = patient.medicalInfo?.medicalScore || patient.medicalScore || 0;
    const registrationDate = patient.waitlistInfo?.registrationDate || patient.registrationDate || new Date();

    // 1. Blood Compatibility Check (CRITICAL - must pass or score = 0)
    breakdown.bloodCompatible = isBloodCompatible(donorBlood, recipientBlood);
    if (!breakdown.bloodCompatible) {
        return {
            ...breakdown,
            reason: `Incompatible blood types: Donor ${donorBlood} ’ Recipient ${recipientBlood}`,
        };
    }

    // 2. Urgency Level (Highest Priority)
    // Matches smart contract: urgencyLevel * 1000
    breakdown.urgencyPoints = urgencyLevel * URGENCY_MULTIPLIER;

    // 3. Medical Score (0-100 points)
    breakdown.medicalScorePoints = medicalScore;

    // 4. Wait Time Bonus (1 point per day)
    const now = new Date();
    const regDate = new Date(registrationDate);
    const daysWaiting = Math.max(0, Math.floor((now - regDate) / (1000 * 60 * 60 * 24)));
    breakdown.waitTimePoints = daysWaiting;

    // Total Score
    breakdown.totalScore = breakdown.urgencyPoints + breakdown.medicalScorePoints + breakdown.waitTimePoints;
    breakdown.reason = 'Compatible match';

    return breakdown;
}

/**
 * Find best matches for an organ from a waitlist
 * Returns top N patients sorted by match score
 *
 * @param {Object} organ - Organ to match
 * @param {Array} waitlist - Array of patient objects
 * @param {number} topN - Number of top matches to return (default: 5)
 * @returns {Array} Array of match objects with patient, score, and breakdown
 */
function findBestMatches(organ, waitlist, topN = 5) {
    // Calculate scores for all patients
    const matches = waitlist.map(patient => {
        const scoreBreakdown = calculateMatchScore(organ, patient);
        return {
            patient,
            score: scoreBreakdown.totalScore,
            breakdown: scoreBreakdown,
            compatible: scoreBreakdown.bloodCompatible,
        };
    });

    // Filter only compatible patients
    const compatibleMatches = matches.filter(m => m.compatible);

    // Sort by score (descending - highest score first)
    compatibleMatches.sort((a, b) => b.score - a.score);

    // Return top N matches
    return compatibleMatches.slice(0, topN);
}

/**
 * Calculate match probability for a patient
 * Probability = (patient's score / top patient's score) * 100
 *
 * @param {number} patientScore - Current patient's composite score
 * @param {number} topScore - Highest score in the waitlist
 * @returns {number} Probability percentage (0-100)
 */
function calculateMatchProbability(patientScore, topScore) {
    if (topScore === 0) return 0;
    const probability = (patientScore / topScore) * 100;
    return Math.min(100, Math.max(0, probability));
}

/**
 * Get urgency level as text from number
 * @param {number} level - Urgency level (1-5)
 * @returns {string} Urgency text
 */
function getUrgencyText(level) {
    const urgencyMap = {
        1: 'LOW',
        2: 'ROUTINE',
        3: 'MODERATE',
        4: 'HIGH',
        5: 'CRITICAL',
    };
    return urgencyMap[level] || 'ROUTINE';
}

/**
 * Get all compatible blood types for a recipient
 * @param {string} recipientBlood - Recipient's blood type
 * @returns {Array} Array of compatible donor blood types
 */
function getCompatibleBloodTypes(recipientBlood) {
    return BLOOD_COMPATIBILITY[recipientBlood] || [];
}

module.exports = {
    isBloodCompatible,
    calculateCompositeScore,
    calculateMatchScore,
    findBestMatches,
    calculateMatchProbability,
    getUrgencyText,
    getCompatibleBloodTypes,
    BLOOD_COMPATIBILITY,
    URGENCY_MULTIPLIER,
};
