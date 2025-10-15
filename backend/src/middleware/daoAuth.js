const jwt = require('jsonwebtoken');
const User = require('../db/models/User');

/**
 * DAO Authentication Middleware
 * Separate from admin authentication to ensure session isolation
 */

/**
 * Authenticate DAO users using separate JWT secret
 */
async function authenticateDAO(req, res, next) {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'DAO authentication required' });
        }

        // Use separate JWT secret for DAO platform
        const decoded = jwt.verify(token, process.env.DAO_JWT_SECRET || process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid DAO authentication' });
        }

        // Verify user has a DAO role
        if (!user.role.startsWith('DAO_')) {
            return res.status(403).json({ error: 'Not a DAO member' });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid DAO authentication token' });
    }
}

/**
 * Authorize DAO voters (doctors and ethics committee)
 */
function authorizeVoter(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const isVoter = req.user.role === 'DAO_DOCTOR' || req.user.role === 'DAO_ETHICS';
    const isAuthorized = req.user.daoProfile?.isAuthorizedVoter;

    if (!isVoter || !isAuthorized) {
        return res.status(403).json({
            error: 'Not authorized to vote',
            message: 'Only authorized doctors and ethics committee members can vote'
        });
    }

    next();
}

/**
 * Require DAO doctor role (can create proposals)
 */
function requireDoctorRole(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'DAO_DOCTOR') {
        return res.status(403).json({
            error: 'Doctors only',
            message: 'Only doctors can create proposals'
        });
    }

    if (!req.user.daoProfile?.isAuthorizedVoter) {
        return res.status(403).json({
            error: 'Not authorized',
            message: 'You must be an authorized doctor to create proposals'
        });
    }

    next();
}

/**
 * Require ethics committee role
 */
function requireEthicsRole(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'DAO_ETHICS') {
        return res.status(403).json({
            error: 'Ethics committee only',
            message: 'Only ethics committee members can perform this action'
        });
    }

    next();
}

/**
 * Allow DAO observers and higher (read-only access)
 */
function allowObserver(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const validRoles = ['DAO_DOCTOR', 'DAO_ETHICS', 'DAO_OBSERVER'];

    if (!validRoles.includes(req.user.role)) {
        return res.status(403).json({
            error: 'DAO access required',
            message: 'You must be a DAO member to view this content'
        });
    }

    next();
}

/**
 * Check if user has specific DAO permission
 */
function checkDaoPermission(permission) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!req.user.daoProfile?.[permission]) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: `This action requires ${permission} permission`
            });
        }

        next();
    };
}

/**
 * Verify user has Hedera wallet connected (DEPRECATED in centralized model)
 * Kept for backward compatibility but no longer enforces wallet requirement
 */
function requireWalletConnected(req, res, next) {
    // In centralized model, wallet is not required
    // Backend handles all blockchain transactions
    next();
}

/**
 * Rate limiting for proposal creation (prevent spam)
 */
function rateLimitProposals(req, res, next) {
    // TODO: Implement rate limiting logic
    // For now, just pass through
    next();
}

/**
 * Validate medical license (additional security check)
 */
async function validateMedicalLicense(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const hasValidLicense = req.user.daoProfile?.medicalLicenseNumber &&
                           req.user.daoProfile?.licenseState;

    if (!hasValidLicense) {
        return res.status(403).json({
            error: 'Medical license required',
            message: 'You must have a verified medical license to perform this action'
        });
    }

    // TODO: Add external medical license verification API call
    next();
}

module.exports = {
    authenticateDAO,
    authorizeVoter,
    requireDoctorRole,
    requireEthicsRole,
    allowObserver,
    checkDaoPermission,
    requireWalletConnected,
    rateLimitProposals,
    validateMedicalLicense
};
