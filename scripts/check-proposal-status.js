require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const Proposal = require('../backend/src/db/models/Proposal');

async function checkProposal() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get proposal #4
        const proposal = await Proposal.findOne({ proposalId: 4 });

        if (!proposal) {
            console.log('❌ Proposal #4 not found');
            process.exit(1);
        }

        console.log('📋 Proposal #4 Details:\n');
        console.log('='.repeat(60));
        console.log(`Proposal ID: ${proposal.proposalId}`);
        console.log(`Type: ${proposal.proposalType}`);
        console.log(`Status: ${proposal.status}`);
        console.log(`Created: ${proposal.createdAt}`);
        console.log(`Voting Deadline: ${proposal.votingDeadline}`);
        console.log(`Finalized At: ${proposal.finalizedAt || 'NOT SET'}`);
        console.log(`\nVotes:`);
        console.log(`  For: ${proposal.votesFor}`);
        console.log(`  Against: ${proposal.votesAgainst}`);
        console.log(`  Abstain: ${proposal.votesAbstain}`);
        console.log(`  Total Voting Power: ${proposal.totalVotingPower}`);

        // Calculate approval percentage
        const totalVotes = proposal.votesFor + proposal.votesAgainst;
        const approvalPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
        console.log(`\nApproval: ${approvalPercentage.toFixed(2)}%`);
        console.log('='.repeat(60));

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkProposal();
