const {
    ContractExecuteTransaction,
    ContractFunctionParameters,
    Hbar
} = require("@hashgraph/sdk");
const hederaClient = require('../hedera/client');
const contractRegistry = require('../config/contracts');
const Proposal = require('../db/models/Proposal');
const Patient = require('../db/models/Patient');
const DaoService = require('./daoService');

/**
 * Proposal Execution Service
 * Handles automatic execution of approved DAO proposals
 * Executes actions on smart contracts and updates database
 */
class ProposalExecutionService {
    constructor() {
        this.client = hederaClient.getClient();
        this.waitlistContractId = contractRegistry.getContractAddress('WaitlistRegistry');
        this.daoContractId = contractRegistry.getContractAddress('GovernanceDAO');
        this.daoService = new DaoService();
    }

    /**
     * Execute an approved proposal
     * @param {number} proposalId - Proposal ID to execute
     * @param {string} executorId - ID of user executing the proposal
     * @returns {Promise<Object>} Execution result
     */
    async executeProposal(proposalId, executorId) {
        try {
            console.log(`🚀 Starting execution of proposal #${proposalId} by user ${executorId}`);

            // Get proposal from database
            const proposal = await Proposal.findOne({ proposalId });

            if (!proposal) {
                throw new Error(`Proposal #${proposalId} not found`);
            }

            // Verify proposal is approved
            if (proposal.status !== 'APPROVED') {
                throw new Error(`Proposal #${proposalId} is not approved (status: ${proposal.status})`);
            }

            // Check if already executed
            if (proposal.executedAt) {
                throw new Error(`Proposal #${proposalId} already executed at ${proposal.executedAt}`);
            }

            let actionResult;
            let patientUpdateResult;

            // Execute action based on proposal type
            switch (proposal.proposalType) {
                case 'URGENCY_UPDATE':
                    actionResult = await this.executeUrgencyUpdate(proposal);
                    patientUpdateResult = await this.updatePatientDatabase(proposal, actionResult);
                    break;

                case 'PATIENT_REMOVAL':
                    actionResult = await this.executePatientRemoval(proposal);
                    patientUpdateResult = await this.updatePatientRemovalDatabase(proposal, actionResult);
                    break;

                case 'SYSTEM_PARAMETER':
                case 'EMERGENCY_OVERRIDE':
                    throw new Error(`Proposal type ${proposal.proposalType} execution not yet implemented`);

                default:
                    throw new Error(`Unknown proposal type: ${proposal.proposalType}`);
            }

            // Mark proposal as executed on DAO contract
            console.log(`📝 Marking proposal #${proposalId} as EXECUTED on DAO contract...`);
            const daoExecutionResult = await this.daoService.executeProposal(proposalId);

            // Update proposal in database
            proposal.status = 'EXECUTED';
            proposal.executedAt = new Date();
            proposal.executionTxId = daoExecutionResult.transactionId;
            await proposal.save();

            console.log(`✅ Proposal #${proposalId} executed successfully!`);

            return {
                success: true,
                proposalId,
                proposalType: proposal.proposalType,
                actionTransactionId: actionResult.transactionId,
                daoTransactionId: daoExecutionResult.transactionId,
                patientUpdate: patientUpdateResult,
                executedAt: proposal.executedAt
            };

        } catch (error) {
            console.error(`❌ Error executing proposal #${proposalId}:`, error);

            // Update proposal with error
            await Proposal.findOneAndUpdate(
                { proposalId },
                {
                    executionError: error.message,
                    executionAttemptedAt: new Date()
                }
            );

            throw new Error(`Proposal execution failed: ${error.message}`);
        }
    }

    /**
     * Execute urgency update on WaitlistRegistry contract
     * @param {Object} proposal - Proposal document
     * @returns {Promise<Object>} Transaction result
     */
    async executeUrgencyUpdate(proposal) {
        try {
            console.log(`🔄 Executing urgency update for proposal #${proposal.proposalId}`);

            // Extract patient ID from patientHash (format: "PT-20250116-1234 (hash)")
            const patientId = proposal.patientHash.split(' ')[0];
            const newUrgency = proposal.proposedValue;

            console.log(`   Patient ID: ${patientId}`);
            console.log(`   Current Urgency: ${proposal.currentValue}`);
            console.log(`   New Urgency: ${newUrgency}`);
            console.log(`   Contract: ${this.waitlistContractId}`);

            // Call updateUrgency on WaitlistRegistry contract
            const transaction = new ContractExecuteTransaction()
                .setContractId(this.waitlistContractId)
                .setGas(300000)
                .setFunction(
                    "updateUrgency",
                    new ContractFunctionParameters()
                        .addString(patientId)
                        .addUint8(newUrgency)
                )
                .setMaxTransactionFee(new Hbar(3));

            const response = await transaction.execute(this.client);
            const receipt = await response.getReceipt(this.client);

            console.log(`✅ Urgency updated on blockchain! TX: ${response.transactionId.toString()}`);

            return {
                success: true,
                transactionId: response.transactionId.toString(),
                status: receipt.status.toString(),
                patientId,
                oldUrgency: proposal.currentValue,
                newUrgency: newUrgency
            };

        } catch (error) {
            console.error('❌ Error executing urgency update:', error);
            throw new Error(`Urgency update failed: ${error.message}`);
        }
    }

    /**
     * Execute patient removal on WaitlistRegistry contract
     * @param {Object} proposal - Proposal document
     * @returns {Promise<Object>} Transaction result
     */
    async executePatientRemoval(proposal) {
        try {
            console.log(`🔄 Executing patient removal for proposal #${proposal.proposalId}`);

            // Extract patient ID from patientHash
            const patientId = proposal.patientHash.split(' ')[0];
            const reason = proposal.reasoning || 'DAO proposal approved';

            console.log(`   Patient ID: ${patientId}`);
            console.log(`   Reason: ${reason}`);
            console.log(`   Contract: ${this.waitlistContractId}`);

            // Call removePatient on WaitlistRegistry contract
            const transaction = new ContractExecuteTransaction()
                .setContractId(this.waitlistContractId)
                .setGas(300000)
                .setFunction(
                    "removePatient",
                    new ContractFunctionParameters()
                        .addString(patientId)
                        .addString(reason)
                )
                .setMaxTransactionFee(new Hbar(3));

            const response = await transaction.execute(this.client);
            const receipt = await response.getReceipt(this.client);

            console.log(`✅ Patient removed on blockchain! TX: ${response.transactionId.toString()}`);

            return {
                success: true,
                transactionId: response.transactionId.toString(),
                status: receipt.status.toString(),
                patientId,
                reason
            };

        } catch (error) {
            console.error('❌ Error executing patient removal:', error);
            throw new Error(`Patient removal failed: ${error.message}`);
        }
    }

    /**
     * Update patient database after urgency update
     * @param {Object} proposal - Proposal document
     * @param {Object} actionResult - Result from blockchain action
     * @returns {Promise<Object>} Update result
     */
    async updatePatientDatabase(proposal, actionResult) {
        try {
            console.log(`💾 Updating patient database for urgency change...`);

            const patientId = actionResult.patientId;
            const patient = await Patient.findOne({ patientId });

            if (!patient) {
                throw new Error(`Patient ${patientId} not found in database`);
            }

            const oldUrgency = patient.medicalInfo.urgencyLevel;
            const newUrgency = actionResult.newUrgency;

            // Update urgency level
            patient.medicalInfo.urgencyLevel = newUrgency;

            // Add to urgency history
            if (!patient.medicalInfo.urgencyHistory) {
                patient.medicalInfo.urgencyHistory = [];
            }

            patient.medicalInfo.urgencyHistory.push({
                oldValue: oldUrgency,
                newValue: newUrgency,
                changedBy: proposal.creatorAddress,
                changedByName: proposal.creatorName,
                reason: proposal.reasoning,
                proposalId: proposal.proposalId,
                blockchainTxId: actionResult.transactionId,
                timestamp: new Date()
            });

            await patient.save();

            console.log(`✅ Patient database updated: ${patientId} urgency ${oldUrgency} → ${newUrgency}`);

            return {
                success: true,
                patientId,
                oldUrgency,
                newUrgency,
                historyRecorded: true
            };

        } catch (error) {
            console.error('❌ Error updating patient database:', error);
            throw new Error(`Patient database update failed: ${error.message}`);
        }
    }

    /**
     * Update patient database after removal
     * @param {Object} proposal - Proposal document
     * @param {Object} actionResult - Result from blockchain action
     * @returns {Promise<Object>} Update result
     */
    async updatePatientRemovalDatabase(proposal, actionResult) {
        try {
            console.log(`💾 Updating patient database for removal...`);

            const patientId = actionResult.patientId;
            const patient = await Patient.findOne({ patientId });

            if (!patient) {
                throw new Error(`Patient ${patientId} not found in database`);
            }

            // Mark as inactive
            patient.waitlistInfo.isActive = false;
            patient.waitlistInfo.removalReason = actionResult.reason;
            patient.waitlistInfo.removalDate = new Date();
            patient.waitlistInfo.removedByProposal = proposal.proposalId;
            patient.waitlistInfo.removalTxId = actionResult.transactionId;

            await patient.save();

            console.log(`✅ Patient database updated: ${patientId} marked as inactive`);

            return {
                success: true,
                patientId,
                removed: true,
                reason: actionResult.reason
            };

        } catch (error) {
            console.error('❌ Error updating patient database:', error);
            throw new Error(`Patient database update failed: ${error.message}`);
        }
    }

    /**
     * Get execution summary for a proposal
     * @param {number} proposalId - Proposal ID
     * @returns {Promise<Object>} Execution summary
     */
    async getExecutionSummary(proposalId) {
        try {
            const proposal = await Proposal.findOne({ proposalId });

            if (!proposal) {
                throw new Error(`Proposal #${proposalId} not found`);
            }

            if (proposal.status !== 'EXECUTED') {
                return {
                    executed: false,
                    status: proposal.status
                };
            }

            const patientId = proposal.patientHash?.split(' ')[0];
            const patient = patientId ? await Patient.findOne({ patientId }) : null;

            return {
                executed: true,
                executedAt: proposal.executedAt,
                executionTxId: proposal.executionTxId,
                proposalType: proposal.proposalType,
                patientId,
                actionSummary: this.getActionSummary(proposal, patient),
                error: proposal.executionError
            };

        } catch (error) {
            console.error('❌ Error getting execution summary:', error);
            throw new Error(`Failed to get execution summary: ${error.message}`);
        }
    }

    /**
     * Get human-readable action summary
     * @param {Object} proposal - Proposal document
     * @param {Object} patient - Patient document (optional)
     * @returns {string} Action summary
     */
    getActionSummary(proposal, patient) {
        const patientName = patient ?
            `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}` :
            proposal.patientHash?.split(' ')[0] || 'Unknown';

        switch (proposal.proposalType) {
            case 'URGENCY_UPDATE':
                return `Changed urgency level from ${proposal.currentValue} to ${proposal.proposedValue} for patient ${patientName}`;

            case 'PATIENT_REMOVAL':
                return `Removed patient ${patientName} from waitlist`;

            case 'SYSTEM_PARAMETER':
                return `Updated system parameter from ${proposal.currentValue} to ${proposal.proposedValue}`;

            case 'EMERGENCY_OVERRIDE':
                return `Applied emergency override for patient ${patientName}`;

            default:
                return `Executed ${proposal.proposalType} proposal`;
        }
    }
}

module.exports = ProposalExecutionService;
