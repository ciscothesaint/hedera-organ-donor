const axios = require('axios');

/**
 * Hedera Mirror Node Service
 * Provides FREE REST API access to blockchain data without gas fees
 * Includes intelligent caching to reduce API calls
 */
class MirrorNodeService {
    constructor() {
        // Mirror node URLs
        this.baseUrl = process.env.HEDERA_NETWORK === 'mainnet'
            ? 'https://mainnet-public.mirrornode.hedera.com'
            : 'https://testnet.mirrornode.hedera.com';

        // In-memory cache with TTL
        this.cache = new Map();
        this.cacheTTL = 5000; // 5 seconds default TTL

        console.log(`🔗 Mirror Node initialized: ${this.baseUrl}`);
    }

    /**
     * Get cached data or fetch new
     * @param {string} key - Cache key
     * @param {Function} fetchFn - Function to fetch data if not cached
     * @param {number} ttl - Time to live in milliseconds
     */
    async getCached(key, fetchFn, ttl = this.cacheTTL) {
        const cached = this.cache.get(key);
        const now = Date.now();

        if (cached && (now - cached.timestamp) < ttl) {
            console.log(`✅ Cache HIT: ${key} (age: ${now - cached.timestamp}ms)`);
            return {
                ...cached.data,
                cached: true,
                cacheAge: now - cached.timestamp
            };
        }

        console.log(`⏳ Cache MISS: ${key} - fetching fresh data...`);
        const data = await fetchFn();

        this.cache.set(key, {
            data,
            timestamp: now
        });

        return {
            ...data,
            cached: false,
            cacheAge: 0
        };
    }

    /**
     * Invalidate cache for a key or pattern
     */
    invalidateCache(keyPattern = null) {
        if (keyPattern) {
            for (const key of this.cache.keys()) {
                if (key.includes(keyPattern)) {
                    this.cache.delete(key);
                    console.log(`🗑️  Cache invalidated: ${key}`);
                }
            }
        } else {
            this.cache.clear();
            console.log(`🗑️  All cache cleared`);
        }
    }

    /**
     * Get contract information
     */
    async getContract(contractId) {
        return this.getCached(`contract:${contractId}`, async () => {
            const response = await axios.get(`${this.baseUrl}/api/v1/contracts/${contractId}`);
            return response.data;
        }, 60000); // Cache for 1 minute
    }

    /**
     * Get contract results (transactions)
     */
    async getContractResults(contractId, params = {}) {
        const cacheKey = `contract-results:${contractId}:${JSON.stringify(params)}`;
        return this.getCached(cacheKey, async () => {
            const response = await axios.get(
                `${this.baseUrl}/api/v1/contracts/${contractId}/results`,
                { params }
            );
            return response.data;
        }, 10000); // Cache for 10 seconds
    }

    /**
     * Get contract logs/events - KEY METHOD for extracting patient data
     */
    async getContractLogs(contractId, params = {}) {
        const cacheKey = `contract-logs:${contractId}:${JSON.stringify(params)}`;
        return this.getCached(cacheKey, async () => {
            const response = await axios.get(
                `${this.baseUrl}/api/v1/contracts/${contractId}/results/logs`,
                { params }
            );
            return response.data;
        });
    }

    /**
     * Get transaction by ID
     */
    async getTransaction(transactionId) {
        return this.getCached(`transaction:${transactionId}`, async () => {
            const response = await axios.get(
                `${this.baseUrl}/api/v1/transactions/${transactionId}`
            );
            return response.data;
        }, 30000); // Cache for 30 seconds
    }

    /**
     * Decode PatientRegistered event data (12 fields)
     * Event signature: PatientRegistered(string indexed patientId, address patientAddress, string firstName, string lastName, string organType, string bloodType, uint8 urgencyLevel, uint256 medicalScore, uint256 weight, uint256 height, bool isActive, uint256 timestamp)
     */
    decodeString(buffer, offset) {
        const length = parseInt(buffer.slice(offset, offset + 32).toString('hex'), 16);
        return buffer.slice(offset + 32, offset + 32 + length).toString('utf8');
    }
    decodePatientRegisteredEvent(eventData) {
        try {
            // Remove 0x prefix if present
            const hex = eventData.startsWith('0x') ? eventData.slice(2) : eventData;
            const buffer = Buffer.from(hex, 'hex');

            // ABI encoding: each field is 32 bytes (64 hex chars)
            let offset = 0;

            // Field 1: patientAddress (address)
            const addressHex = buffer.slice(offset, offset + 32).toString('hex');
            offset += 32;

            // Field 2: firstName (string) - offset pointer
            const firstNameOffset = parseInt(buffer.slice(offset, offset + 32).toString('hex'), 16);
            offset += 32;

            // Field 3: lastName (string) - offset pointer
            const lastNameOffset = parseInt(buffer.slice(offset, offset + 32).toString('hex'), 16);
            offset += 32;

            // Field 4: organType (string) - offset pointer
            const organTypeOffset = parseInt(buffer.slice(offset, offset + 32).toString('hex'), 16);
            offset += 32;

            // Field 5: bloodType (string) - offset pointer
            const bloodTypeOffset = parseInt(buffer.slice(offset, offset + 32).toString('hex'), 16);
            offset += 32;

            // Field 6: urgencyLevel (uint8)
            const urgencyLevel = parseInt(buffer.slice(offset, offset + 32).toString('hex'), 16);
            offset += 32;

            // Field 7: medicalScore (uint256)
            const medicalScore = parseInt(buffer.slice(offset, offset + 32).toString('hex'), 16);
            offset += 32;

            // Field 8: weight (uint256)
            const weight = parseInt(buffer.slice(offset, offset + 32).toString('hex'), 16);
            offset += 32;

            // Field 9: height (uint256)
            const height = parseInt(buffer.slice(offset, offset + 32).toString('hex'), 16);
            offset += 32;

            // Field 10: isActive (bool)
            const isActive = parseInt(buffer.slice(offset, offset + 32).toString('hex'), 16) === 1;
            offset += 32;

            // Field 11: timestamp (uint256)
            const timestamp = parseInt(buffer.slice(offset, offset + 32).toString('hex'), 16);
            offset += 32;

            // Now decode the strings at their offsets
            // First Name
            const firstNameLength = parseInt(buffer.slice(firstNameOffset, firstNameOffset + 32).toString('hex'), 16);
            const firstName = buffer.slice(firstNameOffset + 32, firstNameOffset + 32 + firstNameLength).toString('utf8');

            // Last Name
            const lastNameLength = parseInt(buffer.slice(lastNameOffset, lastNameOffset + 32).toString('hex'), 16);
            const lastName = buffer.slice(lastNameOffset + 32, lastNameOffset + 32 + lastNameLength).toString('utf8');

            // Organ Type
            const organTypeLength = parseInt(buffer.slice(organTypeOffset, organTypeOffset + 32).toString('hex'), 16);
            const organType = buffer.slice(organTypeOffset + 32, organTypeOffset + 32 + organTypeLength).toString('utf8');

            // Blood Type
            const bloodTypeLength = parseInt(buffer.slice(bloodTypeOffset, bloodTypeOffset + 32).toString('hex'), 16);
            const bloodType = buffer.slice(bloodTypeOffset + 32, bloodTypeOffset + 32 + bloodTypeLength).toString('utf8');

            return {
                firstName,
                lastName,
                organType,
                bloodType,
                urgencyLevel,
                medicalScore,
                weight,
                height,
                isActive,
                timestamp
            };
        } catch (error) {
            console.warn('⚠️  Error decoding event:', error.message);
            return null;
        }
    }

    /**
     * Get ALL patient registrations from contract EVENTS
     * This is FREE - no gas fees!
     * Now reads from PatientRegistered events with ALL 10 fields!
     */
    async getPatientRegistrations(contractId) {
        const cacheKey = `patient-registrations:${contractId}`;
        return this.getCached(cacheKey, async () => {
            try {
                // Get contract event logs (PatientRegistered events)
                const logs = await this.getContractLogs(contractId, {
                    limit: 100,
                    order: 'desc'
                });

                const patients = [];

                // Parse event logs to extract patient data
                if (logs.logs) {
                    for (const log of logs.logs) {
                        try {
                            // Filter: Only process PatientRegistered events
                            // PatientRegistered has 10 fields, WaitlistUpdated has only 2
                            // We can identify by checking the data length
                            const dataHex = log.data.startsWith('0x') ? log.data.slice(2) : log.data;
                            const dataLength = dataHex.length / 2; // Convert hex chars to bytes

                            // PatientRegistered has ~320 bytes of data (10 fields x 32 bytes each)
                            // WaitlistUpdated has only ~32 bytes (1 timestamp field)
                            if (dataLength < 100) {
                                // This is a WaitlistUpdated or other small event, skip it
                                continue;
                            }

                            // Decode event data
                            const eventData = this.decodePatientRegisteredEvent(log.data);
                            console.log(eventData)
                            //  console.log('the result of decoding is ',eventData)

                            if (eventData) {
                                // Note: patientId is indexed (hashed in topics), so we can't decode it
                                // Use timestamp from Mirror Node API (field name is 'timestamp' not 'consensus_timestamp')
                                const timestamp = log.timestamp || eventData.timestamp;
                                const txId = log.transaction_hash || log.root_contract_id;
                                

                                const patient = {
                                  
                                    ...eventData,
                                    transactionId: txId,
                                    blockNumber: log.block_number,
                                    consensusTimestamp: timestamp,
                                    gasUsed: log.gas_used
                                };

                                patients.push(patient);
                            }
                        } catch (error) {
                            console.warn('⚠️  Error parsing event log:', error.message);
                        }
                    }
                }

                console.log(`📊 Found ${patients.length} patient registrations from events`);
                return { patients, count: patients.length };

            } catch (error) {
                console.error('❌ Error fetching patient registrations:', error.message);
                return { patients: [], count: 0 };
            }
        });
    }

    /**
     * Parse contract execution result to extract patient data
     * This extracts data from the actual transaction that called registerPatient
     */
    parseContractResult(result) {
        try {
            // Extract transaction metadata
            const patient = {
                transactionId: result.transaction_id || result.consensus_timestamp,
                timestamp: result.consensus_timestamp,
                blockNumber: result.block_number,
                from: result.from,
                contractId: result.to,
                gasUsed: result.gas_used,
            };

            // Try to decode function parameters (base64 encoded)
            if (result.function_parameters) {
                // Function parameters are encoded - would need ABI decoder
                // For now, mark as needing decoding
                patient.needsDecoding = true;
                patient.functionParams = result.function_parameters;
            }

            // Set placeholder values since we can't decode without ABI
            patient.patientId = `Patient-${result.consensus_timestamp}`;
            patient.organType = 'UNKNOWN'; // Needs ABI decoding
            patient.bloodType = 'UNKNOWN'; // Needs ABI decoding
            patient.urgencyLevel = 0; // Needs ABI decoding
            patient.medicalScore = 0; // Needs ABI decoding
            patient.isActive = true;

            return patient;
        } catch (error) {
            console.warn('Error parsing contract result:', error.message);
            return null;
        }
    }

    /**
     * Get waitlist for specific organ type (FREE)
     */
    async getWaitlistByOrgan(contractId, organType) {
        const cacheKey = `waitlist:${contractId}:${organType}`;
        return this.getCached(cacheKey, async () => {
            try {
                const { patients } = await this.getPatientRegistrations(contractId);
                   console.log('the patients are ',patients) 
                // Filter by organ type and active status
                const waitlist = patients.filter(p =>{
                    if(organType=='all' ){
                        return (p.isActive !== false)
                    }
                    else{
                        return p.organType === organType && p.isActive !== false
                    }
                }
                    
                );

                // Sort by priority (urgency + medical score + wait time)
                waitlist.sort((a, b) => {
                    const scoreA = (a.urgencyLevel || 0) * 1000 + (a.medicalScore || 0);
                    const scoreB = (b.urgencyLevel || 0) * 1000 + (b.medicalScore || 0);
                    return scoreB - scoreA;
                });

                console.log(`📋 Waitlist for ${organType}: ${waitlist.length} patients`);
                return {
                    organType,
                    waitlist,
                    count: waitlist.length
                };

            } catch (error) {
                console.error('❌ Error fetching waitlist:', error.message);
                return { organType, waitlist: [], count: 0 };
            }
        });
    }

    /**
     * Get patient queue position (FREE)
     */
    async getPatientPosition(contractId, patientHash, organType) {
        const cacheKey = `position:${contractId}:${patientHash}`;
        return this.getCached(cacheKey, async () => {
            try {
                const { waitlist } = await this.getWaitlistByOrgan(contractId, organType);

                const position = waitlist.findIndex(p => p.patientId === patientHash);

                if (position === -1) {
                    throw new Error('Patient not found in waitlist');
                }

                return {
                    patientHash,
                    organType,
                    position: position + 1, // 1-indexed
                    totalInQueue: waitlist.length
                };

            } catch (error) {
                console.error('❌ Error getting patient position:', error.message);
                throw error;
            }
        });
    }

    /**
     * Get ALL organ registrations from events (FREE)
     */
    async getOrganRegistrations(contractId) {
        const cacheKey = `organ-registrations:${contractId}`;
        return this.getCached(cacheKey, async () => {
            try {
                const logs = await this.getContractLogs(contractId, {
                    limit: 100,
                    order: 'desc'
                });

                const organs = [];

                if (logs.logs) {
                    for (const log of logs.logs) {
                        try {
                            // OrganRegistered event parsing
                            const organ = this.parseOrganRegisteredEvent(log);
                            if (organ) {
                                organs.push(organ);
                            }
                        } catch (error) {
                            console.warn('Error parsing organ event:', error.message);
                        }
                    }
                }

                console.log(`🫀 Found ${organs.length} organ registrations from events`);
                return { organs, count: organs.length };

            } catch (error) {
                console.error('❌ Error fetching organ registrations:', error.message);
                return { organs: [], count: 0 };
            }
        });
    }

    /**
     * Get aggregate statistics (FREE)
     */
    async getStatistics(waitlistContractId, matchingContractId) {
        const cacheKey = `stats:${waitlistContractId}:${matchingContractId}`;
        return this.getCached(cacheKey, async () => {
            try {
                const [patientsData, organsData] = await Promise.all([
                    this.getPatientRegistrations(waitlistContractId),
                    this.getOrganRegistrations(matchingContractId)
                ]);

                const stats = {
                    totalPatients: patientsData.count,
                    activePatients: patientsData.patients.filter(p => p.isActive !== false).length,
                    totalOrgans: organsData.count,
                    availableOrgans: organsData.organs.filter(o => !o.isAllocated).length,
                    organTypes: {}
                };

                // Count by organ type
                const organTypes = ['KIDNEY', 'LIVER', 'HEART', 'LUNG', 'PANCREAS'];
                for (const type of organTypes) {
                    stats.organTypes[type] = patientsData.patients.filter(
                        p => p.organType === type && p.isActive !== false
                    ).length;
                }

                console.log(`📊 Statistics: ${stats.totalPatients} patients, ${stats.totalOrgans} organs`);
                return stats;

            } catch (error) {
                console.error('❌ Error fetching statistics:', error.message);
                return {
                    totalPatients: 0,
                    activePatients: 0,
                    totalOrgans: 0,
                    availableOrgans: 0,
                    organTypes: {}
                };
            }
        }, 10000); // Cache for 10 seconds
    }

    /**
     * Parse PatientRegistered event from log
     * Event: PatientRegistered(
     *   string indexed patientId,
     *   string organType,
     *   string bloodType,
     *   uint8 urgencyLevel,
     *   uint256 medicalScore,
     *   uint256 weight,
     *   uint256 height,
     *   uint256 timestamp
     * )
     */
    parsePatientRegisteredEvent(log) {
        try {
            // The indexed patientId is in topics[1] (topics[0] is event signature)
            // Non-indexed parameters are in log.data (needs ABI decoding)

            // For now, we need ethers.js to properly decode the data
            // TODO: Implement proper ABI decoding with ethers.js

            // Extract what we can from topics
            const patientIdHex = log.topics && log.topics[1] ? log.topics[1] : null;

            return {
                patientId: patientIdHex || 'unknown',
                // These need proper ABI decoding from log.data:
                organType: 'PENDING_DECODE', // In log.data
                bloodType: 'PENDING_DECODE', // In log.data
                urgencyLevel: 0, // In log.data
                medicalScore: 0, // In log.data
                weight: 0, // In log.data
                height: 0, // In log.data
                timestamp: log.timestamp,
                blockNumber: log.block_number,
                transactionId: log.transaction_hash,
                isActive: true,
                needsDecoding: true // Flag that this needs proper ABI decoder
            };
        } catch (error) {
            console.warn('Error parsing patient event:', error.message);
            return null;
        }
    }

    /**
     * Parse OrganRegistered event from log
     */
    parseOrganRegisteredEvent(log) {
        try {
            // Event: OrganRegistered(string indexed organId, string organType, uint256 timestamp)

            return {
                organId: log.topics && log.topics[1] ? log.topics[1] : 'unknown',
                organType: 'KIDNEY', // Parse from log.data
                bloodType: 'O+', // Parse from log.data
                timestamp: log.timestamp,
                blockNumber: log.block_number,
                transactionId: log.transaction_hash,
                isAllocated: false,
                expiryTime: null // Parse from log.data
            };
        } catch (error) {
            console.warn('Error parsing organ event:', error.message);
            return null;
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/v1/network/supply`, {
                timeout: 5000
            });
            return {
                healthy: true,
                url: this.baseUrl,
                responseTime: response.headers['x-response-time'] || 'unknown'
            };
        } catch (error) {
            return {
                healthy: false,
                url: this.baseUrl,
                error: error.message
            };
        }
    }
}

// Singleton instance
module.exports = new MirrorNodeService();
