"use client";

import {
  useReadContract,
  useWriteContract,
  useWatchContractEvent,
} from "wagmi";
import { useState } from "react";
import HelloWorldABI from "@/contracts/HelloWorldABI.json";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { toast } from "sonner";

const CONTRACT_ADDRESS = "";

export default function SmartContract() {
  const [depositAmount, setDepositAmount] = useState("");

  // Read contract balance
  const { data: contractBalance } = useReadContract({
    abi: HelloWorldABI,
    address: CONTRACT_ADDRESS,
    functionName: "getContractBalance",
  });

  // Read user balance
  const { data: userBalance } = useReadContract({
    abi: HelloWorldABI,
    address: CONTRACT_ADDRESS,
    functionName: "balances",
    args: [],
  });

  // Configure contract write for deposit
  const { writeContract: deposit } = useWriteContract({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Deposit successful",
          description: "Your deposit has been processed successfully",
        });
        setDepositAmount("");
      },
      onError: (error) => {
        toast({
          title: "Deposit error",
          description: error.message,
          variant: "destructive",
        });
      },
    },
  });

  // Configure contract write for withdrawal
  const { writeContract: withdraw } = useWriteContract({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Withdrawal successful",
          description: "Your withdrawal has been processed successfully",
        });
      },
      onError: (error) => {
        toast({
          title: "Withdrawal error",
          description: error.message,
          variant: "destructive",
        });
      },
    },
  });

  // Watch deposit events
  useWatchContractEvent({
    abi: HelloWorldABI,
    address: CONTRACT_ADDRESS,
    eventName: "Deposit",
    onLogs(logs) {
      console.log("New deposit:", logs);
    },
  });

  // Watch withdrawal events
  useWatchContractEvent({
    abi: HelloWorldABI,
    address: CONTRACT_ADDRESS,
    eventName: "Withdrawal",
    onLogs(logs) {
      console.log("New withdrawal:", logs);
    },
  });

  const handleDeposit = () => {
    if (!depositAmount || isNaN(Number(depositAmount))) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive",
      });
      return;
    }

    deposit({
      abi: HelloWorldABI,
      address: CONTRACT_ADDRESS,
      functionName: "deposit",
      value: BigInt(Number(depositAmount) * 1e18), // Convert to wei
    });
  };

  const handleWithdraw = () => {
    withdraw({
      abi: HelloWorldABI,
      address: CONTRACT_ADDRESS,
      functionName: "withdraw",
    });
  };

  return (
    <div className="container max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Smart Contract</h1>

      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle>Deposited Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Deposited Balance */}
          <div className="text-center mb-8">
            <p className="text-5xl font-bold">
              {userBalance ? `${Number(userBalance) / 1e18} ETH` : "0 ETH"}
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
              <Button onClick={handleDeposit} className="mr-2">
                Deposit
              </Button>
              <Button onClick={handleWithdraw}>Withdraw All</Button>
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
                    ? `${Number(contractBalance) / 1e18} ETH`
                    : "Loading..."}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  HelloWorld Contract - Manages ETH deposits and withdrawals
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
