require('dotenv').config({ path: './backend/.env' });
const { ContractExecuteTransaction, ContractFunctionParameters, Hbar } = require('@hashgraph/sdk');
const { createHederaClient } = require('../backend/src/hedera/hederaClient');

/**
 * Authorize the operator account to interact with contracts
 * This must be run before running tests
 */
async function authorizeAccount() {
    console.log('\n🔐 Authorizing Account for Contract Interactions\n');
    console.log('='.repeat(70));

    const client = createHederaClient();
    const operatorId = client.operatorAccountId;

    console.log(`\n📝 Account: ${operatorId.toString()}`);
    console.log(`📋 Contracts:`);
    console.log(`   Waitlist: ${process.env.WAITLIST_CONTRACT_ID}`);
    console.log(`   Matching: ${process.env.MATCHING_CONTRACT_ID}`);
    console.log(`   Audit: ${process.env.AUDIT_CONTRACT_ID || 'Not set'}\n`);

    try {
        // Authorize for Waitlist Contract
        console.log('🔓 Authorizing for WaitlistRegistry...');
        const waitlistTx = new ContractExecuteTransaction()
            .setContractId(process.env.WAITLIST_CONTRACT_ID)
            .setGas(100000)
            .setFunction(
                "authorizeHospital",
                new ContractFunctionParameters()
                    .addAddress(operatorId.toSolidityAddress())
                    .addBool(true)
            )
            .setMaxTransactionFee(new Hbar(2));

        const waitlistResponse = await waitlistTx.execute(client);
        const waitlistReceipt = await waitlistResponse.getReceipt(client);

        console.log(`   ✅ Authorized for Waitlist: ${waitlistResponse.transactionId.toString()}`);
        console.log(`   Status: ${waitlistReceipt.status.toString()}\n`);

        // Authorize for Matching Contract (if it has authorization)
        try {
            console.log('🔓 Authorizing for MatchingEngine...');
            const matchingTx = new ContractExecuteTransaction()
                .setContractId(process.env.MATCHING_CONTRACT_ID)
                .setGas(100000)
                .setFunction(
                    "authorizeHospital",
                    new ContractFunctionParameters()
                        .addAddress(operatorId.toSolidityAddress())
                        .addBool(true)
                )
                .setMaxTransactionFee(new Hbar(2));

            const matchingResponse = await matchingTx.execute(client);
            const matchingReceipt = await matchingResponse.getReceipt(client);

            console.log(`   ✅ Authorized for Matching: ${matchingResponse.transactionId.toString()}`);
            console.log(`   Status: ${matchingReceipt.status.toString()}\n`);
        } catch (error) {
            console.log(`   ⚠️  MatchingEngine authorization not needed or already authorized\n`);
        }

        console.log('='.repeat(70));
        console.log('✅ Authorization complete! You can now run tests.\n');
        console.log('Run tests with:');
        console.log('  npm test              # All scenarios');
        console.log('  npm run test:workflow # Single scenario\n');

    } catch (error) {
        console.error('\n❌ Authorization failed:', error.message);
        console.error('\nPossible reasons:');
        console.error('  1. You are not the contract admin');
        console.error('  2. Contracts not deployed');
        console.error('  3. Insufficient HBAR balance');
        console.error('  4. Contract IDs incorrect\n');
        throw error;
    } finally {
        await client.close();
    }
}

// Run authorization
authorizeAccount()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
