const {
    ContractExecuteTransaction,
    ContractCallQuery,
    Hbar,
    ContractFunctionParameters,
    Status
} = require("@hashgraph/sdk");
const hederaClient = require('../hedera/client');
const Proposal = require('../db/models/Proposal');
const contractRegistry = require('../config/contracts');

/**
 * DAO Service
 * Handles interactions with GovernanceDAO smart contract
 */
class DaoService {
    constructor() {
        this.client = hederaClient.getClient();
        this.daoContractId = contractRegistry.getContractAddress('GovernanceDAO');
        this.waitlistContractId = contractRegistry.getContractAddress('WaitlistRegistry');
    }

    /**
     * Authorize a doctor (no blockchain action needed in centralized model)
     * Authorization is managed in database only
     * @param {Object} doctorData - Doctor information
     * @returns {Promise<Object>} Authorization result
     */
    async authorizeDoctor(doctorData) {
        try {
            const {
                userId,
                name,
                licenseNumber,
                votingPower = 1
            } = doctorData;

            console.log(`✅ Doctor authorized in database: ${name} (${licenseNumber}) - User ID: ${userId}`);

            // In centralized model, authorization is database-only
            // No blockchain transaction needed
            return {
                success: true,
                userId,
                message: 'Doctor authorized in database'
            };

        } catch (error) {
            console.error('❌ Error authorizing doctor:', error);
            throw new Error(`Doctor authorization failed: ${error.message}`);
        }
    }

    /**
     * Create a new proposal
     * @param {Object} proposalData - Proposal details
     * @returns {Promise<Object>} Proposal creation result with proposal ID
     */
    async createProposal(proposalData) {
        try {
            const {
                proposalType,
                urgencyLevel,
                patientHash,
                currentValue,
                proposedValue,
                reasoning,
                evidenceHash,
                creatorId,
                creatorName,
                creatorHospitalId
            } = proposalData;

            console.log(`Creating proposal: ${proposalType} by ${creatorName} (ID: ${creatorId})`);

            // Convert to enum indices
            const typeIndex = { 'URGENCY_UPDATE': 0, 'PATIENT_REMOVAL': 1, 'SYSTEM_PARAMETER': 2, 'EMERGENCY_OVERRIDE': 3 }[proposalType];
            const urgencyIndex = urgencyLevel === 'EMERGENCY' ? 0 : 1;

            // Extract patient ID and convert to bytes32
            const patientId = patientHash ? patientHash.split(' ')[0] : '';
            const patientHashBytes = Buffer.alloc(32);
            if (patientId) Buffer.from(patientId, 'utf8').copy(patientHashBytes);

            // CREATE PROPOSAL ON BLOCKCHAIN
            const transaction = new ContractExecuteTransaction()
                .setContractId(this.daoContractId)
                .setGas(500000)
                .setFunction("createProposal",
                    new ContractFunctionParameters()
                        .addUint8(typeIndex)
                        .addUint8(urgencyIndex)
                        .addBytes32(patientHashBytes)
                        .addUint256(currentValue || 0)
                        .addUint256(proposedValue || 0)
                );

            const response = await transaction.execute(this.client);
            const receipt = await response.getReceipt(this.client);

            // Check if transaction succeeded
            if (receipt.status.toString() !== Status.Success.toString()) {
                throw new Error(`Transaction failed with status: ${receipt.status.toString()}`);
            }

            console.log(`✅ Transaction succeeded! TX: ${response.transactionId}`);

            // Wait for Hedera state to propagate before querying
            console.log(`⏳ Waiting 3s for Hedera state propagation...`);
            await new Promise(resolve => setTimeout(resolve, 3000));

            const proposalId = await this.getProposalCount();

            console.log(`✅ Proposal ${proposalId} created ON-CHAIN! TX: ${response.transactionId}`);

            // Calculate voting deadline based on urgency
            const votingPeriod = urgencyLevel === 'EMERGENCY' ?
                2 * 24 * 60 * 60 * 1000 : // 2 days in milliseconds
                7 * 24 * 60 * 60 * 1000;  // 7 days in milliseconds

            const votingDeadline = new Date(Date.now() + votingPeriod);

            // Get total voting power
            const totalVotingPower = await this.getTotalVotingPower();

            // Set quorum and threshold based on urgency
            const quorumRequired = urgencyLevel === 'EMERGENCY' ? 30 : 20;
            const approvalThreshold = urgencyLevel === 'EMERGENCY' ? 66 : 60;

            // Save proposal to database
            const proposal = new Proposal({
                proposalId,
                blockchainTxId: response.transactionId.toString(),
                proposalType,
                urgencyLevel,
                patientHash,
                currentValue,
                proposedValue,
                reasoning,
                evidenceHash,
                creatorAddress: creatorId,  // Store user ID
                creatorName,
                creatorHospitalId,
                votingDeadline,
                totalVotingPower,
                quorumRequired,
                approvalThreshold,
                status: 'ACTIVE'
            });

            await proposal.save();

            return {
                success: true,
                proposalId,
                transactionId: response.transactionId.toString(),
                status: receipt.status.toString(),
                votingDeadline,
                proposal: proposal.toObject()
            };

        } catch (error) {
            console.error('❌ Error creating proposal:', error);
            throw new Error(`Proposal creation failed: ${error.message}`);
        }
    }

    /**
     * Submit a vote on a proposal
     * @param {Object} voteData - Vote details
     * @returns {Promise<Object>} Vote submission result
     */
    async submitVote(voteData) {
        try {
            const {
                proposalId,
                voterId,
                voterName,
                voteChoice,
                reasoning,
                votingPower
            } = voteData;

            console.log(`Submitting vote: ${voteChoice} for proposal #${proposalId} by ${voterName} (ID: ${voterId})`);

            // Convert vote choice to enum index
            const choiceIndex = {
                'APPROVE': 0,
                'REJECT': 1,
                'ABSTAIN': 2
            }[voteChoice];

            // Convert userId to bytes32 (MongoDB ObjectId is 24 hex chars)
            const userIdBytes = Buffer.alloc(32);
            Buffer.from(voterId, 'utf8').copy(userIdBytes);

            // Detailed logging
            console.log(`📊 Vote Parameters:`);
            console.log(`   Proposal ID: ${proposalId} (type: ${typeof proposalId})`);
            console.log(`   Voter ID: "${voterId}" (length: ${voterId.length})`);
            console.log(`   Voter ID Bytes32: ${userIdBytes.toString('hex').substring(0, 48)}...`);
            console.log(`   Choice Index: ${choiceIndex} (${voteChoice})`);
            console.log(`   Voting Power: ${votingPower}`);
            console.log(`   Contract ID: ${this.daoContractId}`);

            // DEBUG: Verify proposal exists in contract before voting
            console.log(`🔍 Checking if proposal #${proposalId} exists in contract...`);
            try {
                const onChainProposal = await this.getProposalFromBlockchain(proposalId);
                console.log(`📋 On-chain proposal data:`, {
                    proposalId: onChainProposal.proposalId,
                    proposalType: onChainProposal.proposalType,
                    status: onChainProposal.status,
                    votingDeadline: new Date(onChainProposal.votingDeadline * 1000).toISOString(),
                    votesFor: onChainProposal.votesFor,
                    votesAgainst: onChainProposal.votesAgainst,
                    votesAbstain: onChainProposal.votesAbstain
                });
            } catch (error) {
                console.error(`❌ Failed to get proposal from blockchain:`, error.message);
                throw new Error(`Proposal #${proposalId} does not exist in smart contract: ${error.message}`);
            }

            const transaction = new ContractExecuteTransaction()
                .setContractId(this.daoContractId)
                .setGas(500000)
                .setFunction(
                    "vote",
                    new ContractFunctionParameters()
                        .addUint256(proposalId)
                        .addBytes32(userIdBytes)  // Pass user ID as bytes32
                        .addUint8(choiceIndex)
                        .addUint256(votingPower)
                )
                .setMaxTransactionFee(new Hbar(5));

            const response = await transaction.execute(this.client);
            const receipt = await response.getReceipt(this.client);

            console.log(`✅ Vote submitted for proposal #${proposalId}`);

            // Update proposal in database
            const proposal = await Proposal.findOne({ proposalId });
            if (proposal) {
                await proposal.addVote({
                    voterAddress: voterId,  // Store user ID
                    voterName,
                    voteChoice,
                    votingPower,
                    reasoning,
                    transactionId: response.transactionId.toString()
                });
            }

            return {
                success: true,
                transactionId: response.transactionId.toString(),
                status: receipt.status.toString()
            };

        } catch (error) {
            console.error('❌ Error submitting vote:', error);
            throw new Error(`Vote submission failed: ${error.message}`);
        }
    }

    /**
     * Finalize a proposal after voting period
     * @param {number} proposalId - Proposal ID
     * @returns {Promise<Object>} Finalization result
     */
    async finalizeProposal(proposalId) {
        try {
            console.log(`Finalizing proposal #${proposalId}`);

            const transaction = new ContractExecuteTransaction()
                .setContractId(this.daoContractId)
                .setGas(300000)
                .setFunction(
                    "finalizeProposal",
                    new ContractFunctionParameters()
                        .addUint256(proposalId)
                )
                .setMaxTransactionFee(new Hbar(3));

            const response = await transaction.execute(this.client);
            const receipt = await response.getReceipt(this.client);

            // Update database
            const proposal = await Proposal.findOne({ proposalId });
            if (proposal) {
                await proposal.finalize();
            }

            console.log(`✅ Proposal #${proposalId} finalized`);

            return {
                success: true,
                transactionId: response.transactionId.toString(),
                status: receipt.status.toString()
            };

        } catch (error) {
            console.error('❌ Error finalizing proposal:', error);
            throw new Error(`Proposal finalization failed: ${error.message}`);
        }
    }

    /**
     * Emergency finalize a proposal before deadline (requires 75% supermajority)
     * @param {number} proposalId - Proposal ID
     * @returns {Promise<Object>} Emergency finalization result
     */
    async emergencyFinalizeProposal(proposalId) {
        try {
            console.log(`Emergency finalizing proposal #${proposalId}`);

            const transaction = new ContractExecuteTransaction()
                .setContractId(this.daoContractId)
                .setGas(300000)
                .setFunction(
                    "emergencyFinalize",
                    new ContractFunctionParameters()
                        .addUint256(proposalId)
                )
                .setMaxTransactionFee(new Hbar(3));

            const response = await transaction.execute(this.client);
            const receipt = await response.getReceipt(this.client);

            // Update database using emergency finalize method (bypasses deadline check)
            const proposal = await Proposal.findOne({ proposalId });
            if (proposal) {
                await proposal.emergencyFinalize();
                console.log(`✅ Database updated: Proposal #${proposalId} status = ${proposal.status}`);
            }

            console.log(`✅ Proposal #${proposalId} emergency finalized on blockchain`);

            return {
                success: true,
                transactionId: response.transactionId.toString(),
                status: receipt.status.toString(),
                proposalStatus: proposal?.status
            };

        } catch (error) {
            console.error('❌ Error emergency finalizing proposal:', error);
            throw new Error(`Emergency finalization failed: ${error.message}`);
        }
    }

    /**
     * Execute an approved proposal
     * @param {number} proposalId - Proposal ID
     * @returns {Promise<Object>} Execution result
     */
    async executeProposal(proposalId) {
        try {
            console.log(`Executing proposal #${proposalId}`);

            const transaction = new ContractExecuteTransaction()
                .setContractId(this.daoContractId)
                .setGas(500000)
                .setFunction(
                    "executeProposal",
                    new ContractFunctionParameters()
                        .addUint256(proposalId)
                )
                .setMaxTransactionFee(new Hbar(5));

            const response = await transaction.execute(this.client);
            const receipt = await response.getReceipt(this.client);

            // Update database
            await Proposal.findOneAndUpdate(
                { proposalId },
                {
                    status: 'EXECUTED',
                    executedAt: new Date(),
                    executionTxId: response.transactionId.toString()
                }
            );

            console.log(`✅ Proposal #${proposalId} executed`);

            return {
                success: true,
                transactionId: response.transactionId.toString(),
                status: receipt.status.toString()
            };

        } catch (error) {
            console.error('❌ Error executing proposal:', error);

            // Update database with error
            await Proposal.findOneAndUpdate(
                { proposalId },
                { executionError: error.message }
            );

            throw new Error(`Proposal execution failed: ${error.message}`);
        }
    }

    /**
     * Get proposal details from blockchain with retry logic for state consistency
     * @param {number} proposalId - Proposal ID
     * @param {number} maxRetries - Maximum retry attempts (default 3)
     * @returns {Promise<Object>} Proposal data
     */
    async getProposalFromBlockchain(proposalId, maxRetries = 3) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔍 Attempt ${attempt}/${maxRetries} to fetch proposal #${proposalId} from blockchain...`);

                const query = new ContractCallQuery()
                    .setContractId(this.daoContractId)
                    .setGas(100000)
                    .setFunction(
                        "getProposal",
                        new ContractFunctionParameters()
                            .addUint256(proposalId)
                    );

                const response = await query.execute(this.client);

                // The contract returns a Proposal struct
                // Decode the response based on the struct fields
                const proposalData = {
                    proposalId: response.getUint256(0).toNumber(),
                    proposalType: response.getUint8(1), // enum
                    patientHash: response.getBytes32(2),
                    currentValue: response.getUint256(3).toNumber(),
                    proposedValue: response.getUint256(4).toNumber(),
                    createdAt: response.getUint256(5).toNumber(),
                    votingDeadline: response.getUint256(6).toNumber(),
                    votesFor: response.getUint256(7).toNumber(),
                    votesAgainst: response.getUint256(8).toNumber(),
                    votesAbstain: response.getUint256(9).toNumber(),
                    status: response.getUint8(10) // enum
                };

                // Verify proposal exists (proposalId should not be 0)
                if (proposalData.proposalId === 0) {
                    throw new Error(`Proposal #${proposalId} does not exist (returned proposalId=0)`);
                }

                console.log(`✅ Successfully fetched proposal #${proposalId} on attempt ${attempt}`);
                return proposalData;

            } catch (error) {
                lastError = error;
                console.error(`❌ Attempt ${attempt}/${maxRetries} failed:`, error.message);

                // If not the last attempt, wait before retrying (exponential backoff)
                if (attempt < maxRetries) {
                    const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                    console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }

        // All retries failed
        console.error(`❌ Failed to get proposal #${proposalId} after ${maxRetries} attempts`);
        throw new Error(`Failed to get proposal: ${lastError.message}`);
    }

    /**
     * Get proposal vote counts from blockchain
     * @param {number} proposalId - Proposal ID
     * @returns {Promise<Object>} Vote counts
     */
    async getProposalVotes(proposalId) {
        try {
            const query = new ContractCallQuery()
                .setContractId(this.daoContractId)
                .setGas(100000)
                .setFunction(
                    "getVoteCounts",
                    new ContractFunctionParameters()
                        .addUint256(proposalId)
                );

            const response = await query.execute(this.client);

            const votesFor = response.getUint256(0);
            const votesAgainst = response.getUint256(1);
            const votesAbstain = response.getUint256(2);

            return {
                votesFor: votesFor.toNumber(),
                votesAgainst: votesAgainst.toNumber(),
                votesAbstain: votesAbstain.toNumber()
            };

        } catch (error) {
            console.error('❌ Error getting proposal votes:', error);
            throw new Error(`Failed to get votes: ${error.message}`);
        }
    }

    /**
     * Get total voting power from database
     * (New contract doesn't track this globally, calculated from authorized users)
     * @returns {Promise<number>} Total voting power
     */
    async getTotalVotingPower() {
        try {
            const User = require('../db/models/User');

            // Get all authorized voters
            const authorizedUsers = await User.find({
                'daoProfile.isAuthorizedVoter': true,
                isActive: true
            });

            // Sum up their voting power
            const totalPower = authorizedUsers.reduce((sum, user) => {
                return sum + (user.daoProfile?.votingPower || 1);
            }, 0);

            return totalPower || 100; // Default to 100 if no users

        } catch (error) {
            console.error('❌ Error getting total voting power:', error);
            return 100; // Default
        }
    }

    /**
     * Get proposal count
     * @returns {Promise<number>} Proposal count
     */
    async getProposalCount() {
        try {
            const query = new ContractCallQuery()
                .setContractId(this.daoContractId)
                .setGas(100000)
                .setFunction("proposalCount");

            const response = await query.execute(this.client);
            const count = response.getUint256(0);

            return parseInt(count.toString());

        } catch (error) {
            console.error('❌ Error getting proposal count:', error);
            // Fallback to database count
            const dbCount = await Proposal.countDocuments();
            return dbCount;
        }
    }

    /**
     * Check if user has voted on proposal
     * @param {number} proposalId - Proposal ID
     * @param {string} userId - User ID (MongoDB ObjectId)
     * @returns {Promise<boolean>} True if voted
     */
    async hasVoted(proposalId, userId) {
        try {
            // Convert userId to bytes32
            const userIdBytes = Buffer.alloc(32);
            Buffer.from(userId, 'utf8').copy(userIdBytes);

            const query = new ContractCallQuery()
                .setContractId(this.daoContractId)
                .setGas(100000)
                .setFunction(
                    "hasUserVoted",
                    new ContractFunctionParameters()
                        .addUint256(proposalId)
                        .addBytes32(userIdBytes)
                );

            const response = await query.execute(this.client);
            return response.getBool(0);

        } catch (error) {
            console.error('❌ Error checking if voted:', error);
            // Fallback to database
            const proposal = await Proposal.findOne({ proposalId });
            return proposal ? proposal.hasVoted(userId) : false;
        }
    }
}

module.exports = DaoService;
