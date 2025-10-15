const fs = require('fs');
const path = require('path');

/**
 * Sync Contract Addresses to .env files
 *
 * This is a helper script for backward compatibility.
 * It reads from contract-registry/deployments.json and updates all .env files.
 *
 * Usage: node scripts/sync-contract-addresses.js [network]
 * Example: node scripts/sync-contract-addresses.js testnet
 */

function syncContractAddresses() {
    try {
        console.log('\n🔄 Syncing contract addresses from registry to .env files...\n');

        // Get network from command line argument or default to testnet
        const network = process.argv[2] || process.env.HEDERA_NETWORK || 'testnet';
        console.log(`📡 Network: ${network}`);

        // Read the registry
        const registryPath = path.join(__dirname, '../contract-registry/deployments.json');

        if (!fs.existsSync(registryPath)) {
            console.error('❌ Contract registry not found at:', registryPath);
            process.exit(1);
        }

        const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

        if (!registry.networks || !registry.networks[network]) {
            console.error(`❌ Network "${network}" not found in registry`);
            process.exit(1);
        }

        const networkData = registry.networks[network];
        const contracts = networkData.contracts;
        const topics = networkData.topics;

        // List of .env files to update
        const envFiles = [
            { path: path.join(__dirname, '../backend/.env'), name: 'Backend' },
            { path: path.join(__dirname, '../frontend-public/.env'), name: 'Frontend Public' },
            { path: path.join(__dirname, '../frontend-dao/.env'), name: 'Frontend DAO' },
            { path: path.join(__dirname, '../frontend/.env'), name: 'Frontend' }
        ];

        let updatedCount = 0;

        // Update each .env file
        for (const envFile of envFiles) {
            if (!fs.existsSync(envFile.path)) {
                console.log(`⚠️  ${envFile.name} .env not found, skipping: ${envFile.path}`);
                continue;
            }

            console.log(`\n📝 Updating ${envFile.name} .env...`);

            let envContent = fs.readFileSync(envFile.path, 'utf8');

            // Update contract addresses
            if (contracts.WaitlistRegistry?.address) {
                envContent = updateEnvVariable(envContent, 'WAITLIST_CONTRACT_ID', contracts.WaitlistRegistry.address);
                console.log(`   ✅ WAITLIST_CONTRACT_ID: ${contracts.WaitlistRegistry.address}`);
            }

            if (contracts.MatchingEngine?.address) {
                envContent = updateEnvVariable(envContent, 'MATCHING_CONTRACT_ID', contracts.MatchingEngine.address);
                console.log(`   ✅ MATCHING_CONTRACT_ID: ${contracts.MatchingEngine.address}`);
            }

            if (contracts.AuditTrail?.address) {
                envContent = updateEnvVariable(envContent, 'AUDIT_CONTRACT_ID', contracts.AuditTrail.address);
                console.log(`   ✅ AUDIT_CONTRACT_ID: ${contracts.AuditTrail.address}`);
            }

            if (contracts.GovernanceDAO?.address) {
                envContent = updateEnvVariable(envContent, 'DAO_CONTRACT_ID', contracts.GovernanceDAO.address);
                console.log(`   ✅ DAO_CONTRACT_ID: ${contracts.GovernanceDAO.address}`);
            }

            // Update topic IDs
            if (topics.PatientRegistration?.topicId) {
                envContent = updateEnvVariable(envContent, 'PATIENT_REGISTRATION_TOPIC_ID', topics.PatientRegistration.topicId);
                console.log(`   ✅ PATIENT_REGISTRATION_TOPIC_ID: ${topics.PatientRegistration.topicId}`);
            }

            if (topics.OrganMatch?.topicId) {
                envContent = updateEnvVariable(envContent, 'ORGAN_MATCH_TOPIC_ID', topics.OrganMatch.topicId);
                console.log(`   ✅ ORGAN_MATCH_TOPIC_ID: ${topics.OrganMatch.topicId}`);
            }

            if (topics.AuditLog?.topicId) {
                envContent = updateEnvVariable(envContent, 'AUDIT_LOG_TOPIC_ID', topics.AuditLog.topicId);
                console.log(`   ✅ AUDIT_LOG_TOPIC_ID: ${topics.AuditLog.topicId}`);
            }

            // Write updated content
            fs.writeFileSync(envFile.path, envContent);
            updatedCount++;
        }

        console.log('\n' + '='.repeat(60));
        console.log(`✅ Successfully synced contract addresses to ${updatedCount} .env file(s)`);
        console.log('='.repeat(60));
        console.log('\n💡 Tip: The contract registry is now the primary source of truth.');
        console.log('   .env files are kept for backward compatibility only.\n');

    } catch (error) {
        console.error('❌ Error syncing contract addresses:', error.message);
        process.exit(1);
    }
}

/**
 * Update or add environment variable in .env content
 */
function updateEnvVariable(content, key, value) {
    const regex = new RegExp(`^${key}=.*$`, 'm');

    if (regex.test(content)) {
        return content.replace(regex, `${key}=${value}`);
    } else {
        // Add to end if not found
        return content.trimEnd() + `\n${key}=${value}\n`;
    }
}

// Run sync
syncContractAddresses();
