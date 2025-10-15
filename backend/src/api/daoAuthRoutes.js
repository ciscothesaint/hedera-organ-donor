const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../db/models/User');
const { authenticateDAO } = require('../middleware/daoAuth');

const router = express.Router();

/**
 * DAO Doctor/Medical Professional Login
 * POST /api/dao/auth/login
 *
 * Uses SEPARATE JWT secret from admin platform
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Find user with DAO role
        const user = await User.findOne({
            email,
            isActive: true,
            role: { $in: ['DAO_DOCTOR', 'DAO_ETHICS', 'DAO_OBSERVER'] }
        });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if user is authorized to access DAO
        if (user.role === 'DAO_DOCTOR' && !user.daoProfile?.isAuthorizedVoter) {
            return res.status(403).json({
                error: 'Account pending authorization',
                message: 'Your DAO access is pending approval from an administrator'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT with SEPARATE secret for DAO platform
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.DAO_JWT_SECRET || process.env.JWT_SECRET, // Fallback for development
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.json({
            message: 'DAO login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                permissions: user.permissions,
                daoProfile: {
                    medicalLicenseNumber: user.daoProfile?.medicalLicenseNumber,
                    specialization: user.daoProfile?.specialization,
                    votingPower: user.daoProfile?.votingPower,
                    isAuthorizedVoter: user.daoProfile?.isAuthorizedVoter,
                    totalProposalsCreated: user.daoProfile?.totalProposalsCreated,
                    totalVotesCast: user.daoProfile?.totalVotesCast
                }
            }
        });
    } catch (error) {
        console.error('DAO login error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Register new DAO member (doctor/medical professional)
 * POST /api/dao/auth/register
 *
 * This creates a pending account that requires admin approval
 */
router.post('/register', async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            firstName,
            lastName,
            medicalLicenseNumber,
            licenseState,
            specialization,
            yearsOfExperience
        } = req.body;

        // Validate required fields
        if (!username || !email || !password || !medicalLicenseNumber) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['username', 'email', 'password', 'medicalLicenseNumber']
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create new DAO doctor (pending authorization)
        const user = new User({
            username,
            email,
            password,
            role: 'DAO_DOCTOR', // Default role for medical professionals
            profile: {
                firstName,
                lastName
            },
            daoProfile: {
                medicalLicenseNumber,
                licenseState,
                specialization,
                yearsOfExperience,
                votingPower: 1, // Default voting power
                isAuthorizedVoter: false, // Requires admin approval
                totalProposalsCreated: 0,
                totalVotesCast: 0
            }
        });

        user.setRolePermissions();
        await user.save();

        res.status(201).json({
            message: 'DAO registration successful',
            userId: user._id,
            username: user.username,
            email: user.email,
            status: 'pending_authorization',
            note: 'Your account is pending approval. You will be notified once authorized.'
        });

    } catch (error) {
        console.error('DAO registration error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get current DAO user profile
 * GET /api/dao/auth/me
 */
router.get('/me', authenticateDAO, async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user._id,
                username: req.user.username,
                email: req.user.email,
                role: req.user.role,
                permissions: req.user.permissions,
                profile: req.user.profile,
                daoProfile: {
                    medicalLicenseNumber: req.user.daoProfile?.medicalLicenseNumber,
                    licenseState: req.user.daoProfile?.licenseState,
                    specialization: req.user.daoProfile?.specialization,
                    yearsOfExperience: req.user.daoProfile?.yearsOfExperience,
                    votingPower: req.user.daoProfile?.votingPower,
                    isAuthorizedVoter: req.user.daoProfile?.isAuthorizedVoter,
                    authorizedAt: req.user.daoProfile?.authorizedAt,
                    totalProposalsCreated: req.user.daoProfile?.totalProposalsCreated,
                    totalVotesCast: req.user.daoProfile?.totalVotesCast
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Update DAO profile (wallet address, etc.)
 * PATCH /api/dao/auth/profile
 */
router.patch('/profile', authenticateDAO, async (req, res) => {
    try {
        const {
            specialization,
            yearsOfExperience
        } = req.body;

        // Update allowed fields
        if (specialization) {
            req.user.daoProfile.specialization = specialization;
        }
        if (yearsOfExperience !== undefined) {
            req.user.daoProfile.yearsOfExperience = yearsOfExperience;
        }

        await req.user.save();

        res.json({
            message: 'Profile updated successfully',
            daoProfile: req.user.daoProfile
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Logout
 * POST /api/dao/auth/logout
 */
router.post('/logout', authenticateDAO, async (req, res) => {
    try {
        // In production, you might want to blacklist the token
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Connect Hedera wallet (DEPRECATED in centralized model)
 * POST /api/dao/auth/connect-wallet
 */
router.post('/connect-wallet', authenticateDAO, async (req, res) => {
    try {
        res.json({
            message: 'Wallet connection not required in centralized model',
            note: 'Backend handles all blockchain transactions'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Check authorization status
 * GET /api/dao/auth/status
 */
router.get('/status', authenticateDAO, async (req, res) => {
    try {
        const isAuthorized = req.user.daoProfile?.isAuthorizedVoter || false;

        res.json({
            userId: req.user._id,
            role: req.user.role,
            isAuthorizedVoter: isAuthorized,
            votingPower: req.user.daoProfile?.votingPower || 0,
            canVote: isAuthorized,
            canCreateProposals: isAuthorized && req.user.role === 'DAO_DOCTOR'
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
