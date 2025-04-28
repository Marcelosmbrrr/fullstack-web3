"use client";

import { useState, useEffect } from "react";

import {
  useSendTransaction,
  useWaitForTransactionReceipt,
  useAccount,
  useBalance,
} from "wagmi";
import { parseEther, formatEther } from "viem";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  isIncoming: boolean;
}

export default function Transaction() {
  // Transaction sending
  const {
    data: hash,
    isPending,
    isSuccess,
    isError,
    error,
    sendTransaction,
  } = useSendTransaction();

  // Transaction confirmation status
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const account = useAccount();
  const wallet_balance = useBalance({
    address: account.address,
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState(0);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  useEffect(() => {
    if (account) {
      fetchTransactionHistory();
    }
  }, [account]);

  const shortenAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const fetchTransactionHistory = async () => {
    if (!account.address) return;

    setIsLoadingTransactions(true);

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
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleRefreshTransactions = () => {
    if (account) {
      fetchTransactionHistory();
    }
  };

  const handleSubmitTransaction = async () => {
    const to = recipient as `0x${string}`;
    const value = String(amount);

    sendTransaction({ chainId: account.chainId, to, value: parseEther(value) });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Transaction</h1>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Send Ether</CardTitle>
          <CardDescription>
            Transfer ETH from your connected wallet to another address
          </CardDescription>
        </CardHeader>

        <CardContent>
          {account ? (
            <form onSubmit={handleSubmitTransaction} className="space-y-6">
              <div className="space-y-2">
                <div className="flex gap-x-2">
                  <Label htmlFor="balance">Your Balance</Label>
                  <Badge>
                    {wallet_balance
                      ? `${wallet_balance.data?.formatted} ETH`
                      : "Loading..."}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (ETH)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              {hash && (
                <Alert variant={isSuccess ? "success" : "destructive"}>
                  {isSuccess ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>{isSuccess ? "Success" : "Error"}</AlertTitle>
                  <AlertDescription className="break-all">
                    {hash}
                  </AlertDescription>
                </Alert>
              )}
              {isConfirming && <div>Waiting for confirmation...</div>}
              {isConfirmed && <div>Transaction confirmed.</div>}
            </form>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Not Connected</AlertTitle>
              <AlertDescription>
                Please connect your wallet to send transactions
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            className="w-fit"
            onClick={handleSubmitTransaction}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Send ETH"
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Histórico de Transações */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Transaction History</h2>
          {account && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshTransactions}
              disabled={isLoadingTransactions}
            >
              {isLoadingTransactions ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          )}
        </div>

        {account ? (
          isLoadingTransactions ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
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
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Transactions</AlertTitle>
              <AlertDescription>
                No transactions found for this address
              </AlertDescription>
            </Alert>
          )
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Connected</AlertTitle>
            <AlertDescription>
              Connect your wallet to see your transaction history
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
