"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { ethers } from "ethers";

// Interface para representar uma transação
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  isIncoming: boolean;
}

type EthereumContextType = {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string | null;
  balance: string | null;
  transactions: Transaction[];
  isLoadingTransactions: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  fetchBalance: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  sendTransaction: (
    to: string,
    amountInEther: string
  ) => Promise<ethers.TransactionResponse>;
};

const EthereumContext = createContext<EthereumContextType | undefined>(
  undefined
);

const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY!;

export function EthereumProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const browserProvider = new ethers.BrowserProvider(
        (window as any).ethereum
      );
      setProvider(browserProvider);

      // Listen for account changes
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          disconnectWallet();
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
          fetchBalanceForAccount(accounts[0]);
          // Fetch transactions for the new account
          if (accounts[0]) {
            fetchTransactionsForAccount(accounts[0]);
          }
        }
      };

      const ethereum = (window as any).ethereum;
      ethereum.on("accountsChanged", handleAccountsChanged);

      // Clean up listeners when component unmounts
      return () => {
        ethereum.removeListener("accountsChanged", handleAccountsChanged);
      };
    } else {
      console.error("No Ethereum provider found. Install MetaMask.");
    }
  }, [account]);

  const connectWallet = useCallback(async () => {
    if (!provider) return;
    try {
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      const signerInstance = await provider.getSigner();
      setSigner(signerInstance);

      if (accounts[0]) {
        fetchBalanceForAccount(accounts[0]);
        fetchTransactionsForAccount(accounts[0]);
      }
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    }
  }, [provider]);

  const disconnectWallet = useCallback(() => {
    setSigner(null);
    setAccount(null);
    setBalance(null);
    setTransactions([]);
  }, []);

  const fetchBalanceForAccount = useCallback(
    async (accountAddress: string) => {
      if (!provider) return;
      try {
        const balanceBN = await provider.getBalance(accountAddress);
        const balanceInEther = ethers.formatEther(balanceBN);
        setBalance(balanceInEther);
      } catch (err) {
        console.error("Failed to fetch balance:", err);
      }
    },
    [provider]
  );

  const fetchBalance = useCallback(async () => {
    if (!provider || !account) return;
    await fetchBalanceForAccount(account);
  }, [provider, account, fetchBalanceForAccount]);

  const fetchTransactionsForAccount = useCallback(
    async (accountAddress: string) => {
      if (!provider) return;

      setIsLoadingTransactions(true);
      try {
        const response = await fetch(
          `https://api.etherscan.io/v2/api
           ?chainid=11155111
           &module=account
           &action=balance
           &address=${accountAddress}
           &tag=latest&apikey=${ETHERSCAN_API_KEY}`
        );

        const data = await response.json();

        if (data.status !== "1") {
          throw new Error(data.message || "Failed to fetch transactions");
        }

        const txs: Transaction[] = data.result.map((tx: any) => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: ethers.formatEther(tx.value),
          timestamp: Number(tx.timeStamp) * 1000, // transformar para milliseconds
          isIncoming: tx.to.toLowerCase() === accountAddress.toLowerCase(),
        }));

        setTransactions(txs);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
      } finally {
        setIsLoadingTransactions(false);
      }
    },
    [provider]
  );

  const fetchTransactions = useCallback(async () => {
    if (!provider || !account) return;
    await fetchTransactionsForAccount(account);
  }, [provider, account, fetchTransactionsForAccount]);

  const sendTransaction = useCallback(
    async (to: string, amountInEther: string) => {
      if (!signer) {
        throw new Error("No signer available");
      }
      try {
        const tx = await signer.sendTransaction({
          to,
          value: ethers.parseEther(amountInEther),
        });
        await tx.wait();

        // Atualiza o saldo e a lista de transações após o envio bem-sucedido
        if (account) {
          fetchBalanceForAccount(account);
          fetchTransactionsForAccount(account);
        }

        return tx;
      } catch (err) {
        console.error("Transaction failed:", err);
        throw err;
      }
    },
    [signer, account, fetchBalanceForAccount, fetchTransactionsForAccount]
  );

  return (
    <EthereumContext.Provider
      value={{
        provider,
        signer,
        account,
        balance,
        transactions,
        isLoadingTransactions,
        connectWallet,
        disconnectWallet,
        fetchBalance,
        fetchTransactions,
        sendTransaction,
      }}
    >
      {children}
    </EthereumContext.Provider>
  );
}

// Hook to consume the context
export function useEthereum() {
  const context = useContext(EthereumContext);
  if (!context) {
    throw new Error("useEthereum must be used within an EthereumProvider");
  }
  return context;
}
