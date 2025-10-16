import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: `${API_URL}/api/mirror`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const mirrorAPI = {
  // Get aggregate statistics
  getStats: () => api.get('/stats'),

  // Get waitlist for specific organ type
  getWaitlist: (organType) => api.get(`/patients/waitlist/${organType}`),

  // Get all patients
  getAllPatients: () => api.get('/patients/all'),

  // Get all organs
  getAllOrgans: () => api.get('/organs/all'),

  // Get patient position in queue
  getPatientPosition: (patientHash, organType) =>
    api.get(`/patients/position/${patientHash}`, { params: { organType } }),

  // Get contract information
  getContract: (contractId) => api.get(`/contract/${contractId}`),

  // Get transaction details
  getTransaction: (transactionId) => api.get(`/transaction/${transactionId}`),

  // Health check
  healthCheck: () => api.get('/health'),

  // ============================================
  // DAO TRANSPARENCY METHODS - PUBLIC ACCESS
  // Complete transparency of governance proposals and votes
  // FREE - No authentication required
  // ============================================

  // Get DAO governance statistics
  getDaoStats: () => api.get('/dao/stats'),

  // Get all proposals with pagination and filters
  // filters: { page, limit, status, urgency, type, patientHash }
  getProposals: (filters = {}) => api.get('/dao/proposals', { params: filters }),

  // Get currently active proposals (open for voting)
  getActiveProposals: () => api.get('/dao/proposals/active'),

  // Get specific proposal details
  getProposal: (proposalId) => api.get(`/dao/proposals/${proposalId}`),

  // Get all votes for a proposal (full transparency)
  getProposalVotes: (proposalId) => api.get(`/dao/proposals/${proposalId}/votes`),

  // ============================================
  // ORGAN MATCHING METHODS - PUBLIC TRANSPARENCY
  // Shows how the matching algorithm works
  // FREE - No authentication required
  // ============================================

  // Get all available organs for matching
  getAvailableOrgans: () => api.get('/organs/available'),

  // Simulate organ matching with current waitlist
  // organData: { organType, bloodType, weight }
  simulateMatching: (organData) => api.post('/matching/simulate', organData),

  // Get match probability for a specific patient
  // organType query parameter required
  getPatientProbability: (patientId, organType) =>
    api.get(`/matching/patient-probability/${patientId}`, { params: { organType } }),
};

export default mirrorAPI;
