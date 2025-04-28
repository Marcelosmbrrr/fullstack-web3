"use client";

import { useEffect, useState } from "react";

import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Copy, Wallet, Clock, Activity, Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React from "react";

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  isIncoming: boolean;
}

const networks: { [key: number]: string } = {
  1: "Ethereum Mainnet",
  5: "Goerli Testnet",
  11155111: "Sepolia Testnet",
  137: "Polygon",
  80001: "Mumbai Testnet",
  42161: "Arbitrum One",
  10: "Optimism",
  8453: "Base",
  43114: "Avalanche C-Chain",
  56: "BNB Smart Chain",
  42220: "Celo",
  100: "Gnosis Chain",
  1337: "Local Network",
};

export default function Dashboard() {
  const account = useAccount();

  const wallet_balance = useBalance({
    address: account.address,
  });

  const [network, setNetwork] = useState<{
    name: string;
    chainId: number;
  } | null>(null);
  const [walletAge, setWalletAge] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  useEffect(() => {
    const fetchNetworkInfo = async () => {
      if (account) {
        const chain_name = networks[account.chainId as number];
        setNetwork({
          name: chain_name,
          chainId: Number(account.chainId),
        });
      }
    };

    fetchNetworkInfo();
    fetchTransactionHistory();
  }, [account]);

  const fetchTransactionHistory = async () => {
    if (!account.address) return;

    setLoadingTx(true);

    const url = `https://api.etherscan.io/v2/api?chainid=${account.chain?.id}&module=account&action=txlist&address=${account.address}&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=${process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY}`;

    try {
      const response = await fetch(url);

      const data = await response.json();

      if (data.status != "1" && data.result.length === 0) {
        throw new Error("No transactions found.");
      }

      const txs = data.result.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        timestamp: parseInt(tx.timeStamp),
        isIncoming: tx.to.toLowerCase() === account.address?.toLowerCase(),
      }));
      setTransactions(txs);

      const first_tx_timestamp = parseInt(data.result[0].timeStamp);
      const now = Date.now() / 1000;
      const age_in_days = Math.floor(
        (now - first_tx_timestamp) / (60 * 60 * 24)
      );

      setWalletAge(age_in_days);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoadingTx(false);
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <>
      <h1 className="text-3xl font-bold">Wallet Dashboard</h1>

      {/* Wallet Connection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Ethereum Wallet
          </CardTitle>
          <CardDescription>
            {account.isConnected
              ? "Your wallet is connected and ready to use"
              : "Connect your wallet to view and manage your assets"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              {account.isConnected ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  Connected
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200"
                >
                  Disconnected
                </Badge>
              )}
            </div>

            {/* Network Information */}
            {account.isConnected && network && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Network:</span>
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{network.name}</span>
                </div>
              </div>
            )}

            {/* Account Address */}
            {account.isConnected && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Account:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">
                      {account.address && shortenAddress(account.address)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() =>
                        account.address && copyToClipboard(account.address)
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Balance */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Balance:</span>
                  {wallet_balance ? (
                    <span className="font-medium">
                      {wallet_balance.data?.formatted} ETH
                    </span>
                  ) : (
                    <Skeleton className="h-5 w-16" />
                  )}
                </div>

                {/* Wallet Age */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Wallet Age:</span>
                  {walletAge !== null ? (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{walletAge} days</span>
                    </div>
                  ) : (
                    <Skeleton className="h-5 w-32" />
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Only show these sections when connected */}
      {account.isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
            <CardDescription>
              View your recent sent and received transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTx ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.hash}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            tx.isIncoming
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }
                        >
                          {tx.isIncoming ? "Received" : "Sent"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {tx.isIncoming ? "+" : "-"}
                        {formatEther(BigInt(tx.value))} ETH
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {shortenAddress(tx.isIncoming ? tx.from : tx.to)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatDate(tx.timestamp)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found for this wallet
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
