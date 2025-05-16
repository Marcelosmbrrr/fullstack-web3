// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleLottery is ReentrancyGuard, Ownable {  //Contract name is Lottery
    
    address payable[] public participants; 

    constructor() Ownable(msg.sender) {}

    // ============================================================== GET/VIEW FUNCTIONS 

    function getLotteryBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function generateRandomNumber() private view returns(uint) { 
        return uint(keccak256( abi.encodePacked (block.difficulty, block.timestamp, participants.length)));
    }

    // ============================================================== SET FUNCTIONS

    function deposit() external payable nonReentrant {
        require(msg.value == 1 ether, "Deposit must be exactly 1 ether");
        participants.push(payable(msg.sender)); 
    }

    function selectWinner() public onlyOwner {
        require(participants.length >= 3, "Participants are not enough");
        uint randomNumber = generateRandomNumber(); 
        uint winnerIndex = randomNumber % participants.length;
        address payable winner = participants[winnerIndex];
        winner.transfer(getLotteryBalance()); 
        participants = new address payable[](0); 
    }
}