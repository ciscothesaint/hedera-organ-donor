import { useState } from 'react';
import './VotingInterface.css';

function VotingInterface({ proposal, onVoteSubmit, userHasVoted }) {
    const [selectedChoice, setSelectedChoice] = useState(null);
    const [reasoning, setReasoning] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showReasoningInput, setShowReasoningInput] = useState(false);

    const handleVoteClick = (choice) => {
        if (userHasVoted) {
            setError('You have already voted on this proposal');
            return;
        }

        if (proposal.status !== 'ACTIVE') {
            setError('This proposal is no longer accepting votes');
            return;
        }

        setSelectedChoice(choice);
        setShowReasoningInput(true);
        setError('');
    };

    const handleSubmitVote = async () => {
        // Validation
        if (!selectedChoice) {
            setError('Please select a vote choice');
            return;
        }

        if (!reasoning.trim()) {
            setError('Please provide reasoning for your vote');
            return;
        }

        if (reasoning.trim().length < 20) {
            setError('Reasoning must be at least 20 characters long');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await onVoteSubmit({
                voteChoice: selectedChoice,
                reasoning: reasoning.trim(),
            });

            // Reset form
            setSelectedChoice(null);
            setReasoning('');
            setShowReasoningInput(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit vote. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setSelectedChoice(null);
        setReasoning('');
        setShowReasoningInput(false);
        setError('');
    };

    // Don't show voting interface if proposal is not active
    if (proposal.status !== 'ACTIVE') {
        return (
            <div className="voting-interface disabled">
                <div className="voting-disabled-message">
                    <span className="status-badge status-{proposal.status.toLowerCase()}">
                        {proposal.status}
                    </span>
                    <p>This proposal is no longer accepting votes</p>
                </div>
            </div>
        );
    }

    // Show "already voted" message if user has voted
    if (userHasVoted) {
        return (
            <div className="voting-interface voted">
                <div className="already-voted-message">
                    <svg className="checkmark-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>You have already voted on this proposal</p>
                    <small>Your vote has been recorded on the blockchain</small>
                </div>
            </div>
        );
    }

    return (
        <div className="voting-interface">
            <div className="voting-header">
                <h3>Cast Your Vote</h3>
                <p className="voting-description">
                    Your vote will be recorded on the blockchain and publicly visible.
                    Please provide medical reasoning for transparency.
                </p>
            </div>

            {error && (
                <div className="voting-error">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {!showReasoningInput ? (
                <div className="voting-buttons">
                    <button
                        className="vote-btn approve"
                        onClick={() => handleVoteClick('APPROVE')}
                        disabled={isSubmitting}
                    >
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Approve</span>
                        <small>Support this proposal</small>
                    </button>

                    <button
                        className="vote-btn reject"
                        onClick={() => handleVoteClick('REJECT')}
                        disabled={isSubmitting}
                    >
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Reject</span>
                        <small>Oppose this proposal</small>
                    </button>

                    <button
                        className="vote-btn abstain"
                        onClick={() => handleVoteClick('ABSTAIN')}
                        disabled={isSubmitting}
                    >
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                        <span>Abstain</span>
                        <small>No position</small>
                    </button>
                </div>
            ) : (
                <div className="reasoning-input-section">
                    <div className="selected-choice-banner">
                        <span>You selected:</span>
                        <strong className={`choice-${selectedChoice.toLowerCase()}`}>
                            {selectedChoice}
                        </strong>
                    </div>

                    <div className="reasoning-field">
                        <label htmlFor="vote-reasoning">
                            Medical Reasoning <span className="required">*</span>
                        </label>
                        <textarea
                            id="vote-reasoning"
                            value={reasoning}
                            onChange={(e) => setReasoning(e.target.value)}
                            placeholder="Provide your medical reasoning for this vote. Your reasoning will be publicly visible. (Min 20 characters)"
                            rows={5}
                            maxLength={1000}
                            disabled={isSubmitting}
                        />
                        <div className="character-count">
                            {reasoning.length}/1000 characters
                            {reasoning.length > 0 && reasoning.length < 20 && (
                                <span className="warning"> (Min 20 required)</span>
                            )}
                        </div>
                    </div>

                    <div className="reasoning-actions">
                        <button
                            className="btn-cancel"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn-submit-vote"
                            onClick={handleSubmitVote}
                            disabled={isSubmitting || reasoning.trim().length < 20}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="spinner"></span>
                                    Submitting to Blockchain...
                                </>
                            ) : (
                                <>
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Submit Vote
                                </>
                            )}
                        </button>
                    </div>

                    <div className="voting-disclaimer">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <small>
                            Your vote will be permanently recorded on the Hedera blockchain and cannot be changed.
                            All votes are publicly transparent.
                        </small>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VotingInterface;
