import React, { useState, useEffect } from 'react';
import mirrorAPI from '../services/mirrorApi';
import '../styles/daoproposals.css';

function ProposalDetail({ proposal, onClose }) {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const hashScanUrl = import.meta.env.VITE_HASHSCAN_URL || 'https://hashscan.io/testnet';

  useEffect(() => {
    const fetchVotes = async () => {
      try {
        const response = await mirrorAPI.getProposalVotes(proposal.proposalId);
        setVotes(response.data.votes || []);
      } catch (error) {
        console.error('Error fetching votes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVotes();
  }, [proposal.proposalId]);

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

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeRemaining = (milliseconds) => {
    if (milliseconds <= 0) return 'Voting closed';

    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content proposal-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-section">
            <h2>Proposal #{proposal.proposalId}</h2>
            <span className={`status-badge large ${proposal.status.toLowerCase()}`}>
              {proposal.status}
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Proposal Info Section */}
          <div className="detail-section">
            <h3>Proposal Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Type:</span>
                <span className="info-value">{proposal.proposalType.replace(/_/g, ' ')}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Urgency:</span>
                <span className={`urgency-badge ${proposal.urgencyLevel.toLowerCase()}`}>
                  {proposal.urgencyLevel === 'EMERGENCY' ? '🚨 Emergency' : '📋 Standard'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Created by:</span>
                <span className="info-value">{proposal.creatorName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Created:</span>
                <span className="info-value">{formatDate(proposal.createdAt)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Voting Deadline:</span>
                <span className="info-value">{formatDate(proposal.votingDeadline)}</span>
              </div>
              {proposal.isVotingOpen && (
                <div className="info-item">
                  <span className="info-label">Time Remaining:</span>
                  <span className="info-value highlight">
                    ⏰ {formatTimeRemaining(proposal.timeRemaining)}
                  </span>
                </div>
              )}
            </div>

            {/* Patient Information */}
            {proposal.patientHash && (
              <div className="patient-info-box">
                <strong>Patient:</strong> {proposal.patientHash}
              </div>
            )}

            {/* Values (if applicable) */}
            {proposal.currentValue !== undefined && proposal.proposedValue !== undefined && (
              <div className="values-comparison">
                <div className="value-box current">
                  <span className="value-label">Current Value</span>
                  <span className="value-number">{proposal.currentValue}</span>
                </div>
                <span className="arrow">→</span>
                <div className="value-box proposed">
                  <span className="value-label">Proposed Value</span>
                  <span className="value-number">{proposal.proposedValue}</span>
                </div>
              </div>
            )}
          </div>

          {/* Reasoning Section */}
          <div className="detail-section">
            <h3>Proposal Reasoning</h3>
            <div className="reasoning-box">
              <p>{proposal.reasoning}</p>
            </div>
            {proposal.evidenceHash && (
              <div className="evidence-box">
                <strong>Evidence Hash:</strong> {proposal.evidenceHash}
              </div>
            )}
          </div>

          {/* Vote Summary Section */}
          <div className="detail-section">
            <h3>Voting Results</h3>
            <div className="vote-summary">
              <div className="vote-summary-card for">
                <div className="vote-icon">✅</div>
                <div className="vote-number">{proposal.votesFor || 0}</div>
                <div className="vote-label">For</div>
              </div>
              <div className="vote-summary-card against">
                <div className="vote-icon">❌</div>
                <div className="vote-number">{proposal.votesAgainst || 0}</div>
                <div className="vote-label">Against</div>
              </div>
              <div className="vote-summary-card abstain">
                <div className="vote-icon">🤷</div>
                <div className="vote-number">{proposal.votesAbstain || 0}</div>
                <div className="vote-label">Abstain</div>
              </div>
            </div>

            <div className="vote-metrics">
              <div className="metric-bar">
                <span className="metric-label">Participation Rate:</span>
                <div className="metric-progress">
                  <div
                    className="metric-fill participation"
                    style={{ width: `${proposal.participationRate || 0}%` }}
                  ></div>
                </div>
                <span className="metric-value">{proposal.participationRate || 0}%</span>
              </div>
              <div className="metric-bar">
                <span className="metric-label">Approval Rate:</span>
                <div className="metric-progress">
                  <div
                    className="metric-fill approval"
                    style={{ width: `${proposal.approvalRate || 0}%` }}
                  ></div>
                </div>
                <span className="metric-value">{proposal.approvalRate || 0}%</span>
              </div>
              <div className="quorum-info">
                <span>Quorum Required: {proposal.quorumRequired}%</span>
                <span>Approval Threshold: {proposal.approvalThreshold}%</span>
              </div>
            </div>
          </div>

          {/* Individual Votes Section */}
          <div className="detail-section votes-section">
            <h3>All Votes ({votes.length}) - Complete Transparency</h3>
            {loading ? (
              <div className="loading-spinner"></div>
            ) : votes.length === 0 ? (
              <p className="no-votes">No votes cast yet</p>
            ) : (
              <div className="votes-list">
                {votes.map((vote, index) => (
                  <div
                    key={vote._id || index}
                    className={`vote-item ${vote.voteChoice.toLowerCase()}`}
                  >
                    <div className="vote-header">
                      <div className="voter-info">
                        <span className="vote-icon-large">{getVoteIcon(vote.voteChoice)}</span>
                        <div className="voter-details">
                          <span className="voter-name">{vote.voterName}</span>
                          <span className="vote-time">{formatDate(vote.timestamp)}</span>
                        </div>
                      </div>
                      <div className="vote-power">
                        <span className="power-label">Voting Power:</span>
                        <span className="power-value">{vote.votingPower}</span>
                      </div>
                    </div>
                    <div className="vote-reasoning">
                      <strong>Reasoning:</strong>
                      <p>{vote.reasoning}</p>
                    </div>
                    {vote.transactionId && (
                      <div className="vote-blockchain">
                        <a
                          href={`${hashScanUrl}/transaction/${vote.transactionId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="blockchain-link"
                        >
                          🔗 View on HashScan
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Blockchain Verification Section */}
          <div className="detail-section blockchain-section">
            <h3>Blockchain Verification</h3>
            <div className="blockchain-info">
              <div className="blockchain-item">
                <span className="blockchain-label">Proposal Creation TX:</span>
                <a
                  href={`${hashScanUrl}/transaction/${proposal.blockchainTxId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="blockchain-link"
                >
                  {proposal.blockchainTxId} ↗
                </a>
              </div>
              {proposal.executionTxId && (
                <div className="blockchain-item">
                  <span className="blockchain-label">Execution TX:</span>
                  <a
                    href={`${hashScanUrl}/transaction/${proposal.executionTxId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="blockchain-link"
                  >
                    {proposal.executionTxId} ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn-close-modal" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProposalDetail;
