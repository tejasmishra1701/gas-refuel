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

// Define custom chains
const polygonAmoy = defineChain({
  id: 80002,
  name: "Polygon Amoy",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc-amoy.polygon.technology"] },
  },
  blockExplorers: {
    default: { name: "PolygonScan", url: "https://amoy.polygonscan.com" },
  },
  testnet: true,
});

const scrollSepolia = defineChain({
  id: 534351,
  name: "Scroll Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://sepolia-rpc.scroll.io"] },
  },
  blockExplorers: {
    default: { name: "Scrollscan", url: "https://sepolia.scrollscan.com" },
  },
  testnet: true,
});

const lineaSepolia = defineChain({
  id: 59141,
  name: "Linea Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.sepolia.linea.build"] },
  },
  blockExplorers: {
    default: { name: "Lineascan", url: "https://sepolia.lineascan.build" },
  },
  testnet: true,
});

const mantleSepolia = defineChain({
  id: 5003,
  name: "Mantle Sepolia",
  nativeCurrency: { name: "MNT", symbol: "MNT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.sepolia.mantle.xyz"] },
  },
  blockExplorers: {
    default: { name: "Mantlescan", url: "https://sepolia.mantlescan.xyz" },
  },
  testnet: true,
});

// Create config outside component to prevent re-initialization
const config = getDefaultConfig({
  appName: "FuelFlow",
  projectId: "e397ba97ad3be14af2fc3ecc0e645e93", // Get this from cloud.walletconnect.com
  chains: [
    sepolia,
    baseSepolia,
    arbitrumSepolia,
    optimismSepolia,
    polygonAmoy,
    scrollSepolia,
    lineaSepolia,
    mantleSepolia,
  ] as any,
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
