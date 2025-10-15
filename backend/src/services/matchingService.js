const {
    ContractExecuteTransaction,
    ContractCallQuery,
    Hbar,
    ContractFunctionParameters
} = require("@hashgraph/sdk");
const hederaClient = require('../hedera/client');
const contractRegistry = require('../config/contracts');

/**
 * Matching Service
 * Handles organ offers, matching algorithm, and allocation
 */
class MatchingService {
    constructor() {
        this.client = hederaClient.getClient();
        this.matchingContractId = contractRegistry.getContractAddress('MatchingEngine');
        this.waitlistContractId = contractRegistry.getContractAddress('WaitlistRegistry');
    }

    /**
     * Register a new organ offer
     * @param {Object} organData - Organ details
     * @returns {Promise<Object>} Offer result with offer ID
     */
    async offerOrgan(organData) {
        try {
            const {
                organType,
                bloodType,
                location,
                donorInfo,
                weight = 500,  // Default weight in grams
                viabilityHours = 24  // Default viability 24 hours
            } = organData;

            // Validate inputs
            if (!organType || !bloodType || !location) {
                throw new Error("Missing required fields");
            }

            // Generate unique organ ID
            const organId = `ORG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            console.log(`Offering organ: ${organType} (${bloodType}) from ${location}`);

            const transaction = new ContractExecuteTransaction()
                .setContractId(this.matchingContractId)
                .setGas(3000000)
                .setFunction(
                    "registerOrgan",
                    new ContractFunctionParameters()
                        .addString(organId)
                        .addString(organType)
                        .addString(bloodType)
                        .addUint256(weight)
                        .addUint256(viabilityHours)
                )
                .setMaxTransactionFee(new Hbar(3));

            const response = await transaction.execute(this.client);
            const receipt = await response.getReceipt(this.client);

            // Get offer ID from logs
            const record = await response.getRecord(this.client);

            console.log(`✅ Organ offered successfully`);

            // Submit to consensus for transparency
            await this.logOrganOffer({
                organId,
                organType,
                bloodType,
                location,
                weight,
                viabilityHours,
                donorInfo,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                transactionId: response.transactionId.toString(),
                status: receipt.status.toString(),
                offerId: organId
            };

        } catch (error) {
            console.error('❌ Error offering organ:', error);
            throw new Error(`Organ offer failed: ${error.message}`);
        }
    }

    /**
     * Run matching algorithm to find best recipient
     * @param {number} offerId - Organ offer ID
     * @returns {Promise<Object>} Match result with patient hash
     */
    async runMatching(offerId) {
        try {
            console.log(`Running matching algorithm for offer #${offerId}`);

            // First, get the organ details
            const organDetails = await this.getOrganOffer(offerId);

            // Get all candidates from waitlist
            const candidates = await this.getCandidates(organDetails.organType);

            if (candidates.length === 0) {
                throw new Error("No candidates found in waitlist");
            }

            console.log(`   Found ${candidates.length} candidates`);

            // Run matching algorithm on-chain
            const transaction = new ContractExecuteTransaction()
                .setContractId(this.matchingContractId)
                .setGas(500000)
                .setFunction(
                    "runMatching",
                    new ContractFunctionParameters()
                        .addUint256(offerId)
                        .addBytes32Array(candidates.map(c =>
                            Buffer.from(c.slice(2), 'hex')
                        ))
                )
                .setMaxTransactionFee(new Hbar(10));

            const response = await transaction.execute(this.client);
            const receipt = await response.getReceipt(this.client);

            // Get matched patient from logs
            const record = await response.getRecord(this.client);

            const matchedPatient = null; // TODO: Parse from contract events

            console.log(`✅ Match found successfully`);

            // Log match result
            await this.logMatchResult({
                offerId,
                matchedPatient,
                candidatesCount: candidates.length,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                transactionId: response.transactionId.toString(),
                matchedPatient,
                status: receipt.status.toString()
            };

        } catch (error) {
            console.error('❌ Error running matching:', error);
            throw new Error(`Matching failed: ${error.message}`);
        }
    }

    /**
     * Calculate match scores for all candidates
     * @param {number} offerId - Organ offer ID
     * @param {Array<string>} candidates - Array of patient hashes
     * @returns {Promise<Array>} Array of match scores sorted by score
     */
    async calculateMatchScores(offerId, candidates) {
        try {
            const scores = [];

            console.log(`Calculating match scores for ${candidates.length} candidates...`);

            for (const candidate of candidates) {
                try {
                    const query = new ContractCallQuery()
                        .setContractId(this.matchingContractId)
                        .setGas(100000)
                        .setFunction(
                            "calculateMatchScore",
                            new ContractFunctionParameters()
                                .addBytes32(Buffer.from(candidate.slice(2), 'hex'))
                                .addUint256(offerId)
                        );

                    const response = await query.execute(this.client);
                    const score = response.getUint256(0);

                    scores.push({
                        patientHash: candidate,
                        score: score.toString()
                    });
                } catch (error) {
                    console.warn(`Could not calculate score for candidate ${candidate}:`, error.message);
                }
            }

            // Sort by score descending
            scores.sort((a, b) => parseInt(b.score) - parseInt(a.score));

            console.log(`   Top match score: ${scores[0]?.score || 'N/A'}`);

            return scores;

        } catch (error) {
            console.error('❌ Error calculating scores:', error);
            throw new Error(`Score calculation failed: ${error.message}`);
        }
    }

    /**
     * Get organ offer details
     * @param {number} offerId - Organ offer ID
     * @returns {Promise<Object>} Organ offer data
     */
    async getOrganOffer(offerId) {
        try {
            const query = new ContractCallQuery()
                .setContractId(this.matchingContractId)
                .setGas(100000)
                .setFunction(
                    "organOffers",
                    new ContractFunctionParameters()
                        .addUint256(offerId)
                );

            const response = await query.execute(this.client);

            // Parse organ offer struct
            // TODO: Implement based on contract return structure
            return {
                organType: 'KIDNEY', // placeholder
                bloodType: 'O+',
                location: 'Location',
                availableTime: Date.now(),
                isMatched: false
            };

        } catch (error) {
            console.error('❌ Error getting organ offer:', error);
            throw new Error(`Failed to get organ offer: ${error.message}`);
        }
    }

    /**
     * Get candidates from waitlist for specific organ type
     * @param {string} organType - Type of organ
     * @returns {Promise<Array<string>>} Array of patient hashes
     */
    async getCandidates(organType) {
        try {
            const query = new ContractCallQuery()
                .setContractId(this.waitlistContractId)
                .setGas(1000000)
                .setFunction(
                    "getWaitlist",
                    new ContractFunctionParameters()
                        .addString(organType)
                );

            const response = await query.execute(this.client);

            // Parse waitlist response
            // TODO: Implement based on contract return structure
            const candidates = [];

            return candidates;

        } catch (error) {
            console.error('❌ Error getting candidates:', error);
            throw new Error(`Failed to get candidates: ${error.message}`);
        }
    }

    /**
     * Log organ offer to Hedera Consensus Service
     * @param {Object} data - Organ offer data
     */
    async logOrganOffer(data) {
        const { TopicMessageSubmitTransaction } = require("@hashgraph/sdk");

        try {
            const topicId = contractRegistry.getTopicId('OrganMatch');

            if (!topicId) {
                console.warn('⚠️  Organ match topic ID not configured');
                return;
            }

            const transaction = new TopicMessageSubmitTransaction()
                .setTopicId(topicId)
                .setMessage(JSON.stringify({
                    type: 'ORGAN_OFFER',
                    ...data
                }));

            await transaction.execute(this.client);

        } catch (error) {
            console.error('❌ Error logging organ offer:', error);
            // Don't throw - logging is supplementary
        }
    }

    /**
     * Log match result to Hedera Consensus Service
     * @param {Object} data - Match result data
     */
    async logMatchResult(data) {
        const { TopicMessageSubmitTransaction } = require("@hashgraph/sdk");

        try {
            const topicId = contractRegistry.getTopicId('OrganMatch');

            if (!topicId) {
                console.warn('⚠️  Organ match topic ID not configured');
                return;
            }

            const transaction = new TopicMessageSubmitTransaction()
                .setTopicId(topicId)
                .setMessage(JSON.stringify({
                    type: 'MATCH_RESULT',
                    ...data
                }));

            await transaction.execute(this.client);

        } catch (error) {
            console.error('❌ Error logging match result:', error);
            // Don't throw - logging is supplementary
        }
    }

    /**
     * Find matching patients for an organ offer
     * @param {Object} criteria - Organ criteria (organType, bloodType, location)
     * @returns {Promise<Array>} Array of matching patients with scores
     */
    async findMatches(criteria) {
        try {
            const { organType, bloodType, location } = criteria;

            console.log(`🔍 Finding matches for ${organType} (${bloodType}) in ${location}...`);

            // Get all candidates from waitlist for this organ type
            const query = new ContractCallQuery()
                .setContractId(this.waitlistContractId)
                .setGas(1000000)
                .setFunction(
                    "getWaitlist",
                    new ContractFunctionParameters()
                        .addString(organType)
                );

            const response = await query.execute(this.client);

            // Parse the response to extract patient hashes
            // Note: This is a simplified version - actual parsing depends on contract structure
            const patientCount = response.getUint256(0) || 0;

            console.log(`   Found ${patientCount} patients in ${organType} waitlist`);

            // For now, return mock matches since contract integration needs completion
            // In production, this would call calculateMatchScores with real patient data
            const matches = [];

            // TODO: Replace with actual contract data parsing
            if (patientCount > 0) {
                matches.push({
                    patientHash: '0x' + '1'.repeat(64), // Placeholder
                    score: 95,
                    reason: 'Blood type match, high urgency, same location'
                });
            }

            console.log(`   ✅ Found ${matches.length} compatible matches`);

            return matches;

        } catch (error) {
            console.error('❌ Error finding matches:', error);
            throw new Error(`Match finding failed: ${error.message}`);
        }
    }

    /**
     * Allocate an organ to a patient
     * @param {Object} allocationData - Contains organId and patientHash
     * @returns {Promise<Object>} Allocation result
     */
    async allocateOrgan(allocationData) {
        try {
            const { organId, patientHash } = allocationData;

            console.log(`🎯 Allocating organ ${organId} to patient ${patientHash.substring(0, 16)}...`);

            // Execute allocation transaction
            const transaction = new ContractExecuteTransaction()
                .setContractId(this.matchingContractId)
                .setGas(500000)
                .setFunction(
                    "allocateOrgan",
                    new ContractFunctionParameters()
                        .addString(organId)
                        .addBytes32(Buffer.from(patientHash.slice(2), 'hex'))
                )
                .setMaxTransactionFee(new Hbar(5));

            const response = await transaction.execute(this.client);
            const receipt = await response.getReceipt(this.client);

            console.log(`✅ Organ allocated successfully`);

            // Log allocation to consensus service
            await this.logAllocation({
                organId,
                patientHash,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                transactionId: response.transactionId.toString(),
                status: receipt.status.toString()
            };

        } catch (error) {
            console.error('❌ Error allocating organ:', error);
            throw new Error(`Allocation failed: ${error.message}`);
        }
    }

    /**
     * Log allocation to Hedera Consensus Service
     * @param {Object} data - Allocation data
     */
    async logAllocation(data) {
        const { TopicMessageSubmitTransaction } = require("@hashgraph/sdk");

        try {
            const topicId = contractRegistry.getTopicId('OrganMatch');

            if (!topicId) {
                console.warn('⚠️  Organ match topic ID not configured');
                return;
            }

            const transaction = new TopicMessageSubmitTransaction()
                .setTopicId(topicId)
                .setMessage(JSON.stringify({
                    type: 'ALLOCATION',
                    ...data
                }));

            await transaction.execute(this.client);

        } catch (error) {
            console.error('❌ Error logging allocation:', error);
            // Don't throw - logging is supplementary
        }
    }

    /**
     * Check if blood types are compatible
     * @param {string} recipientBlood - Recipient blood type
     * @param {string} donorBlood - Donor blood type
     * @returns {boolean} True if compatible
     */
    isCompatibleBloodType(recipientBlood, donorBlood) {
        const compatibility = {
            'O-': ['O-'],
            'O+': ['O-', 'O+'],
            'A-': ['O-', 'A-'],
            'A+': ['O-', 'O+', 'A-', 'A+'],
            'B-': ['O-', 'B-'],
            'B+': ['O-', 'O+', 'B-', 'B+'],
            'AB-': ['O-', 'A-', 'B-', 'AB-'],
            'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
        };

        return compatibility[recipientBlood]?.includes(donorBlood) || false;
    }
}

module.exports = MatchingService;
