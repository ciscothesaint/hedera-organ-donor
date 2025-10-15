import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { daoProposalAPI } from '../services/daoApi';
import './ProposalsList.css';

function ProposalsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    urgency: searchParams.get('urgency') || '',
    type: searchParams.get('type') || '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  useEffect(() => {
    fetchProposals();
  }, [filters, pagination.page]);

  const fetchProposals = async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        ),
      };

      const response = await daoProposalAPI.getAll(params);

      // DEBUG: Log what we received
      console.log('📥 RECEIVED proposals from API:', response.data.proposals);
      console.log('📥 First proposal proposalId:', response.data.proposals?.[0]?.proposalId, 'Type:', typeof response.data.proposals?.[0]?.proposalId);

      setProposals(response.data.proposals || []);
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination,
      }));

    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));

    // Update URL
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      ACTIVE: 'badge-info',
      APPROVED: 'badge-success',
      REJECTED: 'badge-danger',
      EXECUTED: 'badge-success',
      EXPIRED: 'badge-secondary',
    };
    return `badge ${classes[status] || 'badge-info'}`;
  };

  const getTimeRemaining = (deadline) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Less than 1h';
  };

  return (
    <div className="proposals-list-page">
      <div className="page-header">
        <h1>📋 All Proposals</h1>
        <p>Browse and vote on governance proposals</p>
      </div>

      {/* Filters */}
      <div className="filters-section card">
        <div className="filters-grid">
          <div className="filter-group">
            <label className="label">Status</label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXECUTED">Executed</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="label">Urgency</label>
            <select
              className="input"
              value={filters.urgency}
              onChange={(e) => handleFilterChange('urgency', e.target.value)}
            >
              <option value="">All Urgency</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="STANDARD">Standard</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="label">Type</label>
            <select
              className="input"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="URGENCY_UPDATE">Urgency Update</option>
              <option value="PATIENT_REMOVAL">Patient Removal</option>
              <option value="SYSTEM_PARAMETER">System Parameter</option>
              <option value="EMERGENCY_OVERRIDE">Emergency Override</option>
            </select>
          </div>

          <div className="filter-group">
            <button
              className="btn btn-outline btn-block"
              onClick={() => {
                setFilters({ status: '', urgency: '', type: '' });
                setSearchParams({});
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Proposals List */}
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading proposals...</p>
        </div>
      ) : proposals.length === 0 ? (
        <div className="empty-state card">
          <p>No proposals found matching your filters.</p>
        </div>
      ) : (
        <>
          <div className="proposals-grid">
            {proposals.map((proposal) => (
              <div
                key={proposal.proposalId}
                className={`proposal-item ${proposal.urgencyLevel === 'EMERGENCY' ? 'emergency' : ''}`}
              >
                <div className="proposal-item-header">
                  <div className="badges">
                    <span className={getStatusBadgeClass(proposal.status)}>
                      {proposal.status}
                    </span>
                    <span className={`badge ${proposal.urgencyLevel === 'EMERGENCY' ? 'badge-danger' : 'badge-warning'}`}>
                      {proposal.urgencyLevel}
                    </span>
                    <span className="badge badge-info">
                      {proposal.proposalType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="proposal-number">#{proposal.proposalId}</span>
                </div>

                <div className="proposal-item-body">
                  <h3>{proposal.proposalType.replace(/_/g, ' ')}</h3>

                  {proposal.patientHash && (
                    <div className="patient-info">
                      <span className="label-sm">Patient:</span>
                      <code>{proposal.patientHash.substring(0, 20)}...</code>
                    </div>
                  )}

                  {proposal.proposalType === 'URGENCY_UPDATE' && (
                    <div className="urgency-change">
                      <span className="old-value">{proposal.currentValue}</span>
                      <span className="arrow">→</span>
                      <span className="new-value">{proposal.proposedValue}</span>
                    </div>
                  )}

                  <p className="proposal-reasoning">
                    {proposal.reasoning.substring(0, 200)}
                    {proposal.reasoning.length > 200 && '...'}
                  </p>

                  <div className="proposal-item-meta">
                    <span>👤 {proposal.creatorName}</span>
                    <span>🕐 {getTimeRemaining(proposal.votingDeadline)}</span>
                    <span>🗳️ {proposal.votes?.length || 0} votes</span>
                  </div>

                  {/* Vote Progress */}
                  <div className="vote-progress-section">
                    <div className="vote-bar">
                      <div
                        className="vote-fill approve"
                        style={{
                          width: `${proposal.totalVotingPower > 0 ? (proposal.votesFor / proposal.totalVotingPower) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                    <div className="vote-counts">
                      <span className="approve">✓ {proposal.votesFor}</span>
                      <span className="reject">✗ {proposal.votesAgainst}</span>
                      <span className="abstain">○ {proposal.votesAbstain}</span>
                    </div>
                  </div>
                </div>

                <div className="proposal-item-footer">
                  <Link
                    to={`/proposals/${proposal.proposalId}`}
                    className="btn btn-primary btn-sm btn-block"
                    onClick={() => {
                      console.log('🔗 LINK CLICKED - proposalId:', proposal.proposalId, 'Type:', typeof proposal.proposalId);
                      console.log('🔗 Full proposal object:', proposal);
                    }}
                  >
                    View Details & Vote
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                ← Previous
              </button>

              <span className="page-info">
                Page {pagination.page} of {pagination.pages}
              </span>

              <button
                className="btn btn-outline btn-sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ProposalsList;
