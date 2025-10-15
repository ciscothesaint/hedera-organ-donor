import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDaoAuthStore } from '../services/daoAuthStore';
import { daoProposalAPI, daoRoleAPI } from '../services/daoApi';
import './DaoDashboard.css';

function DaoDashboard() {
  const { doctor } = useDaoAuthStore();
  const [activeProposals, setActiveProposals] = useState([]);
  const [emergencyProposals, setEmergencyProposals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch active proposals
      const activeRes = await daoProposalAPI.getActive();
      setActiveProposals(activeRes.data.proposals || []);

      // Fetch emergency proposals
      const emergencyRes = await daoProposalAPI.getEmergency();
      setEmergencyProposals(emergencyRes.data.proposals || []);

      // Fetch DAO stats
      const statsRes = await daoRoleAPI.getStats();
      setStats(statsRes.data);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (deadline) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dao-dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {doctor?.profile?.firstName || doctor?.username}!</h1>
        <p className="subtitle">DAO Governance Dashboard</p>
      </div>

      {/* Authorization Status */}
      {!doctor?.daoProfile?.isAuthorizedVoter && (
        <div className="alert alert-warning">
          <strong>⚠️ Pending Authorization</strong>
          <p>Your account is awaiting approval from an administrator. You will be able to vote and create proposals once authorized.</p>
        </div>
      )}


      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🗳️</div>
          <div className="stat-info">
            <h3>{activeProposals.length}</h3>
            <p>Active Proposals</p>
          </div>
        </div>

        <div className="stat-card emergency">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <h3>{emergencyProposals.length}</h3>
            <p>Emergency Proposals</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats?.members?.authorizedDoctors || 0}</h3>
            <p>Authorized Voters</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚖️</div>
          <div className="stat-info">
            <h3>{doctor?.daoProfile?.votingPower || 0}</h3>
            <p>My Voting Power</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <h3>{doctor?.daoProfile?.totalProposalsCreated || 0}</h3>
            <p>Proposals Created</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{doctor?.daoProfile?.totalVotesCast || 0}</h3>
            <p>Votes Cast</p>
          </div>
        </div>
      </div>

      {/* Emergency Proposals */}
      {emergencyProposals.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>⚠️ Emergency Proposals</h2>
            <Link to="/proposals?urgency=EMERGENCY" className="view-all">
              View All →
            </Link>
          </div>
          <div className="proposals-list">
            {emergencyProposals.slice(0, 3).map((proposal) => (
              <div key={proposal.proposalId} className="proposal-card emergency">
                <div className="proposal-header">
                  <div>
                    <span className="badge badge-danger">EMERGENCY</span>
                    <span className="badge badge-info">
                      {proposal.proposalType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="proposal-id">#{proposal.proposalId}</span>
                </div>
                <div className="proposal-body">
                  <p className="proposal-reason">{proposal.reasoning.substring(0, 150)}...</p>
                  <div className="proposal-meta">
                    <span>🕐 {getTimeRemaining(proposal.votingDeadline)}</span>
                    <span>
                      📊 {proposal.votes?.length || 0} / {stats?.members?.authorizedDoctors || 0} votes
                    </span>
                  </div>
                </div>
                <div className="proposal-footer">
                  <Link to={`/proposals/${proposal.proposalId}`} className="btn btn-primary btn-sm">
                    View & Vote
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Proposals */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>📋 Active Proposals</h2>
          <Link to="/proposals" className="view-all">
            View All →
          </Link>
        </div>

        {activeProposals.length === 0 ? (
          <div className="empty-state">
            <p>No active proposals at the moment.</p>
            {doctor?.role === 'DAO_DOCTOR' && doctor?.daoProfile?.isAuthorizedVoter && (
              <Link to="/proposals/create" className="btn btn-primary">
                Create Proposal
              </Link>
            )}
          </div>
        ) : (
          <div className="proposals-list">
            {activeProposals.slice(0, 5).map((proposal) => (
              <div key={proposal.proposalId} className="proposal-card">
                <div className="proposal-header">
                  <div>
                    <span className={`badge badge-${proposal.urgencyLevel === 'EMERGENCY' ? 'danger' : 'warning'}`}>
                      {proposal.urgencyLevel}
                    </span>
                    <span className="badge badge-info">
                      {proposal.proposalType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="proposal-id">#{proposal.proposalId}</span>
                </div>
                <div className="proposal-body">
                  <p className="proposal-reason">{proposal.reasoning.substring(0, 150)}...</p>
                  <div className="proposal-meta">
                    <span>👤 {proposal.creatorName}</span>
                    <span>🕐 {getTimeRemaining(proposal.votingDeadline)}</span>
                  </div>
                  <div className="proposal-votes">
                    <div className="vote-stats-header">
                      <span className="vote-stat-item approve">
                        <span className="vote-icon">✓</span>
                        <span className="vote-label">Approve</span>
                        <span className="vote-count">{proposal.votesFor}</span>
                        <span className="vote-percentage">
                          {proposal.totalVotingPower > 0 ? Math.round((proposal.votesFor / proposal.totalVotingPower) * 100) : 0}%
                        </span>
                      </span>
                      <span className="vote-stat-item reject">
                        <span className="vote-icon">✗</span>
                        <span className="vote-label">Reject</span>
                        <span className="vote-count">{proposal.votesAgainst}</span>
                        <span className="vote-percentage">
                          {proposal.totalVotingPower > 0 ? Math.round((proposal.votesAgainst / proposal.totalVotingPower) * 100) : 0}%
                        </span>
                      </span>
                      <span className="vote-stat-item abstain">
                        <span className="vote-icon">○</span>
                        <span className="vote-label">Abstain</span>
                        <span className="vote-count">{proposal.votesAbstain}</span>
                        <span className="vote-percentage">
                          {proposal.totalVotingPower > 0 ? Math.round((proposal.votesAbstain / proposal.totalVotingPower) * 100) : 0}%
                        </span>
                      </span>
                    </div>
                    <div className="vote-bar">
                      <div
                        className="vote-progress approve"
                        style={{
                          width: `${proposal.totalVotingPower > 0 ? (proposal.votesFor / proposal.totalVotingPower) * 100 : 0}%`
                        }}
                        title={`Approve: ${proposal.votesFor} votes (${proposal.totalVotingPower > 0 ? Math.round((proposal.votesFor / proposal.totalVotingPower) * 100) : 0}%)`}
                      >
                        {proposal.totalVotingPower > 0 && (proposal.votesFor / proposal.totalVotingPower) * 100 >= 10 && (
                          <span className="progress-label">{Math.round((proposal.votesFor / proposal.totalVotingPower) * 100)}%</span>
                        )}
                      </div>
                      <div
                        className="vote-progress reject"
                        style={{
                          width: `${proposal.totalVotingPower > 0 ? (proposal.votesAgainst / proposal.totalVotingPower) * 100 : 0}%`
                        }}
                        title={`Reject: ${proposal.votesAgainst} votes (${proposal.totalVotingPower > 0 ? Math.round((proposal.votesAgainst / proposal.totalVotingPower) * 100) : 0}%)`}
                      >
                        {proposal.totalVotingPower > 0 && (proposal.votesAgainst / proposal.totalVotingPower) * 100 >= 10 && (
                          <span className="progress-label">{Math.round((proposal.votesAgainst / proposal.totalVotingPower) * 100)}%</span>
                        )}
                      </div>
                      <div
                        className="vote-progress abstain"
                        style={{
                          width: `${proposal.totalVotingPower > 0 ? (proposal.votesAbstain / proposal.totalVotingPower) * 100 : 0}%`
                        }}
                        title={`Abstain: ${proposal.votesAbstain} votes (${proposal.totalVotingPower > 0 ? Math.round((proposal.votesAbstain / proposal.totalVotingPower) * 100) : 0}%)`}
                      >
                        {proposal.totalVotingPower > 0 && (proposal.votesAbstain / proposal.totalVotingPower) * 100 >= 10 && (
                          <span className="progress-label">{Math.round((proposal.votesAbstain / proposal.totalVotingPower) * 100)}%</span>
                        )}
                      </div>
                    </div>
                    <div className="vote-summary">
                      <span className="total-votes">
                        <strong>{proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain}</strong> / {proposal.totalVotingPower} total votes
                      </span>
                    </div>
                  </div>
                </div>
                <div className="proposal-footer">
                  <Link to={`/proposals/${proposal.proposalId}`} className="btn btn-primary btn-sm">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>⚡ Quick Actions</h2>
        </div>
        <div className="quick-actions">
          {doctor?.role === 'DAO_DOCTOR' && doctor?.daoProfile?.isAuthorizedVoter && (
            <Link to="/proposals/create" className="action-card">
              <div className="action-icon">➕</div>
              <h3>Create Proposal</h3>
              <p>Submit a new governance proposal</p>
            </Link>
          )}
          <Link to="/proposals" className="action-card">
            <div className="action-icon">📋</div>
            <h3>View Proposals</h3>
            <p>Browse all active proposals</p>
          </Link>
          <Link to="/my/votes" className="action-card">
            <div className="action-icon">🗳️</div>
            <h3>My Voting History</h3>
            <p>See your past votes</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default DaoDashboard;
