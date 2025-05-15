// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

contract Lottery {

    enum RoundStatus {
        WAITING_NEW_ROUND,
        RUNNING
    }

    uint public constant ENTRY_VALUE = 1 ether; 
    uint public constant MAX_PARTICIPANTS = 1000;
    uint public constant ROUND_TIME_DURATION = 24 hours; 
    uint public constant TIME_INTERVAL_BETWEEN_ROUNDS = 1 hours;

    event NewRoundStarted(uint indexed round, address indexed initializer_address);
    event NewParticipant(address indexed participant);
    event LotteryFull();
    event WinnerSelected(
        address indexed winner,
        uint prize,
        address indexed initializer_address,
        uint initializerReward,
        address indexed finalizerAddress,
        uint finalizer_reward
    );
    event RoundForceReset(uint indexed round, address indexed resetBy);

    address public owner;

    address[] public round_participants;
    mapping(address => bool) public round_participants_map;
    uint public round_count;
    uint public round_start_time;
    RoundStatus public round_status;
    
    uint public last_round_end_time;
    address public last_round_initializer_address;
    address public last_round_finalizer_address;
    address public last_round_winner;
    uint public last_round_prize;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyParticipant() {
        require(round_participants_map[msg.sender], "Not a participant");
        _;
    }

    modifier uniqueParticipant() {
        require(!round_participants_map[msg.sender], "Already participating");
        _;
    }

    modifier notLastRoundInitializer() {
        require(msg.sender != last_round_initializer_address, "Cant repeat initializer");
        _;
    }

    modifier notLastRoundFinalizer() {
        require(msg.sender != last_round_finalizer_address, "Cant repeat finalizer");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ============================================================== GET/VIEW FUNCTIONS 

    function getCurrentRoundParticipantsCount() external view returns (uint) {
        return round_participants.length;
    }

    function getTimeLeftToCloseCurrentRound() external view returns (uint) {
        if (block.timestamp >= round_start_time + ROUND_TIME_DURATION) return 0;
        return (round_start_time + ROUND_TIME_DURATION) - block.timestamp;
    }

    function getIsRoundRunning() public view returns (bool) {
        return round_status == RoundStatus.RUNNING;
    }

    function getTimeLeftToAllowNewRound() public view returns (uint) {
        require(round_status == RoundStatus.WAITING_NEW_ROUND, "Current round not completed");

        if (block.timestamp >= last_round_end_time + TIME_INTERVAL_BETWEEN_ROUNDS) {
            return 0;
        }

        return (last_round_end_time + TIME_INTERVAL_BETWEEN_ROUNDS) - block.timestamp;
    }

    function getLastRoundWinner() external view returns (address) {
        return last_round_winner;
    }

    function getLastRoundPrize() external view returns (uint) {
        return last_round_prize;
    }

    function getLastRoundInitializer() external view returns (address) {
        return last_round_initializer_address;
    }

    function getLastRoundFinalizer() external view returns (address) {
        return last_round_finalizer_address;
    }    

    // ============================================================== SET FUNCTIONS

    function deposit() external payable uniqueParticipant {
        require(round_status == RoundStatus.RUNNING, "Round not running");
        require(msg.value == ENTRY_VALUE, "Exactly 1 MON required");
        require(round_participants.length < MAX_PARTICIPANTS, "Round is full");
        
        round_participants.push(msg.sender);
        round_participants_map[msg.sender] = true;
        emit NewParticipant(msg.sender);

        if (round_participants.length == MAX_PARTICIPANTS) {
            emit LotteryFull();
        }
    }

    function selectWinner() external notLastRoundInitializer notLastRoundFinalizer {
        require(block.timestamp >= round_start_time + ROUND_TIME_DURATION, "24h not passed");
        require(round_participants.length > 0, "No participants");

        uint total_prize = address(this).balance;
        
        uint owner_reward = total_prize / 100;           // 1% for owner
        uint initializer_reward = total_prize / 1000;      // 0.1% for initializer address
        uint finalizer_reward = total_prize / 1000;       // 0.1% for finalizing address
        uint winner_reward = total_prize - (owner_reward + initializer_reward + finalizer_reward); // 98% for winner

        // Winner selection
        // Refatoração: substituir por uma função de Oracle
        uint randomIndex = uint(keccak256(abi.encodePacked(
            block.timestamp, block.prevrandao, round_participants.length
        ))) % round_participants.length;

        last_round_winner = round_participants[randomIndex];
        last_round_finalizer_address = msg.sender;
        
        // MON transfers
        payable(last_round_winner).transfer(winner_reward);
        payable(owner).transfer(owner_reward);
        payable(last_round_initializer_address).transfer(initializer_reward);
        payable(last_round_finalizer_address).transfer(finalizer_reward); 
        
        round_status = RoundStatus.WAITING_NEW_ROUND;
        
        emit WinnerSelected(last_round_winner, winner_reward, last_round_initializer_address, initializer_reward, last_round_finalizer_address, finalizer_reward);
    }

    function startNextRound() external notLastRoundInitializer notLastRoundFinalizer {
        require(round_status == RoundStatus.WAITING_NEW_ROUND, "Current round not completed");
        require(block.timestamp >= last_round_end_time + TIME_INTERVAL_BETWEEN_ROUNDS, "Time interval not passed");

        round_start_time = block.timestamp;
        round_status = RoundStatus.RUNNING;
        last_round_initializer_address = msg.sender;
        round_count++;
        delete round_participants;

        emit NewRoundStarted(round_count, msg.sender);
    }

    function forceResetRound() external onlyOwner {
        require(round_status == RoundStatus.RUNNING, "Round not running");
        require(round_participants.length == 0, "Participants exist");
        require(block.timestamp >= round_start_time + ROUND_TIME_DURATION, "24h not passed");
        
        round_status = RoundStatus.WAITING_NEW_ROUND;
        last_round_end_time = block.timestamp;
        
        emit RoundForceReset(round_count, msg.sender);
    }
    
}