// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * GovernanceDAO - Complete On-Chain Governance for Organ Transplant Waitlist
 *
 * Architecture:
 * - All proposals and votes stored on-chain for immutability and transparency
 * - Centralized backend wallet executes all transactions
 * - User IDs (MongoDB ObjectIds) passed as parameters and tracked on-chain
 * - Heavy data (reasoning, evidence, names) stored off-chain in MongoDB
 */
contract GovernanceDAO {

    // ============ Enums ============

    enum ProposalType {
        URGENCY_UPDATE,      // Change patient urgency score
        PATIENT_REMOVAL,     // Remove patient from waitlist
        SYSTEM_PARAMETER,    // Modify system parameters
        EMERGENCY_OVERRIDE   // Emergency decision
    }

    enum UrgencyLevel {
        EMERGENCY,  // 2 days voting period
        STANDARD    // 7 days voting period
    }

    enum ProposalStatus {
        ACTIVE,     // Currently open for voting
        APPROVED,   // Passed and approved
        REJECTED,   // Did not pass
        EXECUTED    // Approved and executed
    }

    enum VoteChoice {
        APPROVE,    // Vote in favor
        REJECT,     // Vote against
        ABSTAIN     // Abstain from voting
    }

    // ============ Structs ============

    struct Proposal {
        uint256 proposalId;
        ProposalType proposalType;
        bytes32 patientHash;
        uint256 currentValue;
        uint256 proposedValue;
        uint256 createdAt;
        uint256 votingDeadline;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votesAbstain;
        ProposalStatus status;
    }

    // ============ State Variables ============

    uint256 public proposalCount;

    // Proposal storage
    mapping(uint256 => Proposal) public proposals;

    // Vote tracking: proposalId => userId => hasVoted
    mapping(uint256 => mapping(bytes32 => bool)) public hasVoted;

    // Vote details: proposalId => userId => voteChoice
    mapping(uint256 => mapping(bytes32 => VoteChoice)) public userVoteChoice;

    // Voting power: proposalId => userId => votingPower
    mapping(uint256 => mapping(bytes32 => uint256)) public userVotingPower;

    // ============ Events ============

    event ProposalCreated(
        uint256 indexed proposalId,
        ProposalType proposalType,
        bytes32 patientHash,
        uint256 votingDeadline
    );

    event VoteCast(
        uint256 indexed proposalId,
        bytes32 userId,
        VoteChoice choice,
        uint256 votingPower,
        uint256 timestamp
    );

    event ProposalFinalized(
        uint256 indexed proposalId,
        ProposalStatus status,
        uint256 votesFor,
        uint256 votesAgainst
    );

    event ProposalExecuted(
        uint256 indexed proposalId,
        uint256 timestamp
    );

    // ============ Functions ============

    /**
     * Create a new governance proposal
     * @param _type Type of proposal
     * @param _urgency Urgency level (determines voting period)
     * @param _patientHash Patient ID as bytes32
     * @param _currentValue Current value (for URGENCY_UPDATE)
     * @param _proposedValue Proposed new value
     * @return proposalId The ID of the created proposal
     */
    function createProposal(
        ProposalType _type,
        UrgencyLevel _urgency,
        bytes32 _patientHash,
        uint256 _currentValue,
        uint256 _proposedValue
    ) public returns (uint256) {
        proposalCount++;

        // Calculate voting deadline based on urgency
        uint256 period = _urgency == UrgencyLevel.EMERGENCY ? 2 days : 7 days;
        uint256 deadline = block.timestamp + period;

        // Create proposal
        proposals[proposalCount] = Proposal({
            proposalId: proposalCount,
            proposalType: _type,
            patientHash: _patientHash,
            currentValue: _currentValue,
            proposedValue: _proposedValue,
            createdAt: block.timestamp,
            votingDeadline: deadline,
            votesFor: 0,
            votesAgainst: 0,
            votesAbstain: 0,
            status: ProposalStatus.ACTIVE
        });

        emit ProposalCreated(proposalCount, _type, _patientHash, deadline);

        return proposalCount;
    }

    /**
     * Submit a vote on a proposal
     * @param _proposalId ID of the proposal
     * @param _userId User ID (MongoDB ObjectId as bytes32)
     * @param _choice Vote choice (APPROVE, REJECT, ABSTAIN)
     * @param _votingPower Voting power of the user
     */
    function vote(
        uint256 _proposalId,
        bytes32 _userId,
        VoteChoice _choice,
        uint256 _votingPower
    ) public {
        Proposal storage proposal = proposals[_proposalId];

        // Validations
        require(proposal.proposalId != 0, "Proposal does not exist");
        require(!hasVoted[_proposalId][_userId], "User already voted");
        require(proposal.status == ProposalStatus.ACTIVE, "Voting is closed");
        require(block.timestamp < proposal.votingDeadline, "Voting deadline passed");
        require(_votingPower > 0, "Voting power must be positive");

        // Record vote
        hasVoted[_proposalId][_userId] = true;
        userVoteChoice[_proposalId][_userId] = _choice;
        userVotingPower[_proposalId][_userId] = _votingPower;

        // Update vote counts
        if (_choice == VoteChoice.APPROVE) {
            proposal.votesFor += _votingPower;
        } else if (_choice == VoteChoice.REJECT) {
            proposal.votesAgainst += _votingPower;
        } else {
            proposal.votesAbstain += _votingPower;
        }

        emit VoteCast(_proposalId, _userId, _choice, _votingPower, block.timestamp);
    }

    /**
     * Finalize a proposal after voting period ends
     * @param _proposalId ID of the proposal to finalize
     */
    function finalizeProposal(uint256 _proposalId) public {
        Proposal storage proposal = proposals[_proposalId];

        require(proposal.proposalId != 0, "Proposal does not exist");
        require(proposal.status == ProposalStatus.ACTIVE, "Proposal already finalized");
        require(block.timestamp >= proposal.votingDeadline, "Voting period not ended");

        // Determine outcome: simple majority wins
        if (proposal.votesFor > proposal.votesAgainst) {
            proposal.status = ProposalStatus.APPROVED;
        } else {
            proposal.status = ProposalStatus.REJECTED;
        }

        emit ProposalFinalized(
            _proposalId,
            proposal.status,
            proposal.votesFor,
            proposal.votesAgainst
        );
    }

    /**
     * Emergency finalize a proposal before deadline with supermajority
     * Requires 75% approval to prevent abuse
     * @param _proposalId ID of the proposal to finalize early
     */
    function emergencyFinalize(uint256 _proposalId) public {
        Proposal storage proposal = proposals[_proposalId];

        require(proposal.proposalId != 0, "Proposal does not exist");
        require(proposal.status == ProposalStatus.ACTIVE, "Proposal already finalized");

        // Calculate vote percentages
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        require(totalVotes > 0, "No votes cast yet");

        // Require supermajority (75% approval) for emergency finalization
        uint256 approvalPercentage = (proposal.votesFor * 100) / totalVotes;
        require(approvalPercentage >= 75, "Requires 75% supermajority for emergency finalization");

        // Determine outcome: if we got here, votesFor > votesAgainst (due to 75% check)
        if (proposal.votesFor > proposal.votesAgainst) {
            proposal.status = ProposalStatus.APPROVED;
        } else {
            proposal.status = ProposalStatus.REJECTED;
        }

        emit ProposalFinalized(
            _proposalId,
            proposal.status,
            proposal.votesFor,
            proposal.votesAgainst
        );
    }

    /**
     * Mark a proposal as executed
     * @param _proposalId ID of the proposal
     */
    function executeProposal(uint256 _proposalId) public {
        Proposal storage proposal = proposals[_proposalId];

        require(proposal.proposalId != 0, "Proposal does not exist");
        require(proposal.status == ProposalStatus.APPROVED, "Proposal not approved");

        proposal.status = ProposalStatus.EXECUTED;

        emit ProposalExecuted(_proposalId, block.timestamp);
    }

    // ============ View Functions ============

    /**
     * Get proposal details
     * @param _proposalId ID of the proposal
     */
    function getProposal(uint256 _proposalId) public view returns (
        uint256 proposalId,
        ProposalType proposalType,
        bytes32 patientHash,
        uint256 currentValue,
        uint256 proposedValue,
        uint256 createdAt,
        uint256 votingDeadline,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 votesAbstain,
        ProposalStatus status
    ) {
        Proposal memory p = proposals[_proposalId];
        return (
            p.proposalId,
            p.proposalType,
            p.patientHash,
            p.currentValue,
            p.proposedValue,
            p.createdAt,
            p.votingDeadline,
            p.votesFor,
            p.votesAgainst,
            p.votesAbstain,
            p.status
        );
    }

    /**
     * Get user's vote on a proposal
     * @param _proposalId ID of the proposal
     * @param _userId User ID
     * @return voted Whether user voted
     * @return choice User's vote choice
     * @return votingPower User's voting power used
     */
    function getUserVote(uint256 _proposalId, bytes32 _userId)
        public
        view
        returns (bool voted, VoteChoice choice, uint256 votingPower)
    {
        voted = hasVoted[_proposalId][_userId];
        choice = userVoteChoice[_proposalId][_userId];
        votingPower = userVotingPower[_proposalId][_userId];
    }

    /**
     * Check if user has voted on a proposal
     * @param _proposalId ID of the proposal
     * @param _userId User ID as bytes32
     * @return Whether user has voted
     */
    function hasUserVoted(uint256 _proposalId, bytes32 _userId)
        public
        view
        returns (bool)
    {
        return hasVoted[_proposalId][_userId];
    }

    /**
     * Get vote counts for a proposal
     * @param _proposalId ID of the proposal
     * @return votesFor Total votes in favor
     * @return votesAgainst Total votes against
     * @return votesAbstain Total abstain votes
     */
    function getVoteCounts(uint256 _proposalId)
        public
        view
        returns (uint256 votesFor, uint256 votesAgainst, uint256 votesAbstain)
    {
        Proposal memory proposal = proposals[_proposalId];
        return (proposal.votesFor, proposal.votesAgainst, proposal.votesAbstain);
    }
}
