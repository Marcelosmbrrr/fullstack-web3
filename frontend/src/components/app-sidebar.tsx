"use client";

import * as React from "react";

import {
  IconCode,
  IconCurrencyEthereum,
  IconSend,
  IconWallet,
} from "@tabler/icons-react";

import { NavDapps } from "@/components/nav-dapps";
import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      name: "Wallet Scan",
      url: "/",
      icon: IconWallet,
    },
    {
      name: "Transaction",
      url: "transaction",
      icon: IconSend,
    },
  ],
  dapps: [
    {
      name: "Deposit/Withdraw",
      url: "deposit-withdraw",
      icon: IconCode,
    },
    {
      name: "Lottery",
      url: "lottery",
      icon: IconCode,
    },
    {
      name: "Swap",
      url: "swap",
      icon: IconCode,
    },
    {
      name: "Create ERC-20",
      url: "#",
      icon: IconCode,
    },
    {
      name: "Create ERC-721",
      url: "#",
      icon: IconCode,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconCurrencyEthereum className="!size-5" />
                <span className="text-base font-semibold">Learning Web3</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDapps items={data.dapps} />
      </SidebarContent>
    </Sidebar>
  );
}
