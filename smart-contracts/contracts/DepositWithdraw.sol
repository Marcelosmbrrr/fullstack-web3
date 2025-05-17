// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract DepositWithdraw is ReentrancyGuard {

    address public owner;
    mapping (address => uint256) public balances;

    event Deposit(uint amount, address from);
    event Withdrawal(uint amount, address to);

    constructor() {
        owner = msg.sender; 
    }

    function deposit() public payable nonReentrant {
        require(msg.value != 0, "Must be greater than zero");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.value, msg.sender);
    }

    function withdraw() public nonReentrant {
        uint amount = balances[msg.sender];
        require(amount != 0, "No funds");

        delete balances[msg.sender];
        payable(msg.sender).transfer(amount);

        emit Withdrawal(amount, msg.sender);
    }

    function getDepositedAmount() public view returns (uint256) {
        return balances[msg.sender]; 
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}

