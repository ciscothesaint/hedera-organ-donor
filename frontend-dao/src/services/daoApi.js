import axios from 'axios';
import { useDaoAuthStore } from './daoAuthStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * DAO API Client
 * All requests use /api/dao/* endpoints and separate DAO JWT token
 */

// Create axios instance for DAO
const daoClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add DAO token to all requests
daoClient.interceptors.request.use(
  (config) => {
    const token = useDaoAuthStore.getState().daoToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
daoClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - logout
      useDaoAuthStore.getState().logoutDoctor();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============ Authentication ============

export const daoAuthAPI = {
  login: (credentials) => daoClient.post('/api/dao/auth/login', credentials),

  register: (userData) => daoClient.post('/api/dao/auth/register', userData),

  getMe: () => daoClient.get('/api/dao/auth/me'),

  updateProfile: (profileData) => daoClient.patch('/api/dao/auth/profile', profileData),

  connectWallet: (walletAddress) => daoClient.post('/api/dao/auth/connect-wallet', { walletAddress }),

  getStatus: () => daoClient.get('/api/dao/auth/status'),

  logout: () => daoClient.post('/api/dao/auth/logout'),
};

// ============ Proposals ============

export const daoProposalAPI = {
  getAll: (params) => daoClient.get('/api/dao/proposals', { params }),

  getActive: () => daoClient.get('/api/dao/proposals/active'),

  getEmergency: () => daoClient.get('/api/dao/proposals/emergency'),

  getById: (id) => daoClient.get(`/api/dao/proposals/${id}`),

  create: (proposalData) => daoClient.post('/api/dao/proposals', proposalData),

  vote: (proposalId, voteData) => daoClient.post(`/api/dao/proposals/${proposalId}/vote`, voteData),

  getVotes: (proposalId) => daoClient.get(`/api/dao/proposals/${proposalId}/votes`),

  finalize: (proposalId) => daoClient.post(`/api/dao/proposals/${proposalId}/finalize`),

  emergencyFinalize: (proposalId, password) => daoClient.post(`/api/dao/proposals/${proposalId}/emergency-finalize`, { password }),

  execute: (proposalId) => daoClient.post(`/api/dao/proposals/${proposalId}/execute`),

  getMyProposals: () => daoClient.get('/api/dao/proposals/my/created'),

  getMyVotes: () => daoClient.get('/api/dao/proposals/my/votes'),
};

// ============ Roles & Members ============

export const daoRoleAPI = {
  getMembers: (params) => daoClient.get('/api/dao/roles/members', { params }),

  getPending: () => daoClient.get('/api/dao/roles/pending'),

  authorize: (userId, votingPower) => daoClient.post(`/api/dao/roles/authorize/${userId}`, { votingPower }),

  revoke: (userId) => daoClient.post(`/api/dao/roles/revoke/${userId}`),

  updateVotingPower: (userId, votingPower) => daoClient.patch(`/api/dao/roles/${userId}/voting-power`, { votingPower }),

  getStats: () => daoClient.get('/api/dao/roles/stats'),

  assignRole: (userId, role) => daoClient.post('/api/dao/roles/assign', { userId, role }),
};

// ============ Patients (via Mirror API) ============

export const daoPatientAPI = {
  getAllPatients: () => daoClient.get('/api/mirror/patients/all'),

  getWaitlist: (organType) => daoClient.get(`/api/mirror/patients/waitlist/${organType}`),
};

export default daoClient;
