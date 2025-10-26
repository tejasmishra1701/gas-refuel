"use client";

import React, { ReactElement } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import {
  mainnet,
  sepolia,
  optimismSepolia,
  baseSepolia,
  arbitrumSepolia,
} from "wagmi/chains";
import { defineChain } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

// Create config outside component to prevent re-initialization
const config = getDefaultConfig({
  appName: "Gas Refuel",
  projectId: "e397ba97ad3be14af2fc3ecc0e645e93", // Get this from cloud.walletconnect.com
  chains: [sepolia, baseSepolia, arbitrumSepolia, optimismSepolia],
});

// Create query client outside component to prevent re-initialization
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children as any}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
