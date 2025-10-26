"use client";

import React, { useState } from "react";
import {
  NexusProvider,
  useNexus,
  BridgeButton,
  TransferButton,
  SwapButton,
  BridgeAndExecuteButton,
  SUPPORTED_CHAINS_IDS,
  SUPPORTED_TOKENS,
} from "@avail-project/nexus-widgets";
import { CHAIN_MAP, ChainKey } from "@/lib/chains";
import { formatBalance } from "@/lib/utils";

interface NexusWidgetsProps {
  balances: Record<ChainKey, bigint>;
  onTransactionComplete?: () => void;
}

// Internal component that uses the Nexus hook
function NexusWidgetsContent({
  balances,
  onTransactionComplete,
}: NexusWidgetsProps) {
  const { sdk, isSdkInitialized, initializeSdk } = useNexus();
  const [activeTab, setActiveTab] = useState<
    "bridge" | "transfer" | "swap" | "bridgeExecute"
  >("bridge");

  const handleInitialize = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        await initializeSdk((window as any).ethereum);
      } catch (error: any) {
        // Handle fee grant errors gracefully
        if (
          error?.message?.includes("fee grant") ||
          error?.message?.includes("Network Error") ||
          error?.message?.includes("XAR_CA_SDK")
        ) {
          console.warn("⚠️ Nexus Widgets fee grant failed, continuing...");
        } else {
          console.error("❌ Nexus Widgets initialization failed:", error);
          throw error;
        }
      }
    }
  };

  const handleTransactionComplete = () => {
    onTransactionComplete?.();
  };

  if (!isSdkInitialized) {
    return (
      <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl border border-zinc-700/50 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
          <span className="text-2xl">🧩</span>
          Nexus Widgets
        </h2>
        <div className="text-center py-8">
          <div className="text-6xl mb-4 opacity-50">🔧</div>
          <h3 className="text-xl font-semibold text-zinc-400 mb-2">
            Initialize Nexus Widgets
          </h3>
          <p className="text-zinc-500 text-sm mb-6">
            Connect your wallet to use Nexus pre-built components
          </p>
          <button
            onClick={handleInitialize}
            className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 hover:from-blue-500 hover:via-blue-600 hover:to-purple-600 text-white py-3 px-6 rounded-xl transition-all font-bold shadow-2xl hover:scale-105"
          >
            Initialize Widgets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl border border-zinc-700/50 rounded-3xl p-8 shadow-2xl">
      <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
        <span className="text-2xl">🧩</span>
        Nexus Widgets
        <span className="text-sm bg-green-500/20 text-green-300 px-3 py-1 rounded-full ml-2">
          ✅ Initialized
        </span>
      </h2>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 bg-zinc-800/50 p-1 rounded-xl">
        {[
          { id: "bridge", label: "Bridge", icon: "🌉" },
          { id: "transfer", label: "Transfer", icon: "💸" },
          { id: "swap", label: "Swap", icon: "💱" },
          { id: "bridgeExecute", label: "Bridge & Execute", icon: "⚡" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                : "text-zinc-400 hover:text-white hover:bg-zinc-700/50"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bridge Widget */}
      {activeTab === "bridge" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">
            Bridge Widget
          </h3>
          <BridgeButton
            prefill={{
              fromChainId: 11155111, // Ethereum Sepolia
              toChainId: 84532, // Base Sepolia
              token: "ETH", // Both chains use ETH
              amount: "0.05",
            }}
            title="Bridge ETH with Nexus Widget"
          >
            {({ onClick, isLoading }) => (
              <button
                onClick={() => {
                  onClick();
                  handleTransactionComplete();
                }}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 hover:from-blue-500 hover:via-blue-600 hover:to-purple-600 text-white py-4 px-6 rounded-xl transition-all font-bold shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              >
                {isLoading ? "⏳ Bridging..." : "🌉 Bridge ETH (Widget)"}
              </button>
            )}
          </BridgeButton>
        </div>
      )}

      {/* Transfer Widget */}
      {activeTab === "transfer" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">
            Transfer Widget
          </h3>
          <TransferButton
            prefill={{
              toChainId: 84532, // Base Sepolia
              token: "ETH",
              amount: "0.03",
            }}
            title="Transfer ETH with Nexus Widget"
          >
            {({ onClick, isLoading }) => (
              <button
                onClick={() => {
                  onClick();
                  handleTransactionComplete();
                }}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-600 via-green-700 to-cyan-700 hover:from-green-500 hover:via-green-600 hover:to-cyan-600 text-white py-4 px-6 rounded-xl transition-all font-bold shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              >
                {isLoading ? "⏳ Transferring..." : "💸 Transfer ETH (Widget)"}
              </button>
            )}
          </TransferButton>
        </div>
      )}

      {/* Swap Widget */}
      {activeTab === "swap" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Swap Widget</h3>
          <SwapButton
            prefill={{
              fromChainId: 11155111, // Ethereum Sepolia
              toChainId: 84532, // Base Sepolia
              fromToken: "ETH",
              toToken: "USDC",
              fromAmount: "0.01",
            }}
            title="Swap ETH to USDC with Nexus Widget"
          >
            {({ onClick, isLoading }) => (
              <button
                onClick={() => {
                  onClick();
                  handleTransactionComplete();
                }}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-600 via-orange-700 to-red-700 hover:from-orange-500 hover:via-orange-600 hover:to-red-600 text-white py-4 px-6 rounded-xl transition-all font-bold shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              >
                {isLoading ? "⏳ Swapping..." : "💱 Swap ETH → USDC (Widget)"}
              </button>
            )}
          </SwapButton>
        </div>
      )}

      {/* Bridge & Execute Widget */}
      {activeTab === "bridgeExecute" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">
            Bridge & Execute Widget
          </h3>
          <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4 mb-4">
            <p className="text-sm text-zinc-400">
              This widget demonstrates advanced Nexus functionality by bridging
              ETH and executing a contract function.
              <br />
              <span className="text-xs text-zinc-500">
                Note: This requires a valid contract address and ABI in a real
                implementation.
              </span>
            </p>
          </div>
          <button
            disabled
            className="w-full bg-zinc-800/50 text-zinc-500 py-4 px-6 rounded-xl font-bold cursor-not-allowed"
          >
            🔧 Bridge & Execute (Requires Contract Setup)
          </button>
        </div>
      )}

      {/* Widget Info */}
      <div className="mt-6 pt-6 border-t border-zinc-700/50">
        <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-zinc-300 mb-2">
            Widget Features
          </h4>
          <ul className="text-xs text-zinc-400 space-y-1">
            <li>• Pre-built UI components from Nexus SDK</li>
            <li>• Automatic wallet integration</li>
            <li>• Built-in error handling</li>
            <li>• Consistent design system</li>
            <li>• Reduced development time</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Main component with NexusProvider wrapper
export function NexusWidgets({
  balances,
  onTransactionComplete,
}: NexusWidgetsProps) {
  return (
    <NexusProvider
      config={{
        network: "testnet",
        debug: false,
        // Disable fee grant requests
        skipFeeGrant: true,
      }}
    >
      <NexusWidgetsContent
        balances={balances}
        onTransactionComplete={onTransactionComplete}
      />
    </NexusProvider>
  );
}
