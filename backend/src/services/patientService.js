const {
    ContractExecuteTransaction,
    ContractCallQuery,
    Hbar,
    ContractFunctionParameters
} = require("@hashgraph/sdk");
const crypto = require('crypto');
const hederaClient = require('../hedera/client');
const mirrorNodeService = require('../hedera/mirrorNodeService');

/**
 * Patient Service
 * Handles patient registration, queue management, and urgency updates
 */
class PatientService {
    constructor() {
        this.client = hederaClient.getClient();
        this.contractId = process.env.WAITLIST_CONTRACT_ID;
    }

    /**
     * Hash patient ID for privacy
     * @param {string} patientId - Patient national ID or unique identifier
     * @returns {string} Hex string with 0x prefix
     */
    hashPatientId(patientId) {
        return '0x' + crypto
            .createHash('sha256')
            .update(patientId.toString())
            .digest('hex');
    }

    /**
     * Register a new patient on the blockchain
     * @param {Object} patientData - Patient registration data
     * @returns {Promise<Object>} Registration result with patient hash and transaction ID
     */
    async registerPatient(patientData) {
        try {
            // Extract fields from nested structure or root level
            const nationalId = patientData.nationalId || patientData.personalInfo?.nationalId;
            const organType = patientData.organType || patientData.medicalInfo?.organType;
            const bloodType = patientData.bloodType || patientData.medicalInfo?.bloodType;
            const urgencyScore = patientData.urgencyScore || patientData.medicalInfo?.urgencyLevel || 50;
            const location = patientData.location;
            const hospitalId = patientData.hospitalId;

            // Validate inputs
            if (!nationalId || !organType || !bloodType) {
                console.error('❌ Missing required fields:', { nationalId, organType, bloodType, patientData });
                throw new Error("Missing required fields");
            }

            if (urgencyScore < 0 || urgencyScore > 100) {
                throw new Error("Urgency score must be between 0 and 100");
            }

            // Hash the patient ID for privacy
            const patientHash = this.hashPatientId(nationalId);
            console.log(`Registering patient with hash: ${patientHash}`);

            // Convert urgency score (0-100) to urgency level (1-5)
            const urgencyLevel = Math.max(1, Math.min(5, Math.ceil(urgencyScore / 20)));

            // Get medical score, weight, height with defaults
            const medicalScore = patientData.medicalScore || 70;
            const weight = patientData.weight || 70;
            const height = patientData.height || 170;

            // Get firstName and lastName from personalInfo
            const firstName = patientData.personalInfo?.firstName || patientData.firstName || 'Unknown';
            const lastName = patientData.personalInfo?.lastName || patientData.lastName || 'Patient';

            // Execute contract to register patient
            // Contract expects: (string patientId, string firstName, string lastName, string organType, uint8 urgencyLevel,
            //                    uint256 medicalScore, string bloodType, uint256 weight, uint256 height)
            const transaction = new ContractExecuteTransaction()
                .setContractId(this.contractId)
                .setGas(10000000)
                .setFunction(
                    "registerPatient",
                    new ContractFunctionParameters()
                        .addString(patientHash)
                        .addString(firstName)
                        .addString(lastName)
                        .addString(organType)
                        .addUint8(urgencyLevel)
                        .addUint256(medicalScore)
                        .addString(bloodType)
                        .addUint256(weight)
                        .addUint256(height)
                )
                .setMaxTransactionFee(new Hbar(10));

            const response = await transaction.execute(this.client);
            const receipt = await response.getReceipt(this.client);

            console.log(`✅ Patient registered: ${patientHash}`);
            console.log(`   Transaction ID: ${response.transactionId.toString()}`);

            // Get the queue position from contract logs
            const record = await response.getRecord(this.client);

            // Also submit to Hedera Consensus Service for transparency
            await this.submitToConsensusService({
                type: 'PATIENT_REGISTRATION',
                patientHash,
                organType,
                bloodType,
                urgencyScore,
                location,
                hospitalId,
                timestamp: new Date().toISOString()
            });

            // Invalidate Mirror Node cache after write
            mirrorNodeService.invalidateCache('patient');
            mirrorNodeService.invalidateCache('waitlist');
            mirrorNodeService.invalidateCache('stats');

            return {
                success: true,
                patientHash,
                transactionId: response.transactionId.toString(),
                status: receipt.status.toString()
            };

        } catch (error) {
            console.error('❌ Error registering patient:', error);
            throw new Error(`Patient registration failed: ${error.message}`);
        }
    }

    /**
     * Get patient's queue position (USES GAS - Consider using getQueuePositionFree())
     * @param {string} patientHash - Hashed patient ID
     * @returns {Promise<Object>} Queue position data
     */
    async getQueuePosition(patientHash) {
        try {
            const query = new ContractCallQuery()
                .setContractId(this.contractId)
                .setGas(100000)
                .setFunction(
                    "getQueuePosition",
                    new ContractFunctionParameters()
                        .addBytes32(Buffer.from(patientHash.slice(2), 'hex'))
                );

            const response = await query.execute(this.client);
            const position = response.getUint256(0);

            return {
                patientHash,
                queuePosition: position.toString()
            };

        } catch (error) {
            console.error('❌ Error getting queue position:', error);
            throw new Error(`Failed to get queue position: ${error.message}`);
        }
    }

    /**
     * Get patient's queue position using Mirror Node (FREE - NO GAS FEES!)
     * @param {string} patientHash - Hashed patient ID
     * @param {string} organType - Organ type
     * @returns {Promise<Object>} Queue position data
     */
    async getQueuePositionFree(patientHash, organType) {
        try {
            console.log('💰 FREE Query: Getting queue position from Mirror Node...');
            const result = await mirrorNodeService.getPatientPosition(
                this.contractId,
                patientHash,
                organType
            );

            return {
                success: true,
                ...result,
                source: 'mirror-node',
                cost: 'FREE'
            };

        } catch (error) {
            console.error('❌ Error getting queue position from Mirror Node:', error);
            // Fallback to gas-based query if Mirror Node fails
            console.log('⚠️  Falling back to ContractCallQuery (costs gas)...');
            return this.getQueuePosition(patientHash);
        }
    }

    /**
     * Get waitlist for specific organ type (USES GAS - Consider using getWaitlistFree())
     * @param {string} organType - Type of organ (KIDNEY, LIVER, HEART, etc.)
     * @returns {Promise<Object>} Waitlist data
     */
    async getWaitlist(organType) {
        try {
            const query = new ContractCallQuery()
                .setContractId(this.contractId)
                .setGas(150000)
                .setFunction(
                    "getWaitlist",
                    new ContractFunctionParameters()
                        .addString(organType)
                );

            const response = await query.execute(this.client);

            // Parse the response to get list of patient hashes
            // Note: Parsing depends on contract return format
            const waitlist = [];

            return {
                organType,
                waitlist,
                count: waitlist.length
            };

        } catch (error) {
            console.error('❌ Error getting waitlist:', error);
            throw new Error(`Failed to get waitlist: ${error.message}`);
        }
    }

    /**
     * Get waitlist for specific organ type using Mirror Node (FREE - NO GAS FEES!)
     * @param {string} organType - Type of organ
     * @returns {Promise<Object>} Waitlist data with cache info
     */
    async getWaitlistFree(organType) {
        try {
            console.log(`💰 FREE Query: Getting ${organType} waitlist from Mirror Node...`);
            const result = await mirrorNodeService.getWaitlistByOrgan(
                this.contractId,
                organType
            );

            return {
                success: true,
                ...result,
                source: 'mirror-node',
                cost: 'FREE'
            };

        } catch (error) {
            console.error('❌ Error getting waitlist from Mirror Node:', error);
            // Fallback to gas-based query
            console.log('⚠️  Falling back to ContractCallQuery (costs gas)...');
            return this.getWaitlist(organType);
        }
    }

    /**
     * Update patient urgency score
     * @param {Object} updateData - Urgency update data
     * @returns {Promise<Object>} Update result
     */
    async updateUrgency(updateData) {
        try {
            const {
                patientHash,
                newScore,
                reason,
                doctorId
            } = updateData;

            if (newScore < 0 || newScore > 100) {
                throw new Error("Urgency score must be between 0 and 100");
            }

            const transaction = new ContractExecuteTransaction()
                .setContractId(this.contractId)
                .setGas(150000)
                .setFunction(
                    "updateUrgency",
                    new ContractFunctionParameters()
                        .addBytes32(Buffer.from(patientHash.slice(2), 'hex'))
                        .addUint256(newScore)
                        .addString(reason)
                )
                .setMaxTransactionFee(new Hbar(3));

            const response = await transaction.execute(this.client);
            const receipt = await response.getReceipt(this.client);

            console.log(`✅ Urgency updated for patient: ${patientHash}`);

            // Log to consensus service
            await this.submitToConsensusService({
                type: 'URGENCY_UPDATE',
                patientHash,
                newScore,
                reason,
                doctorId,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                transactionId: response.transactionId.toString(),
                status: receipt.status.toString()
            };

        } catch (error) {
            console.error('❌ Error updating urgency:', error);
            throw new Error(`Urgency update failed: ${error.message}`);
        }
    }

    /**
     * Submit message to Hedera Consensus Service
     * @param {Object} message - Message data to log
     * @returns {Promise<string>} Transaction status
     */
    async submitToConsensusService(message) {
        const {
            TopicMessageSubmitTransaction
        } = require("@hashgraph/sdk");

        try {
            if (!process.env.PATIENT_REGISTRATION_TOPIC_ID) {
                console.warn('⚠️  Patient registration topic ID not configured');
                return;
            }

            const transaction = new TopicMessageSubmitTransaction()
                .setTopicId(process.env.PATIENT_REGISTRATION_TOPIC_ID)
                .setMessage(JSON.stringify(message));

            const response = await transaction.execute(this.client);
            const receipt = await response.getReceipt(this.client);

            return receipt.status.toString();

        } catch (error) {
            console.error('❌ Error submitting to consensus:', error);
            // Don't throw - consensus logging is supplementary
        }
    }

    /**
     * Deactivate a patient (removed from waitlist)
     * @param {string} patientHash - Hashed patient ID
     * @returns {Promise<Object>} Deactivation result
     */
    async deactivatePatient(patientHash) {
        try {
            const transaction = new ContractExecuteTransaction()
                .setContractId(this.contractId)
                .setGas(100000)
                .setFunction(
                    "deactivatePatient",
                    new ContractFunctionParameters()
                        .addBytes32(Buffer.from(patientHash.slice(2), 'hex'))
                )
                .setMaxTransactionFee(new Hbar(2));

            const response = await transaction.execute(this.client);
            const receipt = await response.getReceipt(this.client);

            console.log(`✅ Patient deactivated: ${patientHash}`);

            return {
                success: true,
                transactionId: response.transactionId.toString()
            };

        } catch (error) {
            console.error('❌ Error deactivating patient:', error);
            throw new Error(`Patient deactivation failed: ${error.message}`);
        }
    }
}

module.exports = PatientService;
