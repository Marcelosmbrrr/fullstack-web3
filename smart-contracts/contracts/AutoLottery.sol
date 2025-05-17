// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract AutoLottery is ReentrancyGuard, Ownable {

    address payable[] public participants;
    uint256 public constant WIN_PROBABILITY = 100000; // 1 in 100,000 (0.001%)
    uint256 public constant DEPOSIT_VALUE_REQUIRED = 1 ether;
    
    address public lastWinner;
    uint256 public lastPrize;
    uint256 public participantsCountHistory; 
    uint256 public roundsCountHistory; 

    event NewDeposit(address indexed participant, uint256 amount);
    event NewWinner(address indexed winner, uint256 prizeAmount);
    
    constructor() Ownable(msg.sender) {}

    // ============================================================== GET/VIEW FUNCTIONS 

    function getLotteryBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getLastWinner() public view returns (address) {
        return lastWinner;
    }

    function getLastPrize() public view returns (uint256) {
        return lastPrize;
    }

    function getParticipants() public view returns (uint256) {
        return participants.length;
    }

    function getTotalParticipantsHistory() public view returns (uint256) {
        return participantsCountHistory;
    }

    function getTotalRoundsHistory() public view returns (uint256) {
        return roundsCountHistory;
    }

    function generateRandomNumber() private view returns(uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.difficulty,
            block.timestamp,
            participants.length,
            msg.sender
        )));
    }

    // ============================================================== SET FUNCTIONS

    function deposit() external payable nonReentrant {
        require(msg.value == DEPOSIT_VALUE_REQUIRED, "Deposit must be exactly 1 ether");

        participants.push(payable(msg.sender));
        participantsCountHistory++;

        emit NewDeposit(msg.sender, msg.value);

        uint256 randomNumber = generateRandomNumber();
        if (randomNumber % WIN_PROBABILITY == 0) {
            _selectWinner();
        }
    }

    function _selectWinner() private {
        require(participants.length > 0, "No participants");

        uint256 winnerIndex = generateRandomNumber() % participants.length;
        address payable winner = participants[winnerIndex];
        uint256 prizeAmount = address(this).balance;
        
        lastWinner = winner;
        lastPrize = prizeAmount;
        roundsCountHistory++; 
        
        winner.transfer(prizeAmount);
        
        participants = new address payable[](0);

        emit NewWinner(winner, prizeAmount);
    }
}