import React, { useState, useEffect } from 'react';
import notificationAPI from '../services/notificationAPI';
import { format } from 'date-fns';
import './PatientUrgencyHistoryModal.css';

function PatientUrgencyHistoryModal({ patient, isOpen, onClose }) {
  const [urgencyHistory, setUrgencyHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && patient) {
      fetchPatientHistory();
      fetchPatientNotifications();
    }
  }, [isOpen, patient]);

  const fetchPatientHistory = () => {
    // Get urgency history from patient object
    const history = patient.medicalInfo?.urgencyHistory || [];
    setUrgencyHistory(history);
  };

  const fetchPatientNotifications = async () => {
    if (!patient.patientId) return;

    setLoading(true);
    try {
      const data = await notificationAPI.getPatientNotifications(patient.patientId);
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch patient notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getUrgencyBadgeClass = (level) => {
    if (level >= 4) return 'urgency-critical';
    if (level >= 3) return 'urgency-high';
    if (level >= 2) return 'urgency-medium';
    return 'urgency-low';
  };

  const getUrgencyLabel = (level) => {
    if (level >= 4) return 'Critical';
    if (level >= 3) return 'High';
    if (level >= 2) return 'Medium';
    return 'Standard';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Patient Urgency History</h2>
          <button className="modal-close" onClick={onClose}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Patient Info */}
          <div className="patient-info-card">
            <div className="patient-avatar">
              {patient.personalInfo?.firstName?.[0]}{patient.personalInfo?.lastName?.[0]}
            </div>
            <div className="patient-details">
              <h3>
                {patient.personalInfo?.firstName} {patient.personalInfo?.lastName}
              </h3>
              <p className="patient-id">Patient ID: {patient.patientId}</p>
              <div className="patient-meta">
                <span className="meta-item">
                  <strong>Organ:</strong> {patient.medicalInfo?.organType}
                </span>
                <span className="meta-item">
                  <strong>Blood:</strong> {patient.medicalInfo?.bloodType}
                </span>
                <span className="meta-item">
                  <strong>Current Urgency:</strong>
                  <span className={`urgency-badge ${getUrgencyBadgeClass(patient.medicalInfo?.urgencyLevel)}`}>
                    Level {patient.medicalInfo?.urgencyLevel} - {getUrgencyLabel(patient.medicalInfo?.urgencyLevel)}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Urgency History Timeline */}
          <div className="history-section">
            <h3 className="section-title">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Urgency Level Changes
            </h3>

            {urgencyHistory.length === 0 ? (
              <div className="empty-state">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No urgency changes recorded</p>
                <span>Patient urgency has not been modified since registration</span>
              </div>
            ) : (
              <div className="history-timeline">
                {urgencyHistory.map((entry, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-marker">
                      <div className="marker-dot"></div>
                      {index < urgencyHistory.length - 1 && <div className="marker-line"></div>}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <div className="urgency-change">
                          <span className={`urgency-badge ${getUrgencyBadgeClass(entry.oldValue)}`}>
                            Level {entry.oldValue}
                          </span>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="arrow-icon">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <span className={`urgency-badge ${getUrgencyBadgeClass(entry.newValue)}`}>
                            Level {entry.newValue}
                          </span>
                        </div>
                        <span className="timeline-date">
                          {format(new Date(entry.timestamp), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      <div className="timeline-details">
                        <p className="changed-by">
                          <strong>Changed by:</strong> {entry.changedByName || entry.changedBy}
                        </p>
                        {entry.reason && (
                          <p className="change-reason">
                            <strong>Reason:</strong> {entry.reason}
                          </p>
                        )}
                        {entry.proposalId && (
                          <p className="proposal-link">
                            <strong>Proposal:</strong> #{entry.proposalId}
                          </p>
                        )}
                        {entry.blockchainTxId && (
                          <a
                            href={`https://hashscan.io/testnet/transaction/${entry.blockchainTxId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="blockchain-link"
                          >
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View on Blockchain
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Related Notifications */}
          <div className="history-section">
            <h3 className="section-title">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Related Notifications
            </h3>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="empty-state">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p>No notifications found</p>
              </div>
            ) : (
              <div className="notification-list">
                {notifications.map((notification) => (
                  <div key={notification._id} className={`notification-item priority-${notification.priority.toLowerCase()}`}>
                    <div className="notification-icon">
                      {notification.type === 'URGENCY_CHANGED' ? '⚠️' : '📢'}
                    </div>
                    <div className="notification-content">
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      {notification.relatedProposalId && (
                        <span className="proposal-badge">
                          Proposal #{notification.relatedProposalId}
                        </span>
                      )}
                      <span className="notification-date">
                        {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PatientUrgencyHistoryModal;
