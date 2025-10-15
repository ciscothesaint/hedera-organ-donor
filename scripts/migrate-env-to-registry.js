require('dotenv').config({ path: './backend/.env' });
const fs = require('fs');
const path = require('path');

/**
 * Migrate Existing Contract Addresses to Registry
 *
 * This script reads contract addresses from .env and populates the registry.
 * Run this ONCE to migrate from old .env-based system to new registry.
 */

function migrateToRegistry() {
    try {
        console.log('\n🔄 Migrating contract addresses from .env to registry...\n');

        // Read .env values
        const waitlistContractId = process.env.WAITLIST_CONTRACT_ID;
        const matchingContractId = process.env.MATCHING_CONTRACT_ID;
        const auditContractId = process.env.AUDIT_CONTRACT_ID;
        const daoContractId = process.env.DAO_CONTRACT_ID;
        const patientTopicId = process.env.PATIENT_REGISTRATION_TOPIC_ID;
        const organMatchTopicId = process.env.ORGAN_MATCH_TOPIC_ID;
        const auditLogTopicId = process.env.AUDIT_LOG_TOPIC_ID;

        // Validate we have addresses
        if (!waitlistContractId || !matchingContractId || !auditContractId || !daoContractId) {
            console.error('❌ Missing contract IDs in .env file');
            console.log('   Please deploy contracts first using: node scripts/deploy-contracts.js');
            process.exit(1);
        }

        console.log('✅ Found contract addresses in .env:');
        console.log(`   WaitlistRegistry: ${waitlistContractId}`);
        console.log(`   MatchingEngine: ${matchingContractId}`);
        console.log(`   AuditTrail: ${auditContractId}`);
        console.log(`   GovernanceDAO: ${daoContractId}`);
        console.log('');

        // Read registry
        const registryPath = path.join(__dirname, '../contract-registry/deployments.json');
        const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

        const network = process.env.HEDERA_NETWORK || 'testnet';
        const migrationTime = new Date().toISOString();
        const deployerAccount = process.env.HEDERA_ACCOUNT_ID;

        console.log(`📝 Updating registry for network: ${network}\n`);

        // Update contract addresses
        registry.networks[network].contracts.WaitlistRegistry.address = waitlistContractId;
        registry.networks[network].contracts.WaitlistRegistry.deployedAt = migrationTime;
        registry.networks[network].contracts.WaitlistRegistry.deployedBy = deployerAccount;

        registry.networks[network].contracts.MatchingEngine.address = matchingContractId;
        registry.networks[network].contracts.MatchingEngine.deployedAt = migrationTime;
        registry.networks[network].contracts.MatchingEngine.deployedBy = deployerAccount;

        registry.networks[network].contracts.AuditTrail.address = auditContractId;
        registry.networks[network].contracts.AuditTrail.deployedAt = migrationTime;
        registry.networks[network].contracts.AuditTrail.deployedBy = deployerAccount;

        registry.networks[network].contracts.GovernanceDAO.address = daoContractId;
        registry.networks[network].contracts.GovernanceDAO.deployedAt = migrationTime;
        registry.networks[network].contracts.GovernanceDAO.deployedBy = deployerAccount;

        // Update topic IDs
        if (patientTopicId) {
            registry.networks[network].topics.PatientRegistration.topicId = patientTopicId;
            registry.networks[network].topics.PatientRegistration.createdAt = migrationTime;
        }

        if (organMatchTopicId) {
            registry.networks[network].topics.OrganMatch.topicId = organMatchTopicId;
            registry.networks[network].topics.OrganMatch.createdAt = migrationTime;
        }

        if (auditLogTopicId) {
            registry.networks[network].topics.AuditLog.topicId = auditLogTopicId;
            registry.networks[network].topics.AuditLog.createdAt = migrationTime;
        }

        // Update metadata
        registry.lastUpdated = migrationTime;

        // Add migration note to history
        if (!registry.deploymentHistory) {
            registry.deploymentHistory = [];
        }
        registry.deploymentHistory.push({
            timestamp: migrationTime,
            network: network,
            deployer: deployerAccount,
            note: 'Migrated from .env file',
            contracts: {
                WaitlistRegistry: waitlistContractId,
                MatchingEngine: matchingContractId,
                AuditTrail: auditContractId,
                GovernanceDAO: daoContractId
            },
            topics: {
                PatientRegistration: patientTopicId || '',
                OrganMatch: organMatchTopicId || '',
                AuditLog: auditLogTopicId || ''
            }
        });

        // Write updated registry
        fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));

        console.log('✅ Registry updated successfully!\n');
        console.log('='.repeat(60));
        console.log('Migration Complete!');
        console.log('='.repeat(60));
        console.log('\n📋 Summary:');
        console.log(`   Network: ${network}`);
        console.log(`   Contracts migrated: 4`);
        console.log(`   Topics migrated: 3`);
        console.log(`   Registry path: ${registryPath}`);
        console.log('\n🚀 Next step: Restart your backend server');
        console.log('   cd backend && npm run dev\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Run migration
migrateToRegistry();
