const express = require('express');
const router = express.Router();
const MatchingService = require('../services/matchingService');
const matchingService = new MatchingService();

/**
 * POST /api/matching/offer
 * Register new organ offer
 */
router.post('/offer', async (req, res) => {
    try {
        const result = await matchingService.offerOrgan(req.body);
        res.json({
            success: true,
            data: result,
            message: 'Organ offered successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/matching/run/:offerId
 * Run matching algorithm for an organ offer
 */
router.post('/run/:offerId', async (req, res) => {
    try {
        const offerId = parseInt(req.params.offerId);
        const result = await matchingService.runMatching(offerId);

        res.json({
            success: true,
            data: result,
            message: 'Matching completed successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/matching/scores/:offerId
 * Calculate match scores for all candidates
 */
router.get('/scores/:offerId', async (req, res) => {
    try {
        const offerId = parseInt(req.params.offerId);

        // Get candidates from request body or query params
        const candidates = req.body.candidates || [];

        if (candidates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Candidates array is required'
            });
        }

        const scores = await matchingService.calculateMatchScores(
            offerId,
            candidates
        );

        res.json({
            success: true,
            data: {
                offerId,
                scores,
                topMatch: scores[0] || null
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/matching/offer/:offerId
 * Get organ offer details
 */
router.get('/offer/:offerId', async (req, res) => {
    try {
        const offerId = parseInt(req.params.offerId);
        const offer = await matchingService.getOrganOffer(offerId);

        res.json({
            success: true,
            data: offer
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/matching/check-compatibility
 * Check blood type compatibility
 */
router.post('/check-compatibility', async (req, res) => {
    try {
        const { recipientBlood, donorBlood } = req.body;

        if (!recipientBlood || !donorBlood) {
            return res.status(400).json({
                success: false,
                error: 'Both recipientBlood and donorBlood are required'
            });
        }

        const isCompatible = matchingService.isCompatibleBloodType(
            recipientBlood,
            donorBlood
        );

        res.json({
            success: true,
            data: {
                recipientBlood,
                donorBlood,
                isCompatible
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
