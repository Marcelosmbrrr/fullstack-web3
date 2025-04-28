"use client";

import * as React from "react";
import {
  IconDashboard,
  IconDatabase,
  IconFileWord,
  IconInnerShadowTop,
  IconReport,
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
      icon: IconDashboard,
    },
    {
      name: "Transaction",
      url: "transaction",
      icon: IconDashboard,
    },
    {
      name: "Smart Contract",
      url: "smart-contract",
      icon: IconDashboard,
    },
  ],
  dapps: [
    {
      name: "Lottery",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Swap",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Create ERC-20",
      url: "#",
      icon: IconFileWord,
    },
    {
      name: "Create ERC-721",
      url: "#",
      icon: IconFileWord,
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
                <IconInnerShadowTop className="!size-5" />
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
