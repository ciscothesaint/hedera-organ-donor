require('dotenv').config({ path: './backend/.env' });
const { createHederaClient, closeClient } = require('../backend/src/hedera/hederaClient');
const { deployContract } = require('../backend/src/hedera/contractService');
const { createTopic } = require('../backend/src/hedera/topicService');
const { ContractFunctionParameters } = require('@hashgraph/sdk');
const fs = require('fs');
const path = require('path');

async function deployContracts() {
    let client;

    try {
        console.log('\n🚀 Starting Hedera Contract Deployment\n');
        console.log(`Account ID: ${process.env.HEDERA_ACCOUNT_ID}`);
        console.log(`Network: ${process.env.HEDERA_NETWORK}\n`);

        // Create Hedera client
        client = createHederaClient();
        console.log('✅ Connected to Hedera Network\n');

        // Step 1: Deploy WaitlistRegistry Contract
        console.log('📝 Deploying WaitlistRegistry contract...');
        const waitlistContractId = await deployContract(client, 'WaitlistRegistry');
        console.log(`✅ WaitlistRegistry deployed: ${waitlistContractId}\n`);

        // Step 2: Deploy MatchingEngine Contract (with WaitlistRegistry address)
        console.log('📝 Deploying MatchingEngine contract...');
        const matchingContractParams = new ContractFunctionParameters()
            .addAddress(waitlistContractId.toSolidityAddress());
        const matchingContractId = await deployContract(
            client,
            'MatchingEngine',
            matchingContractParams
        );
        console.log(`✅ MatchingEngine deployed: ${matchingContractId}\n`);
        console.log('📝 Deploying AuditTrail contract...');
        const auditContractId = await deployContract(client, 'AuditTrail');
        console.log(`✅ AuditTrail deployed: ${auditContractId}\n`);
        console.log('📝 Deploying GovernanceDAO contract...');
        const daoContractId = await deployContract(client, 'GovernanceDAO');
        console.log(`✅ GovernanceDAO deployed: ${daoContractId}\n`);
        console.log('📝 Creating Hedera Consensus Service Topics...\n');
        const patientRegistrationTopic = await createTopic(client, 'Patient Registration Events');
        const organMatchTopic = await createTopic(client, 'Organ Match Events');
        const auditLogTopic = await createTopic(client, 'Audit Log Events');
        console.log('\n📝 Updating contract registry...');
        const registryPath = path.join(__dirname, '../contract-registry/deployments.json');
        let registry = {};
        if (fs.existsSync(registryPath)) {
            registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
        }
        const network = process.env.HEDERA_NETWORK || 'testnet';
        const deploymentTime = new Date().toISOString();
        const deployerAccount = process.env.HEDERA_ACCOUNT_ID;
        registry.networks[network].contracts.WaitlistRegistry.address = waitlistContractId.toString();
        registry.networks[network].contracts.WaitlistRegistry.deployedAt = deploymentTime;
        registry.networks[network].contracts.WaitlistRegistry.deployedBy = deployerAccount;
        registry.networks[network].contracts.MatchingEngine.address = matchingContractId.toString();
        registry.networks[network].contracts.MatchingEngine.deployedAt = deploymentTime;
        registry.networks[network].contracts.MatchingEngine.deployedBy = deployerAccount;
        registry.networks[network].contracts.AuditTrail.address = auditContractId.toString();
        registry.networks[network].contracts.AuditTrail.deployedAt = deploymentTime;
        registry.networks[network].contracts.AuditTrail.deployedBy = deployerAccount;
        registry.networks[network].contracts.GovernanceDAO.address = daoContractId.toString();
        registry.networks[network].contracts.GovernanceDAO.deployedAt = deploymentTime;
        registry.networks[network].contracts.GovernanceDAO.deployedBy = deployerAccount;
        registry.networks[network].topics.PatientRegistration.topicId = patientRegistrationTopic.toString();
        registry.networks[network].topics.PatientRegistration.createdAt = deploymentTime;
        registry.networks[network].topics.OrganMatch.topicId = organMatchTopic.toString();
        registry.networks[network].topics.OrganMatch.createdAt = deploymentTime;
        registry.networks[network].topics.AuditLog.topicId = auditLogTopic.toString();
        registry.networks[network].topics.AuditLog.createdAt = deploymentTime;
        registry.lastUpdated = deploymentTime;
        if (!registry.deploymentHistory) {
            registry.deploymentHistory = [];
        }
        registry.deploymentHistory.push({
            timestamp: deploymentTime,
            network: network,
            deployer: deployerAccount,
            contracts: {
                WaitlistRegistry: waitlistContractId.toString(),
                MatchingEngine: matchingContractId.toString(),
                AuditTrail: auditContractId.toString(),
                GovernanceDAO: daoContractId.toString()
            },
            topics: {
                PatientRegistration: patientRegistrationTopic.toString(),
                OrganMatch: organMatchTopic.toString(),
                AuditLog: auditLogTopic.toString()
            }
        });

        fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
        console.log('✅ Contract registry updated\n');

        // Step 7: Update .env file (backward compatibility)
        console.log('📝 Updating .env file for backward compatibility...');
        const envPath = path.join(__dirname, '../backend/.env');

        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        // Update or add contract IDs
        envContent = updateEnvVariable(envContent, 'WAITLIST_CONTRACT_ID', waitlistContractId.toString());
        envContent = updateEnvVariable(envContent, 'MATCHING_CONTRACT_ID', matchingContractId.toString());
        envContent = updateEnvVariable(envContent, 'AUDIT_CONTRACT_ID', auditContractId.toString());
        envContent = updateEnvVariable(envContent, 'DAO_CONTRACT_ID', daoContractId.toString());
        envContent = updateEnvVariable(envContent, 'PATIENT_REGISTRATION_TOPIC_ID', patientRegistrationTopic.toString());
        envContent = updateEnvVariable(envContent, 'ORGAN_MATCH_TOPIC_ID', organMatchTopic.toString());
        envContent = updateEnvVariable(envContent, 'AUDIT_LOG_TOPIC_ID', auditLogTopic.toString());

        fs.writeFileSync(envPath, envContent);
        console.log('✅ .env file updated\n');

        // Summary
        console.log('🎉 Deployment Complete!\n');
        console.log('='.repeat(60));
        console.log('Contract IDs:');
        console.log('='.repeat(60));
        console.log(`WaitlistRegistry:  ${waitlistContractId}`);
        console.log(`MatchingEngine:    ${matchingContractId}`);
        console.log(`AuditTrail:        ${auditContractId}`);
        console.log(`GovernanceDAO:     ${daoContractId}`);
        console.log('\nTopic IDs:');
        console.log('='.repeat(60));
        console.log(`Patient Registration: ${patientRegistrationTopic}`);
        console.log(`Organ Match:          ${organMatchTopic}`);
        console.log(`Audit Log:            ${auditLogTopic}`);
        console.log('='.repeat(60));
        console.log('\n✅ All contracts and topics deployed successfully!');
        console.log('💡 Make sure to update your backend .env file with these values.\n');

    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    } finally {
        if (client) {
            await closeClient(client);
        }
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
        return content + `\n${key}=${value}`;
    }
}

// Run deployment
deployContracts();
