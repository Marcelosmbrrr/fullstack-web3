"use client";

import { useState } from "react";

import {
  useReadContract,
  useWriteContract,
  useWatchContractEvent,
  useAccount,
  useWaitForTransactionReceipt,
} from "wagmi";

import DepositWithdrawABI from "@/contracts/DepositWithdrawABI.json";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatEther, parseEther } from "viem";
import { LoaderIcon } from "lucide-react";

const CONTRACT_ADDRESS = "0xD6D47F2f14869560B5c9BA15878ec622c6Cc1e31";

export default function SmartContract() {
  const account = useAccount();
  const [depositAmount, setDepositAmount] = useState("");

  // Read contract balance
  const { data: contractBalance } = useReadContract({
    abi: DepositWithdrawABI,
    address: CONTRACT_ADDRESS,
    functionName: "getContractBalance",
  });

  // Read user balance
  const { data: userBalance, error } = useReadContract({
    abi: DepositWithdrawABI,
    address: CONTRACT_ADDRESS,
    functionName: "getDepositedAmount",
    account: account.address,
  });

  if (error) {
    console.error("Error fetching user balance:", error);
  }

  // Write deposit
  const {
    writeContract: deposit,
    isPending: isDepositPending,
    data: depositHash,
  } = useWriteContract();

  // Write withdraw
  const {
    writeContract: withdraw,
    isPending: isWithdrawPending,
    data: withdrawHash,
  } = useWriteContract();

  // Get deposit transaction processing status
  const { isLoading: isDepositConfirming } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

   // Get withdraw transaction processing status
  const { isLoading: isWithdrawConfirming } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  // Watch deposit events
  useWatchContractEvent({
    abi: DepositWithdrawABI,
    address: CONTRACT_ADDRESS,
    eventName: "Deposit",
    onLogs(logs) {
      console.log("New deposit:", logs);
    },
  });

  // Watch withdrawal events
  useWatchContractEvent({
    abi: DepositWithdrawABI,
    address: CONTRACT_ADDRESS,
    eventName: "Withdrawal",
    onLogs(logs) {
      console.log("New withdrawal:", logs);
    },
  });

  const handleDeposit = () => {
    if (!depositAmount || isNaN(Number(depositAmount))) {
      window.alert("Invalid amount");
      return;
    }

    deposit({
      abi: DepositWithdrawABI,
      address: CONTRACT_ADDRESS,
      functionName: "deposit",
      value: parseEther(depositAmount),
    });
  };

  const handleWithdraw = () => {
    withdraw({
      abi: DepositWithdrawABI,
      address: CONTRACT_ADDRESS,
      functionName: "withdraw",
    });
  };

  return (
    <div className="container max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Deposit and Withdraw</h1>

      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle>Deposited Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Deposited Balance */}
          <div className="text-center mb-8">
            <p className="text-5xl font-bold">
              {userBalance ? `${formatEther(userBalance)}` : "0"} ETH
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Available balance for withdrawal
            </p>
          </div>

          {/* ETH Deposit and Withdraw */}
          <div className="flex justify-center">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="depositAmount">Deposit ETH</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.1"
                />
              </div>
              <Button
                onClick={handleDeposit}
                disabled={
                  isDepositPending ||
                  isDepositConfirming ||
                  isWithdrawPending ||
                  isWithdrawConfirming
                }
                className="mr-2"
              >
                {isDepositPending
                  ? "Sending..."
                  : isDepositConfirming
                  ? "Processing..."
                  : "Deposit"}
              </Button>

              <Button
                onClick={handleWithdraw}
                disabled={
                  isDepositPending ||
                  isDepositConfirming ||
                  isWithdrawPending ||
                  isWithdrawConfirming
                }
              >
                {isWithdrawPending
                  ? "Sending..."
                  : isWithdrawConfirming
                  ? "Processing..."
                  : "Withdraw"}
              </Button>
            </div>
          </div>

          {/* Contract Info */}
          <Separator className="my-4" />
          <div className="space-y-2 mt-4">
            <p className="font-medium">Contract Information:</p>

            <p className="text-sm">
              <span className="text-muted-foreground">Address: </span>
              {CONTRACT_ADDRESS || "Not configured"}
            </p>

            {CONTRACT_ADDRESS && (
              <>
                <p className="text-sm">
                  <span className="text-muted-foreground">Total Balance: </span>
                  {contractBalance
                    ? `${formatEther(contractBalance)}`
                    : "0"}{" "}
                  ETH
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  DepositWithdraw Contract - Manages ETH deposits and
                  withdrawals
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
