// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {DepositWithdraw} from "../src/DepositWithdraw.sol";

contract DepositWithdrawScript is Script {
    DepositWithdraw public deposit_withdraw;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        deposit_withdraw = new DepositWithdraw();

        vm.stopBroadcast();
    }
}
