// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MatchingEngine
 * @dev Automated organ matching based on medical compatibility and priority
 */
contract MatchingEngine {

    struct Organ {
        string organId;
        string organType;
        string bloodType;
        uint256 weight; // in grams
        address donorHospital;
        uint256 harvestTime;
        bool isAllocated;
        string allocatedToPatient;
        uint256 expiryTime; // Time before organ becomes non-viable
    }

    struct MatchScore {
        string patientId;
        uint256 score;
        string reason;
    }

    struct Allocation {
        string organId;
        string patientId;
        uint256 allocationTime;
        bool accepted;
        bool completed;
    }

    // State variables
    address public admin;
    address public waitlistContract;
    mapping(string => Organ) public organs;
    mapping(string => Allocation) public allocations;
    mapping(string => bool) public authorizedHospitals;

    string[] public organIds;
    string[] public allocationIds;

    // Blood type compatibility matrix
    mapping(string => string[]) public bloodCompatibility;

    // Events
    event OrganRegistered(string indexed organId, string organType, uint256 timestamp);
    event MatchFound(string indexed organId, string indexed patientId, uint256 score, uint256 timestamp);
    event AllocationAccepted(string indexed organId, string indexed patientId, uint256 timestamp);
    event AllocationRejected(string indexed organId, string indexed patientId, string reason, uint256 timestamp);
    event OrganExpired(string indexed organId, uint256 timestamp);

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == admin || authorizedHospitals[addressToString(msg.sender)],
                "Not authorized");
        _;
    }

    constructor(address _waitlistContract) {
        admin = msg.sender;
        waitlistContract = _waitlistContract;

        // Initialize blood compatibility
        bloodCompatibility["A+"] = ["A+", "A-", "O+", "O-"];
        bloodCompatibility["A-"] = ["A-", "O-"];
        bloodCompatibility["B+"] = ["B+", "B-", "O+", "O-"];
        bloodCompatibility["B-"] = ["B-", "O-"];
        bloodCompatibility["AB+"] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
        bloodCompatibility["AB-"] = ["A-", "B-", "AB-", "O-"];
        bloodCompatibility["O+"] = ["O+", "O-"];
        bloodCompatibility["O-"] = ["O-"];
    }

    /**
     * @dev Register a new organ for allocation
     */
    function registerOrgan(
        string memory _organId,
        string memory _organType,
        string memory _bloodType,
        uint256 _weight,
        uint256 _viabilityHours
    ) public onlyAuthorized {
        require(!organs[_organId].isAllocated, "Organ already exists");

        uint256 expiryTime = block.timestamp + (_viabilityHours * 1 hours);

        organs[_organId] = Organ({
            organId: _organId,
            organType: _organType,
            bloodType: _bloodType,
            weight: _weight,
            donorHospital: msg.sender,
            harvestTime: block.timestamp,
            isAllocated: false,
            allocatedToPatient: "",
            expiryTime: expiryTime
        });

        organIds.push(_organId);

        emit OrganRegistered(_organId, _organType, block.timestamp);
    }

    /**
     * @dev Find best match for an organ from waitlist
     * This is a simplified matching algorithm
     */
    function findMatch(string memory _organId, string[] memory _waitlistPatientIds)
        public view returns (string memory bestMatchPatientId, uint256 bestScore) {
        Organ memory organ = organs[_organId];
        require(!organ.isAllocated, "Organ already allocated");
        require(block.timestamp < organ.expiryTime, "Organ expired");
        bestScore = 0;
        bestMatchPatientId = "";
        for (uint256 i = 0; i < _waitlistPatientIds.length; i++) {
            string memory patientId = _waitlistPatientIds[i];
            uint256 score = calculateMatchScore(_organId, patientId);
            if (score > bestScore) {
                bestScore = score;
                bestMatchPatientId = patientId;
            }
        }
        return (bestMatchPatientId, bestScore);
    }

    /**
     * @dev Calculate match score between organ and patient
     */
    function calculateMatchScore(string memory _organId, string memory _patientId)
        public view returns (uint256) {

        Organ memory organ = organs[_organId];

        // In production, fetch patient data from WaitlistRegistry contract
        // For now, return a simplified score

        // Base score starts at 100
        uint256 score = 100;

        // Blood type compatibility check (mock implementation)
        // if (isBloodCompatible(organ.bloodType, patient.bloodType)) {
        //     score += 50;
        // }

        // Urgency bonus (would come from patient data)
        // score += patient.urgencyLevel * 20;

        // Wait time bonus (would come from patient data)
        // uint256 waitDays = (block.timestamp - patient.registrationTime) / 1 days;
        // score += waitDays;

        // Medical compatibility score
        // score += patient.medicalScore / 10;

        return score;
    }

    /**
     * @dev Allocate organ to patient
     */
    function allocateOrgan(string memory _organId, string memory _patientId)
        public onlyAuthorized {
        require(!organs[_organId].isAllocated, "Organ already allocated");
        require(block.timestamp < organs[_organId].expiryTime, "Organ expired");
        organs[_organId].isAllocated = true;
        organs[_organId].allocatedToPatient = _patientId;
        string memory allocationId = string(abi.encodePacked(_organId, "-", _patientId));
        allocations[allocationId] = Allocation({
            organId: _organId,
            patientId: _patientId,
            allocationTime: block.timestamp,
            accepted: false,
            completed: false
        });
        allocationIds.push(allocationId);

        emit MatchFound(_organId, _patientId, 0, block.timestamp);
    }

    /**
     * @dev Accept organ allocation
     */
    function acceptAllocation(string memory _allocationId) public onlyAuthorized {
        require(!allocations[_allocationId].accepted, "Already accepted");

        allocations[_allocationId].accepted = true;

        emit AllocationAccepted(
            allocations[_allocationId].organId,
            allocations[_allocationId].patientId,
            block.timestamp
        );
    }

    /**
     * @dev Reject organ allocation
     */
    function rejectAllocation(string memory _allocationId, string memory _reason)
        public onlyAuthorized {

        require(!allocations[_allocationId].accepted, "Already accepted");

        Allocation memory allocation = allocations[_allocationId];

        // Return organ to available pool
        organs[allocation.organId].isAllocated = false;
        organs[allocation.organId].allocatedToPatient = "";

        emit AllocationRejected(allocation.organId, allocation.patientId, _reason, block.timestamp);
    }

    /**
     * @dev Complete transplant
     */
    function completeTransplant(string memory _allocationId) public onlyAuthorized {
        require(allocations[_allocationId].accepted, "Allocation not accepted");

        allocations[_allocationId].completed = true;
    }

    /**
     * @dev Check if blood types are compatible
     */
    function isBloodCompatible(string memory _donorBlood, string memory _recipientBlood)
        public view returns (bool) {

        string[] memory compatible = bloodCompatibility[_recipientBlood];

        for (uint256 i = 0; i < compatible.length; i++) {
            if (keccak256(bytes(compatible[i])) == keccak256(bytes(_donorBlood))) {
                return true;
            }
        }

        return false;
    }

    /**
     * @dev Mark expired organs
     */
    function markExpiredOrgans() public {
        for (uint256 i = 0; i < organIds.length; i++) {
            string memory organId = organIds[i];
            Organ storage organ = organs[organId];

            if (!organ.isAllocated && block.timestamp >= organ.expiryTime) {
                organ.isAllocated = true; // Mark as unavailable
                emit OrganExpired(organId, block.timestamp);
            }
        }
    }

    /**
     * @dev Get organ details
     */
    function getOrgan(string memory _organId) public view returns (Organ memory) {
        return organs[_organId];
    }

    /**
     * @dev Get allocation details
     */
    function getAllocation(string memory _allocationId)
        public view returns (Allocation memory) {
        return allocations[_allocationId];
    }

    /**
     * @dev Authorize/deauthorize hospital
     */
    function authorizeHospital(address _hospital, bool _status) public onlyAdmin {
        authorizedHospitals[addressToString(_hospital)] = _status;
    }

    /**
     * @dev Convert address to string
     */
    function addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }

    /**
     * @dev Get available organs
     */
    function getAvailableOrgans() public view returns (string[] memory) {
        uint256 count = 0;

        // Count available organs
        for (uint256 i = 0; i < organIds.length; i++) {
            if (!organs[organIds[i]].isAllocated &&
                block.timestamp < organs[organIds[i]].expiryTime) {
                count++;
            }
        }

        // Build array
        string[] memory available = new string[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < organIds.length; i++) {
            if (!organs[organIds[i]].isAllocated &&
                block.timestamp < organs[organIds[i]].expiryTime) {
                available[index] = organIds[i];
                index++;
            }
        }

        return available;
    }
}
