require('dotenv').config();
const axios = require('axios');

const MIRROR_NODE_URL = 'https://testnet.mirrornode.hedera.com';
const CONTRACT_ID = process.env.WAITLIST_CONTRACT_ID;

async function inspectEventTopics() {
    try {
        const logsUrl = `${MIRROR_NODE_URL}/api/v1/contracts/${CONTRACT_ID}/results/logs?limit=5&order=desc`;
        const response = await axios.get(logsUrl);
        const logs = response.data.logs || [];

        console.log(`Found ${logs.length} events\n`);

        logs.forEach((log, idx) => {
            console.log(`Event ${idx + 1}:`);
            console.log(`  Topics (${log.topics ? log.topics.length : 0}):`);
            if (log.topics) {
                log.topics.forEach((topic, i) => {
                    console.log(`    [${i}] ${topic}`);
                });
            }
            console.log(`  Data: ${log.data.substring(0, 100)}...`);
            console.log('');
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

inspectEventTopics();
