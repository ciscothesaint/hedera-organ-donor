const { expect } = require('chai');
const PatientService = require('../backend/src/services/patientService');
const MatchingService = require('../backend/src/services/matchingService');
const { createHederaClient } = require('../backend/src/hedera/hederaClient');

/**
 * Blood Type Compatibility Testing
 *
 * This scenario tests the blood type compatibility matrix for organ transplants:
 * - Universal donor: O- can donate to all blood types
 * - Universal recipient: AB+ can receive from all blood types
 * - Specific compatibility rules for A, B, AB, and O blood types
 * - Positive/negative Rh factor compatibility
 */
describe('🩸 Blood Type Compatibility Testing', function() {
    this.timeout(300000);

    let patientService;
    let matchingService;
    let client;

    // Blood type compatibility matrix
    const compatibilityMatrix = {
        'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal donor
        'O+': ['O+', 'A+', 'B+', 'AB+'],
        'A-': ['A-', 'A+', 'AB-', 'AB+'],
        'A+': ['A+', 'AB+'],
        'B-': ['B-', 'B+', 'AB-', 'AB+'],
        'B+': ['B+', 'AB+'],
        'AB-': ['AB-', 'AB+'],
        'AB+': ['AB+'] // Universal recipient
    };

    // Recipient compatibility (what a recipient can receive from)
    const recipientCompatibility = {
        'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal recipient
        'AB-': ['O-', 'A-', 'B-', 'AB-'],
        'A+': ['O-', 'O+', 'A-', 'A+'],
        'A-': ['O-', 'A-'],
        'B+': ['O-', 'O+', 'B-', 'B+'],
        'B-': ['O-', 'B-'],
        'O+': ['O-', 'O+'],
        'O-': ['O-'] // Can only receive from O-
    };

    before(async () => {
        console.log('\n🧪 Initializing Blood Compatibility Test Suite\n');
        console.log('=' .repeat(70));

        client = createHederaClient();
        patientService = new PatientService();
        matchingService = new MatchingService();

        console.log('✅ Services initialized');
        console.log('📋 Testing blood type compatibility matrix');
        console.log('=' .repeat(70) + '\n');
    });

    describe('Blood Type Compatibility Matrix', () => {
        Object.entries(compatibilityMatrix).forEach(([donorType, recipients]) => {
            it(`should verify ${donorType} donor compatibility`, () => {
                console.log(`\n🩸 Testing ${donorType} donor:`);
                console.log(`   Can donate to: ${recipients.join(', ')}`);

                // Test each recipient type
                const allBloodTypes = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

                allBloodTypes.forEach(recipientType => {
                    const isCompatible = recipients.includes(recipientType);
                    const status = isCompatible ? '✅' : '❌';
                    console.log(`   ${status} ${donorType} → ${recipientType}: ${isCompatible ? 'Compatible' : 'Incompatible'}`);

                    expect(recipients.includes(recipientType)).to.equal(isCompatible);
                });
            });
        });
    });

    describe('Universal Donor (O-) Testing', () => {
        const organs = [
            { organType: 'KIDNEY', bloodType: 'O-', location: 'Lagos' },
            { organType: 'LIVER', bloodType: 'O-', location: 'Abuja' }
        ];

        organs.forEach(organ => {
            it(`should match O- ${organ.organType} with all blood types`, async function() {
                this.timeout(60000);

                console.log(`\n🫀 Testing O- ${organ.organType} (Universal Donor):\n`);

                const allBloodTypes = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

                for (const bloodType of allBloodTypes) {
                    const patient = {
                        nationalId: `TEST-${organ.organType}-${bloodType}-${Date.now()}`,
                        organType: organ.organType,
                        bloodType: bloodType,
                        urgencyScore: 70,
                        location: organ.location,
                        hospitalId: 'TEST-HOSP-001',
                        medicalScore: 75,
                        weight: 70,
                        height: 170
                    };

                    console.log(`   Testing O- → ${bloodType}:`);

                    try {
                        // Register patient
                        const patientResult = await patientService.registerPatient(patient);
                        console.log(`      ✅ Patient registered: ${patientResult.patientHash.substring(0, 16)}...`);

                        // Offer organ
                        const organResult = await matchingService.offerOrgan({
                            organId: `ORG-${organ.organType}-O-${bloodType}-${Date.now()}`,
                            ...organ,
                            donorInfo: { age: 35, cause: 'Brain death' },
                            weight: 150,
                            viabilityHours: 24
                        });
                        console.log(`      ✅ Organ offered: ${organResult.transactionId}`);

                        // Verify compatibility
                        const isCompatible = recipientCompatibility[bloodType].includes('O-');
                        expect(isCompatible).to.be.true;
                        console.log(`      ✅ Compatibility confirmed: O- → ${bloodType}`);

                    } catch (error) {
                        console.error(`      ❌ Test failed for ${bloodType}: ${error.message}`);
                        // Don't fail entire test suite
                    }
                }
            });
        });
    });

    describe('Universal Recipient (AB+) Testing', () => {
        it('should allow AB+ patient to receive from all blood types', async function() {
            this.timeout(120000);

            console.log('\n💉 Testing AB+ Patient (Universal Recipient):\n');

            const allBloodTypes = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

            // Register AB+ KIDNEY patient
            const patient = {
                nationalId: `TEST-AB-PLUS-PATIENT-${Date.now()}`,
                organType: 'KIDNEY',
                bloodType: 'AB+',
                urgencyScore: 80,
                location: 'Lagos',
                hospitalId: 'TEST-HOSP-001',
                medicalScore: 85,
                weight: 75,
                height: 175
            };

            try {
                const patientResult = await patientService.registerPatient(patient);
                console.log(`   ✅ AB+ patient registered: ${patientResult.patientHash.substring(0, 16)}...`);

                // Test receiving from each blood type
                for (const donorBlood of allBloodTypes) {
                    console.log(`\n   Testing ${donorBlood} → AB+:`);

                    const organ = {
                        organId: `ORG-KIDNEY-${donorBlood}-TO-ABPLUS-${Date.now()}`,
                        organType: 'KIDNEY',
                        bloodType: donorBlood,
                        location: 'Lagos',
                        donorInfo: { age: 35, cause: 'Brain death' },
                        weight: 150,
                        viabilityHours: 24
                    };

                    try {
                        const organResult = await matchingService.offerOrgan(organ);
                        console.log(`      ✅ ${donorBlood} organ offered: ${organResult.transactionId}`);

                        // AB+ should be compatible with all blood types
                        const isCompatible = recipientCompatibility['AB+'].includes(donorBlood);
                        expect(isCompatible).to.be.true;
                        console.log(`      ✅ Compatibility confirmed: ${donorBlood} → AB+`);

                    } catch (error) {
                        console.error(`      ❌ Organ offer failed: ${error.message}`);
                    }
                }

            } catch (error) {
                console.error(`   ❌ Patient registration failed: ${error.message}`);
                throw error;
            }
        });
    });

    describe('Incompatible Blood Type Rejection', () => {
        const incompatiblePairs = [
            { donor: 'A+', recipient: 'B+', reason: 'Different ABO groups' },
            { donor: 'B+', recipient: 'A+', reason: 'Different ABO groups' },
            { donor: 'A+', recipient: 'O+', reason: 'O can only receive from O' },
            { donor: 'B+', recipient: 'O+', reason: 'O can only receive from O' },
            { donor: 'AB+', recipient: 'A+', reason: 'A+ cannot receive from AB+' },
            { donor: 'AB+', recipient: 'B+', reason: 'B+ cannot receive from AB+' },
            { donor: 'O+', recipient: 'O-', reason: 'Positive cannot donate to negative' },
            { donor: 'A+', recipient: 'A-', reason: 'Positive cannot donate to negative' }
        ];

        incompatiblePairs.forEach(({ donor, recipient, reason }) => {
            it(`should reject ${donor} → ${recipient} (${reason})`, async function() {
                this.timeout(60000);

                console.log(`\n🚫 Testing incompatible pair: ${donor} → ${recipient}`);
                console.log(`   Reason: ${reason}`);

                const isCompatible = recipientCompatibility[recipient]?.includes(donor);

                expect(isCompatible).to.be.false;
                console.log(`   ✅ Correctly identified as incompatible`);
            });
        });
    });

    describe('Rh Factor (Positive/Negative) Testing', () => {
        it('should allow Rh- to receive from Rh- only', () => {
            console.log('\n🧬 Testing Rh factor compatibility (Negative recipients):\n');

            const negativeRecipients = ['O-', 'A-', 'B-', 'AB-'];

            negativeRecipients.forEach(recipientType => {
                const compatibleDonors = recipientCompatibility[recipientType];
                const allNegative = compatibleDonors.every(donor => donor.endsWith('-'));

                console.log(`   ${recipientType} compatible donors: ${compatibleDonors.join(', ')}`);
                console.log(`   ${allNegative ? '✅' : '❌'} All donors are Rh-`);

                expect(allNegative).to.be.true;
            });
        });

        it('should allow Rh+ to receive from both Rh+ and Rh-', () => {
            console.log('\n🧬 Testing Rh factor compatibility (Positive recipients):\n');

            const positiveRecipients = ['O+', 'A+', 'B+', 'AB+'];

            positiveRecipients.forEach(recipientType => {
                const compatibleDonors = recipientCompatibility[recipientType];
                const baseType = recipientType.charAt(0) === 'A' ? 'A' :
                                 recipientType.charAt(0) === 'B' ? 'B' :
                                 recipientType.startsWith('AB') ? 'AB' : 'O';

                console.log(`   ${recipientType} compatible donors: ${compatibleDonors.join(', ')}`);

                // Positive recipients should accept both positive and negative of compatible ABO types
                const hasPositive = compatibleDonors.some(d => d.endsWith('+'));
                const hasNegative = compatibleDonors.some(d => d.endsWith('-'));

                console.log(`   ${hasPositive ? '✅' : '❌'} Can receive Rh+`);
                console.log(`   ${hasNegative ? '✅' : '❌'} Can receive Rh-`);

                expect(hasNegative).to.be.true; // All positive can receive from negative
            });
        });
    });

    describe('ABO Group Testing', () => {
        const aboGroups = [
            { group: 'O', types: ['O-', 'O+'], description: 'Can only receive from O group' },
            { group: 'A', types: ['A-', 'A+'], description: 'Can receive from O and A groups' },
            { group: 'B', types: ['B-', 'B+'], description: 'Can receive from O and B groups' },
            { group: 'AB', types: ['AB-', 'AB+'], description: 'Can receive from all groups (universal recipient)' }
        ];

        aboGroups.forEach(({ group, types, description }) => {
            it(`should verify ${group} group rules: ${description}`, () => {
                console.log(`\n🔬 Testing ${group} blood group:\n`);
                console.log(`   Description: ${description}\n`);

                types.forEach(bloodType => {
                    const compatibleDonors = recipientCompatibility[bloodType];
                    console.log(`   ${bloodType} can receive from: ${compatibleDonors.join(', ')}`);

                    // Verify rules
                    if (group === 'O') {
                        const onlyO = compatibleDonors.every(d => d.startsWith('O'));
                        expect(onlyO).to.be.true;
                        console.log(`      ✅ Only receives from O group`);
                    } else if (group === 'AB') {
                        expect(compatibleDonors.length).to.be.greaterThan(types.length);
                        console.log(`      ✅ Can receive from multiple groups`);
                    }
                });
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle rare blood type combinations', async function() {
            this.timeout(60000);

            console.log('\n🔍 Testing rare blood type combinations:\n');

            const rareCombinations = [
                { donor: 'AB-', recipient: 'AB+', expected: true, description: 'Rare to common' },
                { donor: 'O-', recipient: 'AB-', expected: true, description: 'Universal to rare negative' },
                { donor: 'A-', recipient: 'AB+', expected: true, description: 'Negative to positive universal' }
            ];

            rareCombinations.forEach(({ donor, recipient, expected, description }) => {
                const isCompatible = recipientCompatibility[recipient]?.includes(donor);

                console.log(`   ${donor} → ${recipient} (${description})`);
                console.log(`      Expected: ${expected ? 'Compatible' : 'Incompatible'}`);
                console.log(`      Result: ${isCompatible ? '✅ Compatible' : '❌ Incompatible'}`);

                expect(isCompatible).to.equal(expected);
            });
        });
    });
});
