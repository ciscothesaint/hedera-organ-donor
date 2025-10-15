const express = require('express');
const User = require('../db/models/User');
const DaoService = require('../services/daoService');
const { authenticate } = require('../middleware/auth'); // Admin auth
const { authenticateDAO } = require('../middleware/daoAuth');

const router = express.Router();
const daoService = new DaoService();

/**
 * Get all DAO members
 * GET /api/dao/roles/members
 *
 * Accessible by: Admin or DAO members (for transparency)
 */
router.get('/members', authenticateDAO, async (req, res) => {
    try {
        const { role, authorized } = req.query;

        const query = {
            role: { $in: ['DAO_DOCTOR', 'DAO_ETHICS', 'DAO_OBSERVER'] }
        };

        if (role) query.role = role;
        if (authorized !== undefined) {
            query['daoProfile.isAuthorizedVoter'] = authorized === 'true';
        }

        const members = await User.find(query)
            .select('-password') // Don't send passwords
            .sort({ 'daoProfile.authorizedAt': -1 });

        res.json({
            members: members.map(m => ({
                id: m._id,
                username: m.username,
                email: m.email,
                role: m.role,
                daoProfile: {
                    specialization: m.daoProfile?.specialization,
                    votingPower: m.daoProfile?.votingPower,
                    isAuthorizedVoter: m.daoProfile?.isAuthorizedVoter,
                    authorizedAt: m.daoProfile?.authorizedAt,
                    totalProposalsCreated: m.daoProfile?.totalProposalsCreated,
                    totalVotesCast: m.daoProfile?.totalVotesCast
                }
            })),
            count: members.length
        });

    } catch (error) {
        console.error('Error fetching DAO members:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get pending authorization requests
 * GET /api/dao/roles/pending
 *
 * Accessible by: Admin only
 */
router.get('/pending', authenticate, async (req, res) => {
    try {
        // Only admins can view pending requests
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const pendingMembers = await User.find({
            role: { $in: ['DAO_DOCTOR', 'DAO_ETHICS'] },
            'daoProfile.isAuthorizedVoter': false
        })
        .select('-password')
        .sort({ createdAt: -1 });

        res.json({
            pendingRequests: pendingMembers.map(m => ({
                id: m._id,
                username: m.username,
                email: m.email,
                role: m.role,
                registeredAt: m.createdAt,
                daoProfile: {
                    medicalLicenseNumber: m.daoProfile?.medicalLicenseNumber,
                    licenseState: m.daoProfile?.licenseState,
                    specialization: m.daoProfile?.specialization,
                    yearsOfExperience: m.daoProfile?.yearsOfExperience,
                    hederaWalletAddress: m.daoProfile?.hederaWalletAddress
                }
            })),
            count: pendingMembers.length
        });

    } catch (error) {
        console.error('Error fetching pending requests:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Authorize a doctor/member
 * POST /api/dao/roles/authorize/:userId
 *
 * Accessible by: Admin only
 */
router.post('/authorize/:userId', authenticate, async (req, res) => {
    try {
        // Only admins can authorize
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { userId } = req.params;
        const { votingPower = 1 } = req.body;

        const member = await User.findById(userId);

        if (!member) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!member.role.startsWith('DAO_')) {
            return res.status(400).json({ error: 'User is not a DAO member' });
        }

        if (member.daoProfile?.isAuthorizedVoter) {
            return res.status(400).json({ error: 'User is already authorized' });
        }

        // Authorize doctor (database only in centralized model)
        try {
            await daoService.authorizeDoctor({
                userId: member._id.toString(),
                name: member.username,
                licenseNumber: member.daoProfile.medicalLicenseNumber,
                votingPower
            });
        } catch (authError) {
            console.error('Authorization logging failed:', authError);
            // Continue with database authorization
        }

        // Update database
        member.daoProfile.isAuthorizedVoter = true;
        member.daoProfile.votingPower = votingPower;
        member.daoProfile.authorizedAt = new Date();
        await member.save();

        res.json({
            message: 'Member authorized successfully',
            member: {
                id: member._id,
                username: member.username,
                email: member.email,
                role: member.role,
                daoProfile: {
                    isAuthorizedVoter: true,
                    votingPower,
                    authorizedAt: member.daoProfile.authorizedAt
                }
            }
        });

    } catch (error) {
        console.error('Error authorizing member:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Revoke authorization
 * POST /api/dao/roles/revoke/:userId
 *
 * Accessible by: Admin only
 */
router.post('/revoke/:userId', authenticate, async (req, res) => {
    try {
        // Only admins can revoke
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { userId } = req.params;

        const member = await User.findById(userId);

        if (!member) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!member.daoProfile?.isAuthorizedVoter) {
            return res.status(400).json({ error: 'User is not authorized' });
        }

        // TODO: Revoke on blockchain
        // await daoService.revokeDoctor(member.daoProfile.hederaWalletAddress);

        // Update database
        member.daoProfile.isAuthorizedVoter = false;
        member.daoProfile.votingPower = 0;
        await member.save();

        res.json({
            message: 'Authorization revoked successfully',
            userId: member._id
        });

    } catch (error) {
        console.error('Error revoking authorization:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Update voting power
 * PATCH /api/dao/roles/:userId/voting-power
 *
 * Accessible by: Admin only
 */
router.patch('/:userId/voting-power', authenticate, async (req, res) => {
    try {
        // Only admins can update voting power
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { userId } = req.params;
        const { votingPower } = req.body;

        if (!votingPower || votingPower < 1 || votingPower > 10) {
            return res.status(400).json({
                error: 'Voting power must be between 1 and 10'
            });
        }

        const member = await User.findById(userId);

        if (!member) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!member.daoProfile?.isAuthorizedVoter) {
            return res.status(400).json({
                error: 'User must be authorized first'
            });
        }

        // TODO: Update on blockchain
        // await daoService.updateVotingPower(member.daoProfile.hederaWalletAddress, votingPower);

        // Update database
        member.daoProfile.votingPower = votingPower;
        await member.save();

        res.json({
            message: 'Voting power updated successfully',
            userId: member._id,
            votingPower
        });

    } catch (error) {
        console.error('Error updating voting power:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get DAO statistics
 * GET /api/dao/roles/stats
 */
router.get('/stats', authenticateDAO, async (req, res) => {
    try {
        const totalDoctors = await User.countDocuments({ role: 'DAO_DOCTOR' });
        const authorizedDoctors = await User.countDocuments({
            role: 'DAO_DOCTOR',
            'daoProfile.isAuthorizedVoter': true
        });
        const ethicsMembers = await User.countDocuments({ role: 'DAO_ETHICS' });
        const observers = await User.countDocuments({ role: 'DAO_OBSERVER' });
        const pendingAuthorization = totalDoctors - authorizedDoctors;

        // Get total voting power
        const authorizedMembers = await User.find({
            'daoProfile.isAuthorizedVoter': true
        });

        const totalVotingPower = authorizedMembers.reduce(
            (sum, member) => sum + (member.daoProfile?.votingPower || 0),
            0
        );

        res.json({
            members: {
                totalDoctors,
                authorizedDoctors,
                ethicsMembers,
                observers,
                pendingAuthorization,
                totalMembers: totalDoctors + ethicsMembers + observers
            },
            votingPower: {
                total: totalVotingPower,
                average: authorizedDoctors > 0 ? (totalVotingPower / authorizedDoctors).toFixed(2) : 0
            }
        });

    } catch (error) {
        console.error('Error fetching DAO stats:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Assign role to user
 * POST /api/dao/roles/assign
 *
 * Accessible by: Admin only
 */
router.post('/assign', authenticate, async (req, res) => {
    try {
        // Only admins can assign roles
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { userId, role } = req.body;

        if (!['DAO_DOCTOR', 'DAO_ETHICS', 'DAO_OBSERVER'].includes(role)) {
            return res.status(400).json({
                error: 'Invalid DAO role',
                allowed: ['DAO_DOCTOR', 'DAO_ETHICS', 'DAO_OBSERVER']
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.role = role;
        user.setRolePermissions();
        await user.save();

        res.json({
            message: 'Role assigned successfully',
            userId: user._id,
            role: user.role
        });

    } catch (error) {
        console.error('Error assigning role:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
