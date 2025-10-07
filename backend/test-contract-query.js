require('dotenv').config();
const { Client, AccountId, PrivateKey } = require('@hashgraph/sdk');
const { getPatient, getWaitlist } = require('./src/hedera/contractService');

/**
 * Test script to QUERY the smart contract directly
 * This PAYS GAS FEES to read from blockchain state
 * (Unlike Mirror Node which is FREE)
 */

/**
 * Parse ContractFunctionResult to extract patient IDs from array
 */
function parsePatientArray(result) {
    try {
        // The result.bytes contains ABI-encoded array of strings
        // Format: [offset][array_length][string1_offset][string1_length][string1_data][string2_offset]...

        const bytes = result.bytes;
        if (!bytes || bytes.length < 64) {
            return [];
        }

        // Read array length at offset 32 (skip the first 32 bytes which is the data offset)
        const arrayLength = parseInt(bytes.slice(32, 64).toString('hex'), 16);

        if (arrayLength === 0) {
            return [];
        }

        console.log(`   📊 Array length: ${arrayLength}`);

        // Try to extract string array items
        const patientIds = [];
        let offset = 64; // Start after array length

        for (let i = 0; i < arrayLength; i++) {
            try {
                // Read string offset
                const stringOffset = parseInt(bytes.slice(offset, offset + 32).toString('hex'), 16);
                offset += 32;

                // Read string length at the offset
                const absoluteOffset = 32 + stringOffset; // 32 is the initial data offset
                const stringLength = parseInt(bytes.slice(absoluteOffset, absoluteOffset + 32).toString('hex'), 16);

                // Read string data
                const stringData = bytes.slice(absoluteOffset + 32, absoluteOffset + 32 + stringLength).toString('utf8');
                patientIds.push(stringData);
            } catch (err) {
                console.warn(`   ⚠️  Error parsing patient ${i + 1}:`, err.message);
            }
        }

        return patientIds;
    } catch (error) {
        console.warn('   ⚠️  Error parsing result:', error.message);
        return [];
    }
}

async function testContractQuery() {
    try {
        // Initialize Hedera client
        const client = Client.forTestnet();
        const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
        const operatorKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);
        client.setOperator(operatorId, operatorKey);

        const contractId = process.env.WAITLIST_CONTRACT_ID;

        console.log('🔗 Querying Smart Contract (PAYS GAS FEES)...');
        console.log(`📝 Contract ID: ${contractId}\n`);

        // Test 1: Get waitlist for KIDNEY organ type
        console.log('Test 1: Getting KIDNEY waitlist...');
        const kidneyWaitlist = await getWaitlist(client, contractId, 'KIDNEY');
        console.log(`   💰 Gas Used: ${kidneyWaitlist.gasUsed.toString()}`);
        const kidneyPatients = parsePatientArray(kidneyWaitlist);
        console.log(`   ✅ Patients Found: ${kidneyPatients.length}`);
        if (kidneyPatients.length > 0) {
            kidneyPatients.forEach((id, idx) => {
                console.log(`      ${idx + 1}. ${id}`);
            });
        } else {
            console.log('   ℹ️  No patients in KIDNEY waitlist');
        }
        console.log('');

        // Test 2: Get waitlist for HEART organ type
        console.log('Test 2: Getting HEART waitlist...');
        const heartWaitlist = await getWaitlist(client, contractId, 'HEART');
        console.log(`   💰 Gas Used: ${heartWaitlist.gasUsed.toString()}`);
        const heartPatients = parsePatientArray(heartWaitlist);
        console.log(`   ✅ Patients Found: ${heartPatients.length}`);
        if (heartPatients.length > 0) {
            heartPatients.forEach((id, idx) => {
                console.log(`      ${idx + 1}. ${id}`);
            });
        } else {
            console.log('   ℹ️  No patients in HEART waitlist');
        }
        console.log('');

        // Test 3: Get waitlist for LIVER organ type
        console.log('Test 3: Getting LIVER waitlist...');
        const liverWaitlist = await getWaitlist(client, contractId, 'LIVER');
        console.log(`   💰 Gas Used: ${liverWaitlist.gasUsed.toString()}`);
        const liverPatients = parsePatientArray(liverWaitlist);
        console.log(`   ✅ Patients Found: ${liverPatients.length}`);
        if (liverPatients.length > 0) {
            liverPatients.forEach((id, idx) => {
                console.log(`      ${idx + 1}. ${id}`);
            });
        } else {
            console.log('   ℹ️  No patients in LIVER waitlist');
        }
        console.log('');

        // Test 4: Get waitlist for LUNG organ type
        console.log('Test 4: Getting LUNG waitlist...');
        const lungWaitlist = await getWaitlist(client, contractId, 'LUNG');
        console.log(`   💰 Gas Used: ${lungWaitlist.gasUsed.toString()}`);
        const lungPatients = parsePatientArray(lungWaitlist);
        console.log(`   ✅ Patients Found: ${lungPatients.length}`);
        if (lungPatients.length > 0) {
            lungPatients.forEach((id, idx) => {
                console.log(`      ${idx + 1}. ${id}`);
            });
        } else {
            console.log('   ℹ️  No patients in LUNG waitlist');
        }
        console.log('');

        console.log('💰 NOTE: These queries COST GAS FEES (tiny hbar amount)');
        console.log('🆓 Use Mirror Node API for FREE queries instead!');

    } catch (error) {
        console.error('❌ Error querying contract:', error.message);
        console.error(error);
    }
}

// Run the test
testContractQuery();
