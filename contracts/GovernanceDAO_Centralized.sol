// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title GovernanceDAO (Centralized Backend Model)
 * @dev Simplified DAO contract where backend acts as trusted oracle
 * All transactions are signed by backend wallet, voter identity passed as parameter
 */
contract GovernanceDAO_Centralized {

    // Enums
    enum ProposalType { URGENCY_UPDATE, PATIENT_REMOVAL, SYSTEM_PARAMETER, EMERGENCY_OVERRIDE }
    enum VoteChoice { APPROVE, REJECT, ABSTAIN }
    enum ProposalStatus { PENDING, ACTIVE, APPROVED, REJECTED, EXECUTED, EXPIRED }
    enum UrgencyLevel { EMERGENCY, STANDARD }

    // Structs
    struct Proposal {
        uint256 proposalId;
        ProposalType proposalType;
        UrgencyLevel urgency;
        bytes32 patientHash;
        uint256 currentValue;
        uint256 proposedValue;
        string creatorId;  // Database user ID instead of wallet
        uint256 createdAt;
        uint256 votingDeadline;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votesAbstain;
        ProposalStatus status;
    }

    struct Vote {
        string voterId;  // Database user ID
        VoteChoice choice;
        uint256 votingPower;
        uint256 timestamp;
    }

    // State
    address public admin;
    address public trustedBackend;  // Backend wallet that submits votes
    uint256 public proposalCount;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => Vote[]) public proposalVotes;
    mapping(uint256 => mapping(string => bool)) public hasVoted;  // proposalId => voterId => bool

    uint256 public emergencyVotingPeriod = 2 days;
    uint256 public standardVotingPeriod = 7 days;

    // Events
    event ProposalCreated(uint256 indexed proposalId, string creatorId, ProposalType proposalType);
    event VoteCast(uint256 indexed proposalId, string voterId, VoteChoice choice, uint256 votingPower);
    event ProposalFinalized(uint256 indexed proposalId, ProposalStatus status);
    event ProposalExecuted(uint256 indexed proposalId);

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyTrustedBackend() {
        require(msg.sender == trustedBackend, "Only trusted backend");
        _;
    }

    constructor(address _trustedBackend) {
        admin = msg.sender;
        trustedBackend = _trustedBackend;
    }

    /**
     * Update trusted backend address (admin only)
     */
    function setTrustedBackend(address _newBackend) public onlyAdmin {
        trustedBackend = _newBackend;
    }

    /**
     * Create proposal (backend submits on behalf of doctor)
     */
    function createProposal(
        ProposalType _type,
        UrgencyLevel _urgency,
        bytes32 _patientHash,
        uint256 _currentValue,
        uint256 _proposedValue,
        string memory _creatorId
    ) public returns (uint256) {
        proposalCount++;

        Proposal storage p = proposals[proposalCount];
        p.proposalId = proposalCount;
        p.proposalType = _type;
        p.urgency = _urgency;
        p.patientHash = _patientHash;
        p.currentValue = _currentValue;
        p.proposedValue = _proposedValue;
        p.creatorId = _creatorId;
        p.createdAt = block.timestamp;
        p.votingDeadline = block.timestamp +
            (_urgency == UrgencyLevel.EMERGENCY ? emergencyVotingPeriod : standardVotingPeriod);
        p.status = ProposalStatus.ACTIVE;

        emit ProposalCreated(proposalCount, _creatorId, _type);
        return proposalCount;
    }

    /**
     * Submit vote (backend submits on behalf of doctor)
     * Backend verifies doctor authorization before calling this
     */
    function vote(
        uint256 _proposalId,
        string memory _voterId,
        VoteChoice _choice,
        uint256 _votingPower
    ) public {
        require(!hasVoted[_proposalId][_voterId], "Already voted");
        require(proposals[_proposalId].status == ProposalStatus.ACTIVE, "Not active");
        require(block.timestamp <= proposals[_proposalId].votingDeadline, "Expired");
        require(_votingPower > 0 && _votingPower <= 10, "Invalid voting power");

        Proposal storage p = proposals[_proposalId];

        hasVoted[_proposalId][_voterId] = true;

        if (_choice == VoteChoice.APPROVE) {
            p.votesFor += _votingPower;
        } else if (_choice == VoteChoice.REJECT) {
            p.votesAgainst += _votingPower;
        } else {
            p.votesAbstain += _votingPower;
        }

        proposalVotes[_proposalId].push(Vote({
            voterId: _voterId,
            choice: _choice,
            votingPower: _votingPower,
            timestamp: block.timestamp
        }));

        emit VoteCast(_proposalId, _voterId, _choice, _votingPower);
    }

    /**
     * Finalize proposal after voting period
     */
    function finalizeProposal(uint256 _proposalId) public {
        Proposal storage p = proposals[_proposalId];
        require(p.status == ProposalStatus.ACTIVE, "Not active");
        require(block.timestamp > p.votingDeadline, "Not ended");

        uint256 total = p.votesFor + p.votesAgainst;
        if (total == 0) {
            p.status = ProposalStatus.REJECTED;
        } else {
            uint256 approvalPct = (p.votesFor * 100) / total;
            uint256 threshold = p.urgency == UrgencyLevel.EMERGENCY ? 66 : 60;

            p.status = approvalPct >= threshold ? ProposalStatus.APPROVED : ProposalStatus.REJECTED;
        }

        emit ProposalFinalized(_proposalId, p.status);
    }

    /**
     * Execute approved proposal
     */
    function executeProposal(uint256 _proposalId) public {
        Proposal storage p = proposals[_proposalId];
        require(p.status == ProposalStatus.APPROVED, "Not approved");

        p.status = ProposalStatus.EXECUTED;
        emit ProposalExecuted(_proposalId);
    }

    // View functions
    function getProposal(uint256 _proposalId) public view returns (Proposal memory) {
        return proposals[_proposalId];
    }

    function getVotes(uint256 _proposalId) public view returns (Vote[] memory) {
        return proposalVotes[_proposalId];
    }

    function hasUserVoted(uint256 _proposalId, string memory _voterId) public view returns (bool) {
        return hasVoted[_proposalId][_voterId];
    }

    function getVoteCount(uint256 _proposalId) public view returns (uint256) {
        return proposalVotes[_proposalId].length;
    }
}
