// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {DepositWithdraw} from "../src/DepositWithdraw.sol";

contract DepositWithdrawTest is Test {
    DepositWithdraw public depositWithdraw;
    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);

    function setUp() public {
        vm.prank(owner);
        depositWithdraw = new DepositWithdraw();
    }

    function test_InitialState() public {
        assertEq(depositWithdraw.owner(), owner);
        assertEq(depositWithdraw.getContractBalance(), 0);
    }

    function test_Deposit() public {
        uint256 depositAmount = 1 ether;
        
        vm.prank(user1);
        vm.deal(user1, depositAmount);
        depositWithdraw.deposit{value: depositAmount}();

        assertEq(depositWithdraw.balances(user1), depositAmount);
    }

    function test_DepositZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert("Must be greater than zero");
        depositWithdraw.deposit{value: 0}();
    }

    function test_Withdraw() public {
        uint256 depositAmount = 1 ether;
        
        // Primeiro faz um depósito
        vm.prank(user1);
        vm.deal(user1, depositAmount);
        depositWithdraw.deposit{value: depositAmount}();

        // Verifica o saldo antes do saque
        uint256 user1BalanceBefore = user1.balance;
        uint256 contractBalanceBefore = address(depositWithdraw).balance;

        // Faz o saque
        vm.prank(user1);
        depositWithdraw.withdraw();

        // Verifica os saldos após o saque
        assertEq(depositWithdraw.balances(user1), 0);
        assertEq(user1.balance, user1BalanceBefore + depositAmount);
        assertEq(address(depositWithdraw).balance, contractBalanceBefore - depositAmount);
    }

    function test_WithdrawNoFunds() public {
        vm.prank(user1);
        vm.expectRevert("No funds");
        depositWithdraw.withdraw();
    }
}
