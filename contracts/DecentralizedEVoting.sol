// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DecentralizedEVoting
 * @dev Immutable voting smart contract with SHA-256 hashing
 * @author SRM Valliammai Engineering College - MCA Section 2
 */
contract DecentralizedEVoting {
    
    // ============================================================
    // STRUCTS
    // ============================================================
    
    struct Candidate {
        uint256 id;
        string name;
        string party;
        string symbol;
        uint256 voteCount;
        bool exists;
    }

    struct Election {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool resultsPublished;
        uint256 totalVotes;
    }

    struct VoteRecord {
        bytes32 voteHash;       // SHA-256 hash of vote for immutability
        uint256 timestamp;
        uint256 electionId;
        bool hasVoted;
    }

    // ============================================================
    // STATE VARIABLES
    // ============================================================

    address public owner;
    uint256 public electionCount;
    uint256 public candidateCount;
    uint256 public totalVotesCast;

    mapping(uint256 => Election) public elections;
    mapping(uint256 => Candidate) public candidates;
    mapping(uint256 => uint256[]) public electionCandidates; // electionId => candidateIds[]
    mapping(address => mapping(uint256 => VoteRecord)) public voterRecords; // voter => electionId => record
    mapping(bytes32 => bool) public usedVoteHashes; // prevent duplicate hashes
    
    // ============================================================
    // EVENTS
    // ============================================================

    event ElectionCreated(uint256 indexed electionId, string title, uint256 startTime, uint256 endTime);
    event ElectionStatusChanged(uint256 indexed electionId, bool isActive);
    event CandidateAdded(uint256 indexed electionId, uint256 indexed candidateId, string name, string party);
    event VoteCast(uint256 indexed electionId, bytes32 voteHash, uint256 timestamp);
    event ResultsPublished(uint256 indexed electionId, uint256 winnerCandidateId);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ============================================================
    // MODIFIERS
    // ============================================================

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can perform this action");
        _;
    }

    modifier electionExists(uint256 _electionId) {
        require(_electionId > 0 && _electionId <= electionCount, "Election does not exist");
        _;
    }

    modifier electionActive(uint256 _electionId) {
        require(elections[_electionId].isActive, "Election is not active");
        require(block.timestamp >= elections[_electionId].startTime, "Election has not started yet");
        require(block.timestamp <= elections[_electionId].endTime, "Election has ended");
        _;
    }

    modifier hasNotVoted(uint256 _electionId) {
        require(!voterRecords[msg.sender][_electionId].hasVoted, "You have already voted in this election");
        _;
    }

    // ============================================================
    // CONSTRUCTOR
    // ============================================================

    constructor() {
        owner = msg.sender;
        electionCount = 0;
        candidateCount = 0;
        totalVotesCast = 0;
    }

    // ============================================================
    // ADMIN FUNCTIONS
    // ============================================================

    /**
     * @dev Create a new election
     */
    function createElection(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime
    ) external onlyOwner returns (uint256) {
        require(bytes(_title).length > 0, "Election title cannot be empty");
        require(_endTime > _startTime, "End time must be after start time");
        require(_startTime >= block.timestamp, "Start time must be in the future");

        electionCount++;
        elections[electionCount] = Election({
            id: electionCount,
            title: _title,
            description: _description,
            startTime: _startTime,
            endTime: _endTime,
            isActive: true,
            resultsPublished: false,
            totalVotes: 0
        });

        emit ElectionCreated(electionCount, _title, _startTime, _endTime);
        return electionCount;
    }

    /**
     * @dev Add a candidate to an election
     */
    function addCandidate(
        uint256 _electionId,
        string memory _name,
        string memory _party,
        string memory _symbol
    ) external onlyOwner electionExists(_electionId) returns (uint256) {
        require(bytes(_name).length > 0, "Candidate name cannot be empty");
        require(!elections[_electionId].resultsPublished, "Cannot add candidates after results published");

        candidateCount++;
        candidates[candidateCount] = Candidate({
            id: candidateCount,
            name: _name,
            party: _party,
            symbol: _symbol,
            voteCount: 0,
            exists: true
        });

        electionCandidates[_electionId].push(candidateCount);

        emit CandidateAdded(_electionId, candidateCount, _name, _party);
        return candidateCount;
    }

    /**
     * @dev Toggle election active status
     */
    function toggleElectionStatus(uint256 _electionId) 
        external 
        onlyOwner 
        electionExists(_electionId) 
    {
        elections[_electionId].isActive = !elections[_electionId].isActive;
        emit ElectionStatusChanged(_electionId, elections[_electionId].isActive);
    }

    /**
     * @dev Publish election results
     */
    function publishResults(uint256 _electionId) 
        external 
        onlyOwner 
        electionExists(_electionId) 
    {
        require(!elections[_electionId].isActive || block.timestamp > elections[_electionId].endTime, 
                "Election is still active");
        elections[_electionId].resultsPublished = true;
        
        uint256 winnerId = getWinner(_electionId);
        emit ResultsPublished(_electionId, winnerId);
    }

    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }

    // ============================================================
    // VOTER FUNCTIONS
    // ============================================================

    /**
     * @dev Cast a vote with SHA-256 hash for immutability
     * @param _electionId The election to vote in
     * @param _candidateId The candidate to vote for
     * @param _voterIdHash SHA-256 hash of voter identifier (anonymity)
     */
    function castVote(
        uint256 _electionId,
        uint256 _candidateId,
        bytes32 _voterIdHash
    ) external electionExists(_electionId) electionActive(_electionId) hasNotVoted(_electionId) {
        require(candidates[_candidateId].exists, "Candidate does not exist");
        
        // Verify candidate belongs to this election
        bool candidateInElection = false;
        uint256[] memory elCandidates = electionCandidates[_electionId];
        for (uint256 i = 0; i < elCandidates.length; i++) {
            if (elCandidates[i] == _candidateId) {
                candidateInElection = true;
                break;
            }
        }
        require(candidateInElection, "Candidate is not in this election");

        // Generate immutable vote hash using SHA-256
        bytes32 voteHash = keccak256(abi.encodePacked(
            _voterIdHash,
            _electionId,
            _candidateId,
            block.timestamp,
            block.number
        ));

        require(!usedVoteHashes[voteHash], "Duplicate vote hash detected");

        // Record vote (anonymous - no address stored in vote record)
        usedVoteHashes[voteHash] = true;
        voterRecords[msg.sender][_electionId] = VoteRecord({
            voteHash: voteHash,
            timestamp: block.timestamp,
            electionId: _electionId,
            hasVoted: true
        });

        // Update counts
        candidates[_candidateId].voteCount++;
        elections[_electionId].totalVotes++;
        totalVotesCast++;

        emit VoteCast(_electionId, voteHash, block.timestamp);
    }

    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================

    /**
     * @dev Get all candidates for an election
     */
    function getElectionCandidates(uint256 _electionId) 
        external 
        view 
        electionExists(_electionId) 
        returns (Candidate[] memory) 
    {
        uint256[] memory candIds = electionCandidates[_electionId];
        Candidate[] memory cands = new Candidate[](candIds.length);
        for (uint256 i = 0; i < candIds.length; i++) {
            cands[i] = candidates[candIds[i]];
        }
        return cands;
    }

    /**
     * @dev Get election details
     */
    function getElection(uint256 _electionId) 
        external 
        view 
        electionExists(_electionId) 
        returns (Election memory) 
    {
        return elections[_electionId];
    }

    /**
     * @dev Get all elections
     */
    function getAllElections() external view returns (Election[] memory) {
        Election[] memory allElections = new Election[](electionCount);
        for (uint256 i = 1; i <= electionCount; i++) {
            allElections[i - 1] = elections[i];
        }
        return allElections;
    }

    /**
     * @dev Check if voter has voted in an election
     */
    function hasVoted(address _voter, uint256 _electionId) external view returns (bool) {
        return voterRecords[_voter][_electionId].hasVoted;
    }

    /**
     * @dev Get voter's vote record (for verification, no candidate revealed)
     */
    function getVoterRecord(address _voter, uint256 _electionId) 
        external 
        view 
        returns (VoteRecord memory) 
    {
        return voterRecords[_voter][_electionId];
    }

    /**
     * @dev Get winner of an election
     */
    function getWinner(uint256 _electionId) 
        public 
        view 
        electionExists(_electionId) 
        returns (uint256 winnerId) 
    {
        uint256[] memory candIds = electionCandidates[_electionId];
        uint256 maxVotes = 0;
        winnerId = 0;

        for (uint256 i = 0; i < candIds.length; i++) {
            if (candidates[candIds[i]].voteCount > maxVotes) {
                maxVotes = candidates[candIds[i]].voteCount;
                winnerId = candIds[i];
            }
        }
    }

    /**
     * @dev Verify a vote using its hash
     */
    function verifyVote(bytes32 _voteHash) external view returns (bool) {
        return usedVoteHashes[_voteHash];
    }

    /**
     * @dev Get contract stats
     */
    function getStats() external view returns (
        uint256 _electionCount,
        uint256 _candidateCount,
        uint256 _totalVotesCast
    ) {
        return (electionCount, candidateCount, totalVotesCast);
    }
}
