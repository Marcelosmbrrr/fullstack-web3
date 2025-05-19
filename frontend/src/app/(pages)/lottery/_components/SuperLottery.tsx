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
import { Badge } from "@/components/ui/badge";

import SuperLotteryABI from "@/contracts/SuperLotteryABI.json";

const SUPER_LOTTERY_ADDRESS = "0x25944F21FDB16B168F77e56e5D0BAB2134b035Da";

export function SuperLottery() {
  const account = useAccount();
  const [isOwner, setIsOwner] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Read owner address
  const { data: owner } = useReadContract({
    abi: SuperLotteryABI,
    address: SUPER_LOTTERY_ADDRESS,
    functionName: "owner",
  });

  // Read contract balance
  const { data: contractBalance, refetch: refetchBalance } = useReadContract({
    abi: SuperLotteryABI,
    address: SUPER_LOTTERY_ADDRESS,
    functionName: "getCurrentRoundBalance",
  });

  // Read current participants count
  const { data: currentParticipants, refetch: refetchCurrentParticipants } =
    useReadContract({
      abi: SuperLotteryABI,
      address: SUPER_LOTTERY_ADDRESS,
      functionName: "getCurrentRoundParticipantsCount",
    });

  // Read round status
  const { data: hasRoundStarted, refetch: refetchRoundStatus } =
    useReadContract({
      abi: SuperLotteryABI,
      address: SUPER_LOTTERY_ADDRESS,
      functionName: "getHasRoundStarted",
    });

  // Read last prize
  const { data: lastPrize, refetch: refetchLastPrize } = useReadContract({
    abi: SuperLotteryABI,
    address: SUPER_LOTTERY_ADDRESS,
    functionName: "getLastRoundPrize",
  });

  // Read current round
  const { data: currentRound, refetch: refetchCurrentRound } = useReadContract({
    abi: SuperLotteryABI,
    address: SUPER_LOTTERY_ADDRESS,
    functionName: "round_number",
  });

  // Check if user has participated
  const { data: userHasParticipated, refetch: refetchUserHasParticipated } =
    useReadContract({
      abi: SuperLotteryABI,
      address: SUPER_LOTTERY_ADDRESS,
      functionName: "getIsAddressParticipating",
      args: [account.address],
    });

  // Check time left for round
  const { data: roundTimeLeft, refetch: refetchRoundTimeLeft } =
    useReadContract({
      abi: SuperLotteryABI,
      address: SUPER_LOTTERY_ADDRESS,
      functionName: "getTimeLeftToCurrentRoundEnd",
    });

  // Check if user can invoke functions
  const { data: canInvoke, refetch: refetchCanInvoke } = useReadContract({
    abi: SuperLotteryABI,
    address: SUPER_LOTTERY_ADDRESS,
    functionName: "getCanAddressInvoke",
    args: [account.address],
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

  // Write startNextRound function
  const {
    writeContract: startNextRound,
    isPending: isStartNextRoundPending,
    data: startNextRoundHash,
  } = useWriteContract();

  // Transaction statuses
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } =
    useWaitForTransactionReceipt({
      hash: depositHash,
    });

  const {
    isLoading: isSelectWinnerConfirming,
    isSuccess: isSelectWinnerSuccess,
  } = useWaitForTransactionReceipt({
    hash: selectWinnerHash,
  });

  const {
    isLoading: isStartNextRoundConfirming,
    isSuccess: isStartNextRoundSuccess,
  } = useWaitForTransactionReceipt({
    hash: startNextRoundHash,
  });

  // Handle deposit
  const handleDeposit = () => {
    deposit({
      abi: SuperLotteryABI,
      address: SUPER_LOTTERY_ADDRESS,
      functionName: "deposit",
      value: parseEther("1"), // 1 ETH deposit
    });
  };

  // Handle select winner
  const handleSelectWinner = () => {
    selectWinner({
      abi: SuperLotteryABI,
      address: SUPER_LOTTERY_ADDRESS,
      functionName: "selectWinner",
    });
  };

  // Handle start next round
  const handleStartNextRound = () => {
    startNextRound({
      abi: SuperLotteryABI,
      address: SUPER_LOTTERY_ADDRESS,
      functionName: "startNextRound",
    });
  };

  // Watch events
  useWatchContractEvent({
    abi: SuperLotteryABI,
    address: SUPER_LOTTERY_ADDRESS,
    eventName: "NewDeposit",
    onLogs(logs) {
      console.log("New deposit:", logs);
      refetchCurrentParticipants();
      refetchUserHasParticipated();
      refetchBalance();
    },
  });

  useWatchContractEvent({
    abi: SuperLotteryABI,
    address: SUPER_LOTTERY_ADDRESS,
    eventName: "WinnerSelected",
    onLogs(logs) {
      console.log("Winner selected:", logs);
      refetchLastPrize();
      refetchRoundStatus();
      refetchRoundTimeLeft();
    },
  });

  useWatchContractEvent({
    abi: SuperLotteryABI,
    address: SUPER_LOTTERY_ADDRESS,
    eventName: "RoundStarted",
    onLogs(logs) {
      console.log("Round started:", logs);
      refetchCurrentRound();
      refetchRoundStatus();
      refetchRoundTimeLeft();
      refetchCurrentParticipants();
    },
  });

  // Check if user is owner
  useEffect(() => {
    if (account.address && owner) {
      setIsOwner(account.address === owner);
    }
  }, [account.address, owner]);

  // Format time left
  useEffect(() => {
    if (roundTimeLeft) {
      setTimeLeft(Number(roundTimeLeft));
    }
  }, [roundTimeLeft]);

  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };


  console.log(hasRoundStarted)

  return (
    <Card className="w-full">
      <CardContent>
        <div className="text-center mb-8">
          <p className="text-2xl font-bold mb-2">Super Lottery</p>
          <p className="text-xl">
            Round Total Prize:{" "}
            <span className="font-bold">
              {contractBalance ? `${formatEther(contractBalance)}` : "0"} ETH
            </span>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Time remaining for distribution: {formatTime(timeLeft)}
          </p>
        </div>

        <div className="text-center mb-8">
          <Badge
            className="mb-2"
            variant={hasRoundStarted ? "secondary" : "destructive"}
          >
            {hasRoundStarted ? "Round Active" : "Round Not Started"}
          </Badge>
          <p className="text-xl mb-2">Your participation</p>
          <p className="text-2xl font-bold">
            {userHasParticipated ? "1 ETH" : "0 ETH"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Your current deposit in this round
          </p>
        </div>

        <div className="flex justify-center">
          <div className="space-y-4 w-full max-w-md">
            <div className="space-y-2">
              <Label htmlFor="depositAmount">Deposit ETH to participate</Label>
              <Input
                id="depositAmount"
                type="number"
                placeholder="1"
                disabled
                value="1"
              />
            </div>

            <div>
              <Button
                className="w-full"
                onClick={handleDeposit}
                disabled={
                  isDepositPending ||
                  isDepositConfirming ||
                  !account.isConnected ||
                  userHasParticipated ||
                  !hasRoundStarted
                }
              >
                {isDepositPending
                  ? "Sending..."
                  : isDepositConfirming
                  ? "Processing..."
                  : "Deposit 1 ETH"}
              </Button>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="success"
                onClick={handleSelectWinner}
                disabled={
                  isSelectWinnerPending ||
                  isSelectWinnerConfirming ||
                  !account.isConnected ||
                  !canInvoke ||
                  hasRoundStarted ||
                  timeLeft > 0
                }
              >
                Select Winner
              </Button>
              <Button
                variant="alert"
                onClick={handleStartNextRound}
                disabled={
                  isStartNextRoundPending ||
                  isStartNextRoundConfirming ||
                  !account.isConnected ||
                  !canInvoke ||
                  hasRoundStarted
                }
              >
                Start New Round
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-4" />
        <div className="space-y-2 mt-4">
          <p className="font-medium">Lottery Information:</p>
          <p className="text-sm">
            <span className="text-muted-foreground">Contract Address: </span>
            {SUPER_LOTTERY_ADDRESS.slice(0, 5)}...
            {SUPER_LOTTERY_ADDRESS.slice(-3)}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Round: </span>
            {currentRound !== undefined
              ? currentRound.toString()
              : "Loading..."}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Round Participants: </span>
            {currentParticipants !== undefined
              ? currentParticipants.toString()
              : "Loading..."}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Last Round Prize: </span>
            {lastPrize ? `${formatEther(lastPrize)} ETH` : "Loading..."}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Super Lottery Contract - Manages prize distribution with multiple
            rounds
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
