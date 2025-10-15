import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { daoProposalAPI } from '../services/daoApi';
import './MyProposals.css';

function MyProposals() {
    const navigate = useNavigate();
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('ALL'); // ALL, ACTIVE, APPROVED, REJECTED, EXPIRED

    useEffect(() => {
        fetchMyProposals();
    }, []);

    const fetchMyProposals = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await daoProposalAPI.getMyProposals();
            setProposals(response.data.proposals || []);

        } catch (err) {
            console.error('Error fetching proposals:', err);
            setError(err.response?.data?.error || 'Failed to load your proposals');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
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

    const getStatusClass = (status) => {
        switch (status) {
            case 'ACTIVE': return 'status-active';
            case 'APPROVED': return 'status-approved';
            case 'REJECTED': return 'status-rejected';
            case 'EXPIRED': return 'status-expired';
            default: return '';
        }
    };

    const getUrgencyColor = (urgency) => {
        return urgency === 'EMERGENCY' ? '#dc2626' : '#3b82f6';
    };

    const filteredProposals = filter === 'ALL'
        ? proposals
        : proposals.filter(p => p.status === filter);

    const proposalStats = {
        total: proposals.length,
        active: proposals.filter(p => p.status === 'ACTIVE').length,
        approved: proposals.filter(p => p.status === 'APPROVED').length,
        rejected: proposals.filter(p => p.status === 'REJECTED').length,
        expired: proposals.filter(p => p.status === 'EXPIRED').length,
    };

    if (loading) {
        return (
            <div className="my-proposals-loading">
                <div className="spinner-large"></div>
                <p>Loading your proposals...</p>
            </div>
        );
    }

    return (
        <div className="my-proposals-page">
            <div className="page-header">
                <div>
                    <h1>My Proposals</h1>
                    <p className="subtitle">Track governance proposals you've created</p>
                </div>
                <button onClick={() => navigate('/proposals/create')} className="create-proposal-btn">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Proposal
                </button>
            </div>

            {error && (
                <div className="error-banner">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Proposal Statistics */}
            <div className="proposal-stats-grid">
                <div className="stat-card total">
                    <div className="stat-icon">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total Created</div>
                        <div className="stat-value">{proposalStats.total}</div>
                    </div>
                </div>

                <div className="stat-card active">
                    <div className="stat-icon">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Active</div>
                        <div className="stat-value">{proposalStats.active}</div>
                    </div>
                </div>

                <div className="stat-card approved">
                    <div className="stat-icon">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Approved</div>
                        <div className="stat-value">{proposalStats.approved}</div>
                    </div>
                </div>

                <div className="stat-card rejected">
                    <div className="stat-icon">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Rejected</div>
                        <div className="stat-value">{proposalStats.rejected}</div>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="filter-section">
                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
                        onClick={() => setFilter('ALL')}
                    >
                        All ({proposalStats.total})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'ACTIVE' ? 'active' : ''}`}
                        onClick={() => setFilter('ACTIVE')}
                    >
                        Active ({proposalStats.active})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'APPROVED' ? 'active' : ''}`}
                        onClick={() => setFilter('APPROVED')}
                    >
                        Approved ({proposalStats.approved})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'REJECTED' ? 'active' : ''}`}
                        onClick={() => setFilter('REJECTED')}
                    >
                        Rejected ({proposalStats.rejected})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'EXPIRED' ? 'active' : ''}`}
                        onClick={() => setFilter('EXPIRED')}
                    >
                        Expired ({proposalStats.expired})
                    </button>
                </div>
            </div>

            {/* Proposals List */}
            {filteredProposals.length === 0 ? (
                <div className="no-proposals">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3>No proposals found</h3>
                    <p>
                        {filter === 'ALL'
                            ? "You haven't created any proposals yet"
                            : `You don't have any ${filter.toLowerCase()} proposals`
                        }
                    </p>
                    <button onClick={() => navigate('/proposals/create')} className="create-first-btn">
                        Create Your First Proposal
                    </button>
                </div>
            ) : (
                <div className="proposals-grid">
                    {filteredProposals.map((proposal) => {
                        const approvalPercentage = proposal.totalVotingPower > 0
                            ? ((proposal.votesFor / proposal.totalVotingPower) * 100).toFixed(1)
                            : 0;

                        const requiredApproval = proposal.urgencyLevel === 'EMERGENCY' ? 66 : 60;

                        return (
                            <Link
                                key={proposal.proposalId}
                                to={`/proposals/${proposal.proposalId}`}
                                className="proposal-card"
                            >
                                <div className="proposal-card-header">
                                    <div className="urgency-indicator" style={{ borderColor: getUrgencyColor(proposal.urgencyLevel) }}>
                                        <span style={{ color: getUrgencyColor(proposal.urgencyLevel) }}>
                                            {proposal.urgencyLevel}
                                        </span>
                                    </div>
                                    <span className={`status-badge ${getStatusClass(proposal.status)}`}>
                                        {proposal.status}
                                    </span>
                                </div>

                                <h3 className="proposal-title">{proposal.proposalType.replace(/_/g, ' ')}</h3>

                                <div className="proposal-id-badge">#{proposal.proposalId}</div>

                                {proposal.proposalType === 'URGENCY_UPDATE' && (
                                    <div className="urgency-change-mini">
                                        <span className="value-current">{proposal.currentValue}</span>
                                        <span className="arrow">→</span>
                                        <span className="value-proposed">{proposal.proposedValue}</span>
                                    </div>
                                )}

                                <div className="vote-progress-section">
                                    <div className="progress-header">
                                        <span>Approval Progress</span>
                                        <span className="percentage">{approvalPercentage}%</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${approvalPercentage}%`,
                                                backgroundColor: parseFloat(approvalPercentage) >= requiredApproval ? '#10b981' : '#3b82f6'
                                            }}
                                        ></div>
                                        <div className="required-line" style={{ left: `${requiredApproval}%` }}>
                                            <div className="required-label">{requiredApproval}%</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="vote-stats-mini">
                                    <div className="vote-stat">
                                        <span className="stat-label">Total Votes</span>
                                        <span className="stat-value">{proposal.voteCount || 0}</span>
                                    </div>
                                    <div className="vote-stat">
                                        <span className="stat-label">Voting Power</span>
                                        <span className="stat-value">{proposal.totalVotingPower}</span>
                                    </div>
                                </div>

                                <div className="proposal-footer">
                                    <div className="footer-item">
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>
                                            {proposal.status === 'ACTIVE'
                                                ? getTimeRemaining(proposal.votingDeadline)
                                                : formatDate(proposal.createdAt)
                                            }
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default MyProposals;
