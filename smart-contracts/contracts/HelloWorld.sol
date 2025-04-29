// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract HelloWorld {

    address payable public owner;
    mapping(address => uint) public balances;

    event Deposit(uint amount, address from);
    event Withdrawal(uint amount, address to, uint when);

    constructor() payable {
        owner = payable(msg.sender);
    }

    function deposit() public payable {
        require(msg.value > 0, "Deposit must be greater than zero");

        balances[msg.sender] += msg.value;

        emit Deposit(msg.value, msg.sender);
    }

    function withdraw() public {
        uint amount = balances[msg.sender];
        require(amount > 0, "You have no funds to withdraw");

        balances[msg.sender] = 0;

        payable(msg.sender).transfer(amount);

        emit Withdrawal(amount, msg.sender, block.timestamp);
    }

    function getContractBalance() public view returns (uint) {
        return address(this).balance;
    }
}

