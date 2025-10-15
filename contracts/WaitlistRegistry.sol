// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title WaitlistRegistry
 * @dev Manages patient registration and waitlist queue for organ transplants
 */
contract WaitlistRegistry {

    struct Patient {
        address patientAddress;
        string patientId;
        string organType; // HEART, LIVER, KIDNEY, LUNG, PANCREAS
        uint8 urgencyLevel; // 1 (lowest) to 5 (highest)
        uint256 registrationTime;
        uint256 medicalScore; // Based on medical criteria
        bool isActive;
        string bloodType;
        uint256 weight; // in kg
        uint256 height; // in cm
    }

    struct WaitlistEntry {
        string patientId;
        uint256 position;
        uint256 score; // Composite score for ranking
        bool isMatched;
    }

    // State variables
    address public admin;
    mapping(string => Patient) public patients;
    mapping(string => WaitlistEntry[]) public organWaitlists; // organType => waitlist
    mapping(string => bool) public authorizedHospitals;

    string[] public patientIds;
    string[] public organTypes;

    // Events
    event PatientRegistered(
        string indexed patientId,
        address patientAddress,
        string firstName,
        string lastName,
        string organType,
        string bloodType,
        uint8 urgencyLevel,
        uint256 medicalScore,
        uint256 weight,
        uint256 height,
        bool isActive,
        uint256 timestamp
    );
    event UrgencyUpdated(string indexed patientId, uint8 newUrgency, uint256 timestamp);
    event PatientRemoved(string indexed patientId, string reason, uint256 timestamp);
    event WaitlistUpdated(string indexed organType, uint256 timestamp);
    event HospitalAuthorized(address indexed hospital, bool status);

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

    constructor() {
        admin = msg.sender;
        // Initialize organ types
        organTypes = ["HEART", "LIVER", "KIDNEY", "LUNG", "PANCREAS"];
    }

    /**
     * @dev Register a new patient on the waitlist
     */
    function registerPatient(
        string memory _patientId,
        string memory _firstName,
        string memory _lastName,
        string memory _organType,
        uint8 _urgencyLevel,
        uint256 _medicalScore,
        string memory _bloodType,
        uint256 _weight,
        uint256 _height
    ) public {
        require(!patients[_patientId].isActive, "Patient already registered");
        require(_urgencyLevel >= 1 && _urgencyLevel <= 5, "Invalid urgency level");
        require(isValidOrganType(_organType), "Invalid organ type");

        patients[_patientId] = Patient({
            patientAddress: msg.sender,
            patientId: _patientId,
            organType: _organType,
            urgencyLevel: _urgencyLevel,
            registrationTime: block.timestamp,
            medicalScore: _medicalScore,
            isActive: true,
            bloodType: _bloodType,
            weight: _weight,
            height: _height
        });

        patientIds.push(_patientId);

        // Add to waitlist
        addToWaitlist(_patientId, _organType);

        emit PatientRegistered(
            _patientId,
            msg.sender,
            _firstName,
            _lastName,
            _organType,
            _bloodType,
            _urgencyLevel,
            _medicalScore,
            _weight,
            _height,
            true, // isActive
            block.timestamp
        );
    }

    /**
     * @dev Add patient to organ-specific waitlist
     */
    function addToWaitlist(string memory _patientId, string memory _organType) internal {
        Patient memory patient = patients[_patientId];

        // Calculate composite score (urgency * 10 + medical score + wait time bonus)
        uint256 waitTimeBonus = (block.timestamp - patient.registrationTime) / 1 days;
        uint256 compositeScore = (patient.urgencyLevel * 1000) + patient.medicalScore + waitTimeBonus;

        WaitlistEntry memory entry = WaitlistEntry({
            patientId: _patientId,
            position: organWaitlists[_organType].length,
            score: compositeScore,
            isMatched: false
        });

        organWaitlists[_organType].push(entry);
        sortWaitlist(_organType);

        emit WaitlistUpdated(_organType, block.timestamp);
    }

    /**
     * @dev Update patient urgency level
     */
    function updateUrgency(string memory _patientId, uint8 _newUrgency)
        public {
        require(patients[_patientId].isActive, "Patient not found or inactive");
        require(_newUrgency >= 1 && _newUrgency <= 5, "Invalid urgency level");

        patients[_patientId].urgencyLevel = _newUrgency;

        // Recalculate waitlist position
        string memory organType = patients[_patientId].organType;
        removeFromWaitlist(_patientId, organType);
        addToWaitlist(_patientId, organType);

        emit UrgencyUpdated(_patientId, _newUrgency, block.timestamp);
    }

    /**
     * @dev Remove patient from waitlist
     */
    function removePatient(string memory _patientId, string memory _reason)
        public {
        require(patients[_patientId].isActive, "Patient not active");

        string memory organType = patients[_patientId].organType;
        patients[_patientId].isActive = false;

        removeFromWaitlist(_patientId, organType);

        emit PatientRemoved(_patientId, _reason, block.timestamp);
    }

    /**
     * @dev Remove patient from organ waitlist
     */
    function removeFromWaitlist(string memory _patientId, string memory _organType) internal {
        WaitlistEntry[] storage waitlist = organWaitlists[_organType];

        for (uint256 i = 0; i < waitlist.length; i++) {
            if (keccak256(bytes(waitlist[i].patientId)) == keccak256(bytes(_patientId))) {
                waitlist[i] = waitlist[waitlist.length - 1];
                waitlist.pop();
                sortWaitlist(_organType);
                break;
            }
        }
    }

    /**
     * @dev Sort waitlist by composite score (descending)
     */
    function sortWaitlist(string memory _organType) internal {
        WaitlistEntry[] storage waitlist = organWaitlists[_organType];
        uint256 length = waitlist.length;

        for (uint256 i = 0; i < length; i++) {
            for (uint256 j = i + 1; j < length; j++) {
                if (waitlist[i].score < waitlist[j].score) {
                    WaitlistEntry memory temp = waitlist[i];
                    waitlist[i] = waitlist[j];
                    waitlist[j] = temp;
                }
            }
        }

        // Update positions
        for (uint256 i = 0; i < length; i++) {
            waitlist[i].position = i;
        }
    }

    /**
     * @dev Get waitlist for specific organ type
     */
    function getWaitlist(string memory _organType)
        public view returns (WaitlistEntry[] memory) {
        return organWaitlists[_organType];
    }

    /**
     * @dev Get patient details
     */
    function getPatient(string memory _patientId)
        public view returns (Patient memory) {
        return patients[_patientId];
    }

    /**
     * @dev Authorize/deauthorize hospital
     */
    function authorizeHospital(address _hospital, bool _status) public onlyAdmin {
        authorizedHospitals[addressToString(_hospital)] = _status;
        emit HospitalAuthorized(_hospital, _status);
    }

    /**
     * @dev Check if organ type is valid
     */
    function isValidOrganType(string memory _organType) internal view returns (bool) {
        for (uint256 i = 0; i < organTypes.length; i++) {
            if (keccak256(bytes(organTypes[i])) == keccak256(bytes(_organType))) {
                return true;
            }
        }
        return false;
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
     * @dev Get total patients registered
     */
    function getTotalPatients() public view returns (uint256) {
        return patientIds.length;
    }
}
