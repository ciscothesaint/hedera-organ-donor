import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useDaoAuthStore } from '../services/daoAuthStore';
import { daoProposalAPI } from '../services/daoApi';
import VotingInterface from '../components/Voting/VotingInterface';
import ConfirmModal from '../components/Modal/ConfirmModal';
import './ProposalDetail.css';

function ProposalDetail() {
    const { id: proposalId } = useParams(); // Extract 'id' from URL params and rename to proposalId
    const navigate = useNavigate();
    const { doctor } = useDaoAuthStore();

    const [proposal, setProposal] = useState(null);
    const [votes, setVotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userVote, setUserVote] = useState(null);
    const refreshIntervalRef = useRef(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isFinalizingLoading, setIsFinalizingLoading] = useState(false);
    const [emergencyPassword, setEmergencyPassword] = useState('');
    const [showExecuteModal, setShowExecuteModal] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);

    // Fetch proposal details on mount and when proposalId changes
    useEffect(() => {
        fetchProposalDetails();
    }, [proposalId]);

    const fetchProposalDetails = async () => {
        try {
            setLoading(true);
            setError('');

            // Fetch proposal details
            const proposalResponse = await daoProposalAPI.getById(proposalId);
            setProposal(proposalResponse.data.proposal);

            // Fetch votes
            const votesResponse = await daoProposalAPI.getVotes(proposalId);
            setVotes(votesResponse.data.votes || []);

            // Check if current user has voted
            const currentUserVote = votesResponse.data.votes?.find(
                vote => vote.voterAddress === doctor?.id
            );
            setUserVote(currentUserVote || null);

        } catch (err) {
            console.error('Error fetching proposal:', err);
            setError(err.response?.data?.error || 'Failed to load proposal details');
        } finally {
            setLoading(false);
        }
    };

    const handleVoteSubmit = async (voteData) => {
        try {
            const votePromise = daoProposalAPI.vote(proposalId, voteData);

            toast.promise(
                votePromise,
                {
                    loading: 'Submitting vote to blockchain...',
                    success: '✅ Vote recorded successfully on Hedera!',
                    error: 'Failed to submit vote',
                },
                {
                    style: {
                        minWidth: '250px',
                    },
                    success: {
                        duration: 4000,
                        icon: '🗳️',
                    },
                }
            );

            await votePromise;

            // Refresh proposal and votes
            await fetchProposalDetails();
        } catch (err) {
            throw err; // Let VotingInterface handle the error
        }
    };

    const handleEmergencyFinalize = () => {
        // Show confirmation modal
        setShowConfirmModal(true);
    };

    const handleExecuteProposal = () => {
        setShowExecuteModal(true);
    };

    const confirmExecuteProposal = async () => {
        try {
            setIsExecuting(true);
            setShowExecuteModal(false);

            const executePromise = daoProposalAPI.execute(proposalId);

            toast.promise(
                executePromise,
                {
                    loading: 'Executing proposal on blockchain...',
                    success: (response) => {
                        const data = response.data;
                        return `✅ Proposal executed! Updated blockchain state.`;
                    },
                    error: (err) => {
                        const msg = err.response?.data?.error || err.response?.data?.message;
                        return msg || 'Proposal execution failed';
                    },
                },
                {
                    success: {
                        duration: 6000,
                        icon: '⚡',
                    },
                    error: {
                        duration: 6000,
                    },
                }
            );

            const response = await executePromise;

            // Show transaction details
            if (response.data.actionTransactionId) {
                setTimeout(() => {
                    toast.success(`Action TX: ${response.data.actionTransactionId}`, {
                        duration: 8000,
                        icon: '🔗',
                    });
                }, 1000);
            }

            // Refresh proposal details
            await fetchProposalDetails();

        } catch (err) {
            console.error('Error executing proposal:', err);
            const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Execution failed';
            setError(errorMsg);
        } finally {
            setIsExecuting(false);
        }
    };

    const confirmEmergencyFinalize = async () => {
        if (!emergencyPassword) {
            toast.error('Please enter the emergency finalize password');
            return;
        }

        try {
            setIsFinalizingLoading(true);
            setShowConfirmModal(false);

            const finalizePromise = daoProposalAPI.emergencyFinalize(proposalId, emergencyPassword);

            toast.promise(
                finalizePromise,
                {
                    loading: 'Emergency finalizing on blockchain...',
                    success: '✅ Proposal emergency finalized successfully!',
                    error: (err) => {
                        const msg = err.response?.data?.message || err.response?.data?.error;
                        return msg || 'Emergency finalization failed';
                    },
                },
                {
                    success: {
                        duration: 5000,
                        icon: '⚡',
                    },
                    error: {
                        duration: 6000,
                    },
                }
            );

            await finalizePromise;

            // Clear password and refresh
            setEmergencyPassword('');
            await fetchProposalDetails();
        } catch (err) {
            console.error('Error emergency finalizing:', err);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Emergency finalization failed';
            setError(errorMsg);
        } finally {
            setIsFinalizingLoading(false);
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

    const getUrgencyColor = (urgency) => {
        return urgency === 'EMERGENCY' ? '#dc2626' : '#3b82f6';
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'ACTIVE': return 'status-active';
            case 'APPROVED': return 'status-approved';
            case 'REJECTED': return 'status-rejected';
            case 'EXPIRED': return 'status-expired';
            default: return '';
        }
    };

    const getVoteChoiceClass = (choice) => {
        switch (choice) {
            case 'APPROVE': return 'vote-approve';
            case 'REJECT': return 'vote-reject';
            case 'ABSTAIN': return 'vote-abstain';
            default: return '';
        }
    };

    if (loading) {
        return (
            <div className="proposal-detail-loading">
                <div className="spinner-large"></div>
                <p>Loading proposal details...</p>
            </div>
        );
    }

    if (error || !proposal) {
        return (
            <div className="proposal-detail-error">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2>Failed to Load Proposal</h2>
                <p>{error || 'Proposal not found'}</p>
                <Link to="/proposals" className="back-link">← Back to Proposals</Link>
            </div>
        );
    }

    const approvalPercentage = proposal.totalVotingPower > 0
        ? ((proposal.votesFor / proposal.totalVotingPower) * 100).toFixed(1)
        : 0;

    const rejectPercentage = proposal.totalVotingPower > 0
        ? ((proposal.votesAgainst / proposal.totalVotingPower) * 100).toFixed(1)
        : 0;

    const requiredApproval = proposal.urgencyLevel === 'EMERGENCY' ? 66 : 60;

    // Calculate emergency finalize eligibility
    const totalVotesForEmergency = proposal.votesFor + proposal.votesAgainst;
    const emergencyApprovalPercentage = totalVotesForEmergency > 0
        ? (proposal.votesFor / totalVotesForEmergency) * 100
        : 0;
    const isEligibleForEmergencyFinalize = emergencyApprovalPercentage >= 75;

    return (
        <div className="proposal-detail-page">
            {/* Toast Notifications */}
            <Toaster
                position="bottom-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                    },
                    success: {
                        style: {
                            background: '#10b981',
                        },
                    },
                    error: {
                        style: {
                            background: '#ef4444',
                        },
                    },
                }}
            />
            {/* Header */}
            <div className="proposal-detail-header">
                <Link to="/proposals" className="back-link">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Proposals
                </Link>

                <div className="proposal-meta">
                    <span className={`status-badge ${getStatusBadgeClass(proposal.status)}`}>
                        {proposal.status}
                    </span>
                    <span className="proposal-id">#{proposal.proposalId}</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="proposal-detail-content">
                {/* Left Column */}
                <div className="proposal-main">
                    {/* Title Section */}
                    <div className="proposal-title-section">
                        <div className="urgency-indicator" style={{ borderColor: getUrgencyColor(proposal.urgencyLevel) }}>
                            <span style={{ color: getUrgencyColor(proposal.urgencyLevel) }}>
                                {proposal.urgencyLevel}
                            </span>
                        </div>
                        <h1>{proposal.proposalType.replace(/_/g, ' ')}</h1>
                        <div className="proposal-subtitle">
                            <span>Patient: {proposal.patientHash}</span>
                            <span>•</span>
                            <span>Proposed by {proposal.creatorName}</span>
                        </div>
                    </div>

                    {/* Urgency Change */}
                    {proposal.proposalType === 'URGENCY_UPDATE' && (
                        <div className="urgency-change-card">
                            <div className="urgency-change-item">
                                <label>Current Urgency</label>
                                <div className="urgency-value current">{proposal.currentValue || 'N/A'}</div>
                            </div>
                            <div className="urgency-arrow">→</div>
                            <div className="urgency-change-item">
                                <label>Proposed Urgency</label>
                                <div className="urgency-value proposed">{proposal.proposedValue || 'N/A'}</div>
                            </div>
                        </div>
                    )}

                    {/* Reasoning */}
                    <div className="proposal-section">
                        <h2>Medical Reasoning</h2>
                        <div className="reasoning-content">
                            <p>{proposal.reasoning}</p>
                        </div>
                    </div>

                    {/* Evidence */}
                    {proposal.evidenceHash && (
                        <div className="proposal-section">
                            <h2>Medical Evidence</h2>
                            <div className="evidence-card">
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div>
                                    <div className="evidence-label">Evidence Hash (IPFS/Blockchain)</div>
                                    <div className="evidence-hash">{proposal.evidenceHash}</div>
                                </div>
                                <a href={`https://ipfs.io/ipfs/${proposal.evidenceHash}`} target="_blank" rel="noopener noreferrer" className="view-evidence-btn">
                                    View
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="proposal-section">
                        <h2>Proposal Timeline</h2>
                        <div className="timeline">
                            <div className="timeline-item">
                                <div className="timeline-icon created">
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div className="timeline-content">
                                    <div className="timeline-title">Proposal Created</div>
                                    <div className="timeline-date">{formatDate(proposal.createdAt)}</div>
                                </div>
                            </div>

                            {proposal.status !== 'ACTIVE' && (
                                <div className="timeline-item">
                                    <div className={`timeline-icon ${proposal.status.toLowerCase()}`}>
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            {proposal.status === 'APPROVED' ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            )}
                                        </svg>
                                    </div>
                                    <div className="timeline-content">
                                        <div className="timeline-title">Proposal {proposal.status}</div>
                                        <div className="timeline-date">{formatDate(proposal.finalizedAt || proposal.votingDeadline)}</div>
                                    </div>
                                </div>
                            )}

                            {proposal.status === 'ACTIVE' && (
                                <div className="timeline-item">
                                    <div className="timeline-icon pending">
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="timeline-content">
                                        <div className="timeline-title">Voting Deadline</div>
                                        <div className="timeline-date">{formatDate(proposal.votingDeadline)}</div>
                                        <div className="timeline-remaining">{getTimeRemaining(proposal.votingDeadline)}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Voting Interface */}
                    <VotingInterface
                        proposal={proposal}
                        onVoteSubmit={handleVoteSubmit}
                        userHasVoted={!!userVote}
                    />
                </div>

                {/* Right Sidebar */}
                <div className="proposal-sidebar">
                    {/* Vote Progress */}
                    <div className="sidebar-card vote-progress-card">
                        <h3>Vote Progress</h3>

                        <div className="vote-stats">
                            <div className="vote-stat">
                                <span className="vote-stat-label">Total Votes</span>
                                <span className="vote-stat-value">{votes.length}</span>
                            </div>
                            <div className="vote-stat">
                                <span className="vote-stat-label">Voting Power Used</span>
                                <span className="vote-stat-value">{proposal.totalVotingPower}</span>
                            </div>
                        </div>

                        <div className="vote-breakdown">
                            <div className="vote-breakdown-item approve">
                                <div className="vote-breakdown-header">
                                    <span className="vote-choice-label">Approve</span>
                                    <span className="vote-percentage">{approvalPercentage}%</span>
                                </div>
                                <div className="vote-progress-bar">
                                    <div className="vote-progress-fill approve" style={{ width: `${approvalPercentage}%` }}></div>
                                </div>
                                <span className="vote-power-count">{proposal.votesFor || 0} voting power</span>
                            </div>

                            <div className="vote-breakdown-item reject">
                                <div className="vote-breakdown-header">
                                    <span className="vote-choice-label">Reject</span>
                                    <span className="vote-percentage">{rejectPercentage}%</span>
                                </div>
                                <div className="vote-progress-bar">
                                    <div className="vote-progress-fill reject" style={{ width: `${rejectPercentage}%` }}></div>
                                </div>
                                <span className="vote-power-count">{proposal.votesAgainst || 0} voting power</span>
                            </div>

                            <div className="vote-breakdown-item abstain">
                                <div className="vote-breakdown-header">
                                    <span className="vote-choice-label">Abstain</span>
                                    <span className="vote-percentage">{(100 - parseFloat(approvalPercentage) - parseFloat(rejectPercentage)).toFixed(1)}%</span>
                                </div>
                                <div className="vote-progress-bar">
                                    <div className="vote-progress-fill abstain" style={{ width: `${100 - parseFloat(approvalPercentage) - parseFloat(rejectPercentage)}%` }}></div>
                                </div>
                                <span className="vote-power-count">{proposal.votesAbstain || 0} voting power</span>
                            </div>
                        </div>

                        <div className="approval-threshold">
                            <span>Required for Approval</span>
                            <strong>{requiredApproval}%</strong>
                        </div>
                    </div>

                    {/* Proposal Info */}
                    <div className="sidebar-card proposal-info-card">
                        <h3>Proposal Information</h3>
                        <div className="info-list">
                            <div className="info-item">
                                <label>Type</label>
                                <span>{proposal.proposalType.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="info-item">
                                <label>Urgency Level</label>
                                <span className={`urgency-badge ${proposal.urgencyLevel.toLowerCase()}`}>
                                    {proposal.urgencyLevel}
                                </span>
                            </div>
                            <div className="info-item">
                                <label>Created</label>
                                <span>{formatDate(proposal.createdAt)}</span>
                            </div>
                            <div className="info-item">
                                <label>Deadline</label>
                                <span>{formatDate(proposal.votingDeadline)}</span>
                            </div>
                            <div className="info-item">
                                <label>Proposed By</label>
                                <span>{proposal.creatorName}</span>
                            </div>
                        </div>

                        {/* Emergency Finalize Button - Only show for ACTIVE proposals */}
                        {proposal.status === 'ACTIVE' && (
                            <div className="emergency-finalize-section">
                                <div className="emergency-finalize-status">
                                    <span className="status-label">Emergency Finalize Status:</span>
                                    <span className={`status-value ${isEligibleForEmergencyFinalize ? 'eligible' : 'not-eligible'}`}>
                                        {emergencyApprovalPercentage.toFixed(1)}% / 75%
                                    </span>
                                </div>
                                <button
                                    onClick={handleEmergencyFinalize}
                                    className={`emergency-finalize-btn ${isEligibleForEmergencyFinalize ? 'eligible' : ''}`}
                                    disabled={loading || !isEligibleForEmergencyFinalize}
                                    title={isEligibleForEmergencyFinalize ? 'Click to emergency finalize' : `Need 75% approval (current: ${emergencyApprovalPercentage.toFixed(1)}%)`}
                                >
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    {isEligibleForEmergencyFinalize ? 'Emergency Finalize Now' : 'Waiting for 75% Approval'}
                                </button>
                                <p className="emergency-finalize-hint">
                                    {isEligibleForEmergencyFinalize
                                        ? '✅ Eligible for emergency finalization'
                                        : `⏳ Need ${(75 - emergencyApprovalPercentage).toFixed(1)}% more approval`
                                    }
                                </p>
                            </div>
                        )}

                        {/* Finalized Status - Show for completed proposals */}
                        {(proposal.status === 'APPROVED' || proposal.status === 'REJECTED' || proposal.status === 'EXPIRED' || proposal.status === 'EXECUTED') && (
                            <div className="finalized-status-section">
                                <div className={`finalized-badge ${proposal.status.toLowerCase()}`}>
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        {proposal.status === 'APPROVED' || proposal.status === 'EXECUTED' ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        ) : proposal.status === 'REJECTED' ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        )}
                                    </svg>
                                    <span>Proposal {proposal.status}</span>
                                </div>
                                {proposal.finalizedAt && (
                                    <p className="finalized-date">Finalized on {formatDate(proposal.finalizedAt)}</p>
                                )}

                                {/* Execute Button - Show for APPROVED proposals that haven't been executed */}
                                {proposal.status === 'APPROVED' && !proposal.executedAt && (
                                    <button
                                        onClick={handleExecuteProposal}
                                        className="execute-proposal-btn"
                                        disabled={isExecuting}
                                    >
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Execute Proposal
                                    </button>
                                )}

                                {/* Execution Status - Show for EXECUTED proposals */}
                                {proposal.status === 'EXECUTED' && proposal.executedAt && (
                                    <div className="execution-status">
                                        <p className="execution-date">
                                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Executed on {formatDate(proposal.executedAt)}
                                        </p>
                                        {proposal.executionTxId && (
                                            <a
                                                href={`https://hashscan.io/testnet/transaction/${proposal.executionTxId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="tx-link"
                                            >
                                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                                View Transaction
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Votes List */}
            <div className="votes-section">
                <h2>All Votes ({votes.length}) - Public Transparency</h2>

                {votes.length === 0 ? (
                    <div className="no-votes">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p>No votes have been cast yet</p>
                    </div>
                ) : (
                    <div className="votes-list">
                        {votes.map((vote, index) => (
                            <div key={index} className="vote-card">
                                <div className="vote-header">
                                    <div className="voter-info">
                                        <div className="voter-avatar">
                                            {vote.voterName?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <div className="voter-name">{vote.voterName || 'Anonymous'}</div>
                                            <div className="vote-timestamp">{formatDate(vote.timestamp)}</div>
                                        </div>
                                    </div>
                                    <div className="vote-choice-badge-wrapper">
                                        <span className={`vote-choice-badge ${getVoteChoiceClass(vote.voteChoice)}`}>
                                            {vote.voteChoice}
                                        </span>
                                        <span className="voting-power-badge">
                                            Power: {vote.votingPower}
                                        </span>
                                    </div>
                                </div>
                                <div className="vote-reasoning">
                                    <strong>Medical Reasoning:</strong>
                                    <p>{vote.reasoning}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Emergency Finalize Confirmation Modal */}
            {proposal && (
                <ConfirmModal
                    isOpen={showConfirmModal}
                    onClose={() => {
                        setShowConfirmModal(false);
                        setEmergencyPassword('');
                    }}
                    onConfirm={confirmEmergencyFinalize}
                    title="Emergency Finalize Proposal?"
                    message="This action will immediately finalize the proposal based on current votes. This cannot be undone."
                    variant="danger"
                    confirmText="Finalize Now"
                    cancelText="Cancel"
                    warningText="⚠️ Requires 75% supermajority to succeed. The proposal will be marked as APPROVED or REJECTED based on current votes."
                    details={[
                        { label: 'Proposal ID', value: `#${proposal.proposalId}` },
                        { label: 'Votes For', value: proposal.votesFor, variant: 'success' },
                        { label: 'Votes Against', value: proposal.votesAgainst, variant: 'danger' },
                        {
                            label: 'Approval Rate',
                            value: `${((proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100 || 0).toFixed(2)}%`,
                            variant: ((proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100 >= 75) ? 'success' : 'danger'
                        },
                        {
                            label: 'Emergency Password',
                            value: (
                                <input
                                    type="password"
                                    value={emergencyPassword}
                                    onChange={(e) => setEmergencyPassword(e.target.value)}
                                    placeholder="Enter emergency finalize password"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        marginTop: '5px'
                                    }}
                                    autoFocus
                                />
                            )
                        }
                    ]}
                    loading={isFinalizingLoading}
                />
            )}

            {/* Execute Proposal Confirmation Modal */}
            {proposal && (
                <ConfirmModal
                    isOpen={showExecuteModal}
                    onClose={() => setShowExecuteModal(false)}
                    onConfirm={confirmExecuteProposal}
                    title="Execute Approved Proposal?"
                    message="This will automatically execute the action on the blockchain. The smart contract will be called to perform the requested operation."
                    variant="success"
                    confirmText="Execute Now"
                    cancelText="Cancel"
                    warningText="⚡ This action will update the blockchain state and cannot be undone."
                    details={[
                        { label: 'Proposal ID', value: `#${proposal.proposalId}` },
                        { label: 'Proposal Type', value: proposal.proposalType.replace(/_/g, ' ') },
                        { label: 'Patient ID', value: proposal.patientHash?.split(' ')[0] || 'N/A' },
                        proposal.proposalType === 'URGENCY_UPDATE' ? {
                            label: 'Action',
                            value: `Change urgency from ${proposal.currentValue} to ${proposal.proposedValue}`,
                            variant: 'info'
                        } : proposal.proposalType === 'PATIENT_REMOVAL' ? {
                            label: 'Action',
                            value: 'Remove patient from waitlist',
                            variant: 'warning'
                        } : null,
                        { label: 'Status', value: proposal.status, variant: 'success' }
                    ].filter(Boolean)}
                    loading={isExecuting}
                />
            )}
        </div>
    );
}

export default ProposalDetail;
