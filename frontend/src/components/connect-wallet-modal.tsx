"use client";

import React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { CircleFadingArrowUp, Wallet } from "lucide-react";

import { useConnect, useAccount, injected } from "wagmi";

export function ConnectWalletModal() {
  const { connect } = useConnect();
  const account = useAccount();

  if (account.isConnected) {
    return;
  }

  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto sm:mx-0 mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <CircleFadingArrowUp className="h-[18px] w-[18px] text-primary" />
          </div>
          <AlertDialogTitle className="text-2xl font-bold tracking-tight">
            Wallet Connection
          </AlertDialogTitle>
          <AlertDialogDescription className="!mt-3 text-[15px]">
            Connect your Ethereum wallet to start interacting with the app. This
            is required to access the plataform.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogAction onClick={() => connect({ connector: injected() })}>
            <Wallet /> Connect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
