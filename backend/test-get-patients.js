const axios = require('axios');

/**
 * Test script to call GET /api/mirror/patients/all
 * This queries the blockchain via Mirror Node (FREE - no gas fees!)
 */

const API_BASE_URL = 'http://localhost:4000';

async function getPatients() {
    try {
        console.log('🔍 Fetching all patients from blockchain via Mirror Node...\n');

        const response = await axios.get(`${API_BASE_URL}/api/mirror/patients/all`);

        console.log('✅ Response received!\n');
        console.log('📊 Status:', response.status);
        console.log('💰 Cost:', response.data.cost);
        console.log('🗂️  Source:', response.data.source);
        console.log('📦 Cached:', response.data.cached);
        console.log('⏱️  Cache Age:', response.data.cacheAge, 'ms\n');

        const patients = response.data.data?.patients || [];
        console.log(`👥 Total Patients Found: ${patients.length}\n`);

        if (patients.length > 0) {
            console.log('📋 Patient Details:\n');
            patients.forEach((patient, index) => {
                console.log(`Patient #${index + 1}:`);
                console.log(`  Patient ID: ${patient.patientId}`);
                console.log(`  Organ Type: ${patient.organType}`);
                console.log(`  Blood Type: ${patient.bloodType}`);
                console.log(`  Urgency Level: ${patient.urgencyLevel}`);
                console.log(`  Medical Score: ${patient.medicalScore}`);
                console.log(`  Transaction ID: ${patient.transactionId}`);
                console.log(`  Block Number: ${patient.blockNumber}`);
                console.log(`  Gas Used: ${patient.gasUsed}`);
                console.log(`  Timestamp: ${patient.timestamp}`);
                console.log(`  From Address: ${patient.from}`);
                console.log('');
            });
        } else {
            console.log('ℹ️  No patients found on blockchain (new contract has 0 registrations)');
        }

    } catch (error) {
        console.error('❌ Error fetching patients:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            console.error('No response received. Is the backend server running on port 4000?');
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Run the test
getPatients();
