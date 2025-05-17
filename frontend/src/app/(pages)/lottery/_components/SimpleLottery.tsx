"use client";

import { useState, useEffect } from "react";
import {
  useReadContract,
  useWriteContract,
  useWatchContractEvent,
  useAccount,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther, parseEther } from "viem";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import SimpleLotteryABI from "@/contracts/SimpleLotteryABI.json";

const SIMPLE_LOTTERY_ADDRESS = "0x625d60A16558bd7D8892A7eBc7e2063570fA7220";

export function SimpleLottery() {
  const account = useAccount();
  const [isOwner, setIsOwner] = useState(false);

  // Read contract balance
  const { data: lotteryBalance, refetch: refetchBalance } = useReadContract({
    abi: SimpleLotteryABI,
    address: SIMPLE_LOTTERY_ADDRESS,
    functionName: "getLotteryBalance",
  });

  // Read owner address
  const { data: owner } = useReadContract({
    abi: SimpleLotteryABI,
    address: SIMPLE_LOTTERY_ADDRESS,
    functionName: "owner",
  });

  // Get participants count
  const { data: participantsCount, refetch: refetchParticipantsCount } =
    useReadContract({
      abi: SimpleLotteryABI,
      address: SIMPLE_LOTTERY_ADDRESS,
      functionName: "getParticipantsCount",
    });

  // Get last winner
  const { data: lastWinner, refetch: refetchLastWinner } = useReadContract({
    abi: SimpleLotteryABI,
    address: SIMPLE_LOTTERY_ADDRESS,
    functionName: "getLastWinner",
  });

  // Get current round
  const { data: currentRound, refetch: refetchCurrentRound } = useReadContract({
    abi: SimpleLotteryABI,
    address: SIMPLE_LOTTERY_ADDRESS,
    functionName: "getActualRound",
  });

  // Check if user has participated in the current round
  const { data: userHasParticipated, refetch: refetchUserHasParticipated } =
    useReadContract({
      abi: SimpleLotteryABI,
      address: SIMPLE_LOTTERY_ADDRESS,
      functionName: "hasDeposited",
      args: [currentRound, account.address],
    });

  // Write deposit function
  const {
    writeContract: deposit,
    isPending: isDepositPending,
    data: depositHash,
  } = useWriteContract();

  // Write selectWinner function
  const {
    writeContract: selectWinner,
    isPending: isSelectWinnerPending,
    data: selectWinnerHash,
  } = useWriteContract();

  // Transaction status
  const { isLoading: isDepositConfirming } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  const { isLoading: isSelectWinnerConfirming } = useWaitForTransactionReceipt({
    hash: selectWinnerHash,
  });

  // Handle deposit
  const handleDeposit = () => {
    deposit({
      abi: SimpleLotteryABI,
      address: SIMPLE_LOTTERY_ADDRESS,
      functionName: "deposit",
      value: parseEther("0.001"),
    });
  };

  // Handle select winner
  const handleSelectWinner = () => {
    selectWinner({
      abi: SimpleLotteryABI,
      address: SIMPLE_LOTTERY_ADDRESS,
      functionName: "selectWinner",
    });
  };

  // Check if user is owner
  useEffect(() => {
    if (account.address && owner) {
      setIsOwner(account.address === owner);
    }
  }, [account.address, owner]);

  return (
    <Card className="w-full">
      <CardContent>
        <div className="text-center mb-8">
          <p className="text-2xl font-bold mb-2">Simple Lottery</p>
          <p className="text-xl">
            Current Prize:{" "}
            <span className="font-bold">
              {lotteryBalance ? `${formatEther(lotteryBalance)}` : "0"} ETH
            </span>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Minimum 1 participant required
          </p>
        </div>

        <div className="text-center mb-8">
          <p className="text-xl mb-2">Your participation</p>
          <p className="text-2xl font-bold">
            {userHasParticipated ? "0.001 ETH" : "0 ETH"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Your current deposit
          </p>
        </div>

        <div className="flex justify-center">
          <div className="space-y-4 w-full max-w-md">
            <div className="space-y-2">
              <Label htmlFor="simpleDepositAmount">
                Deposit ETH to participate (0.001 ETH)
              </Label>
              <Input
                id="simpleDepositAmount"
                type="number"
                placeholder="0.001"
                disabled
                value="0.001"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Button
                onClick={handleDeposit}
                disabled={
                  isOwner ||
                  isDepositPending ||
                  isDepositConfirming ||
                  isSelectWinnerPending ||
                  isSelectWinnerConfirming ||
                  userHasParticipated ||
                  !account.isConnected
                }
              >
                {isDepositPending
                  ? "Sending..."
                  : isDepositConfirming
                  ? "Processing..."
                  : "Deposit 0.001 ETH"}
              </Button>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 gap-4">
              <Button
                variant="success"
                onClick={handleSelectWinner}
                disabled={
                  isOwner ||
                  isDepositPending ||
                  isDepositConfirming ||
                  isSelectWinnerPending ||
                  isSelectWinnerConfirming ||
                  (participantsCount !== undefined &&
                    Number(participantsCount) < 1)
                }
              >
                {isSelectWinnerPending
                  ? "Sending..."
                  : isSelectWinnerConfirming
                  ? "Processing..."
                  : "Select Winner"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {!isOwner
                  ? "Only contract owner can select winner"
                  : participantsCount !== undefined &&
                    Number(participantsCount) < 1
                  ? "Minimum 1 participants required"
                  : "Select the lottery winner"}
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-4" />
        <div className="space-y-2 mt-4">
          <p className="font-medium">Lottery Information:</p>
          <p className="text-sm">
            <span className="text-muted-foreground">Contract Address: </span>
            {SIMPLE_LOTTERY_ADDRESS.slice(0, 5)}...
            {SIMPLE_LOTTERY_ADDRESS.slice(-3)}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">
              Current Participants:{" "}
            </span>
            {participantsCount !== undefined
              ? participantsCount.toString()
              : "Loading..."}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Entry Fee: </span>0.001 ETH
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Last Winner: </span>
            {lastWinner &&
            lastWinner !== "0x0000000000000000000000000000000000000000"
              ? `${lastWinner.slice(0, 5)}...${lastWinner.slice(-3)}`
              : "No winners yet"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Simple Lottery Contract - Winner takes all after minimum 1
            participants
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
