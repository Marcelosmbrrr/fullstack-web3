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

import AutoLotteryABI from "@/contracts/AutoLotteryABI.json";

const AUTO_LOTTERY_ADDRESS = "0x627858267B49d441AF55637827a29511942e2cc3";

export function AutoLottery() {
  const account = useAccount();
  const [isOwner, setIsOwner] = useState(false);

  // Read owner address
  const { data: owner } = useReadContract({
    abi: AutoLotteryABI,
    address: AUTO_LOTTERY_ADDRESS,
    functionName: "owner",
  });

  // Read contract balance
  const { data: lotteryBalance, refetch: refetchBalance } = useReadContract({
    abi: AutoLotteryABI,
    address: AUTO_LOTTERY_ADDRESS,
    functionName: "getCurrentRoundBalance",
  });

  // Read current participants count
  const { data: currentParticipants, refetch: refetchCurrentParticipants } =
    useReadContract({
      abi: AutoLotteryABI,
      address: AUTO_LOTTERY_ADDRESS,
      functionName: "getCurrentRoundParticipants",
    });

  // Read last winner
  const { data: lastWinner, refetch: refetchLastWinner } = useReadContract({
    abi: AutoLotteryABI,
    address: AUTO_LOTTERY_ADDRESS,
    functionName: "getLastRoundWinner",
  });

  // Read last prize
  const { data: lastPrize, refetch: refetchLastPrize } = useReadContract({
    abi: AutoLotteryABI,
    address: AUTO_LOTTERY_ADDRESS,
    functionName: "getLastRoundPrize",
  });

  // Read current round
  const { data: currentRound, refetch: refetchCurrentRound } = useReadContract({
    abi: AutoLotteryABI,
    address: AUTO_LOTTERY_ADDRESS,
    functionName: "getCurrentRound",
  });

  // Read total participants history
  const { data: totalParticipants, refetch: refetchTotalParticipants } =
    useReadContract({
      abi: AutoLotteryABI,
      address: AUTO_LOTTERY_ADDRESS,
      functionName: "getTotalParticipantsHistory",
    });

  // Check if user has participated in the current round
  const { data: userHasParticipated, refetch: refetchUserHasParticipated } =
    useReadContract({
      abi: AutoLotteryABI,
      address: AUTO_LOTTERY_ADDRESS,
      functionName: "hasDeposited",
      args: [currentRound, account.address],
    });

  // Write deposit function
  const {
    writeContract: deposit,
    isPending: isDepositPending,
    data: depositHash,
  } = useWriteContract();

  // Transaction status
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } =
    useWaitForTransactionReceipt({
      hash: depositHash,
    });

  // Handle deposit
  const handleDeposit = () => {
    deposit({
      abi: AutoLotteryABI,
      address: AUTO_LOTTERY_ADDRESS,
      functionName: "deposit",
      value: parseEther("0.001"),
    });
  };

  // Watch deposit events
  useWatchContractEvent({
    abi: AutoLotteryABI,
    address: AUTO_LOTTERY_ADDRESS,
    eventName: "NewDeposit",
    onLogs(logs) {
      console.log(logs);
      window.alert("Deposit Done!");
    },
  });

  // Watch withdrawal events
  useWatchContractEvent({
    abi: AutoLotteryABI,
    address: AUTO_LOTTERY_ADDRESS,
    eventName: "NewWinner",
    onLogs(logs) {
      console.log(logs);
      window.alert("You won!");
    },
  });

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
          <p className="text-2xl font-bold mb-2">Auto Lottery</p>
          <p className="text-xl">
            Current Prize:{" "}
            <span className="font-bold">
              {lotteryBalance ? `${formatEther(lotteryBalance)}` : "0"} ETH
            </span>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Chance to win: 0.001% per deposit
          </p>
        </div>

        <div className="text-center mb-8">
          <p className="text-xl mb-2">Last Winner</p>
          <p className="text-lg font-mono">
            {lastWinner &&
            lastWinner !== "0x0000000000000000000000000000000000000000"
              ? `${lastWinner.slice(0, 5)}...${lastWinner.slice(-3)}`
              : "No winners yet"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {lastPrize && lastPrize > 0
              ? `Won: ${formatEther(lastPrize)} ETH (Round #${
                  currentRound ? Number(currentRound) - 1 : 0
                })`
              : "No prizes awarded yet"}
          </p>
        </div>

        <div className="flex justify-center">
          <div className="space-y-4 w-full max-w-md">
            <div className="space-y-2">
              <Label htmlFor="autoDepositAmount">
                Deposit ETH to participate (0.001 ETH)
              </Label>
              <Input
                id="autoDepositAmount"
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
                  !account.isConnected ||
                  userHasParticipated
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
              <p className="text-xs text-muted-foreground text-center">
                Winner is selected automatically with 0.001% chance per deposit
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-4" />
        <div className="space-y-2 mt-4">
          <p className="font-medium">Lottery Statistics:</p>
          <p className="text-sm">
            <span className="text-muted-foreground">Contract Address: </span>
            {AUTO_LOTTERY_ADDRESS.slice(0, 5)}...
            {AUTO_LOTTERY_ADDRESS.slice(-3)}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">
              Current Participants:{" "}
            </span>
            {currentParticipants !== undefined
              ? currentParticipants.toString()
              : "Loading..."}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Total Rounds: </span>
            {currentRound !== undefined
              ? currentRound.toString()
              : "Loading..."}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Total Participants: </span>
            {totalParticipants !== undefined
              ? totalParticipants.toString()
              : "Loading..."}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Auto Lottery Contract - Instant win chance with each deposit
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
