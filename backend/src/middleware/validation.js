const { body, param, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array(),
        });
    }

    next();
}

/**
 * Patient registration validation
 */
const validatePatientRegistration = [
    body('patientId').notEmpty().trim(),
    body('personalInfo.firstName').notEmpty().trim(),
    body('personalInfo.lastName').notEmpty().trim(),
    body('personalInfo.dateOfBirth').isISO8601(),
    body('personalInfo.gender').isIn(['MALE', 'FEMALE', 'OTHER']),
    body('medicalInfo.organType').isIn(['HEART', 'LIVER', 'KIDNEY', 'LUNG', 'PANCREAS']),
    body('medicalInfo.bloodType').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    body('medicalInfo.urgencyLevel').isInt({ min: 1, max: 5 }),
    body('medicalInfo.medicalScore').isInt({ min: 0 }),
    body('medicalInfo.weight').isFloat({ min: 0 }),
    body('medicalInfo.height').isFloat({ min: 0 }),
    body('hospitalInfo.hospitalId').notEmpty().trim(),
    handleValidationErrors,
];

/**
 * Organ registration validation
 */
const validateOrganRegistration = [
    body('organId').notEmpty().trim(),
    body('organInfo.organType').isIn(['HEART', 'LIVER', 'KIDNEY', 'LUNG', 'PANCREAS']),
    body('organInfo.bloodType').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    body('organInfo.weight').isFloat({ min: 0 }),
    body('organInfo.viabilityHours').isInt({ min: 1 }),
    body('hospitalInfo.hospitalId').notEmpty().trim(),
    handleValidationErrors,
];

/**
 * Update urgency validation
 */
const validateUrgencyUpdate = [
    param('patientId').notEmpty().trim(),
    body('urgencyLevel').isInt({ min: 1, max: 5 }),
    handleValidationErrors,
];

/**
 * Organ allocation validation
 */
const validateOrganAllocation = [
    body('organId').notEmpty().trim(),
    body('patientId').notEmpty().trim(),
    handleValidationErrors,
];

/**
 * User registration validation
 */
const validateUserRegistration = [
    body('username').notEmpty().trim().isLength({ min: 3 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('role').isIn(['ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'COORDINATOR', 'VIEWER']),
    body('hospitalId').optional().trim(),
    handleValidationErrors,
];

/**
 * Login validation
 */
const validateLogin = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    handleValidationErrors,
];

module.exports = {
    validatePatientRegistration,
    validateOrganRegistration,
    validateUrgencyUpdate,
    validateOrganAllocation,
    validateUserRegistration,
    validateLogin,
    handleValidationErrors,
};
