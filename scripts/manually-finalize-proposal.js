require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const Proposal = require('../backend/src/db/models/Proposal');

async function finalizeProposal(proposalId) {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get proposal
        const proposal = await Proposal.findOne({ proposalId: parseInt(proposalId) });

        if (!proposal) {
            console.log(`❌ Proposal #${proposalId} not found`);
            process.exit(1);
        }

        console.log(`📋 Current Status: ${proposal.status}\n`);

        if (proposal.status !== 'ACTIVE') {
            console.log('✅ Proposal is already finalized!');
            process.exit(0);
        }

        // Check votes
        const totalVotes = proposal.votesFor + proposal.votesAgainst;
        const approvalPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;

        console.log('📊 Vote Summary:');
        console.log(`   For: ${proposal.votesFor}`);
        console.log(`   Against: ${proposal.votesAgainst}`);
        console.log(`   Approval: ${approvalPercentage.toFixed(2)}%\n`);

        // Emergency finalize (requires 75% supermajority)
        if (approvalPercentage >= 75) {
            console.log('✅ Meets 75% supermajority requirement');
            console.log('🔥 Applying emergency finalization...\n');

            await proposal.emergencyFinalize();

            console.log('='.repeat(60));
            console.log(`✅ Proposal #${proposalId} emergency finalized!`);
            console.log(`   New Status: ${proposal.status}`);
            console.log(`   Finalized At: ${proposal.finalizedAt}`);
            console.log('='.repeat(60));
            console.log('\n💡 Refresh your browser to see the changes!\n');
        } else {
            console.log(`❌ Insufficient supermajority (need 75%, have ${approvalPercentage.toFixed(2)}%)`);
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Get proposal ID from command line
const proposalId = process.argv[2] || 4;
finalizeProposal(proposalId);
