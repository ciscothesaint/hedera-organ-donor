const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../db/models/User');
const { validateUserRegistration, validateLogin } = require('../middleware/validation');
const { authenticate, authorizeRole } = require('../middleware/auth');

const router = express.Router();

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post('/register', authorizeRole('ADMIN', 'HOSPITAL_ADMIN'), validateUserRegistration, async (req, res) => {
    try {
        const user = new User(req.body);
        user.setRolePermissions();
        await user.save();

        res.status(201).json({
            message: 'User registered successfully',
            userId: user._id,
            username: user.username,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

/**
 * Login
 * POST /api/auth/login
 */
router.post('/login', validateLogin, async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email, isActive: true });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                permissions: user.permissions,
                hospitalId: user.hospitalId,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user._id,
                username: req.user.username,
                email: req.user.email,
                role: req.user.role,
                permissions: req.user.permissions,
                hospitalId: req.user.hospitalId,
                profile: req.user.profile,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Logout
 * POST /api/auth/logout
 */
router.post('/logout', authenticate, async (req, res) => {
    try {
        // In a production app, you might want to blacklist the token
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
