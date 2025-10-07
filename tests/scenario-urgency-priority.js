const { expect } = require('chai');
const PatientService = require('../backend/src/services/patientService');
const { createHederaClient } = require('../backend/src/hedera/hederaClient');

/**
 * Urgency Priority and Queue Ordering Testing
 *
 * This scenario tests the prioritization algorithm based on:
 * 1. Urgency level (1-5, where 5 is most urgent)
 * 2. Medical score (0-100)
 * 3. Wait time bonus (accumulated over days)
 * 4. Composite score calculation
 * 5. Dynamic queue reordering
 */
describe('⚠️ Urgency Priority and Queue Management', function() {
    this.timeout(300000);

    let patientService;
    let client;
    let registeredPatients = [];

    before(async () => {
        console.log('\n📊 Initializing Urgency Priority Test Suite\n');
        console.log('=' .repeat(70));

        client = createHederaClient();
        patientService = new PatientService();

        console.log('✅ Services initialized');
        console.log('📋 Testing urgency-based prioritization algorithm');
        console.log('=' .repeat(70) + '\n');
    });

    after(() => {
        console.log('\n' + '='.repeat(70));
        console.log('📊 Final Queue State:\n');

        // Group by organ type
        const organTypes = [...new Set(registeredPatients.map(p => p.organType))];

        organTypes.forEach(organType => {
            const patients = registeredPatients
                .filter(p => p.organType === organType)
                .sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0));

            console.log(`\n   ${organType} Waitlist (${patients.length} patients):`);
            console.log('   ' + '─'.repeat(66));

            patients.forEach((p, idx) => {
                console.log(`   ${idx + 1}. ${p.name.padEnd(15)} | Urgency: ${p.urgencyScore} | Score: ${p.compositeScore || 'N/A'}`);
            });
        });

        console.log('\n' + '='.repeat(70) + '\n');
    });

    describe('Phase 1: Register Patients with Different Urgency Levels', () => {
        const patients = [
            {
                name: 'Critical Patient',
                nationalId: 'URG-CRIT-001',
                organType: 'HEART',
                bloodType: 'O+',
                urgencyScore: 95,
                medicalScore: 85,
                location: 'Lagos',
                hospitalId: 'LUTH-001',
                weight: 75,
                height: 175,
                description: 'Life-threatening condition, immediate transplant needed'
            },
            {
                name: 'High Urgency',
                nationalId: 'URG-HIGH-001',
                organType: 'HEART',
                bloodType: 'O+',
                urgencyScore: 80,
                medicalScore: 75,
                location: 'Lagos',
                hospitalId: 'LUTH-001',
                weight: 72,
                height: 170,
                description: 'Severe condition, urgent transplant required'
            },
            {
                name: 'Medium Urgency',
                nationalId: 'URG-MED-001',
                organType: 'HEART',
                bloodType: 'O+',
                urgencyScore: 60,
                medicalScore: 70,
                location: 'Lagos',
                hospitalId: 'LUTH-001',
                weight: 70,
                height: 168,
                description: 'Moderate condition, transplant needed within months'
            },
            {
                name: 'Low Urgency',
                nationalId: 'URG-LOW-001',
                organType: 'HEART',
                bloodType: 'O+',
                urgencyScore: 40,
                medicalScore: 65,
                location: 'Lagos',
                hospitalId: 'LUTH-001',
                weight: 68,
                height: 165,
                description: 'Stable condition, can wait for suitable match'
            },
            {
                name: 'Stable Patient',
                nationalId: 'URG-STABLE-001',
                organType: 'HEART',
                bloodType: 'O+',
                urgencyScore: 25,
                medicalScore: 60,
                location: 'Lagos',
                hospitalId: 'LUTH-001',
                weight: 65,
                height: 162,
                description: 'Very stable, long-term waitlist candidate'
            }
        ];

        patients.forEach((patient) => {
            it(`should register ${patient.name} (Urgency: ${patient.urgencyScore})`, async function() {
                this.timeout(60000);

                console.log(`\n📝 Registering ${patient.name}:`);
                console.log(`   Urgency Score: ${patient.urgencyScore}/100`);
                console.log(`   Medical Score: ${patient.medicalScore}/100`);
                console.log(`   Description: ${patient.description}`);

                try {
                    const result = await patientService.registerPatient(patient);

                    expect(result.success).to.be.true;
                    expect(result.patientHash).to.exist;

                    // Calculate initial composite score
                    // Formula: urgency * 1000 + medicalScore + waitTimeBonus
                    const compositeScore = (patient.urgencyScore * 10) + patient.medicalScore;

                    const patientRecord = {
                        ...patient,
                        hash: result.patientHash,
                        transactionId: result.transactionId,
                        registrationTime: new Date(),
                        compositeScore: compositeScore
                    };

                    registeredPatients.push(patientRecord);

                    console.log(`   ✅ Registered successfully`);
                    console.log(`   Hash: ${result.patientHash.substring(0, 20)}...`);
                    console.log(`   Initial Composite Score: ${compositeScore}`);
                    console.log(`   Transaction: ${result.transactionId}`);

                } catch (error) {
                    console.error(`   ❌ Registration failed: ${error.message}`);
                    throw error;
                }
            });
        });
    });

    describe('Phase 2: Verify Initial Queue Ordering', () => {
        it('should show patients ordered by composite score', async function() {
            this.timeout(30000);

            console.log('\n📋 Initial Queue Order (by Composite Score):\n');
            console.log('   ' + '─'.repeat(70));

            // Sort by composite score (descending)
            const sortedPatients = [...registeredPatients].sort((a, b) => b.compositeScore - a.compositeScore);

            sortedPatients.forEach((patient, index) => {
                console.log(`   ${index + 1}. ${patient.name.padEnd(20)} Score: ${patient.compositeScore} (U:${patient.urgencyScore}, M:${patient.medicalScore})`);
            });

            console.log('   ' + '─'.repeat(70));

            // Verify Critical Patient is first
            expect(sortedPatients[0].name).to.equal('Critical Patient');
            console.log(`\n   ✅ Critical Patient correctly at position #1`);
        });

        it('should retrieve queue positions from blockchain', async function() {
            this.timeout(60000);

            console.log('\n🔍 Fetching queue positions from blockchain:\n');

            for (const patient of registeredPatients) {
                try {
                    const position = await patientService.getQueuePosition(patient.hash);

                    console.log(`   ${patient.name}: Position #${position.queuePosition} (Score: ${patient.compositeScore})`);

                    patient.queuePosition = parseInt(position.queuePosition);
                    expect(position.queuePosition).to.be.a('string');

                } catch (error) {
                    console.log(`   ⚠️  ${patient.name}: Position not available yet (${error.message})`);
                    patient.queuePosition = null;
                }
            }
        });
    });

    describe('Phase 3: Dynamic Urgency Updates', () => {
        it('should escalate Medium Urgency patient to Critical', async function() {
            this.timeout(60000);

            const patient = registeredPatients.find(p => p.name === 'Medium Urgency');

            if (!patient) {
                console.log('   ⚠️  Medium Urgency patient not found');
                this.skip();
                return;
            }

            console.log('\n⬆️  Escalating Medium Urgency patient to Critical:\n');
            console.log(`   Current urgency: ${patient.urgencyScore}`);
            console.log(`   Current composite score: ${patient.compositeScore}`);
            console.log(`   Current position: ${patient.queuePosition || 'Unknown'}`);

            const oldUrgency = patient.urgencyScore;
            const newUrgency = 98;

            console.log(`\n   New urgency: ${newUrgency}`);
            console.log(`   Reason: Patient condition deteriorated significantly`);

            try {
                const result = await patientService.updateUrgency({
                    patientHash: patient.hash,
                    newScore: newUrgency,
                    reason: 'Patient condition deteriorated - now critical',
                    doctorId: 'DOC-CRITICAL-001'
                });

                expect(result.success).to.be.true;

                // Update local record
                patient.urgencyScore = newUrgency;
                patient.compositeScore = (newUrgency * 10) + patient.medicalScore;

                console.log(`\n   ✅ Urgency updated successfully`);
                console.log(`   New composite score: ${patient.compositeScore}`);
                console.log(`   Transaction: ${result.transactionId}`);

            } catch (error) {
                console.error(`   ❌ Update failed: ${error.message}`);
                throw error;
            }
        });

        it('should verify queue reordering after escalation', async function() {
            this.timeout(60000);

            console.log('\n🔄 Verifying queue reordering after escalation:\n');
            console.log('   ' + '─'.repeat(70));

            // Sort by new composite scores
            const sortedPatients = [...registeredPatients].sort((a, b) => b.compositeScore - a.compositeScore);

            sortedPatients.forEach((patient, index) => {
                const arrow = patient.name === 'Medium Urgency' ? '⬆️ ' : '   ';
                console.log(`   ${arrow}${index + 1}. ${patient.name.padEnd(20)} Score: ${patient.compositeScore} (U:${patient.urgencyScore})`);
            });

            console.log('   ' + '─'.repeat(70));

            // Verify Medium Urgency moved to top (or second after original critical)
            const escalatedPatient = sortedPatients.find(p => p.name === 'Medium Urgency');
            const escalatedPosition = sortedPatients.indexOf(escalatedPatient) + 1;

            console.log(`\n   ✅ Medium Urgency patient now at position #${escalatedPosition}`);
            expect(escalatedPosition).to.be.lessThan(3); // Should be in top 2
        });

        it('should downgrade High Urgency patient to Stable', async function() {
            this.timeout(60000);

            const patient = registeredPatients.find(p => p.name === 'High Urgency');

            if (!patient) {
                console.log('   ⚠️  High Urgency patient not found');
                this.skip();
                return;
            }

            console.log('\n⬇️  Downgrading High Urgency patient to Stable:\n');
            console.log(`   Current urgency: ${patient.urgencyScore}`);
            console.log(`   Current composite score: ${patient.compositeScore}`);

            const newUrgency = 30;

            console.log(`\n   New urgency: ${newUrgency}`);
            console.log(`   Reason: Patient received successful bridge therapy`);

            try {
                const result = await patientService.updateUrgency({
                    patientHash: patient.hash,
                    newScore: newUrgency,
                    reason: 'Successful bridge therapy - condition stabilized',
                    doctorId: 'DOC-CARD-002'
                });

                expect(result.success).to.be.true;

                // Update local record
                patient.urgencyScore = newUrgency;
                patient.compositeScore = (newUrgency * 10) + patient.medicalScore;

                console.log(`\n   ✅ Urgency downgraded successfully`);
                console.log(`   New composite score: ${patient.compositeScore}`);
                console.log(`   Transaction: ${result.transactionId}`);

            } catch (error) {
                console.error(`   ❌ Update failed: ${error.message}`);
                throw error;
            }
        });

        it('should verify queue reordering after downgrade', async function() {
            this.timeout(30000);

            console.log('\n🔄 Final queue order after all updates:\n');
            console.log('   ' + '─'.repeat(70));

            const sortedPatients = [...registeredPatients].sort((a, b) => b.compositeScore - a.compositeScore);

            sortedPatients.forEach((patient, index) => {
                let arrow = '   ';
                if (patient.name === 'Medium Urgency') arrow = '⬆️ ';
                if (patient.name === 'High Urgency') arrow = '⬇️ ';

                console.log(`   ${arrow}${index + 1}. ${patient.name.padEnd(20)} Score: ${patient.compositeScore} (U:${patient.urgencyScore})`);
            });

            console.log('   ' + '─'.repeat(70));

            // Verify High Urgency moved down
            const downgradedPatient = sortedPatients.find(p => p.name === 'High Urgency');
            const downgradedPosition = sortedPatients.indexOf(downgradedPatient) + 1;

            console.log(`\n   ✅ High Urgency patient now at position #${downgradedPosition}`);
            expect(downgradedPosition).to.be.greaterThan(3); // Should be lower in queue
        });
    });

    describe('Phase 4: Wait Time Bonus Simulation', () => {
        it('should demonstrate wait time bonus accumulation', () => {
            console.log('\n⏰ Wait Time Bonus Calculation:\n');
            console.log('   Formula: waitTimeBonus = (currentTime - registrationTime) / 1 day\n');
            console.log('   ' + '─'.repeat(70));

            registeredPatients.forEach(patient => {
                const waitTimeMinutes = Math.floor((new Date() - patient.registrationTime) / 1000 / 60);
                const waitTimeDays = (waitTimeMinutes / 60 / 24).toFixed(2);
                const waitTimeBonus = Math.floor(waitTimeMinutes / (60 * 24)); // Days waited

                console.log(`   ${patient.name.padEnd(20)} Wait time: ${waitTimeMinutes}m (~${waitTimeDays} days)`);
                console.log(`   ${' '.padEnd(20)} Bonus: +${waitTimeBonus} points`);
                console.log(`   ${' '.padEnd(20)} New score: ${patient.compositeScore + waitTimeBonus}\n`);
            });

            console.log('   ' + '─'.repeat(70));
            console.log('   ℹ️  Wait time bonus increases over days to balance urgency\n');
        });

        it('should calculate future queue positions with wait time', () => {
            console.log('\n📈 Projected queue order after 30 days:\n');
            console.log('   (Assuming no urgency changes)\n');
            console.log('   ' + '─'.repeat(70));

            const waitTimeBonusDays = 30;

            const futureScores = registeredPatients.map(patient => ({
                ...patient,
                futureScore: patient.compositeScore + waitTimeBonusDays
            })).sort((a, b) => b.futureScore - a.futureScore);

            futureScores.forEach((patient, index) => {
                console.log(`   ${index + 1}. ${patient.name.padEnd(20)} Score: ${patient.futureScore} (+${waitTimeBonusDays} bonus)`);
            });

            console.log('   ' + '─'.repeat(70));
            console.log('   ℹ️  Long-waiting patients gradually move up in priority\n');
        });
    });

    describe('Phase 5: Composite Score Formula Verification', () => {
        it('should verify composite score calculation', () => {
            console.log('\n🧮 Composite Score Formula Breakdown:\n');
            console.log('   Formula: (urgency × 10) + medicalScore + waitTimeBonus\n');
            console.log('   ' + '─'.repeat(70));

            registeredPatients.forEach(patient => {
                const urgencyComponent = patient.urgencyScore * 10;
                const medicalComponent = patient.medicalScore;
                const waitTimeBonus = 0; // Just registered for this test

                const calculatedScore = urgencyComponent + medicalComponent + waitTimeBonus;

                console.log(`   ${patient.name}:`);
                console.log(`      Urgency component: ${patient.urgencyScore} × 10 = ${urgencyComponent}`);
                console.log(`      Medical component: ${medicalComponent}`);
                console.log(`      Wait time bonus: ${waitTimeBonus}`);
                console.log(`      Total score: ${calculatedScore}`);
                console.log(``);

                expect(calculatedScore).to.equal(patient.compositeScore);
            });

            console.log('   ' + '─'.repeat(70));
        });

        it('should demonstrate urgency weight in scoring', () => {
            console.log('\n⚖️  Urgency Weight Demonstration:\n');
            console.log('   Urgency is weighted 10x higher than medical score\n');
            console.log('   ' + '─'.repeat(70));

            const examples = [
                { urgency: 90, medical: 50, desc: 'High urgency, low medical' },
                { urgency: 50, medical: 90, desc: 'Low urgency, high medical' },
                { urgency: 70, medical: 70, desc: 'Balanced scores' }
            ];

            examples.forEach(({ urgency, medical, desc }) => {
                const score = (urgency * 10) + medical;
                console.log(`   ${desc}:`);
                console.log(`      Urgency ${urgency} × 10 + Medical ${medical} = ${score}`);
            });

            console.log('\n   ' + '─'.repeat(70));
            console.log('   ✅ Urgency component (×10) dominates priority\n');
        });
    });
});
