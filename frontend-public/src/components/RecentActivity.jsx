import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import mirrorAPI from '../services/mirrorApi';

function RecentActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const hashScanUrl = import.meta.env.VITE_HASHSCAN_URL || 'https://hashscan.io/testnet';

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent patients and organs
      const [patientsRes, organsRes] = await Promise.all([
        mirrorAPI.getAllPatients(),
        mirrorAPI.getAllOrgans(),
      ]);

      // Backend returns { patients: [...], count: ... } and { organs: [...], count: ... }
      const patients = patientsRes.data.data?.patients || [];
      const organs = organsRes.data.data?.organs || [];

      const combined = [
        ...patients.map((p) => ({
          type: 'patient',
          message: `Patient registered for ${p.organType} waitlist`,
          timestamp: p.consensusTimestamp || p.registeredAt,
          txId: p.transactionId,
          hash: p.patientId,
        })),
        ...organs.map((o) => ({
          type: 'organ',
          message: `${o.organType} organ registered`,
          timestamp: o.consensusTimestamp || o.registeredAt,
          txId: o.transactionId,
          hash: o.organId,
        })),
      ];

      // Sort by timestamp and take last 10
      const sorted = combined
        .filter((a) => a.timestamp)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);

      setActivities(sorted);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'patient':
        return '👤';
      case 'organ':
        return '🫀';
      case 'match':
        return '🎉';
      case 'proposal':
        return '🗳️';
      default:
        return '📝';
    }
  };

  if (loading) {
    return (
      <div className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-loading">
          <div className="loading-spinner"></div>
          <p>Loading blockchain activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recent-activity">
      <div className="activity-header">
        <h2>Recent Blockchain Activity</h2>
        <p>Live feed of registrations and matches</p>
      </div>

      {activities.length === 0 ? (
        <div className="activity-empty">
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="activity-feed">
          {activities.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-icon">{getActivityIcon(activity.type)}</div>
              <div className="activity-content">
                <p className="activity-message">{activity.message}</p>
                <div className="activity-meta">
                  <span className="activity-time">
                    {activity.timestamp
                      ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })
                      : 'Recently'}
                  </span>
                  {activity.txId && (
                    <>
                      <span className="activity-separator">•</span>
                      <a
                        href={`${hashScanUrl}/transaction/${activity.txId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="activity-link"
                      >
                        View transaction ↗
                      </a>
                    </>
                  )}
                </div>
              </div>
              <div className="activity-badge">On-Chain</div>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-outline" onClick={fetchRecentActivity}>
        🔄 Refresh Activity
      </button>
    </div>
  );
}

export default RecentActivity;
