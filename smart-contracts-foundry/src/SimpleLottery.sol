// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SimpleLottery is ReentrancyGuard {

    uint256 public constant ENTRY_FEE = 0.001 ether;

    address public owner;
    address payable[] public participants;
    uint public currentRound;
    address public lastWinner;
    mapping(uint => mapping(address => bool)) public hasDeposited;

    constructor() {
        owner = msg.sender;
        currentRound = 1;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized");
        _; 
    }

    // ============================================================== GET/VIEW FUNCTIONS 

    function getLotteryBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function generateRandomNumber() private view returns(uint) { 
        return uint(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, participants.length)));
    }

    function getParticipantsCount() public view returns (uint256) {
        return participants.length;
    }

    function getActualRound() public view returns (uint) {
        return currentRound;
    }

    function getLastWinner() public view returns (address) {
        return lastWinner;
    }

    // ============================================================== SET FUNCTIONS

    function deposit() external payable nonReentrant {
        require(msg.value == ENTRY_FEE, "Must send exactly 0.001 ETH");
        require(!hasDeposited[currentRound][msg.sender], "Already participating");

        uint256 ownerFee = msg.value / 100;
        payable(owner).transfer(ownerFee);
        
        participants.push(payable(msg.sender));
        hasDeposited[currentRound][msg.sender] = true;
    }

    function selectWinner() public onlyOwner {
        require(participants.length >= 1, "Not enough participants");
        
        uint winnerIndex = uint(keccak256(abi.encodePacked(
            block.prevrandao, block.timestamp, participants.length
        ))) % participants.length;

        address winner = participants[winnerIndex];
        
        payable(winner).transfer(address(this).balance);

        lastWinner = winner;
        currentRound++;
        
        participants = new address payable[](0);
    }
}