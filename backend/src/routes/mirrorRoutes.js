const express = require('express');
const router = express.Router();
const mirrorNodeService = require('../hedera/mirrorNodeService');

/**
 * Mirror Node Routes
 * All these endpoints are FREE - no gas fees!
 * Data is cached for performance
 */

/**
 * GET /api/mirror/health
 * Check Mirror Node health
 */
router.get('/health', async (req, res) => {
    try {
        const health = await mirrorNodeService.healthCheck();
        res.json({
            success: true,
            data: health
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/mirror/patients/waitlist/:organType
 * Get waitlist for specific organ type (FREE!)
 */
router.get('/patients/waitlist/:organType', async (req, res) => {
    try {
        const { organType } = req.params;
        const contractId = process.env.WAITLIST_CONTRACT_ID;

        if (!contractId) {
            return res.status(500).json({
                success: false,
                error: 'Waitlist contract ID not configured'
            });
        }

        const result = await mirrorNodeService.getWaitlistByOrgan(contractId, organType.toUpperCase());

        res.json({
            success: true,
            data: result,
            source: 'mirror-node',
            cost: 'FREE',
            cached: result.cached || false,
            cacheAge: result.cacheAge || 0,
            message: result.cached
                ? `📦 Cached data (${Math.round(result.cacheAge / 1000)}s old)`
                : '🆕 Fresh data from blockchain'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/mirror/patients/position/:patientHash
 * Get patient queue position (FREE!)
 * Requires: ?organType=KIDNEY (query parameter)
 */
router.get('/patients/position/:patientHash', async (req, res) => {
    try {
        const { patientHash } = req.params;
        const { organType } = req.query;
        const contractId = process.env.WAITLIST_CONTRACT_ID;

        if (!organType) {
            return res.status(400).json({
                success: false,
                error: 'organType query parameter is required'
            });
        }

        if (!contractId) {
            return res.status(500).json({
                success: false,
                error: 'Waitlist contract ID not configured'
            });
        }

        const result = await mirrorNodeService.getPatientPosition(
            contractId,
            patientHash,
            organType.toUpperCase()
        );

        res.json({
            success: true,
            data: result,
            source: 'mirror-node',
            cost: 'FREE',
            cached: result.cached || false,
            cacheAge: result.cacheAge || 0
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: 'Patient not found in waitlist'
        });
    }
});

/**
 * GET /api/mirror/patients/all
 * Get all patient registrations (FREE!)
 */
router.get('/patients/all', async (req, res) => {
    try {
        const contractId = process.env.WAITLIST_CONTRACT_ID;

        if (!contractId) {
            return res.status(500).json({
                success: false,
                error: 'Waitlist contract ID not configured'
            });
        }

        const result = await mirrorNodeService.getPatientRegistrations(contractId);

        res.json({
            success: true,
            data: result,
            source: 'mirror-node',
            cost: 'FREE',
            cached: result.cached || false,
            cacheAge: result.cacheAge || 0
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/mirror/organs/all
 * Get all organ registrations (FREE!)
 */
router.get('/organs/all', async (req, res) => {
    try {
        const contractId = process.env.MATCHING_CONTRACT_ID;

        if (!contractId) {
            return res.status(500).json({
                success: false,
                error: 'Matching contract ID not configured'
            });
        }

        const result = await mirrorNodeService.getOrganRegistrations(contractId);

        res.json({
            success: true,
            data: result,
            source: 'mirror-node',
            cost: 'FREE',
            cached: result.cached || false,
            cacheAge: result.cacheAge || 0
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/mirror/stats
 * Get aggregate statistics (FREE!)
 */
router.get('/stats', async (req, res) => {
    try {
        const waitlistContractId = process.env.WAITLIST_CONTRACT_ID;
        const matchingContractId = process.env.MATCHING_CONTRACT_ID;

        if (!waitlistContractId || !matchingContractId) {
            return res.status(500).json({
                success: false,
                error: 'Contract IDs not configured'
            });
        }

        const result = await mirrorNodeService.getStatistics(
            waitlistContractId,
            matchingContractId
        );

        res.json({
            success: true,
            data: result,
            source: 'mirror-node',
            cost: 'FREE',
            cached: result.cached || false,
            cacheAge: result.cacheAge || 0,
            message: '💰 Free blockchain statistics - no gas fees!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/mirror/contract/:contractId
 * Get contract information (FREE!)
 */
router.get('/contract/:contractId', async (req, res) => {
    try {
        const { contractId } = req.params;
        const result = await mirrorNodeService.getContract(contractId);

        res.json({
            success: true,
            data: result,
            source: 'mirror-node',
            cost: 'FREE'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/mirror/transaction/:transactionId
 * Get transaction details (FREE!)
 */
router.get('/transaction/:transactionId', async (req, res) => {
    try {
        const { transactionId } = req.params;
        const result = await mirrorNodeService.getTransaction(transactionId);

        res.json({
            success: true,
            data: result,
            source: 'mirror-node',
            cost: 'FREE'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/mirror/cache/invalidate
 * Manually invalidate cache (for testing/admin)
 */
router.post('/cache/invalidate', async (req, res) => {
    try {
        const { pattern } = req.body;

        mirrorNodeService.invalidateCache(pattern);

        res.json({
            success: true,
            message: pattern
                ? `Cache invalidated for pattern: ${pattern}`
                : 'All cache cleared'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
