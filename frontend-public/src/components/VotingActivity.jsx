import React, { useState, useEffect } from 'react';
import mirrorAPI from '../services/mirrorApi';
import '../styles/daoproposals.css';

function VotingActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCount, setShowCount] = useState(10);

  const fetchActivities = async () => {
    try {
      // Get recent proposals with votes
      const response = await mirrorAPI.getProposals({ limit: 20 });
      const proposals = response.data.proposals || [];

      // Extract all votes from all proposals and sort by timestamp
      const allVotes = [];
      proposals.forEach((proposal) => {
        if (proposal.votes && proposal.votes.length > 0) {
          proposal.votes.forEach((vote) => {
            allVotes.push({
              ...vote,
              proposalId: proposal.proposalId,
              proposalType: proposal.proposalType,
              proposalStatus: proposal.status,
            });
          });
        }
      });

      // Sort by timestamp (most recent first)
      allVotes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setActivities(allVotes);
    } catch (error) {
      console.error('Error fetching voting activity:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const getVoteIcon = (choice) => {
    switch (choice) {
      case 'APPROVE':
        return '✅';
      case 'REJECT':
        return '❌';
      case 'ABSTAIN':
        return '🤷';
      default:
        return '🗳️';
    }
  };

  const getVoteText = (choice) => {
    switch (choice) {
      case 'APPROVE':
        return 'voted to approve';
      case 'REJECT':
        return 'voted to reject';
      case 'ABSTAIN':
        return 'abstained from';
      default:
        return 'voted on';
    }
  };

  const getRelativeTime = (timestamp) => {
    const now = Date.now();
    const diff = now - new Date(timestamp);

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const handleLoadMore = () => {
    setShowCount((prev) => prev + 10);
  };

  if (loading) {
    return (
      <div className="voting-activity">
        <div className="activity-header">
          <h2>Recent Voting Activity</h2>
          <p className="activity-subtitle">Loading recent votes...</p>
        </div>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="voting-activity">
      <div className="activity-header">
        <h2>Recent Voting Activity</h2>
        <p className="activity-subtitle">
          Live feed of all votes cast • Complete transparency of decision-making
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="empty-activity">
          <div className="empty-icon">🗳️</div>
          <h3>No voting activity yet</h3>
          <p>Votes will appear here as they are cast</p>
        </div>
      ) : (
        <>
          <div className="activity-feed">
            {activities.slice(0, showCount).map((activity, index) => (
              <div
                key={`${activity.proposalId}-${activity.voterAddress}-${index}`}
                className={`activity-item ${activity.voteChoice.toLowerCase()}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="activity-icon">
                  {getVoteIcon(activity.voteChoice)}
                </div>
                <div className="activity-content">
                  <div className="activity-message">
                    <strong>{activity.voterName}</strong> {getVoteText(activity.voteChoice)}{' '}
                    <span className="proposal-link">Proposal #{activity.proposalId}</span>
                  </div>
                  <div className="activity-meta">
                    <span className="activity-time">{getRelativeTime(activity.timestamp)}</span>
                    <span className="activity-separator">•</span>
                    <span className="activity-power">
                      Voting Power: {activity.votingPower}
                    </span>
                    <span className="activity-separator">•</span>
                    <span className={`activity-status ${activity.proposalStatus.toLowerCase()}`}>
                      {activity.proposalStatus}
                    </span>
                  </div>
                  {activity.reasoning && (
                    <div className="activity-reasoning">
                      <em>"{activity.reasoning.substring(0, 100)}{activity.reasoning.length > 100 ? '...' : ''}"</em>
                    </div>
                  )}
                </div>
                <div className={`activity-badge ${activity.voteChoice.toLowerCase()}`}>
                  {activity.voteChoice}
                </div>
              </div>
            ))}
          </div>

          {showCount < activities.length && (
            <div className="activity-load-more">
              <button className="btn-load-more" onClick={handleLoadMore}>
                Load More ({activities.length - showCount} remaining)
              </button>
            </div>
          )}

          {showCount >= activities.length && activities.length >= 10 && (
            <div className="activity-end">
              <p>✓ All voting activity loaded ({activities.length} votes)</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default VotingActivity;
