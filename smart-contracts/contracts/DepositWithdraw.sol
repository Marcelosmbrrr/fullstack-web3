// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract DepositWithdraw {

    address payable public owner;
    mapping (address => uint256) public balances;

    event Deposit(uint amount, address from);
    event Withdrawal(uint amount, address to);

    constructor() payable {
        owner = payable(msg.sender);
    }

    function deposit() public payable {
        require(msg.value != 0, "Must be greater than zero");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.value, msg.sender);
    }

    function withdraw() public {
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

