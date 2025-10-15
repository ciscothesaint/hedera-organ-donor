// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title GovernanceDAO (Simplified for Deployment)
 * @dev Simplified DAO contract that compiles without stack depth issues
 */
contract GovernanceDAO {

    // Enums
    enum ProposalType { URGENCY_UPDATE, PATIENT_REMOVAL, SYSTEM_PARAMETER, EMERGENCY_OVERRIDE }
    enum VoteChoice { APPROVE, REJECT, ABSTAIN }
    enum ProposalStatus { PENDING, ACTIVE, APPROVED, REJECTED, EXECUTED, EXPIRED }
    enum UrgencyLevel { EMERGENCY, STANDARD }

    // Simplified structs
    struct Doctor {
        bool isAuthorized;
        uint256 votingPower;
        uint256 totalVotesCast;
    }

    struct Proposal {
        uint256 proposalId;
        ProposalType proposalType;
        UrgencyLevel urgency;
        bytes32 patientHash;
        uint256 currentValue;
        uint256 proposedValue;
        address creator;
        uint256 createdAt;
        uint256 votingDeadline;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votesAbstain;
        ProposalStatus status;
    }

    struct Vote {
        address voter;
        VoteChoice choice;
        uint256 votingPower;
        uint256 timestamp;
    }

    // State
    address public admin;
    uint256 public proposalCount;
    uint256 public totalAuthorizedDoctors;

    mapping(address => Doctor) public doctors;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => Vote[]) public proposalVotes;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    uint256 public emergencyVotingPeriod = 2 days;
    uint256 public standardVotingPeriod = 7 days;

    // Events
    event DoctorAuthorized(address indexed doctor, uint256 votingPower);
    event ProposalCreated(uint256 indexed proposalId, address creator);
    event VoteCast(uint256 indexed proposalId, address indexed voter, VoteChoice choice);
    event ProposalFinalized(uint256 indexed proposalId, ProposalStatus status);

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyAuthorizedDoctor() {
        require(doctors[msg.sender].isAuthorized, "Not authorized");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // Doctor management
    function authorizeDoctor(address _doctor, uint256 _votingPower) public onlyAdmin {
        require(!doctors[_doctor].isAuthorized, "Already authorized");
        require(_votingPower > 0 && _votingPower <= 10, "Invalid power");

        doctors[_doctor].isAuthorized = true;
        doctors[_doctor].votingPower = _votingPower;
        totalAuthorizedDoctors++;

        emit DoctorAuthorized(_doctor, _votingPower);
    }

    function revokeDoctor(address _doctor) public onlyAdmin {
        require(doctors[_doctor].isAuthorized, "Not authorized");
        doctors[_doctor].isAuthorized = false;
        totalAuthorizedDoctors--;
    }

    // Proposal creation
    function createProposal(
        ProposalType _type,
        UrgencyLevel _urgency,
        bytes32 _patientHash,
        uint256 _currentValue,
        uint256 _proposedValue
    ) public returns (uint256) {
        proposalCount++;

        Proposal storage p = proposals[proposalCount];
        p.proposalId = proposalCount;
        p.proposalType = _type;
        p.urgency = _urgency;
        p.patientHash = _patientHash;
        p.currentValue = _currentValue;
        p.proposedValue = _proposedValue;
        p.creator = msg.sender;
        p.createdAt = block.timestamp;
        p.votingDeadline = block.timestamp +
            (_urgency == UrgencyLevel.EMERGENCY ? emergencyVotingPeriod : standardVotingPeriod);
        p.status = ProposalStatus.ACTIVE;

        emit ProposalCreated(proposalCount, msg.sender);
        return proposalCount;
    }

    // Voting
    function vote(uint256 _proposalId, VoteChoice _choice) public {
        require(!hasVoted[_proposalId][msg.sender], "Already voted");
        require(proposals[_proposalId].status == ProposalStatus.ACTIVE, "Not active");
        require(block.timestamp <= proposals[_proposalId].votingDeadline, "Expired");

        Proposal storage p = proposals[_proposalId];
        uint256 power = doctors[msg.sender].votingPower;

        hasVoted[_proposalId][msg.sender] = true;
        doctors[msg.sender].totalVotesCast++;

        if (_choice == VoteChoice.APPROVE) {
            p.votesFor += power;
        } else if (_choice == VoteChoice.REJECT) {
            p.votesAgainst += power;
        } else {
            p.votesAbstain += power;
        }

        proposalVotes[_proposalId].push(Vote({
            voter: msg.sender,
            choice: _choice,
            votingPower: power,
            timestamp: block.timestamp
        }));

        emit VoteCast(_proposalId, msg.sender, _choice);
    }

    // Finalization
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

    // View functions
    function getProposal(uint256 _proposalId) public view returns (Proposal memory) {
        return proposals[_proposalId];
    }

    function getVotes(uint256 _proposalId) public view returns (Vote[] memory) {
        return proposalVotes[_proposalId];
    }

    function isAuthorized(address _doctor) public view returns (bool) {
        return doctors[_doctor].isAuthorized;
    }
}
