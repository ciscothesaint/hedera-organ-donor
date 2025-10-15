const fs = require('fs');
const path = require('path');

/**
 * Contract Registry Loader
 *
 * Centralized configuration for all smart contract addresses.
 * Loads from contract-registry/deployments.json at project root.
 *
 * Benefits:
 * - Single source of truth for contract addresses
 * - Automatic sync across all projects
 * - Git-tracked deployment history
 * - Network-aware (testnet/mainnet)
 */
class ContractRegistry {
    constructor() {
        this.registryPath = path.join(__dirname, '../../../contract-registry/deployments.json');
        this.network = process.env.HEDERA_NETWORK || 'testnet';
        this.registry = null;
        this.load();
    }

    /**
     * Load the contract registry from JSON file
     */
    load() {
        try {
            if (!fs.existsSync(this.registryPath)) {
                throw new Error(`Contract registry not found at: ${this.registryPath}`);
            }

            const content = fs.readFileSync(this.registryPath, 'utf8');
            this.registry = JSON.parse(content);

            if (!this.registry.networks || !this.registry.networks[this.network]) {
                throw new Error(`Network "${this.network}" not found in contract registry`);
            }

            console.log(`✅ Contract registry loaded for network: ${this.network}`);
        } catch (error) {
            console.error('❌ Failed to load contract registry:', error.message);
            throw error;
        }
    }

    /**
     * Reload the registry (useful for hot-reloading during development)
     */
    reload() {
        this.load();
    }

    /**
     * Get contract address by name
     * @param {string} contractName - Name of the contract (e.g., 'GovernanceDAO', 'WaitlistRegistry')
     * @returns {string} Contract ID (e.g., '0.0.4567890')
     */
    getContractAddress(contractName) {
        try {
            const contract = this.registry.networks[this.network].contracts[contractName];

            if (!contract) {
                throw new Error(`Contract "${contractName}" not found in registry for network "${this.network}"`);
            }

            if (!contract.address) {
                throw new Error(`Contract "${contractName}" has no address. Has it been deployed?`);
            }

            return contract.address;
        } catch (error) {
            console.error(`❌ Error getting contract address for "${contractName}":`, error.message);
            throw error;
        }
    }

    /**
     * Get topic ID by name
     * @param {string} topicName - Name of the topic (e.g., 'PatientRegistration', 'OrganMatch')
     * @returns {string} Topic ID (e.g., '0.0.5678901')
     */
    getTopicId(topicName) {
        try {
            const topic = this.registry.networks[this.network].topics[topicName];

            if (!topic) {
                throw new Error(`Topic "${topicName}" not found in registry for network "${this.network}"`);
            }

            if (!topic.topicId) {
                throw new Error(`Topic "${topicName}" has no ID. Has it been created?`);
            }

            return topic.topicId;
        } catch (error) {
            console.error(`❌ Error getting topic ID for "${topicName}":`, error.message);
            throw error;
        }
    }

    /**
     * Get all contract addresses for current network
     * @returns {Object} Map of contract names to addresses
     */
    getAllContracts() {
        const contracts = this.registry.networks[this.network].contracts;
        const result = {};

        for (const [name, contract] of Object.entries(contracts)) {
            result[name] = contract.address;
        }

        return result;
    }

    /**
     * Get all topic IDs for current network
     * @returns {Object} Map of topic names to IDs
     */
    getAllTopics() {
        const topics = this.registry.networks[this.network].topics;
        const result = {};

        for (const [name, topic] of Object.entries(topics)) {
            result[name] = topic.topicId;
        }

        return result;
    }

    /**
     * Get contract metadata
     * @param {string} contractName - Name of the contract
     * @returns {Object} Full contract metadata
     */
    getContractMetadata(contractName) {
        const contract = this.registry.networks[this.network].contracts[contractName];

        if (!contract) {
            throw new Error(`Contract "${contractName}" not found`);
        }

        return contract;
    }

    /**
     * Get current network configuration
     * @returns {Object} Network configuration
     */
    getNetwork() {
        return this.registry.networks[this.network];
    }

    /**
     * Get current network name
     * @returns {string} Network name (testnet/mainnet)
     */
    getNetworkName() {
        return this.network;
    }

    /**
     * Get Mirror Node URL for current network
     * @returns {string} Mirror Node API URL
     */
    getMirrorNodeUrl() {
        return this.registry.networks[this.network].mirrorNode;
    }

    /**
     * Check if contract is deployed
     * @param {string} contractName - Name of the contract
     * @returns {boolean} True if contract has an address
     */
    isContractDeployed(contractName) {
        try {
            const contract = this.registry.networks[this.network].contracts[contractName];
            return contract && contract.address && contract.address.length > 0;
        } catch {
            return false;
        }
    }

    /**
     * Get registry version
     * @returns {string} Version string
     */
    getVersion() {
        return this.registry.version;
    }

    /**
     * Get last update timestamp
     * @returns {string} ISO timestamp
     */
    getLastUpdated() {
        return this.registry.lastUpdated;
    }

    /**
     * Get deployment history
     * @returns {Array} Array of deployment records
     */
    getDeploymentHistory() {
        return this.registry.deploymentHistory || [];
    }
}

// Singleton instance
const contractRegistry = new ContractRegistry();

// Export singleton
module.exports = contractRegistry;

// Export class for testing
module.exports.ContractRegistry = ContractRegistry;
