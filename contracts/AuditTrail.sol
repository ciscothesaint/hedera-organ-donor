// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AuditTrail
 * @dev Immutable logging system for all operations in the organ waitlist system
 */
contract AuditTrail {

    enum ActionType {
        PATIENT_REGISTERED,
        PATIENT_UPDATED,
        PATIENT_REMOVED,
        ORGAN_REGISTERED,
        ORGAN_ALLOCATED,
        ALLOCATION_ACCEPTED,
        ALLOCATION_REJECTED,
        TRANSPLANT_COMPLETED,
        URGENCY_CHANGED,
        HOSPITAL_AUTHORIZED,
        SYSTEM_CONFIG_CHANGED
    }

    struct AuditLog {
        uint256 logId;
        ActionType actionType;
        address actor;
        string entityId; // Patient ID or Organ ID
        string details;
        uint256 timestamp;
        bytes32 dataHash; // Hash of additional data for verification
    }

    struct AccessLog {
        address accessor;
        string action;
        string resource;
        uint256 timestamp;
        bool authorized;
    }

    // State variables
    address public admin;
    mapping(uint256 => AuditLog) public auditLogs;
    mapping(uint256 => AccessLog) public accessLogs;
    mapping(address => bool) public authorizedContracts;

    uint256 public auditLogCount;
    uint256 public accessLogCount;

    // Events
    event AuditLogCreated(uint256 indexed logId, ActionType actionType, address indexed actor, uint256 timestamp);
    event AccessLogCreated(uint256 indexed logId, address indexed accessor, string action, uint256 timestamp);
    event ContractAuthorized(address indexed contractAddress, bool status);

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == admin || authorizedContracts[msg.sender],
                "Not authorized");
        _;
    }

    constructor() {
        admin = msg.sender;
        auditLogCount = 0;
        accessLogCount = 0;
    }

    /**
     * @dev Create audit log entry
     */
    function createAuditLog(
        ActionType _actionType,
        address _actor,
        string memory _entityId,
        string memory _details,
        bytes memory _data
    ) public onlyAuthorized returns (uint256) {

        uint256 logId = auditLogCount++;
        bytes32 dataHash = keccak256(_data);

        auditLogs[logId] = AuditLog({
            logId: logId,
            actionType: _actionType,
            actor: _actor,
            entityId: _entityId,
            details: _details,
            timestamp: block.timestamp,
            dataHash: dataHash
        });

        emit AuditLogCreated(logId, _actionType, _actor, block.timestamp);

        return logId;
    }

    /**
     * @dev Create access log entry
     */
    function createAccessLog(
        address _accessor,
        string memory _action,
        string memory _resource,
        bool _authorized
    ) public onlyAuthorized returns (uint256) {

        uint256 logId = accessLogCount++;

        accessLogs[logId] = AccessLog({
            accessor: _accessor,
            action: _action,
            resource: _resource,
            timestamp: block.timestamp,
            authorized: _authorized
        });

        emit AccessLogCreated(logId, _accessor, _action, block.timestamp);

        return logId;
    }

    /**
     * @dev Log patient registration
     */
    function logPatientRegistration(
        address _actor,
        string memory _patientId,
        string memory _organType
    ) public onlyAuthorized {

        string memory details = string(abi.encodePacked(
            "Patient registered for ", _organType, " transplant"
        ));

        createAuditLog(
            ActionType.PATIENT_REGISTERED,
            _actor,
            _patientId,
            details,
            abi.encode(_patientId, _organType)
        );
    }

    /**
     * @dev Log urgency change
     */
    function logUrgencyChange(
        address _actor,
        string memory _patientId,
        uint8 _oldUrgency,
        uint8 _newUrgency
    ) public onlyAuthorized {

        string memory details = string(abi.encodePacked(
            "Urgency changed from ",
            uint2str(_oldUrgency),
            " to ",
            uint2str(_newUrgency)
        ));

        createAuditLog(
            ActionType.URGENCY_CHANGED,
            _actor,
            _patientId,
            details,
            abi.encode(_patientId, _oldUrgency, _newUrgency)
        );
    }

    /**
     * @dev Log organ registration
     */
    function logOrganRegistration(
        address _actor,
        string memory _organId,
        string memory _organType
    ) public onlyAuthorized {

        string memory details = string(abi.encodePacked(
            "Organ registered: ", _organType
        ));

        createAuditLog(
            ActionType.ORGAN_REGISTERED,
            _actor,
            _organId,
            details,
            abi.encode(_organId, _organType)
        );
    }

    /**
     * @dev Log organ allocation
     */
    function logOrganAllocation(
        address _actor,
        string memory _organId,
        string memory _patientId
    ) public onlyAuthorized {

        string memory details = string(abi.encodePacked(
            "Organ ", _organId, " allocated to patient ", _patientId
        ));

        createAuditLog(
            ActionType.ORGAN_ALLOCATED,
            _actor,
            _organId,
            details,
            abi.encode(_organId, _patientId)
        );
    }

    /**
     * @dev Log allocation acceptance
     */
    function logAllocationAccepted(
        address _actor,
        string memory _organId,
        string memory _patientId
    ) public onlyAuthorized {

        string memory details = string(abi.encodePacked(
            "Allocation accepted for patient ", _patientId
        ));

        createAuditLog(
            ActionType.ALLOCATION_ACCEPTED,
            _actor,
            _organId,
            details,
            abi.encode(_organId, _patientId)
        );
    }

    /**
     * @dev Log allocation rejection
     */
    function logAllocationRejected(
        address _actor,
        string memory _organId,
        string memory _patientId,
        string memory _reason
    ) public onlyAuthorized {

        string memory details = string(abi.encodePacked(
            "Allocation rejected: ", _reason
        ));

        createAuditLog(
            ActionType.ALLOCATION_REJECTED,
            _actor,
            _organId,
            details,
            abi.encode(_organId, _patientId, _reason)
        );
    }

    /**
     * @dev Log transplant completion
     */
    function logTransplantCompleted(
        address _actor,
        string memory _organId,
        string memory _patientId
    ) public onlyAuthorized {

        string memory details = string(abi.encodePacked(
            "Transplant completed for patient ", _patientId
        ));

        createAuditLog(
            ActionType.TRANSPLANT_COMPLETED,
            _actor,
            _organId,
            details,
            abi.encode(_organId, _patientId)
        );
    }

    /**
     * @dev Get audit log by ID
     */
    function getAuditLog(uint256 _logId) public view returns (AuditLog memory) {
        require(_logId < auditLogCount, "Log does not exist");
        return auditLogs[_logId];
    }

    /**
     * @dev Get access log by ID
     */
    function getAccessLog(uint256 _logId) public view returns (AccessLog memory) {
        require(_logId < accessLogCount, "Log does not exist");
        return accessLogs[_logId];
    }

    /**
     * @dev Get logs for specific entity
     */
    function getLogsForEntity(string memory _entityId)
        public view returns (uint256[] memory) {

        uint256 count = 0;

        // Count matching logs
        for (uint256 i = 0; i < auditLogCount; i++) {
            if (keccak256(bytes(auditLogs[i].entityId)) == keccak256(bytes(_entityId))) {
                count++;
            }
        }

        // Build array
        uint256[] memory logIds = new uint256[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < auditLogCount; i++) {
            if (keccak256(bytes(auditLogs[i].entityId)) == keccak256(bytes(_entityId))) {
                logIds[index] = i;
                index++;
            }
        }

        return logIds;
    }

    /**
     * @dev Get logs by action type
     */
    function getLogsByActionType(ActionType _actionType)
        public view returns (uint256[] memory) {

        uint256 count = 0;

        // Count matching logs
        for (uint256 i = 0; i < auditLogCount; i++) {
            if (auditLogs[i].actionType == _actionType) {
                count++;
            }
        }

        // Build array
        uint256[] memory logIds = new uint256[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < auditLogCount; i++) {
            if (auditLogs[i].actionType == _actionType) {
                logIds[index] = i;
                index++;
            }
        }

        return logIds;
    }

    /**
     * @dev Get logs within time range
     */
    function getLogsByTimeRange(uint256 _startTime, uint256 _endTime)
        public view returns (uint256[] memory) {

        uint256 count = 0;

        // Count matching logs
        for (uint256 i = 0; i < auditLogCount; i++) {
            if (auditLogs[i].timestamp >= _startTime &&
                auditLogs[i].timestamp <= _endTime) {
                count++;
            }
        }

        // Build array
        uint256[] memory logIds = new uint256[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < auditLogCount; i++) {
            if (auditLogs[i].timestamp >= _startTime &&
                auditLogs[i].timestamp <= _endTime) {
                logIds[index] = i;
                index++;
            }
        }

        return logIds;
    }

    /**
     * @dev Authorize contract to create logs
     */
    function authorizeContract(address _contract, bool _status) public onlyAdmin {
        authorizedContracts[_contract] = _status;
        emit ContractAuthorized(_contract, _status);
    }

    /**
     * @dev Verify log data integrity
     */
    function verifyLogData(uint256 _logId, bytes memory _data)
        public view returns (bool) {

        require(_logId < auditLogCount, "Log does not exist");
        return auditLogs[_logId].dataHash == keccak256(_data);
    }

    /**
     * @dev Convert uint to string
     */
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    /**
     * @dev Get total audit logs
     */
    function getTotalAuditLogs() public view returns (uint256) {
        return auditLogCount;
    }

    /**
     * @dev Get total access logs
     */
    function getTotalAccessLogs() public view returns (uint256) {
        return accessLogCount;
    }
}
