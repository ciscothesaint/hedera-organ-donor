const {
    Client,
    AccountId,
    PrivateKey,
    Hbar,
} = require('@hashgraph/sdk');
const path = require('path');

// Load environment variables from backend/.env
require('dotenv').config({ path: path.join(__dirname, '../../../backend/.env') });

/**
 * Initialize Hedera client
 */
function createHederaClient() {
    const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);

    // Try to parse the private key - support both DER format and raw hex
    let privateKey;
    try {
        // First try standard DER format
        privateKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);
    } catch (error) {
        console.log('Standard key format failed, trying ECDSA raw format...');
        // Try ECDSA format if the key starts with 02/03 (compressed) or 04 (uncompressed)
        const keyHex = process.env.HEDERA_PRIVATE_KEY;
        if (keyHex.startsWith('02') || keyHex.startsWith('03') || keyHex.startsWith('04')) {
            try {
                privateKey = PrivateKey.fromStringECDSA(keyHex);
            } catch (ecdsaError) {
                console.error('ECDSA format also failed. Please check your private key format.');
                console.error('Expected: DER-encoded private key (96 hex chars starting with 302e...)');
                console.error('Or: Raw ECDSA private key (64 hex chars)');
                throw new Error(`Invalid private key format: ${error.message}`);
            }
        } else {
            throw error;
        }
    }

    let client;

    if (process.env.HEDERA_NETWORK === 'mainnet') {
        client = Client.forMainnet();
    } else {
        client = Client.forTestnet();
    }

    client.setOperator(accountId, privateKey);

    // Set default max transaction fee & query payment
    client.setDefaultMaxTransactionFee(new Hbar(100)); // 100 HBAR
    client.setDefaultMaxQueryPayment(new Hbar(10)); // 10 HBAR

    return client;
}

/**
 * Get operator account info
 */
async function getOperatorInfo(client) {
    const operatorId = client.operatorAccountId;
    const operatorKey = client.operatorPublicKey;

    return {
        accountId: operatorId.toString(),
        publicKey: operatorKey.toString(),
    };
}

/**
 * Close Hedera client connection
 */
async function closeClient(client) {
    if (client) {
        await client.close();
    }
}

module.exports = {
    createHederaClient,
    getOperatorInfo,
    closeClient,
};
