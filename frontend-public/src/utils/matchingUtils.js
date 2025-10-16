/**
 * Organ Matching Utilities - Client-Side
 * Implements matching algorithms for frontend calculations
 * Matches backend logic in matchingService.js
 */

/**
 * Blood type compatibility matrix
 */
export const BLOOD_COMPATIBILITY = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
};

export const URGENCY_MULTIPLIER = 1000;

/**
 * Check if blood types are compatible
 */
export function isBloodCompatible(donorBlood, recipientBlood) {
  const compatible = BLOOD_COMPATIBILITY[recipientBlood] || [];
  return compatible.includes(donorBlood);
}

/**
 * Calculate composite score for waitlist ranking
 * Formula: (Urgency × 1000) + Medical Score + Days Waiting
 */
export function calculateCompositeScore(patient) {
  const urgencyLevel = patient.urgencyLevel || patient.medicalInfo?.urgencyLevel || 1;
  const medicalScore = patient.medicalScore || patient.medicalInfo?.medicalScore || 0;
  const daysWaiting = patient.daysWaiting || 0;

  return (urgencyLevel * URGENCY_MULTIPLIER) + medicalScore + daysWaiting;
}

/**
 * Calculate match score between organ and patient
 */
export function calculateMatchScore(organ, patient) {
  const breakdown = {
    bloodCompatible: false,
    urgencyPoints: 0,
    medicalScorePoints: 0,
    waitTimePoints: 0,
    totalScore: 0,
  };

  const donorBlood = organ.bloodType;
  const recipientBlood = patient.bloodType;
  const urgencyLevel = patient.urgencyLevel || 1;
  const medicalScore = patient.medicalScore || 0;
  const daysWaiting = patient.daysWaiting || 0;

  // Blood compatibility check
  breakdown.bloodCompatible = isBloodCompatible(donorBlood, recipientBlood);
  if (!breakdown.bloodCompatible) {
    return {
      ...breakdown,
      reason: `Incompatible: ${donorBlood} ’ ${recipientBlood}`,
    };
  }

  // Calculate scores
  breakdown.urgencyPoints = urgencyLevel * URGENCY_MULTIPLIER;
  breakdown.medicalScorePoints = medicalScore;
  breakdown.waitTimePoints = daysWaiting;
  breakdown.totalScore = breakdown.urgencyPoints + breakdown.medicalScorePoints + breakdown.waitTimePoints;
  breakdown.reason = 'Compatible match';

  return breakdown;
}

/**
 * Calculate match probability percentage
 */
export function calculateMatchProbability(patientScore, topScore) {
  if (topScore === 0) return 0;
  const probability = (patientScore / topScore) * 100;
  return Math.min(100, Math.max(0, Math.round(probability)));
}

/**
 * Calculate days waiting from registration date
 */
export function calculateDaysWaiting(registrationDate) {
  if (!registrationDate) return 0;
  const now = new Date();
  const regDate = new Date(registrationDate);
  const days = Math.floor((now - regDate) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

/**
 * Get urgency level as text
 */
export function getUrgencyText(level) {
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
 * Get color for urgency level
 */
export function getUrgencyColor(level) {
  const colorMap = {
    1: '#10b981', // green
    2: '#3b82f6', // blue
    3: '#f59e0b', // amber
    4: '#f97316', // orange
    5: '#ef4444', // red
  };
  return colorMap[level] || '#6b7280'; // gray default
}

/**
 * Format score with commas
 */
export function formatScore(score) {
  return score.toLocaleString();
}

/**
 * Get all compatible blood types for a recipient
 */
export function getCompatibleBloodTypes(recipientBlood) {
  return BLOOD_COMPATIBILITY[recipientBlood] || [];
}

/**
 * Get urgency stars for visual display
 */
export function getUrgencyStars(level) {
  return 'P'.repeat(level);
}

/**
 * Format probability as percentage string
 */
export function formatProbability(probability) {
  return `${Math.round(probability)}%`;
}

/**
 * Get probability color (green = high, red = low)
 */
export function getProbabilityColor(probability) {
  if (probability >= 80) return '#10b981'; // green
  if (probability >= 60) return '#3b82f6'; // blue
  if (probability >= 40) return '#f59e0b'; // amber
  if (probability >= 20) return '#f97316'; // orange
  return '#ef4444'; // red
}

/**
 * Check if organ is still viable
 */
export function isOrganViable(expiryTime) {
  return new Date() < new Date(expiryTime);
}

/**
 * Format hours remaining
 */
export function formatHoursRemaining(hoursRemaining) {
  if (hoursRemaining < 1) return '<1 hour';
  if (hoursRemaining === 1) return '1 hour';
  if (hoursRemaining < 24) return `${hoursRemaining} hours`;
  const days = Math.floor(hoursRemaining / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}
