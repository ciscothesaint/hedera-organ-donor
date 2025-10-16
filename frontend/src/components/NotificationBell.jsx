import React, { useState, useEffect, useRef } from 'react';
import notificationAPI from '../services/notificationAPI';
import './NotificationBell.css';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch unread count on mount and set up polling
  useEffect(() => {
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationAPI.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationAPI.getNotifications({ limit: 20 });
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await notificationAPI.markAsRead(notification._id);

        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );

        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications
      .filter(n => !n.isRead)
      .map(n => n._id);

    if (unreadIds.length === 0) return;

    try {
      await notificationAPI.markMultipleAsRead(unreadIds);

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getNotificationIcon = (type, priority) => {
    if (priority === 'URGENT') return '🚨';

    const icons = {
      URGENCY_CHANGED: '⚠️',
      PATIENT_REMOVED: '🚫',
      PROPOSAL_EXECUTED: '✅',
      SYSTEM_ALERT: '🔔',
      WAITLIST_UPDATE: '📋'
    };

    return icons[type] || '📢';
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className="notification-bell-button"
        onClick={handleToggle}
        aria-label="Notifications"
      >
        <svg
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="bell-icon"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-dropdown-body">
            {loading ? (
              <div className="notification-loading">
                <div className="spinner"></div>
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p>No notifications</p>
                <span>You're all caught up!</span>
              </div>
            ) : (
              <div className="notification-list">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`notification-item ${!notification.isRead ? 'unread' : ''} priority-${notification.priority.toLowerCase()}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type, notification.priority)}
                    </div>
                    <div className="notification-content">
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      {notification.relatedProposalId && (
                        <span className="notification-proposal-id">
                          Proposal #{notification.relatedProposalId}
                        </span>
                      )}
                      <span className="notification-time">
                        {getTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                    {!notification.isRead && (
                      <div className="unread-indicator"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
