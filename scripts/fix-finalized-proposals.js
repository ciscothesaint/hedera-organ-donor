require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const Proposal = require('../backend/src/db/models/Proposal');

/**
 * Fix Finalized Proposals
 *
 * This script updates proposals that have been finalized but are missing the finalizedAt timestamp.
 * Run this once to fix existing data.
 */

async function fixFinalizedProposals() {
    try {
        console.log('\n🔧 Fixing finalized proposals...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all finalized proposals without finalizedAt
        const proposals = await Proposal.find({
            status: { $in: ['APPROVED', 'REJECTED', 'EXPIRED'] },
            finalizedAt: { $exists: false }
        });

        console.log(`Found ${proposals.length} finalized proposal(s) without finalizedAt timestamp\n`);

        if (proposals.length === 0) {
            console.log('✅ All finalized proposals already have timestamps!\n');
            process.exit(0);
        }

        // Update each proposal
        for (const proposal of proposals) {
            // Use voting deadline as finalized time if available, otherwise use updatedAt
            const finalizedTime = proposal.votingDeadline || proposal.updatedAt || new Date();

            await Proposal.updateOne(
                { _id: proposal._id },
                { $set: { finalizedAt: finalizedTime } }
            );

            console.log(`✅ Updated proposal #${proposal.proposalId}`);
            console.log(`   Status: ${proposal.status}`);
            console.log(`   Finalized at: ${finalizedTime.toISOString()}\n`);
        }

        console.log('='.repeat(60));
        console.log(`✅ Fixed ${proposals.length} proposal(s)`);
        console.log('='.repeat(60));
        console.log('\n💡 Refresh your browser to see the changes!\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error fixing proposals:', error);
        process.exit(1);
    }
}

// Run fix
fixFinalizedProposals();
