import axios from 'axios';
import { useAuthStore } from './authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Patient API
export const patientAPI = {
  getAll: (params) => api.get('/patients', { params }),
  getById: (patientId) => api.get(`/patients/${patientId}`),
  register: (patientData) => api.post('/patients', patientData),
  updateUrgency: (patientId, urgencyLevel) =>
    api.put(`/patients/${patientId}/urgency`, { urgencyLevel }),
  remove: (patientId, reason) =>
    api.delete(`/patients/${patientId}`, { data: { reason } }),
  getWaitlist: (organType) => api.get(`/patients/waitlist/${organType}`),
};

// Organ API
export const organAPI = {
  getAll: (params) => api.get('/organs', { params }),
  getById: (organId) => api.get(`/organs/${organId}`),
  register: (organData) => api.post('/organs', organData),
  getAvailable: (organType) => api.get(`/organs/available/${organType}`),
  findMatch: (organId) => api.post(`/organs/${organId}/find-match`),
  allocate: (organId, patientId) =>
    api.post('/organs/allocate', { organId, patientId }),
  accept: (organId) => api.post(`/organs/${organId}/accept`),
  reject: (organId, reason) =>
    api.post(`/organs/${organId}/reject`, { reason }),
  complete: (organId) => api.post(`/organs/${organId}/complete`),
};

// Mirror Node API (FREE - No gas fees!)
// All these endpoints query blockchain data without paying gas
export const mirrorAPI = {
  // Health check
  health: () => api.get('/mirror/health'),

  // Patient queries (FREE)
  getWaitlist: (organType) => api.get(`/mirror/patients/waitlist/${organType}`),
  getPatientPosition: (patientHash, organType) =>
    api.get(`/mirror/patients/position/${patientHash}`, {
      params: { organType },
    }),
  getAllPatients: () => api.get('/mirror/patients/all'),

  // Organ queries (FREE)
  getAllOrgans: () => api.get('/mirror/organs/all'),

  // Statistics (FREE)
  getStats: () => api.get('/mirror/stats'),

  // Contract & transaction info (FREE)
  getContract: (contractId) => api.get(`/mirror/contract/${contractId}`),
  getTransaction: (transactionId) =>
    api.get(`/mirror/transaction/${transactionId}`),

  // Cache management
  invalidateCache: (pattern) =>
    api.post('/mirror/cache/invalidate', { pattern }),
};

export default api;
