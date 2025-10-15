// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GovernanceDAO {
    enum ProposalType { URGENCY_UPDATE, PATIENT_REMOVAL, SYSTEM_PARAMETER, EMERGENCY_OVERRIDE }
    enum UrgencyLevel { EMERGENCY, STANDARD }

    struct Proposal {
        uint256 proposalId;
        ProposalType proposalType;
        bytes32 patientHash;
        uint256 currentValue;
        uint256 proposedValue;
        uint256 createdAt;
        uint256 votingDeadline;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;

    event ProposalCreated(uint256 proposalId);

    function createProposal(
        ProposalType _type,
        UrgencyLevel _urgency,
        bytes32 _patientHash,
        uint256 _currentValue,
        uint256 _proposedValue
    ) public returns (uint256) {
        proposalCount++;

        uint256 period = _urgency == UrgencyLevel.EMERGENCY ? 2 days : 7 days;

        proposals[proposalCount] = Proposal({
            proposalId: proposalCount,
            proposalType: _type,
            patientHash: _patientHash,
            currentValue: _currentValue,
            proposedValue: _proposedValue,
            createdAt: block.timestamp,
            votingDeadline: block.timestamp + period
        });

        emit ProposalCreated(proposalCount);
        return proposalCount;
    }
}
