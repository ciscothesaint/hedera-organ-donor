const express = require('express');
const router = express.Router();
const User = require('../db/models/User');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Admin routes for managing DAO users
 * All routes require ADMIN role
 */

/**
 * Get all DAO users (pending and authorized)
 * GET /api/admin/dao-users
 */
router.get('/dao-users', authenticate, authorize(['ADMIN']), async (req, res) => {
    try {
        const { status } = req.query; // 'pending' | 'authorized' | 'all'

        let query = {
            role: { $in: ['DAO_DOCTOR', 'DAO_ETHICS', 'DAO_OBSERVER'] }
        };

        if (status === 'pending') {
            query['daoProfile.isAuthorizedVoter'] = false;
        } else if (status === 'authorized') {
            query['daoProfile.isAuthorizedVoter'] = true;
        }

        const users = await User.find(query)
            .select('name email role daoProfile createdAt')
            .sort({ createdAt: -1 });

        console.log(`Found ${users.length} DAO users with status: ${status || 'all'}`);
        if (users.length > 0) {
            console.log('First user:', { _id: users[0]._id, email: users[0].email, role: users[0].role });
        }

        res.json({
            success: true,
            users: users.map(u => ({
                _id: u._id,
                name: u.name,
                email: u.email,
                role: u.role,
                daoProfile: {
                    medicalLicenseNumber: u.daoProfile?.medicalLicenseNumber,
                    specialization: u.daoProfile?.specialization,
                    hospitalId: u.daoProfile?.hospitalId,
                    hederaWalletAddress: u.daoProfile?.hederaWalletAddress,
                    votingPower: u.daoProfile?.votingPower || 1,
                    isAuthorizedVoter: u.daoProfile?.isAuthorizedVoter || false,
                    totalVotesCast: u.daoProfile?.totalVotesCast || 0,
                    authorizedAt: u.daoProfile?.authorizedAt,
                },
                createdAt: u.createdAt,
            })),
            count: users.length
        });

    } catch (error) {
        console.error('Error fetching DAO users:', error);
        res.status(500).json({ error: 'Failed to fetch DAO users' });
    }
});

/**
 * Authorize a DAO user
 * POST /api/admin/dao-users/:userId/authorize
 */
router.post('/dao-users/:userId/authorize', authenticate, authorize(['ADMIN']), async (req, res) => {
    try {
        const { userId } = req.params;
        const { votingPower = 1 } = req.body;

        // Validate voting power
        if (votingPower < 1 || votingPower > 10) {
            return res.status(400).json({ error: 'Voting power must be between 1 and 10' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!['DAO_DOCTOR', 'DAO_ETHICS'].includes(user.role)) {
            return res.status(400).json({ error: 'User is not a DAO doctor or ethics member' });
        }

        if (user.daoProfile?.isAuthorizedVoter) {
            return res.status(400).json({ error: 'User is already authorized' });
        }

        // Update user authorization
        user.daoProfile.isAuthorizedVoter = true;
        user.daoProfile.votingPower = votingPower;
        user.daoProfile.authorizedAt = new Date();

        await user.save();

        // TODO: Call smart contract to authorize doctor on blockchain
        // This would require daoService.authorizeDoctor() but we'll skip for now
        // since the simplified contract needs the admin's wallet signature

        res.json({
            success: true,
            message: 'User authorized successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                votingPower: user.daoProfile.votingPower,
                authorizedAt: user.daoProfile.authorizedAt
            }
        });

    } catch (error) {
        console.error('Error authorizing user:', error);
        res.status(500).json({ error: 'Failed to authorize user' });
    }
});

/**
 * Revoke DAO user authorization
 * POST /api/admin/dao-users/:userId/revoke
 */
router.post('/dao-users/:userId/revoke', authenticate, authorize(['ADMIN']), async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.daoProfile?.isAuthorizedVoter) {
            return res.status(400).json({ error: 'User is not authorized' });
        }

        user.daoProfile.isAuthorizedVoter = false;
        user.daoProfile.votingPower = 0;

        await user.save();

        res.json({
            success: true,
            message: 'User authorization revoked successfully'
        });

    } catch (error) {
        console.error('Error revoking authorization:', error);
        res.status(500).json({ error: 'Failed to revoke authorization' });
    }
});

/**
 * Update user voting power
 * PATCH /api/admin/dao-users/:userId/voting-power
 */
router.patch('/dao-users/:userId/voting-power', authenticate, authorize(['ADMIN']), async (req, res) => {
    try {
        const { userId } = req.params;
        const { votingPower } = req.body;

        if (votingPower < 1 || votingPower > 10) {
            return res.status(400).json({ error: 'Voting power must be between 1 and 10' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.daoProfile?.isAuthorizedVoter) {
            return res.status(400).json({ error: 'User must be authorized first' });
        }

        user.daoProfile.votingPower = votingPower;
        await user.save();

        res.json({
            success: true,
            message: 'Voting power updated successfully',
            votingPower
        });

    } catch (error) {
        console.error('Error updating voting power:', error);
        res.status(500).json({ error: 'Failed to update voting power' });
    }
});

module.exports = router;
