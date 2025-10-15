import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { daoProposalAPI } from '../services/daoApi';
import './MyVotingHistory.css';

function MyVotingHistory() {
    const [votes, setVotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('ALL'); // ALL, APPROVE, REJECT, ABSTAIN

    useEffect(() => {
        fetchMyVotes();
    }, []);

    const fetchMyVotes = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await daoProposalAPI.getMyVotes();
            setVotes(response.data.votes || []);

        } catch (err) {
            console.error('Error fetching votes:', err);
            setError(err.response?.data?.error || 'Failed to load voting history');
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

    const getVoteChoiceClass = (choice) => {
        switch (choice) {
            case 'APPROVE': return 'vote-approve';
            case 'REJECT': return 'vote-reject';
            case 'ABSTAIN': return 'vote-abstain';
            default: return '';
        }
    };

    const getProposalStatusClass = (status) => {
        switch (status) {
            case 'ACTIVE': return 'status-active';
            case 'APPROVED': return 'status-approved';
            case 'REJECTED': return 'status-rejected';
            case 'EXPIRED': return 'status-expired';
            default: return '';
        }
    };

    const filteredVotes = filter === 'ALL'
        ? votes
        : votes.filter(vote => vote.voteChoice === filter);

    const voteStats = {
        total: votes.length,
        approve: votes.filter(v => v.voteChoice === 'APPROVE').length,
        reject: votes.filter(v => v.voteChoice === 'REJECT').length,
        abstain: votes.filter(v => v.voteChoice === 'ABSTAIN').length,
    };

    if (loading) {
        return (
            <div className="voting-history-loading">
                <div className="spinner-large"></div>
                <p>Loading your voting history...</p>
            </div>
        );
    }

    return (
        <div className="voting-history-page">
            <div className="page-header">
                <h1>My Voting History</h1>
                <p className="subtitle">Track all votes you've cast on DAO proposals</p>
            </div>

            {error && (
                <div className="error-banner">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Vote Statistics */}
            <div className="vote-stats-grid">
                <div className="stat-card total">
                    <div className="stat-icon">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total Votes</div>
                        <div className="stat-value">{voteStats.total}</div>
                    </div>
                </div>

                <div className="stat-card approve">
                    <div className="stat-icon">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Approved</div>
                        <div className="stat-value">{voteStats.approve}</div>
                    </div>
                </div>

                <div className="stat-card reject">
                    <div className="stat-icon">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Rejected</div>
                        <div className="stat-value">{voteStats.reject}</div>
                    </div>
                </div>

                <div className="stat-card abstain">
                    <div className="stat-icon">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Abstained</div>
                        <div className="stat-value">{voteStats.abstain}</div>
                    </div>
                </div>
            </div>

            {/* Filter Buttons */}
            <div className="filter-section">
                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
                        onClick={() => setFilter('ALL')}
                    >
                        All ({votes.length})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'APPROVE' ? 'active' : ''}`}
                        onClick={() => setFilter('APPROVE')}
                    >
                        Approved ({voteStats.approve})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'REJECT' ? 'active' : ''}`}
                        onClick={() => setFilter('REJECT')}
                    >
                        Rejected ({voteStats.reject})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'ABSTAIN' ? 'active' : ''}`}
                        onClick={() => setFilter('ABSTAIN')}
                    >
                        Abstained ({voteStats.abstain})
                    </button>
                </div>
            </div>

            {/* Votes List */}
            {filteredVotes.length === 0 ? (
                <div className="no-votes">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3>No votes found</h3>
                    <p>
                        {filter === 'ALL'
                            ? "You haven't voted on any proposals yet"
                            : `You haven't cast any ${filter.toLowerCase()} votes yet`
                        }
                    </p>
                    <Link to="/proposals" className="browse-proposals-btn">
                        Browse Proposals
                    </Link>
                </div>
            ) : (
                <div className="votes-list">
                    {filteredVotes.map((vote, index) => (
                        <div key={index} className="vote-history-card">
                            <div className="vote-card-header">
                                <div className="proposal-info">
                                    <Link to={`/proposals/${vote.proposal.proposalId}`} className="proposal-title">
                                        {vote.proposal.proposalType.replace(/_/g, ' ')}
                                    </Link>
                                    <div className="proposal-meta">
                                        <span className={`status-badge ${getProposalStatusClass(vote.proposal.status)}`}>
                                            {vote.proposal.status}
                                        </span>
                                        <span className="proposal-id">#{vote.proposal.proposalId}</span>
                                    </div>
                                </div>
                                <div className="vote-badge-wrapper">
                                    <span className={`vote-choice-badge ${getVoteChoiceClass(vote.voteChoice)}`}>
                                        {vote.voteChoice}
                                    </span>
                                    <span className="vote-power">Power: {vote.votingPower}</span>
                                </div>
                            </div>

                            <div className="vote-card-body">
                                <div className="vote-reasoning">
                                    <strong>Your Reasoning:</strong>
                                    <p>{vote.reasoning}</p>
                                </div>

                                <div className="vote-metadata">
                                    <div className="metadata-item">
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Voted on {formatDate(vote.votedAt)}</span>
                                    </div>

                                    {vote.proposal.urgencyLevel && (
                                        <div className="metadata-item">
                                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <span className={`urgency-${vote.proposal.urgencyLevel.toLowerCase()}`}>
                                                {vote.proposal.urgencyLevel}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {vote.proposal.status !== 'ACTIVE' && (
                                <div className={`proposal-outcome ${vote.proposal.status.toLowerCase()}`}>
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        {vote.proposal.status === 'APPROVED' ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        )}
                                    </svg>
                                    <span>Proposal {vote.proposal.status}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyVotingHistory;
