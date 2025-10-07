const {
    Client,
    AccountId,
    PrivateKey,
    ContractCreateFlow,
    ContractFunctionParameters,
} = require('@hashgraph/sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Redeploy WaitlistRegistry contract with updated event structure
 * The new event emits ALL patient data for Mirror Node indexing
 */
async function redeployContract() {
    console.log('🔄 Redeploying WaitlistRegistry Contract\n');
    console.log('═══════════════════════════════════════════════════\n');

    // Setup client
    const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
    const operatorKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);

    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);

    console.log(`👤 Operator: ${operatorId}`);
    console.log(`⛓️  Network: Testnet\n`);

    try {
        // Read compiled bytecode
        const bytecode = fs.readFileSync(
            path.join(__dirname, '../contracts/contracts_WaitlistRegistry_sol_WaitlistRegistry.bin')
        );

        console.log('📝 Contract bytecode loaded');
        console.log(`📊 Size: ${bytecode.length} bytes\n`);

        console.log('⏳ Deploying contract to Hedera...');
        console.log('   (This may take 10-15 seconds)\n');

        // Deploy contract
        const contractCreateFlow = new ContractCreateFlow()
            .setGas(4000000) // Maximum gas for complex contracts
            .setMaxChunks(30) // Allow large bytecode
            .setBytecode(bytecode);

        const txResponse = await contractCreateFlow.execute(client);
        const receipt = await txResponse.getReceipt(client);
        const contractId = receipt.contractId;

        console.log('✅ Contract deployed successfully!\n');
        console.log('═══════════════════════════════════════════════════');
        console.log(`📍 Contract ID: ${contractId}`);
        console.log(`🔗 Transaction: ${txResponse.transactionId}`);
        console.log('═══════════════════════════════════════════════════\n');

        console.log('📋 IMPORTANT: Update your .env file:');
        console.log(`   WAITLIST_CONTRACT_ID=${contractId}\n`);

        console.log('✨ New Features:');
        console.log('   • Event now emits ALL patient data');
        console.log('   • Mirror Node can read full patient details');
        console.log('   • "Check On-Chain" will show real data\n');

        console.log('⚠️  NEXT STEPS:');
        console.log('   1. Update WAITLIST_CONTRACT_ID in backend/.env');
        console.log('   2. Restart backend server');
        console.log('   3. Register new patients (old data on old contract)');
        console.log('   4. Test "Check On-Chain" button\n');

        return contractId.toString();

    } catch (error) {
        console.error('❌ Deployment failed:', error);
        throw error;
    } finally {
        client.close();
    }
}

// Run deployment
redeployContract().catch(console.error);
