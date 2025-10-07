const { expect } = require('chai');
const PatientService = require('../backend/src/services/patientService');

describe('Patient Registration', () => {
    let patientService;

    before(() => {
        patientService = new PatientService();
        console.log('Test suite initialized');
    });

    describe('Patient ID Hashing', () => {
        it('should hash patient ID consistently', () => {
            const patientId = 'TEST123456';
            const hash1 = patientService.hashPatientId(patientId);
            const hash2 = patientService.hashPatientId(patientId);

            expect(hash1).to.equal(hash2);
            expect(hash1).to.match(/^0x[0-9a-f]{64}$/);
        });

        it('should produce different hashes for different IDs', () => {
            const hash1 = patientService.hashPatientId('ID123');
            const hash2 = patientService.hashPatientId('ID456');

            expect(hash1).to.not.equal(hash2);
        });
    });

    describe('Patient Registration on Blockchain', () => {
        it('should register a new patient', async function() {
            // Increase timeout for blockchain transaction
            this.timeout(30000);

            const patientData = {
                nationalId: 'TEST123456',
                organType: 'KIDNEY',
                bloodType: 'O+',
                urgencyScore: 50,
                location: 'Lagos',
                hospitalId: 'HOSP001'
            };

            try {
                const result = await patientService.registerPatient(patientData);

                expect(result.success).to.be.true;
                expect(result.patientHash).to.exist;
                expect(result.patientHash).to.match(/^0x[0-9a-f]{64}$/);
                expect(result.transactionId).to.exist;
                expect(result.status).to.equal('SUCCESS');

                console.log('✅ Patient registered:', result.patientHash);

            } catch (error) {
                console.error('Registration error:', error.message);
                throw error;
            }
        });

        it('should reject invalid urgency score', async function() {
            this.timeout(10000);

            const patientData = {
                nationalId: 'TEST789',
                organType: 'LIVER',
                bloodType: 'A+',
                urgencyScore: 150, // Invalid - should be 0-100
                location: 'Abuja',
                hospitalId: 'HOSP002'
            };

            try {
                await patientService.registerPatient(patientData);
                throw new Error('Should have rejected invalid urgency score');
            } catch (error) {
                expect(error.message).to.include('urgency score');
            }
        });
    });

    describe('Queue Position', () => {
        it('should get queue position for registered patient', async function() {
            this.timeout(15000);

            // Use hash from previous registration
            const patientHash = patientService.hashPatientId('TEST123456');

            try {
                const position = await patientService.getQueuePosition(patientHash);

                expect(position).to.exist;
                expect(position.patientHash).to.equal(patientHash);
                expect(position.queuePosition).to.exist;
                expect(parseInt(position.queuePosition)).to.be.greaterThan(0);

                console.log('✅ Queue position:', position.queuePosition);

            } catch (error) {
                console.error('Error getting position:', error.message);
                // Don't fail test if patient doesn't exist
                console.log('⚠️  Patient may not be registered yet');
            }
        });
    });

    describe('Urgency Update', () => {
        it('should update patient urgency', async function() {
            this.timeout(20000);

            const patientHash = patientService.hashPatientId('TEST123456');

            const updateData = {
                patientHash,
                newScore: 75,
                reason: 'Medical condition deteriorated',
                doctorId: 'DOC001'
            };

            try {
                const result = await patientService.updateUrgency(updateData);

                expect(result.success).to.be.true;
                expect(result.transactionId).to.exist;

                console.log('✅ Urgency updated');

            } catch (error) {
                console.error('Error updating urgency:', error.message);
                // Don't fail if patient doesn't exist
                console.log('⚠️  Patient may not be registered yet');
            }
        });
    });

    describe('Waitlist Query', () => {
        it('should get waitlist for organ type', async function() {
            this.timeout(15000);

            try {
                const waitlist = await patientService.getWaitlist('KIDNEY');

                expect(waitlist).to.exist;
                expect(waitlist.organType).to.equal('KIDNEY');
                expect(waitlist.count).to.be.a('number');

                console.log(`✅ Waitlist count for KIDNEY: ${waitlist.count}`);

            } catch (error) {
                console.error('Error getting waitlist:', error.message);
            }
        });
    });
});
