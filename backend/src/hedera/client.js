const {
    Client,
    PrivateKey,
    AccountId,
    Hbar
} = require("@hashgraph/sdk");
const path = require("path");

// Load environment variables from backend/.env
require("dotenv").config({ path: path.join(__dirname, "../../../backend/.env") });

/**
 * Hedera Client Singleton
 * Manages connection to Hedera network
 */
class HederaClient {
    constructor() {
        this.client = null;
        this.operatorId = null;
        this.operatorKey = null;
        this.initializeClient();
    }

    initializeClient() {
        try {
            // Parse account ID and private key
            this.operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
            this.operatorKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);

            // Create and configure client
            if (process.env.HEDERA_NETWORK === "testnet") {
                this.client = Client.forTestnet();
            } else if (process.env.HEDERA_NETWORK === "mainnet") {
                this.client = Client.forMainnet();
            } else {
                // Default to testnet
                this.client = Client.forTestnet();
            }

            // Set operator
            this.client.setOperator(this.operatorId, this.operatorKey);

            // Set default max transaction fee
            this.client.setDefaultMaxTransactionFee(new Hbar(100));

            // Set default max query payment
            this.client.setDefaultMaxQueryPayment(new Hbar(10));

            console.log("✅ Hedera client initialized successfully");
            console.log(`   Network: ${process.env.HEDERA_NETWORK || 'testnet'}`);
            console.log(`   Operator: ${this.operatorId.toString()}`);
        } catch (error) {
            console.error("❌ Failed to initialize Hedera client:", error);
            throw error;
        }
    }

    /**
     * Get the initialized client
     * @returns {Client} Hedera client instance
     */
    getClient() {
        if (!this.client) {
            throw new Error("Hedera client not initialized");
        }
        return this.client;
    }

    /**
     * Get operator account ID
     * @returns {AccountId} Operator account ID
     */
    getOperatorId() {
        return this.operatorId;
    }

    /**
     * Get operator public key
     * @returns {PublicKey} Operator public key
     */
    getOperatorKey() {
        return this.operatorKey;
    }

    /**
     * Close the client connection
     */
    async close() {
        if (this.client) {
            await this.client.close();
            console.log("Hedera client connection closed");
        }
    }
}

// Export singleton instance
module.exports = new HederaClient();
