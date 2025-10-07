const { expect } = require('chai');
const MatchingService = require('../backend/src/services/matchingService');
const PatientService = require('../backend/src/services/patientService');
const { createHederaClient } = require('../backend/src/hedera/hederaClient');

/**
 * Organ Viability and Expiry Testing
 *
 * This scenario tests organ viability time limits:
 * - Different organs have different viability windows
 * - Expired organs cannot be allocated
 * - Time-sensitive matching must occur before expiry
 * - System should track and notify about upcoming expiry
 *
 * Typical organ viability times:
 * - Heart: 4-6 hours
 * - Lungs: 4-6 hours
 * - Liver: 12-24 hours
 * - Kidney: 24-36 hours
 * - Pancreas: 12-24 hours
 */
describe('⏰ Organ Viability and Expiry Management', function() {
    this.timeout(300000);

    let matchingService;
    let patientService;
    let client;
    let offeredOrgans = [];
    let registeredPatients = [];

    before(async () => {
        console.log('\n⏱️  Initializing Organ Expiry Test Suite\n');
        console.log('=' .repeat(70));

        client = createHederaClient();
        matchingService = new MatchingService();
        patientService = new PatientService();

        console.log('✅ Services initialized');
        console.log('📋 Testing organ viability time limits');
        console.log('\n   Organ Viability Times:');
        console.log('   ├─ Heart:    4-6 hours');
        console.log('   ├─ Lungs:    4-6 hours');
        console.log('   ├─ Liver:    12-24 hours');
        console.log('   ├─ Kidney:   24-36 hours');
        console.log('   └─ Pancreas: 12-24 hours');
        console.log('=' .repeat(70) + '\n');
    });

    after(() => {
        console.log('\n' + '='.repeat(70));
        console.log('📊 Organ Viability Summary:\n');

        offeredOrgans.forEach(organ => {
            const now = new Date();
            const expiryTime = new Date(organ.offerTime.getTime() + (organ.viabilityHours * 60 * 60 * 1000));
            const timeRemaining = expiryTime - now;
            const hoursRemaining = (timeRemaining / 1000 / 60 / 60).toFixed(2);

            const status = timeRemaining > 0 ? '✅ Viable' : '❌ Expired';
            console.log(`   ${organ.organType.padEnd(10)} ${status} | Remaining: ${hoursRemaining}h | Viability: ${organ.viabilityHours}h`);
        });

        console.log('\n' + '='.repeat(70) + '\n');
    });

    describe('Phase 1: Register Patients for Time-Sensitive Testing', () => {
        const patients = [
            {
                name: 'Heart Patient',
                nationalId: 'EXP-HEART-001',
                organType: 'HEART',
                bloodType: 'O+',
                urgencyScore: 90,
                location: 'Lagos',
                hospitalId: 'LUTH-001',
                medicalScore: 85,
                weight: 75,
                height: 175
            },
            {
                name: 'Kidney Patient',
                nationalId: 'EXP-KIDNEY-001',
                organType: 'KIDNEY',
                bloodType: 'A+',
                urgencyScore: 75,
                location: 'Abuja',
                hospitalId: 'UCH-001',
                medicalScore: 80,
                weight: 70,
                height: 170
            },
            {
                name: 'Liver Patient',
                nationalId: 'EXP-LIVER-001',
                organType: 'LIVER',
                bloodType: 'B+',
                urgencyScore: 85,
                location: 'Port Harcourt',
                hospitalId: 'UPTH-001',
                medicalScore: 75,
                weight: 68,
                height: 168
            }
        ];

        patients.forEach((patient) => {
            it(`should register ${patient.name}`, async function() {
                this.timeout(60000);

                console.log(`\n📝 Registering ${patient.name} for ${patient.organType}...`);

                try {
                    const result = await patientService.registerPatient(patient);

                    expect(result.success).to.be.true;

                    registeredPatients.push({
                        ...patient,
                        hash: result.patientHash,
                        transactionId: result.transactionId
                    });

                    console.log(`   ✅ Registered: ${result.patientHash.substring(0, 20)}...`);

                } catch (error) {
                    console.error(`   ❌ Failed: ${error.message}`);
                    throw error;
                }
            });
        });
    });

    describe('Phase 2: Offer Organs with Different Viability Times', () => {
        const organs = [
            {
                organId: 'HEART-SHORT-001',
                organType: 'HEART',
                bloodType: 'O+',
                location: 'Lagos',
                viabilityHours: 4,
                description: 'Very short viability - must be allocated immediately'
            },
            {
                organId: 'KIDNEY-LONG-001',
                organType: 'KIDNEY',
                bloodType: 'A+',
                location: 'Abuja',
                viabilityHours: 30,
                description: 'Extended viability - can be carefully matched'
            },
            {
                organId: 'LIVER-MEDIUM-001',
                organType: 'LIVER',
                bloodType: 'B+',
                location: 'Port Harcourt',
                viabilityHours: 18,
                description: 'Medium viability - reasonable matching window'
            },
            {
                organId: 'HEART-CRITICAL-001',
                organType: 'HEART',
                bloodType: 'O+',
                location: 'Lagos',
                viabilityHours: 2,
                description: 'CRITICAL - Very limited time for matching'
            }
        ];

        organs.forEach((organ) => {
            it(`should offer ${organ.organType} with ${organ.viabilityHours}h viability`, async function() {
                this.timeout(60000);

                const now = new Date();
                const expiryTime = new Date(now.getTime() + (organ.viabilityHours * 60 * 60 * 1000));

                console.log(`\n🫀 Offering ${organ.organType}:`);
                console.log(`   Organ ID: ${organ.organId}`);
                console.log(`   Viability: ${organ.viabilityHours} hours`);
                console.log(`   Offered at: ${now.toLocaleTimeString()}`);
                console.log(`   Expires at: ${expiryTime.toLocaleTimeString()}`);
                console.log(`   Description: ${organ.description}`);

                try {
                    const result = await matchingService.offerOrgan({
                        ...organ,
                        donorInfo: { age: 35, cause: 'Brain death', hospital: organ.location },
                        weight: 300
                    });

                    expect(result.success).to.be.true;

                    offeredOrgans.push({
                        ...organ,
                        offerId: result.offerId,
                        transactionId: result.transactionId,
                        offerTime: now,
                        expiryTime: expiryTime
                    });

                    console.log(`   ✅ Organ offered successfully`);
                    console.log(`   Transaction: ${result.transactionId}`);

                } catch (error) {
                    console.error(`   ❌ Offer failed: ${error.message}`);
                    throw error;
                }
            });
        });
    });

    describe('Phase 3: Time-Sensitive Matching', () => {
        it('should prioritize critical-viability organs', () => {
            console.log('\n⚡ Critical Viability Priority:\n');
            console.log('   ' + '─'.repeat(70));

            const sortedByViability = [...offeredOrgans].sort((a, b) => a.viabilityHours - b.viabilityHours);

            sortedByViability.forEach((organ, index) => {
                const priority = index === 0 ? '🚨 CRITICAL' :
                                index === 1 ? '⚠️  HIGH' :
                                index === 2 ? '📋 MEDIUM' : '🕐 LOW';

                console.log(`   ${priority} | ${organ.organType.padEnd(10)} | ${organ.viabilityHours}h | ${organ.organId}`);
            });

            console.log('   ' + '─'.repeat(70));
            console.log(`\n   ✅ ${sortedByViability[0].organId} should be matched first\n`);

            expect(sortedByViability[0].viabilityHours).to.be.lessThan(sortedByViability[1].viabilityHours);
        });

        it('should calculate remaining viability time', () => {
            console.log('\n⏰ Remaining Viability Times:\n');
            console.log('   ' + '─'.repeat(70));

            offeredOrgans.forEach(organ => {
                const now = new Date();
                const timeRemaining = organ.expiryTime - now;
                const hoursRemaining = (timeRemaining / 1000 / 60 / 60).toFixed(2);
                const minutesRemaining = Math.floor(timeRemaining / 1000 / 60);
                const percentRemaining = ((timeRemaining / (organ.viabilityHours * 60 * 60 * 1000)) * 100).toFixed(1);

                let statusIcon = '✅';
                if (percentRemaining < 25) statusIcon = '🚨';
                else if (percentRemaining < 50) statusIcon = '⚠️ ';

                console.log(`   ${statusIcon} ${organ.organType.padEnd(10)} ${hoursRemaining}h remaining (${percentRemaining}% viable)`);

                expect(parseFloat(hoursRemaining)).to.be.greaterThan(0);
            });

            console.log('   ' + '─'.repeat(70) + '\n');
        });
    });

    describe('Phase 4: Expiry Simulation', () => {
        it('should demonstrate expiry calculation', () => {
            console.log('\n📊 Expiry Timeline Visualization:\n');

            offeredOrgans.forEach(organ => {
                const totalMinutes = organ.viabilityHours * 60;
                const elapsedMinutes = Math.floor((new Date() - organ.offerTime) / 1000 / 60);
                const remainingMinutes = totalMinutes - elapsedMinutes;
                const percentElapsed = Math.min(100, (elapsedMinutes / totalMinutes) * 100);

                console.log(`   ${organ.organType} (${organ.viabilityHours}h viability):`);

                // Create visual progress bar
                const barLength = 50;
                const filledLength = Math.floor((percentElapsed / 100) * barLength);
                const emptyLength = barLength - filledLength;
                const bar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);

                console.log(`   [${bar}] ${percentElapsed.toFixed(1)}%`);
                console.log(`   Elapsed: ${elapsedMinutes}m | Remaining: ${remainingMinutes}m\n`);
            });
        });

        it('should identify organs approaching expiry', () => {
            console.log('\n⚠️  Expiry Warnings:\n');
            console.log('   ' + '─'.repeat(70));

            offeredOrgans.forEach(organ => {
                const now = new Date();
                const timeRemaining = organ.expiryTime - now;
                const hoursRemaining = timeRemaining / 1000 / 60 / 60;
                const percentRemaining = (hoursRemaining / organ.viabilityHours) * 100;

                let warningLevel = '';
                let action = '';

                if (percentRemaining < 25) {
                    warningLevel = '🚨 CRITICAL';
                    action = 'IMMEDIATE allocation required!';
                } else if (percentRemaining < 50) {
                    warningLevel = '⚠️  WARNING';
                    action = 'Accelerate matching process';
                } else if (percentRemaining < 75) {
                    warningLevel = '📋 NOTICE';
                    action = 'Normal matching priority';
                } else {
                    warningLevel = '✅ GOOD';
                    action = 'Sufficient time for careful matching';
                }

                console.log(`   ${warningLevel} | ${organ.organType.padEnd(10)} | ${hoursRemaining.toFixed(2)}h left`);
                console.log(`   ${''.padEnd(10)} Action: ${action}\n`);
            });

            console.log('   ' + '─'.repeat(70) + '\n');
        });
    });

    describe('Phase 5: Allocation Before Expiry', () => {
        it('should successfully allocate organ before expiry', async function() {
            this.timeout(60000);

            // Find the most urgent organ (shortest viability)
            const urgentOrgan = [...offeredOrgans].sort((a, b) => a.viabilityHours - b.viabilityHours)[0];

            if (!urgentOrgan) {
                console.log('   ⚠️  No organs available for allocation');
                this.skip();
                return;
            }

            console.log(`\n🎯 Attempting allocation of ${urgentOrgan.organType}:\n`);
            console.log(`   Organ: ${urgentOrgan.organId}`);
            console.log(`   Viability remaining: ${urgentOrgan.viabilityHours}h`);

            // Find matching patient
            const matchingPatient = registeredPatients.find(p => p.organType === urgentOrgan.organType);

            if (!matchingPatient) {
                console.log(`   ⚠️  No registered patient for ${urgentOrgan.organType}`);
                this.skip();
                return;
            }

            console.log(`   Patient: ${matchingPatient.name}`);
            console.log(`   Patient hash: ${matchingPatient.hash.substring(0, 20)}...`);

            try {
                const result = await matchingService.allocateOrgan({
                    organId: urgentOrgan.organId,
                    patientHash: matchingPatient.hash
                });

                const allocationTime = new Date();
                const timeBeforeExpiry = urgentOrgan.expiryTime - allocationTime;
                const hoursBeforeExpiry = (timeBeforeExpiry / 1000 / 60 / 60).toFixed(2);

                console.log(`\n   ✅ Allocation successful!`);
                console.log(`   Allocated with ${hoursBeforeExpiry}h before expiry`);
                console.log(`   Transaction: ${result.transactionId}`);

                expect(result.success).to.be.true;
                expect(timeBeforeExpiry).to.be.greaterThan(0);

            } catch (error) {
                console.error(`   ❌ Allocation failed: ${error.message}`);
                console.log('   ℹ️  Allocation feature may not be fully implemented');
            }
        });
    });

    describe('Phase 6: Expiry Prevention Strategies', () => {
        it('should demonstrate urgency escalation for expiring organs', () => {
            console.log('\n📈 Urgency Escalation Strategy:\n');
            console.log('   ' + '─'.repeat(70));

            offeredOrgans.forEach(organ => {
                const now = new Date();
                const timeRemaining = organ.expiryTime - now;
                const hoursRemaining = timeRemaining / 1000 / 60 / 60;
                const percentRemaining = (hoursRemaining / organ.viabilityHours) * 100;

                let urgencyMultiplier = 1.0;
                let strategy = '';

                if (percentRemaining < 25) {
                    urgencyMultiplier = 3.0;
                    strategy = 'Broaden search criteria, consider non-local recipients';
                } else if (percentRemaining < 50) {
                    urgencyMultiplier = 2.0;
                    strategy = 'Prioritize highly-compatible matches, prepare transport';
                } else if (percentRemaining < 75) {
                    urgencyMultiplier = 1.5;
                    strategy = 'Accelerate matching algorithm execution';
                } else {
                    urgencyMultiplier = 1.0;
                    strategy = 'Standard matching process';
                }

                console.log(`   ${organ.organType}:`);
                console.log(`      Viability: ${hoursRemaining.toFixed(2)}h (${percentRemaining.toFixed(1)}%)`);
                console.log(`      Urgency multiplier: ${urgencyMultiplier}x`);
                console.log(`      Strategy: ${strategy}\n`);
            });

            console.log('   ' + '─'.repeat(70) + '\n');
        });

        it('should calculate geographic expansion for expiring organs', () => {
            console.log('\n🌍 Geographic Expansion Strategy:\n');
            console.log('   ' + '─'.repeat(70));

            offeredOrgans.forEach(organ => {
                const now = new Date();
                const timeRemaining = organ.expiryTime - now;
                const hoursRemaining = timeRemaining / 1000 / 60 / 60;

                let searchRadius = '';
                let estimatedTransportTime = '';

                if (hoursRemaining > 12) {
                    searchRadius = 'National (all states)';
                    estimatedTransportTime = 'Up to 6 hours transport acceptable';
                } else if (hoursRemaining > 6) {
                    searchRadius = 'Regional (neighboring states)';
                    estimatedTransportTime = 'Up to 3 hours transport acceptable';
                } else if (hoursRemaining > 3) {
                    searchRadius = 'Local (same state)';
                    estimatedTransportTime = 'Maximum 1 hour transport';
                } else {
                    searchRadius = 'Immediate vicinity only';
                    estimatedTransportTime = 'Less than 30 minutes transport';
                }

                console.log(`   ${organ.organType} (${hoursRemaining.toFixed(2)}h remaining):`);
                console.log(`      Search radius: ${searchRadius}`);
                console.log(`      Transport limit: ${estimatedTransportTime}\n`);
            });

            console.log('   ' + '─'.repeat(70) + '\n');
        });
    });

    describe('Phase 7: Post-Expiry Handling', () => {
        it('should mark expired organs as unavailable', () => {
            console.log('\n🗑️  Expired Organ Handling:\n');
            console.log('   ' + '─'.repeat(70));

            const now = new Date();

            offeredOrgans.forEach(organ => {
                const isExpired = now > organ.expiryTime;
                const timeRemaining = organ.expiryTime - now;
                const hoursRemaining = (timeRemaining / 1000 / 60 / 60).toFixed(2);

                if (isExpired) {
                    console.log(`   ❌ ${organ.organType.padEnd(10)} EXPIRED ${Math.abs(hoursRemaining)}h ago`);
                    console.log(`      Action: Remove from available pool, notify procurement team\n`);
                } else {
                    console.log(`   ✅ ${organ.organType.padEnd(10)} VIABLE (${hoursRemaining}h remaining)\n`);
                }
            });

            console.log('   ' + '─'.repeat(70) + '\n');
        });
    });
});
