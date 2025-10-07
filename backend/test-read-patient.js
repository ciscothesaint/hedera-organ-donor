const {
    Client,
    AccountId,
    PrivateKey,
    ContractCallQuery,
    ContractFunctionParameters,
} = require('@hashgraph/sdk');
require('dotenv').config();

/**
 * Test script to read patient data directly from blockchain
 * This PROVES the data is stored correctly on-chain
 */
async function testReadPatient() {
    console.log('🔍 Testing direct blockchain read...\n');

    // Setup client
    const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
    const operatorKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);

    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);

    const contractId = process.env.WAITLIST_CONTRACT_ID;

    console.log(`📝 Contract ID: ${contractId}`);
    console.log(`👤 Operator: ${operatorId}\n`);

    // Ask for patient ID to query
    const patientId = process.argv[2] || 'TEST-001';
    console.log(`🔎 Querying patient: ${patientId}\n`);

    try {
        // Query the getPatient function (view function)
        const query = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(100000)
            .setFunction(
                'getPatient',
                new ContractFunctionParameters().addString(patientId)
            );

        console.log('⏳ Executing query...');
        const result = await query.execute(client);

        console.log('\n✅ SUCCESS! Patient found on blockchain:\n');

        // Decode the result based on Patient struct
        // struct Patient {
        //     address patientAddress;     // 0
        //     string patientId;           // 1
        //     string organType;           // 2
        //     uint8 urgencyLevel;         // 3
        //     uint256 registrationTime;   // 4
        //     uint256 medicalScore;       // 5
        //     bool isActive;              // 6
        //     string bloodType;           // 7
        //     uint256 weight;             // 8
        //     uint256 height;             // 9
        // }

        const patientAddress = result.getAddress(0);
        const returnedPatientId = result.getString(1);
        const organType = result.getString(2);
        const urgencyLevel = result.getUint8(3);
        const registrationTime = result.getUint256(4);
        const medicalScore = result.getUint256(5);
        const isActive = result.getBool(6);
        const bloodType = result.getString(7);
        const weight = result.getUint256(8);
        const height = result.getUint256(9);

        const registrationDate = new Date(registrationTime.toNumber() * 1000);

        console.log(`📋 Patient Details:`);
        console.log(`   Patient ID: ${returnedPatientId}`);
        console.log(`   Organ Type: ${organType}`);
        console.log(`   Blood Type: ${bloodType}`);
        console.log(`   Urgency Level: ${urgencyLevel}`);
        console.log(`   Medical Score: ${medicalScore.toString()}`);
        console.log(`   Weight: ${weight.toString()} kg`);
        console.log(`   Height: ${height.toString()} cm`);
        console.log(`   Is Active: ${isActive ? 'Yes ✅' : 'No ❌'}`);
        console.log(`   Registration: ${registrationDate.toISOString()}`);
        console.log(`   Patient Address: ${patientAddress}`);

        console.log('\n🎉 Data IS correctly stored on blockchain!');
        console.log('💰 NOTE: This query cost gas fees\n');

    } catch (error) {
        if (error.message.includes('INVALID_CONTRACT_ID')) {
            console.error('❌ Contract not found. Check WAITLIST_CONTRACT_ID in .env');
        } else if (error.message.includes('contract revert')) {
            console.error(`❌ Patient "${patientId}" not found on blockchain`);
            console.log('\n💡 Try querying a patient ID that you registered via UI');
        } else {
            console.error('❌ Error:', error.message);
        }
    } finally {
        client.close();
    }
}

// Run the test
console.log('═══════════════════════════════════════════════════');
console.log('  Direct Blockchain Patient Query Test');
console.log('═══════════════════════════════════════════════════\n');

testReadPatient().catch(console.error);
