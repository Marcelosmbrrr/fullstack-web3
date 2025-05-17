// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AutoLottery is ReentrancyGuard {

    address payable[] public participants;
    uint256 public constant WIN_PROBABILITY = 1; // 1 = 100% // 100000 = 0.001%
    uint256 public constant DEPOSIT_VALUE_REQUIRED = 0.001 ether;
    
    address public owner;
    mapping(uint => mapping(address => bool)) public hasDeposited;
    address public lastWinner;
    uint256 public lastPrize;
    uint256 public participantsCountHistory; 
    uint256 public currentRound; 

    event NewDeposit(address indexed participant, uint256 amount);
    event NewWinner(address indexed winner, uint256 prizeAmount);

    constructor() {
        owner = msg.sender;
        currentRound = 1;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized");
        _; 
    }

    // ============================================================== GET/VIEW FUNCTIONS 

    function getCurrentRoundBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getLastRoundWinner() public view returns (address) {
        return lastWinner;
    }

    function getLastRoundPrize() public view returns (uint256) {
        return lastPrize;
    }

    function getCurrentRoundParticipants() public view returns (uint256) {
        return participants.length;
    }

    function getTotalParticipantsHistory() public view returns (uint256) {
        return participantsCountHistory;
    }

    function getCurrentRound() public view returns (uint256) {
        return currentRound;
    }

    function generateRandomNumber() private view returns(uint) { 
        return uint(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, participants.length)));
    }

    // ============================================================== SET FUNCTIONS

    function deposit() external payable nonReentrant {
        require(msg.value == DEPOSIT_VALUE_REQUIRED, "Deposit must be exactly 0.001 ether");
        require(!hasDeposited[currentRound][msg.sender], "Already participating");

        uint256 ownerFee = msg.value / 100;
        uint256 remainingAmount = msg.value - ownerFee;

        payable(owner).transfer(ownerFee);
        
        participants.push(payable(msg.sender));
        hasDeposited[currentRound][msg.sender] = true;
        participantsCountHistory++;

        uint256 randomNumber = generateRandomNumber();
        if (randomNumber % WIN_PROBABILITY == 0) {
            _selectWinner();
        } else {
            emit NewDeposit(msg.sender, remainingAmount);
        }
    }

    function _selectWinner() private {
        require(participants.length > 0, "No participants");

        uint256 winnerIndex = generateRandomNumber() % participants.length;
        address payable winner = participants[winnerIndex];
        uint256 prizeAmount = address(this).balance;
        
        lastWinner = winner;
        lastPrize = prizeAmount;
        currentRound++; 
        
        winner.transfer(prizeAmount);
        
        participants = new address payable[](0);

        emit NewWinner(winner, prizeAmount);
    }
}