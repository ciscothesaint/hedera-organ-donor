import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Create axios instance with auth token
const createAuthenticatedClient = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Notification API Service
 * Handles all notification-related API calls for the public frontend
 */
const notificationAPI = {
  /**
   * Get all notifications for the current user
   * @param {Object} filters - Optional filters (type, priority, isRead)
   * @returns {Promise<Array>} List of notifications
   */
  getNotifications: async (filters = {}) => {
    try {
      const client = createAuthenticatedClient();
      const params = new URLSearchParams();

      if (filters.type) params.append('type', filters.type);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.isRead !== undefined) params.append('isRead', filters.isRead);

      const response = await client.get(`/api/notifications?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get notifications for a specific patient
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} List of patient notifications
   */
  getPatientNotifications: async (patientId) => {
    try {
      const client = createAuthenticatedClient();
      const response = await client.get(`/api/notifications/patient/${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch patient notifications:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Updated notification
   */
  markAsRead: async (notificationId) => {
    try {
      const client = createAuthenticatedClient();
      const response = await client.post(`/api/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Mark multiple notifications as read
   * @param {Array<string>} notificationIds - Array of notification IDs
   * @returns {Promise<Object>} Result with count of updated notifications
   */
  markMultipleAsRead: async (notificationIds) => {
    try {
      const client = createAuthenticatedClient();
      const response = await client.post('/api/notifications/read-multiple', {
        notificationIds
      });
      return response.data;
    } catch (error) {
      console.error('Failed to mark multiple notifications as read:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get count of unread notifications
   * @returns {Promise<number>} Count of unread notifications
   */
  getUnreadCount: async () => {
    try {
      const client = createAuthenticatedClient();
      const response = await client.get('/api/notifications/unread/count');
      return response.data.count;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get notification icon based on type
   * @param {string} type - Notification type
   * @returns {string} Icon name or emoji
   */
  getNotificationIcon: (type) => {
    const icons = {
      URGENCY_CHANGED: '⚠️',
      PATIENT_REMOVED: '🚫',
      PROPOSAL_EXECUTED: '✅',
      SYSTEM_ALERT: '🔔',
      WAITLIST_UPDATE: '📋'
    };
    return icons[type] || '📢';
  },

  /**
   * Get notification color based on priority
   * @param {string} priority - Notification priority
   * @returns {string} Color class
   */
  getNotificationColor: (priority) => {
    const colors = {
      URGENT: 'red',
      HIGH: 'orange',
      NORMAL: 'blue',
      LOW: 'gray'
    };
    return colors[priority] || 'blue';
  }
};

export default notificationAPI;
