// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SuperLottery is ReentrancyGuard {

    enum RoundStatus {
        FINISHED,
        STARTED
    }

    uint public constant ENTRY_VALUE = 1 ether; 
    uint public constant MAX_PARTICIPANTS = 1000;
    uint public constant ROUND_TIME_DURATION = 48 hours; 
    uint public constant TIME_INTERVAL_FOR_INVOKE = 3 days;
    uint public constant TIME_INTERVAL_BETWEEN_ROUNDS = 1 hours;

    address private owner;

    // Round info
    address[] public round_participants;
    mapping(uint => mapping(address => bool)) public has_deposited;
    uint public round_number;
    uint public round_created_at;
    RoundStatus public round_status;
    address round_initializer;
    
    // History info
    uint public last_round_ended_at;
    mapping (address=>uint) invokers_time_history;
    uint last_round_prize;

    event RoundStarted(uint indexed round, address indexed initializer);
    event NewDeposit(uint indexed round, address indexed depositor);
    event WinnerSelected(
        address indexed winner,
        uint prize,
        address indexed initializer,
        uint initializer_prize,
        address indexed finalizer,
        uint finalizer_prize
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyParticipant() {
        require(has_deposited[round_number][msg.sender], "Must be a participant");
        _;
    }

    modifier uniqueParticipant() {
        require(!has_deposited[round_number][msg.sender], "Already participating");
        _;
    }

    modifier avoidSameInvoker() {
        require(
            block.timestamp >= invokers_time_history[msg.sender] + TIME_INTERVAL_FOR_INVOKE,
            "Wait 1 week to invoke again"
        );
        _;
    }

    constructor() payable {
        owner = msg.sender;
    }

    // ============================================================== GET/VIEW FUNCTIONS 

    function getCurrentRoundBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getCurrentRoundParticipantsCount() public view returns (uint) {
        return round_participants.length;
    }

    function getHasRoundStarted() public view returns (bool) {
        return round_status == RoundStatus.STARTED;
    }

    function getTimeLeftToCurrentRoundEnd() public view returns (uint) {
        if (block.timestamp >= (round_created_at + ROUND_TIME_DURATION)) {
            return 0;
        }
        return (round_created_at + ROUND_TIME_DURATION) - block.timestamp;
    }

    function getTimeLeftToStartNewRound() public view returns (uint) {
        require(round_status == RoundStatus.FINISHED, "Round is running");

        if (block.timestamp >= (last_round_ended_at + TIME_INTERVAL_BETWEEN_ROUNDS)) {
            return 0;
        }

        return (last_round_ended_at + TIME_INTERVAL_BETWEEN_ROUNDS) - block.timestamp;
    }

    function getIsAddressParticipating(address value) public view returns (bool) {
        return has_deposited[round_number][value];
    }

    function getCanAddressInvoke() public view returns (bool) {
        return block.timestamp >= invokers_time_history[msg.sender] + TIME_INTERVAL_FOR_INVOKE;
    }

    function getLastRoundPrize() public view returns (uint) {
        return last_round_prize;
    }   

    // ============================================================== SET FUNCTIONS

    function deposit() external payable uniqueParticipant nonReentrant {
        require(round_status == RoundStatus.STARTED, "Round not started");
        require(msg.value == ENTRY_VALUE, "Exactly 1 ETH required");
        require(round_participants.length < MAX_PARTICIPANTS, "Round is full");

        uint256 owner_fee = msg.value / 100;
        payable(owner).transfer(owner_fee);
        
        round_participants.push(msg.sender);
        has_deposited[round_number][msg.sender] = true;

        emit NewDeposit(round_number, msg.sender);
    }

    function selectWinner() external avoidSameInvoker nonReentrant {
        require(block.timestamp >= (round_created_at + ROUND_TIME_DURATION), "Round time has not ended");
        require(round_participants.length > 0, "No participants");

        uint total_prize = address(this).balance;
        uint initializer_prize = total_prize / 1000;      
        uint finalizer_prize = total_prize / 1000;      
        uint initial_amount_for_next_round = total_prize / 1000; 
        uint winner_reward = total_prize - (initializer_prize + finalizer_prize + initial_amount_for_next_round); 

        // Substituir por Chainlink VRF
        uint random_index = uint(keccak256(abi.encodePacked(
            block.timestamp, block.prevrandao, round_participants.length
        ))) % round_participants.length;

        address winner = round_participants[random_index];
        
        payable(winner).transfer(winner_reward); // 99.7%
        payable(round_initializer).transfer(initializer_prize);
        payable(msg.sender).transfer(finalizer_prize); 
        
        round_status = RoundStatus.FINISHED;
        invokers_time_history[msg.sender] = block.timestamp;
        last_round_ended_at = block.timestamp;
        last_round_prize = winner_reward;
        
        emit WinnerSelected(
            winner,
            winner_reward,
            round_initializer,
            initializer_prize,
            msg.sender,
            finalizer_prize
        );
    }

    function startNextRound() external avoidSameInvoker nonReentrant {
        require(round_status == RoundStatus.FINISHED, "Round is running");
        require(block.timestamp >= (last_round_ended_at + TIME_INTERVAL_BETWEEN_ROUNDS), "Time interval not passed");

        invokers_time_history[msg.sender] = block.timestamp;
        round_initializer = msg.sender;
        round_created_at = block.timestamp;
        round_status = RoundStatus.STARTED;
        delete round_participants;
        round_number++;

        emit RoundStarted(round_number, msg.sender);
    }

    receive() external payable {
        revert("Use deposit function");
    }

    fallback() external payable {
        revert("Invalid call");
    }

    
}