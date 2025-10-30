import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MatchesList.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function MatchesList() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        fetchMatches();
    }, [filter]);

    const fetchMatches = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = filter !== 'ALL' ? { status: filter } : {};
            const response = await axios.get(`${API_URL}/mirror/matches`, { params });

            setMatches(response.data.matches || []);
        } catch (err) {
            console.error('Error fetching matches:', err);
            setError('Failed to fetch matches. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            PENDING: '#fbbf24',
            ACCEPTED: '#3b82f6',
            COMPLETED: '#10b981',
            REJECTED: '#ef4444',
        };
        return colors[status] || '#6b7280';
    };

    const getUrgencyLabel = (level) => {
        const labels = {
            1: 'Low',
            2: 'Routine',
            3: 'Moderate',
            4: 'High',
            5: 'Critical',
        };
        return labels[level] || 'Unknown';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="public-matches-container">
            <div className="public-matches-header">
                <h1>🤝 Successful Organ Matches</h1>
                <p className="transparency-note">
                    Complete transparency: All organ matches are publicly visible to ensure fairness and accountability.
                    Patient identities are anonymized to protect privacy.
                </p>
            </div>

            <div className="matches-filters">
                <button
                    className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setFilter('ALL')}
                >
                    All Matches
                </button>
                <button
                    className={`filter-btn ${filter === 'PENDING' ? 'active' : ''}`}
                    onClick={() => setFilter('PENDING')}
                >
                    Pending
                </button>
                <button
                    className={`filter-btn ${filter === 'ACCEPTED' ? 'active' : ''}`}
                    onClick={() => setFilter('ACCEPTED')}
                >
                    Accepted
                </button>
                <button
                    className={`filter-btn ${filter === 'COMPLETED' ? 'active' : ''}`}
                    onClick={() => setFilter('COMPLETED')}
                >
                    Completed
                </button>
            </div>

            {loading && (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading matches...</p>
                </div>
            )}

            {error && (
                <div className="error-state">
                    <p>❌ {error}</p>
                </div>
            )}

            {!loading && !error && matches.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>No Matches Found</h3>
                    <p>Matches will appear here when organs are successfully matched to patients.</p>
                </div>
            )}

            {!loading && !error && matches.length > 0 && (
                <div className="matches-grid">
                    {matches.map((match) => (
                        <div key={match.matchId} className="match-card">
                            <div className="match-card-header">
                                <div className="match-id">
                                    <span className="label">Match ID:</span>
                                    <span className="value">{match.matchId}</span>
                                </div>
                                <span
                                    className="status-badge"
                                    style={{ backgroundColor: getStatusColor(match.status) }}
                                >
                                    {match.status}
                                </span>
                            </div>

                            <div className="match-date">
                                <span className="date-label">📅 Matched on:</span>
                                <span className="date-value">{formatDate(match.matchDate)}</span>
                            </div>

                            <div className="match-details">
                                <div className="detail-section patient-section">
                                    <h3>👤 Patient (Anonymized)</h3>
                                    {match.patient ? (
                                        <div className="detail-grid">
                                            <div className="detail-row">
                                                <span className="detail-label">Initials:</span>
                                                <span className="detail-value">{match.patient.initials}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Age:</span>
                                                <span className="detail-value">{match.patient.age} years</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Blood Type:</span>
                                                <span className="blood-badge">{match.patient.bloodType}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Organ Needed:</span>
                                                <span className="detail-value">{match.patient.organType}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Urgency:</span>
                                                <span className="urgency-badge" data-level={match.patient.urgencyLevel}>
                                                    {getUrgencyLabel(match.patient.urgencyLevel)}
                                                </span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Location:</span>
                                                <span className="detail-value">{match.patient.city || 'N/A'}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="no-data">Patient data not available</p>
                                    )}
                                </div>

                                <div className="detail-section organ-section">
                                    <h3>🫀 Organ Details</h3>
                                    {match.organ ? (
                                        <div className="detail-grid">
                                            <div className="detail-row">
                                                <span className="detail-label">Organ ID:</span>
                                                <span className="detail-value">{match.organ.organId}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Type:</span>
                                                <span className="detail-value">{match.organ.organType}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Blood Type:</span>
                                                <span className="blood-badge">{match.organ.bloodType}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Donor Location:</span>
                                                <span className="detail-value">{match.organ.donorCity || 'N/A'}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Harvest Time:</span>
                                                <span className="detail-value">{formatDate(match.organ.harvestTime)}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="no-data">Organ data not available</p>
                                    )}
                                </div>
                            </div>

                            <div className="match-score-section">
                                <h4>📊 Match Score Details</h4>
                                <div className="score-grid">
                                    <div className="score-item">
                                        <span className="score-label">Urgency Points:</span>
                                        <span className="score-value">{match.matchScore?.urgencyLevel * 1000 || 0}</span>
                                    </div>
                                    <div className="score-item">
                                        <span className="score-label">Days Waiting:</span>
                                        <span className="score-value">{match.matchScore?.daysWaiting || 0}</span>
                                    </div>
                                    <div className="score-item">
                                        <span className="score-label">Blood Compatible:</span>
                                        <span className="score-value">
                                            {match.matchScore?.bloodCompatibility ? '✅ Yes' : '❌ No'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="info-banner">
                <p>
                    <strong>💡 About This System:</strong> Our automated matching algorithm prioritizes patients based on medical urgency,
                    blood compatibility, and time spent waiting. All matches are recorded on the Hedera blockchain for permanent transparency.
                </p>
            </div>
        </div>
    );
}

export default MatchesList;
