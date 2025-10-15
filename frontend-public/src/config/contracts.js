import deploymentsData from '../../../contract-registry/deployments.json';

/**
 * Contract Registry for Frontend
 *
 * Provides access to deployed smart contract addresses and topic IDs.
 * Loads from centralized contract-registry/deployments.json.
 *
 * Usage:
 *   import contractRegistry from './config/contracts';
 *
 *   const daoAddress = contractRegistry.getContractAddress('GovernanceDAO');
 *   const topicId = contractRegistry.getTopicId('PatientRegistration');
 */
class ContractRegistry {
    constructor() {
        this.registry = deploymentsData;
        this.network = import.meta.env.VITE_HEDERA_NETWORK || 'testnet';

        if (!this.registry.networks || !this.registry.networks[this.network]) {
            console.error(`❌ Network "${this.network}" not found in contract registry`);
            throw new Error(`Network "${this.network}" not configured`);
        }

        console.log(`✅ Contract registry loaded for network: ${this.network}`);
    }

    /**
     * Get contract address by name
     * @param {string} contractName - Name of the contract (e.g., 'GovernanceDAO', 'WaitlistRegistry')
     * @returns {string} Contract ID (e.g., '0.0.4567890')
     */
    getContractAddress(contractName) {
        const contract = this.registry.networks[this.network].contracts[contractName];

        if (!contract) {
            throw new Error(`Contract "${contractName}" not found in registry for network "${this.network}"`);
        }

        if (!contract.address) {
            throw new Error(`Contract "${contractName}" has no address. Has it been deployed?`);
        }

        return contract.address;
    }

    /**
     * Get topic ID by name
     * @param {string} topicName - Name of the topic (e.g., 'PatientRegistration', 'OrganMatch')
     * @returns {string} Topic ID (e.g., '0.0.5678901')
     */
    getTopicId(topicName) {
        const topic = this.registry.networks[this.network].topics[topicName];

        if (!topic) {
            throw new Error(`Topic "${topicName}" not found in registry for network "${this.network}"`);
        }

        if (!topic.topicId) {
            throw new Error(`Topic "${topicName}" has no ID. Has it been created?`);
        }

        return topic.topicId;
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

export default contractRegistry;
