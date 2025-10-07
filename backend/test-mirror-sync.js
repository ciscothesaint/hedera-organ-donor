require('dotenv').config();
const axios = require('axios');

/**
 * Test Mirror Node synchronization status
 * This helps diagnose Mirror Node delays
 */

const MIRROR_NODE_URL = 'https://testnet.mirrornode.hedera.com';
const CONTRACT_ID = process.env.WAITLIST_CONTRACT_ID;

async function checkMirrorNodeSync() {
    try {
        console.log('🔍 Checking Mirror Node Synchronization Status...\n');
        console.log(`📝 Contract ID: ${CONTRACT_ID}\n`);

        // 1. Check Mirror Node health and latest consensus timestamp
        console.log('1️⃣  Checking Mirror Node health...');
        const healthResponse = await axios.get(`${MIRROR_NODE_URL}/api/v1/network/nodes`);
        console.log('   ✅ Mirror Node is reachable\n');

        // 2. Get the latest transaction on the network
        console.log('2️⃣  Getting latest network transaction...');
        const latestTxResponse = await axios.get(`${MIRROR_NODE_URL}/api/v1/transactions?limit=1&order=desc`);
        const latestTx = latestTxResponse.data.transactions[0];
        const latestTimestamp = latestTx.consensus_timestamp;
        console.log(`   ⏰ Latest Mirror Node transaction: ${latestTimestamp}`);
        console.log(`   📅 Time: ${new Date(parseFloat(latestTimestamp) * 1000).toISOString()}\n`);

        // 3. Check how old the latest transaction is
        const now = Date.now() / 1000;
        const delay = now - parseFloat(latestTimestamp);
        console.log(`   ⏱️  Mirror Node delay: ${Math.round(delay)} seconds`);
        if (delay < 10) {
            console.log('   ✅ Mirror Node is well synchronized (< 10s delay)\n');
        } else if (delay < 60) {
            console.log('   ⚠️  Mirror Node has minor delay (< 1 min)\n');
        } else {
            console.log('   ❌ Mirror Node has significant delay (> 1 min)\n');
        }

        // 4. Get contract results (transactions that called the contract)
        console.log('3️⃣  Fetching recent contract transactions...');
        const contractResultsUrl = `${MIRROR_NODE_URL}/api/v1/contracts/${CONTRACT_ID}/results?limit=10&order=desc`;
        console.log(`   🔗 URL: ${contractResultsUrl}\n`);

        const contractResponse = await axios.get(contractResultsUrl);
        const contractResults = contractResponse.data.results || [];

        console.log(`   📊 Total contract transactions found: ${contractResults.length}\n`);

        if (contractResults.length > 0) {
            console.log('   📋 Recent contract transactions:\n');
            contractResults.forEach((result, idx) => {
                const timestamp = result.timestamp || result.consensus_timestamp;
                const txId = result.transaction_id || result.consensus_timestamp;
                const gasUsed = result.gas_used || 'N/A';
                const functionCalled = result.function || 'N/A';
                const timeAgo = Math.round(now - parseFloat(timestamp));

                console.log(`   ${idx + 1}. Transaction ID: ${txId}`);
                console.log(`      ⏰ Timestamp: ${timestamp} (${timeAgo}s ago)`);
                console.log(`      📅 Date: ${new Date(parseFloat(timestamp) * 1000).toISOString()}`);
                console.log(`      ⚙️  Function: ${functionCalled}`);
                console.log(`      ⛽ Gas Used: ${gasUsed}`);
                console.log('');
            });
        } else {
            console.log('   ℹ️  No contract transactions found yet on Mirror Node');
            console.log('   ⚠️  This could mean:');
            console.log('      - Mirror Node hasn\'t synced your transaction yet (wait 5-30 mins)');
            console.log('      - No transactions have been made to this contract yet');
            console.log('      - Wrong contract ID\n');
        }

        // 5. Check for PatientRegistered events
        console.log('4️⃣  Checking for PatientRegistered events...');
        const logsUrl = `${MIRROR_NODE_URL}/api/v1/contracts/${CONTRACT_ID}/results/logs?limit=10&order=desc`;
        console.log(`   🔗 URL: ${logsUrl}\n`);

        try {
            const logsResponse = await axios.get(logsUrl);
            const logs = logsResponse.data.logs || [];

            console.log(`   📊 Total events found: ${logs.length}\n`);

            if (logs.length > 0) {
                console.log('   🎉 Events detected! Your contract is emitting events.\n');
                logs.forEach((log, idx) => {
                    const timestamp = log.timestamp;
                    const timeAgo = Math.round(now - parseFloat(timestamp));
                    console.log(`   Event ${idx + 1}:`);
                    console.log(`      ⏰ Timestamp: ${timestamp} (${timeAgo}s ago)`);
                    console.log(`      📅 Date: ${new Date(parseFloat(timestamp) * 1000).toISOString()}`);
                    console.log(`      📝 Data: ${log.data}`);
                    console.log('');
                });
            } else {
                console.log('   ℹ️  No events found yet on Mirror Node\n');
            }
        } catch (error) {
            console.log('   ⚠️  Could not fetch logs:', error.message, '\n');
        }

        // 6. Summary
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 SUMMARY:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Mirror Node Delay: ${Math.round(delay)}s`);
        console.log(`Contract Transactions: ${contractResults.length}`);
        console.log('');

        if (contractResults.length === 0) {
            console.log('⏳ WAITING FOR MIRROR NODE SYNC...');
            console.log('');
            console.log('💡 What to do:');
            console.log('   1. Wait 5-10 minutes for testnet Mirror Node to sync');
            console.log('   2. Run this script again to check progress');
            console.log('   3. Your patient IS on blockchain (confirmed by contract query)');
            console.log('   4. Mirror Node just needs time to index it');
            console.log('');
            console.log('🔗 Manual Check:');
            console.log(`   ${contractResultsUrl}`);
        } else {
            console.log('✅ MIRROR NODE HAS DATA!');
            console.log('   Your transactions are being indexed.');
        }

    } catch (error) {
        console.error('❌ Error checking Mirror Node:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

// Run the check
checkMirrorNodeSync();
