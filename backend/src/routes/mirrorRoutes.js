const express = require('express');
const router = express.Router();
const mirrorNodeService = require('../hedera/mirrorNodeService');
const contractRegistry = require('../config/contracts');

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
        const contractId = contractRegistry.getContractAddress('WaitlistRegistry');

        if (!contractId) {
            return res.status(500).json({
                success: false,
                error: 'Waitlist contract ID not configured'
            });
        }

        const result = await mirrorNodeService.getWaitlistByOrgan(contractId, organType.toUpperCase());

        // Fetch MongoDB patients to get real patient IDs
        const Patient = require('../db/models/Patient');
        const mongoPatients = await Patient.find({
            'medicalInfo.organType': organType.toUpperCase(),
            'waitlistInfo.isActive': true
        }).select('patientId personalInfo medicalInfo blockchainData waitlistInfo').lean();

        // Transform the waitlist data to match frontend expectations
        const transformedWaitlist = result.waitlist.map((blockchainPatient, index) => {
            // Try to match with MongoDB patient by blockchain transaction ID (most reliable)
            // Falls back to matching by blood type + urgency if transaction ID not available
            let matchedMongoPatient = null;

            // Primary match: by blockchain transaction ID
            if (blockchainPatient.transactionId) {
                matchedMongoPatient = mongoPatients.find(mp =>
                    mp.blockchainData?.transactionId === blockchainPatient.transactionId
                );
            }

            // Fallback match: by blood type + urgency + organ type (less reliable)
            if (!matchedMongoPatient) {
                matchedMongoPatient = mongoPatients.find(mp =>
                    mp.medicalInfo.bloodType === blockchainPatient.bloodType &&
                    mp.medicalInfo.urgencyLevel === blockchainPatient.urgencyLevel &&
                    mp.medicalInfo.organType === organType.toUpperCase()
                );
            }

            // Calculate wait time in days
            let registrationDate;
            let waitTime = 'N/A';
            let registeredAt = 'N/A';

            try {
                // Try different timestamp formats
                const timestamp = blockchainPatient.consensusTimestamp || blockchainPatient.timestamp;

                if (timestamp) {
                    // Handle Hedera timestamp format (seconds.nanoseconds)
                    if (typeof timestamp === 'string' && timestamp.includes('.')) {
                        const [seconds, nanoseconds] = timestamp.split('.');
                        registrationDate = new Date(parseInt(seconds) * 1000);
                    }
                    // Handle Unix timestamp (seconds or milliseconds)
                    else if (typeof timestamp === 'number') {
                        // If timestamp is in seconds (< year 3000)
                        registrationDate = timestamp < 10000000000
                            ? new Date(timestamp * 1000)
                            : new Date(timestamp);
                    }
                    // Handle ISO string
                    else {
                        registrationDate = new Date(timestamp);
                    }

                    // Validate the date
                    if (registrationDate && !isNaN(registrationDate.getTime())) {
                        const now = new Date();
                        const waitTimeDays = Math.floor((now - registrationDate) / (1000 * 60 * 60 * 24));
                        waitTime = waitTimeDays > 0 ? `${waitTimeDays} days` : 'Just registered';
                        registeredAt = registrationDate.toISOString();
                    }
                }

                // Fallback to MongoDB registration date if blockchain timestamp fails
                if (!registrationDate && matchedMongoPatient?.waitlistInfo?.registrationDate) {
                    registrationDate = new Date(matchedMongoPatient.waitlistInfo.registrationDate);
                    if (!isNaN(registrationDate.getTime())) {
                        const now = new Date();
                        const waitTimeDays = Math.floor((now - registrationDate) / (1000 * 60 * 60 * 24));
                        waitTime = waitTimeDays > 0 ? `${waitTimeDays} days` : 'Just registered';
                        registeredAt = registrationDate.toISOString();
                    }
                }
            } catch (err) {
                console.warn('Error parsing timestamp for patient:', blockchainPatient.patientId, err.message);
            }

            // Map urgency level (number) to urgency text
            const urgencyMap = {
                1: 'LOW',
                2: 'ROUTINE',
                3: 'MODERATE',
                4: 'HIGH',
                5: 'CRITICAL'
            };

            return {
                // Patient ID: Show MongoDB's real patient ID (e.g., "543543543")
                patientId: matchedMongoPatient?.patientId || 'N/A',

                // Patient Hash: Show a consistent identifier for blockchain verification
                // Use MongoDB patientId formatted as hash, or blockchain timestamp-based ID as fallback
                patientHash: matchedMongoPatient?.patientId
                    ? `PATIENT-${matchedMongoPatient.patientId}`
                    : blockchainPatient.patientId,

                bloodType: blockchainPatient.bloodType || 'N/A',
                urgency: urgencyMap[blockchainPatient.urgencyLevel] || 'ROUTINE',
                urgencyLevel: blockchainPatient.urgencyLevel,
                waitTime,
                registeredAt,

                // Transaction ID: Use blockchain transaction ID for Hashscan verification link
                txId: matchedMongoPatient?.blockchainData?.transactionId
                    || blockchainPatient.transactionId
                    || 'N/A',

                firstName: matchedMongoPatient?.personalInfo?.firstName || blockchainPatient.firstName,
                lastName: matchedMongoPatient?.personalInfo?.lastName || blockchainPatient.lastName,
                medicalScore: blockchainPatient.medicalScore,
                weight: blockchainPatient.weight,
                height: blockchainPatient.height,
                isActive: blockchainPatient.isActive,
                isVerified: !!matchedMongoPatient // Flag to show if blockchain record matches MongoDB
            };
        });

        res.json({
            success: true,
            data: {
                organType: result.organType,
                waitlist: transformedWaitlist,
                count: transformedWaitlist.length
            },
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
        const contractId = contractRegistry.getContractAddress('WaitlistRegistry');

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
 * Get all patient registrations (from MongoDB + blockchain verification)
 */
router.get('/patients/all', async (req, res) => {
    try {
        // Fetch from MongoDB directly
        const Patient = require('../db/models/Patient');
        const patients = await Patient.find({ 'waitlistInfo.isActive': true })
            .select('patientId personalInfo medicalInfo blockchainData')
            .sort({ 'waitlistInfo.registrationDate': -1 });

        // Transform to match expected format for DAO proposals
        const transformedPatients = patients.map(patient => ({
            patientHash: `${patient.patientId} (${patient.personalInfo.firstName} ${patient.personalInfo.lastName})`,
            patientId: patient.patientId,
            firstName: patient.personalInfo.firstName,
            lastName: patient.personalInfo.lastName,
            organType: patient.medicalInfo.organType,
            bloodType: patient.medicalInfo.bloodType,
            urgencyScore: patient.medicalInfo.urgencyLevel,
            urgencyLevel: patient.medicalInfo.urgencyLevel,
            medicalScore: patient.medicalInfo.medicalScore,
            isActive: patient.waitlistInfo?.isActive || true,
            blockchainTxId: patient.blockchainData?.transactionId
        }));

        res.json({
            success: true,
            patients: transformedPatients,
            count: transformedPatients.length,
            source: 'mongodb',
            message: `Found ${transformedPatients.length} active patient(s)`
        });
    } catch (error) {
        console.error('Error fetching patients:', error);
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
        const contractId = contractRegistry.getContractAddress('MatchingEngine');

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
        const waitlistContractId = contractRegistry.getContractAddress('WaitlistRegistry');
        const matchingContractId = contractRegistry.getContractAddress('MatchingEngine');

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

/**
 * ============================================
 * DAO TRANSPARENCY ROUTES - PUBLIC ACCESS
 * Full transparency of governance proposals and votes
 * FREE - No authentication required
 * ============================================
 */

/**
 * GET /api/mirror/dao/stats
 * Get DAO governance statistics (FREE!)
 */
router.get('/dao/stats', async (req, res) => {
    try {
        const Proposal = require('../db/models/Proposal');
        const User = require('../db/models/User');

        // Get statistics
        const [
            totalProposals,
            activeProposals,
            approvedProposals,
            rejectedProposals,
            executedProposals,
            totalVotes,
            authorizedVoters
        ] = await Promise.all([
            Proposal.countDocuments(),
            Proposal.countDocuments({ status: 'ACTIVE' }),
            Proposal.countDocuments({ status: 'APPROVED' }),
            Proposal.countDocuments({ status: 'REJECTED' }),
            Proposal.countDocuments({ status: 'EXECUTED' }),
            Proposal.aggregate([
                { $unwind: '$votes' },
                { $count: 'total' }
            ]),
            User.countDocuments({ 'daoProfile.isAuthorizedVoter': true, isActive: true })
        ]);

        // Calculate participation rate
        const recentProposals = await Proposal.find({ status: { $ne: 'PENDING' } })
            .limit(10)
            .sort({ createdAt: -1 });

        let avgParticipation = 0;
        if (recentProposals.length > 0) {
            const participationRates = recentProposals.map(p => {
                const totalVotes = p.votesFor + p.votesAgainst + p.votesAbstain;
                return (totalVotes / (p.totalVotingPower || 1)) * 100;
            });
            avgParticipation = participationRates.reduce((sum, rate) => sum + rate, 0) / participationRates.length;
        }

        res.json({
            success: true,
            data: {
                totalProposals,
                activeProposals,
                approvedProposals,
                rejectedProposals,
                executedProposals,
                totalVotes: totalVotes[0]?.total || 0,
                authorizedVoters,
                averageParticipation: Math.round(avgParticipation)
            },
            source: 'mongodb + mirror-node',
            cost: 'FREE',
            message: '💰 Free DAO statistics - complete transparency!'
        });

    } catch (error) {
        console.error('Error fetching DAO stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/mirror/dao/proposals
 * Get all proposals with pagination and filters (FREE!)
 *
 * Query params:
 * - page: page number (default: 1)
 * - limit: items per page (default: 20)
 * - status: filter by status (ACTIVE, APPROVED, REJECTED, EXECUTED)
 * - urgency: filter by urgency level (EMERGENCY, STANDARD)
 * - type: filter by proposal type
 */
router.get('/dao/proposals', async (req, res) => {
    try {
        const Proposal = require('../db/models/Proposal');

        const {
            page = 1,
            limit = 20,
            status,
            urgency,
            type,
            patientHash
        } = req.query;

        const query = {};
        if (status) query.status = status;
        if (urgency) query.urgencyLevel = urgency;
        if (type) query.proposalType = type;
        if (patientHash) query.patientHash = patientHash;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 }
        };

        const proposals = await Proposal.find(query)
            .sort(options.sort)
            .limit(options.limit)
            .skip((options.page - 1) * options.limit)
            .lean();

        const total = await Proposal.countDocuments(query);

        // Add computed fields
        const enrichedProposals = proposals.map(proposal => {
            const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
            const participationRate = (totalVotes / (proposal.totalVotingPower || 1)) * 100;
            const approvalRate = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
            const isVotingOpen = proposal.status === 'ACTIVE' && new Date() < new Date(proposal.votingDeadline);
            const timeRemaining = isVotingOpen ? Math.max(0, new Date(proposal.votingDeadline) - Date.now()) : 0;

            return {
                ...proposal,
                participationRate: Math.round(participationRate),
                approvalRate: Math.round(approvalRate),
                isVotingOpen,
                timeRemaining,
                voteCount: totalVotes
            };
        });

        res.json({
            success: true,
            proposals: enrichedProposals,
            pagination: {
                page: options.page,
                limit: options.limit,
                total,
                pages: Math.ceil(total / options.limit)
            },
            source: 'mongodb',
            cost: 'FREE',
            message: 'Complete transparency - all proposals visible to public'
        });

    } catch (error) {
        console.error('Error fetching proposals:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/mirror/dao/proposals/active
 * Get currently active proposals (open for voting) (FREE!)
 */
router.get('/dao/proposals/active', async (req, res) => {
    try {
        const Proposal = require('../db/models/Proposal');

        const proposals = await Proposal.find({
            status: 'ACTIVE',
            votingDeadline: { $gt: new Date() }
        }).sort({ votingDeadline: 1 }).lean();

        // Add computed fields
        const enrichedProposals = proposals.map(proposal => {
            const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
            const participationRate = (totalVotes / (proposal.totalVotingPower || 1)) * 100;
            const approvalRate = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
            const timeRemaining = Math.max(0, new Date(proposal.votingDeadline) - Date.now());

            return {
                ...proposal,
                participationRate: Math.round(participationRate),
                approvalRate: Math.round(approvalRate),
                isVotingOpen: true,
                timeRemaining,
                voteCount: totalVotes
            };
        });

        res.json({
            success: true,
            proposals: enrichedProposals,
            count: enrichedProposals.length,
            source: 'mongodb',
            cost: 'FREE',
            message: `${enrichedProposals.length} active proposal(s) currently open for voting`
        });

    } catch (error) {
        console.error('Error fetching active proposals:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/mirror/dao/proposals/:id
 * Get specific proposal details with full transparency (FREE!)
 */
router.get('/dao/proposals/:id', async (req, res) => {
    try {
        const Proposal = require('../db/models/Proposal');
        const { id } = req.params;

        const proposal = await Proposal.findOne({ proposalId: parseInt(id) }).lean();

        if (!proposal) {
            return res.status(404).json({
                success: false,
                error: 'Proposal not found'
            });
        }

        // Add computed fields
        const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
        const participationRate = (totalVotes / (proposal.totalVotingPower || 1)) * 100;
        const approvalRate = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
        const isVotingOpen = proposal.status === 'ACTIVE' && new Date() < new Date(proposal.votingDeadline);
        const timeRemaining = isVotingOpen ? Math.max(0, new Date(proposal.votingDeadline) - Date.now()) : 0;

        const enrichedProposal = {
            ...proposal,
            participationRate: Math.round(participationRate),
            approvalRate: Math.round(approvalRate),
            isVotingOpen,
            timeRemaining,
            voteCount: totalVotes
        };

        res.json({
            success: true,
            proposal: enrichedProposal,
            source: 'mongodb',
            cost: 'FREE',
            blockchainTxId: proposal.blockchainTxId,
            message: 'Full proposal transparency with all votes and reasoning visible'
        });

    } catch (error) {
        console.error('Error fetching proposal:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/mirror/dao/proposals/:id/votes
 * Get all votes for a proposal with full transparency (FREE!)
 * Shows who voted, how they voted, and their reasoning
 */
router.get('/dao/proposals/:id/votes', async (req, res) => {
    try {
        const Proposal = require('../db/models/Proposal');
        const { id } = req.params;

        const proposal = await Proposal.findOne({ proposalId: parseInt(id) }).lean();

        if (!proposal) {
            return res.status(404).json({
                success: false,
                error: 'Proposal not found'
            });
        }

        // Sort votes by timestamp (most recent first)
        const votes = (proposal.votes || []).sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        );

        // Calculate vote summary
        const summary = {
            votesFor: proposal.votesFor,
            votesAgainst: proposal.votesAgainst,
            votesAbstain: proposal.votesAbstain,
            totalVotingPower: proposal.totalVotingPower,
            participationRate: Math.round(
                ((proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain) /
                (proposal.totalVotingPower || 1)) * 100
            ),
            approvalRate: (proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain) > 0
                ? Math.round((proposal.votesFor / (proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain)) * 100)
                : 0
        };

        res.json({
            success: true,
            proposalId: proposal.proposalId,
            votes,
            summary,
            voteCount: votes.length,
            source: 'mongodb',
            cost: 'FREE',
            message: 'Complete vote transparency - all votes, voters, and reasoning visible to public'
        });

    } catch (error) {
        console.error('Error fetching votes:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
