import React, { useState, useEffect } from 'react';
import mirrorAPI from '../services/mirrorApi';
import ProposalDetail from './ProposalDetail';
import '../styles/daoproposals.css';

function DaoProposals() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [selectedProposal, setSelectedProposal] = useState(null);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const filters = filter !== 'ALL' ? { status: filter } : {};
      const response = await mirrorAPI.getProposals(filters);
      setProposals(response.data.proposals || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setError('Unable to load proposals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchProposals, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE':
        return '🗳️';
      case 'APPROVED':
        return '✅';
      case 'REJECTED':
        return '❌';
      case 'EXECUTED':
        return '⚡';
      case 'EXPIRED':
        return '⏰';
      default:
        return '📋';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'URGENCY_UPDATE':
        return 'Urgency Update';
      case 'PATIENT_REMOVAL':
        return 'Patient Removal';
      case 'SYSTEM_PARAMETER':
        return 'System Parameter';
      case 'EMERGENCY_OVERRIDE':
        return 'Emergency Override';
      default:
        return type;
    }
  };

  const getUrgencyBadge = (urgency) => {
    return urgency === 'EMERGENCY' ? '🚨 Emergency' : '📋 Standard';
  };

  const formatTimeRemaining = (milliseconds) => {
    if (milliseconds <= 0) return 'Voting closed';

    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h remaining`;

    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}m remaining`;
  };

  const handleViewDetails = (proposal) => {
    setSelectedProposal(proposal);
  };

  const handleCloseModal = () => {
    setSelectedProposal(null);
  };

  if (loading && proposals.length === 0) {
    return (
      <div className="dao-proposals">
        <div className="dao-proposals-header">
          <h2>Governance Proposals</h2>
          <p className="dao-proposals-subtitle">Loading proposals...</p>
        </div>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dao-proposals">
        <div className="dao-proposals-header">
          <h2>Governance Proposals</h2>
        </div>
        <div className="dao-error">
          <p>{error}</p>
          <button onClick={fetchProposals} className="btn-retry">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dao-proposals">
      <div className="dao-proposals-header">
        <div>
          <h2>Governance Proposals</h2>
          <p className="dao-proposals-subtitle">
            All proposals are publicly visible • View voting details • Complete transparency
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="proposal-filters">
        {['ALL', 'ACTIVE', 'APPROVED', 'REJECTED', 'EXECUTED'].map((status) => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status === 'ALL' ? '📋 All' : `${getStatusIcon(status)} ${status}`}
          </button>
        ))}
      </div>

      {/* Proposals Grid */}
      {proposals.length === 0 ? (
        <div className="empty-proposals">
          <div className="empty-icon">📋</div>
          <h3>No proposals found</h3>
          <p>There are no {filter.toLowerCase()} proposals at the moment</p>
        </div>
      ) : (
        <div className="proposals-grid">
          {proposals.map((proposal, index) => (
            <div
              key={proposal._id || proposal.proposalId}
              className={`proposal-card ${proposal.status.toLowerCase()}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Card Header */}
              <div className="proposal-card-header">
                <div className="proposal-id">
                  <span className="proposal-number">#{proposal.proposalId}</span>
                  <span className={`proposal-type-badge ${proposal.proposalType.toLowerCase()}`}>
                    {getTypeLabel(proposal.proposalType)}
                  </span>
                </div>
                <span className={`status-badge ${proposal.status.toLowerCase()}`}>
                  {getStatusIcon(proposal.status)} {proposal.status}
                </span>
              </div>

              {/* Urgency Badge */}
              <div className={`urgency-badge ${proposal.urgencyLevel.toLowerCase()}`}>
                {getUrgencyBadge(proposal.urgencyLevel)}
              </div>

              {/* Patient Info (if applicable) */}
              {proposal.patientHash && (
                <div className="proposal-patient">
                  <strong>Patient:</strong> {proposal.patientHash.substring(0, 20)}...
                </div>
              )}

              {/* Reasoning Preview */}
              <div className="proposal-reasoning">
                <p>{proposal.reasoning?.substring(0, 120)}...</p>
              </div>

              {/* Vote Progress Bar */}
              <div className="vote-progress-container">
                <div className="vote-progress-labels">
                  <span className="vote-label for">👍 {proposal.votesFor || 0}</span>
                  <span className="vote-label against">👎 {proposal.votesAgainst || 0}</span>
                  <span className="vote-label abstain">🤷 {proposal.votesAbstain || 0}</span>
                </div>
                <div className="vote-progress-bar">
                  <div
                    className="progress-segment for"
                    style={{
                      width: `${((proposal.votesFor || 0) / (proposal.totalVotingPower || 1)) * 100}%`,
                    }}
                  ></div>
                  <div
                    className="progress-segment against"
                    style={{
                      width: `${((proposal.votesAgainst || 0) / (proposal.totalVotingPower || 1)) * 100}%`,
                    }}
                  ></div>
                  <div
                    className="progress-segment abstain"
                    style={{
                      width: `${((proposal.votesAbstain || 0) / (proposal.totalVotingPower || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="proposal-stats">
                <div className="stat-item">
                  <span className="stat-icon">📊</span>
                  <span className="stat-value">{proposal.participationRate || 0}%</span>
                  <span className="stat-label">Participation</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">✓</span>
                  <span className="stat-value">{proposal.approvalRate || 0}%</span>
                  <span className="stat-label">Approval</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">🗳️</span>
                  <span className="stat-value">{proposal.voteCount || 0}</span>
                  <span className="stat-label">Votes</span>
                </div>
              </div>

              {/* Time Remaining / Deadline */}
              {proposal.isVotingOpen ? (
                <div className="proposal-deadline active">
                  <span className="deadline-icon">⏰</span>
                  <span className="deadline-text">{formatTimeRemaining(proposal.timeRemaining)}</span>
                </div>
              ) : (
                <div className="proposal-deadline closed">
                  <span className="deadline-icon">📅</span>
                  <span className="deadline-text">
                    Ended: {new Date(proposal.votingDeadline).toLocaleDateString()}
                  </span>
                </div>
              )}

              {/* Creator Info */}
              <div className="proposal-creator">
                <span className="creator-label">Created by:</span>
                <span className="creator-name">{proposal.creatorName}</span>
              </div>

              {/* View Details Button */}
              <button
                className="btn-view-details"
                onClick={() => handleViewDetails(proposal)}
              >
                View Full Details & Votes
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Proposal Detail Modal */}
      {selectedProposal && (
        <ProposalDetail
          proposal={selectedProposal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default DaoProposals;
