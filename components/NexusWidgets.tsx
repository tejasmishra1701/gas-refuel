"use client";

import React, { useState } from "react";
import {
  NexusProvider,
  useNexus,
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

  // Bridge widget state
  const [bridgeFromChain, setBridgeFromChain] = useState(11155111); // Ethereum Sepolia
  const [bridgeToChain, setBridgeToChain] = useState(84532); // Base Sepolia
  const [bridgeAmount, setBridgeAmount] = useState("0.05");

  // Transfer widget state
  const [transferFromChain, setTransferFromChain] = useState(11155111); // Ethereum Sepolia
  const [transferToChain, setTransferToChain] = useState(84532); // Base Sepolia
  const [transferAmount, setTransferAmount] = useState("0.03");

  // Swap widget state
  const [swapFromChain, setSwapFromChain] = useState(11155111); // Ethereum Sepolia
  const [swapToChain, setSwapToChain] = useState(84532); // Base Sepolia
  const [swapFromToken, setSwapFromToken] = useState("ETH");
  const [swapToToken, setSwapToToken] = useState("USDC");
  const [swapAmount, setSwapAmount] = useState("0.01");

  // Bridge & Execute widget state
  const [bridgeExecuteFromChain, setBridgeExecuteFromChain] =
    useState(11155111); // Ethereum Sepolia
  const [bridgeExecuteToChain, setBridgeExecuteToChain] = useState(84532); // Base Sepolia
  const [bridgeExecuteAmount, setBridgeExecuteAmount] = useState("0.05");
  const [bridgeExecuteAction, setBridgeExecuteAction] = useState("stake");

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

      {/* Main Content Area - Fixed Height */}
      <div className="flex gap-6 min-h-[400px]">
        {/* Left Side - Description */}
        <div className="flex-1">
          {/* Bridge Widget Description */}
          {activeTab === "bridge" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Bridge Widget
              </h3>
              <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6">
                <div className="text-sm text-zinc-400 space-y-3">
                  <p>
                    The Bridge Widget allows you to transfer ETH from one blockchain to another seamlessly.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span>Select source and destination chains</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span>Enter the amount of ETH to bridge</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span>Execute cross-chain transfer</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-4">
                    Powered by Avail Nexus SDK for secure and fast cross-chain transfers.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Transfer Widget Description */}
          {activeTab === "transfer" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Transfer Widget
              </h3>
              <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6">
                <div className="text-sm text-zinc-400 space-y-3">
                  <p>
                    The Transfer Widget enables you to move ETH between different blockchain networks.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Choose source and destination chains</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Specify the ETH amount to transfer</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Complete the cross-chain transfer</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-4">
                    Simple and efficient cross-chain ETH transfers with minimal fees.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Swap Widget Description */}
          {activeTab === "swap" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Swap Widget</h3>
              <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6">
                <div className="text-sm text-zinc-400 space-y-3">
                  <p>
                    The Swap Widget allows you to exchange tokens across different chains and token types.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      <span>Select source and destination chains</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      <span>Choose tokens to swap between</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      <span>Enter amount and execute swap</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-4">
                    Cross-chain token swapping with competitive rates and low slippage.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bridge & Execute Widget Description */}
          {activeTab === "bridgeExecute" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Bridge & Execute Widget
              </h3>
              <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6">
                <div className="text-sm text-zinc-400 space-y-3">
                  <p>
                    The Bridge & Execute Widget combines bridging with smart contract execution for advanced DeFi operations.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                      <span>Bridge ETH to destination chain</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                      <span>Execute DeFi action (stake, swap, lend, mint)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                      <span>Complete in a single transaction</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-4">
                    Advanced functionality for sophisticated DeFi strategies across multiple chains.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Interactive Card */}
        <div className="w-96">
          <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-xl border border-zinc-600/50 rounded-2xl p-6 shadow-xl">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-xl">
                {activeTab === "bridge" && "🌉"}
                {activeTab === "transfer" && "💸"}
                {activeTab === "swap" && "💱"}
                {activeTab === "bridgeExecute" && "⚡"}
              </span>
              Configure {activeTab === "bridge" && "Bridge"}
              {activeTab === "transfer" && "Transfer"}
              {activeTab === "swap" && "Swap"}
              {activeTab === "bridgeExecute" && "Bridge & Execute"}
            </h4>
            
            {/* Bridge Widget Card */}
            {activeTab === "bridge" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      From Chain
                    </label>
                    <select
                      value={bridgeFromChain}
                      onChange={(e) => setBridgeFromChain(Number(e.target.value))}
                      className="w-full bg-zinc-700/70 border border-zinc-600/70 p-2 rounded-lg text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-zinc-700 cursor-pointer text-sm"
                    >
                      <option value={11155111}>Ethereum Sepolia</option>
                      <option value={84532}>Base Sepolia</option>
                      <option value={421614}>Arbitrum Sepolia</option>
                      <option value={11155420}>Optimism Sepolia</option>
                      <option value={80002}>Polygon Amoy</option>
                      <option value={534351}>Scroll Sepolia</option>
                      <option value={59141}>Linea Sepolia</option>
                      <option value={5003}>Mantle Sepolia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      To Chain
                    </label>
                    <select
                      value={bridgeToChain}
                      onChange={(e) => setBridgeToChain(Number(e.target.value))}
                      className="w-full bg-zinc-700/70 border border-zinc-600/70 p-2 rounded-lg text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-zinc-700 cursor-pointer text-sm"
                    >
                      <option value={11155111}>Ethereum Sepolia</option>
                      <option value={84532}>Base Sepolia</option>
                      <option value={421614}>Arbitrum Sepolia</option>
                      <option value={11155420}>Optimism Sepolia</option>
                      <option value={80002}>Polygon Amoy</option>
                      <option value={534351}>Scroll Sepolia</option>
                      <option value={59141}>Linea Sepolia</option>
                      <option value={5003}>Mantle Sepolia</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Amount (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={bridgeAmount}
                    onChange={(e) => setBridgeAmount(e.target.value)}
                    className="w-full bg-zinc-700/70 border border-zinc-600/70 p-2 rounded-lg text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-zinc-700 text-sm"
                    placeholder="0.05"
                  />
                </div>
                
                <button
                  onClick={async () => {
                    if (bridgeFromChain === bridgeToChain) {
                      const { default: toast } = await import("react-hot-toast");
                      toast.error("Source and target chains cannot be the same.", {
                        icon: "⚠️",
                        duration: 4000,
                      });
                      return;
                    }
                    
                    if (!bridgeAmount || parseFloat(bridgeAmount) <= 0) {
                      const { default: toast } = await import("react-hot-toast");
                      toast.error("Please enter a valid amount.", {
                        icon: "⚠️",
                        duration: 4000,
                      });
                      return;
                    }
                    
                    try {
                      const { bridgeTokens } = await import("@/lib/nexus");
                      
                      const result = await bridgeTokens({
                        token: "ETH",
                        amount: bridgeAmount,
                        fromChainId: bridgeFromChain,
                        toChainId: bridgeToChain,
                      });
                      
                      console.log("Bridge Widget Result:", result);
                      
                      if (result.success) {
                        handleTransactionComplete();
                        const { default: toast } = await import("react-hot-toast");
                        toast.success("Bridge completed successfully!", {
                          icon: "🎉",
                          duration: 5000,
                        });
                      }
                    } catch (error) {
                      console.error("Bridge Widget Error:", error);
                      const { default: toast } = await import("react-hot-toast");
                      toast.error("Bridge failed. Please try again.", {
                        icon: "❌",
                        duration: 5000,
                      });
                    }
                  }}
                  disabled={!bridgeAmount || parseFloat(bridgeAmount) <= 0 || bridgeFromChain === bridgeToChain}
                  className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 hover:from-blue-500 hover:via-blue-600 hover:to-purple-600 text-white py-3 px-4 rounded-lg transition-all font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 text-sm"
                >
                  🌉 Bridge ETH
                </button>
              </div>
            )}

            {/* Transfer Widget Card */}
            {activeTab === "transfer" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      From Chain
                    </label>
                    <select
                      value={transferFromChain}
                      onChange={(e) => setTransferFromChain(Number(e.target.value))}
                      className="w-full bg-zinc-700/70 border border-zinc-600/70 p-2 rounded-lg text-white/90 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all hover:bg-zinc-700 cursor-pointer text-sm"
                    >
                      <option value={11155111}>Ethereum Sepolia</option>
                      <option value={84532}>Base Sepolia</option>
                      <option value={421614}>Arbitrum Sepolia</option>
                      <option value={11155420}>Optimism Sepolia</option>
                      <option value={80002}>Polygon Amoy</option>
                      <option value={534351}>Scroll Sepolia</option>
                      <option value={59141}>Linea Sepolia</option>
                      <option value={5003}>Mantle Sepolia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      To Chain
                    </label>
                    <select
                      value={transferToChain}
                      onChange={(e) => setTransferToChain(Number(e.target.value))}
                      className="w-full bg-zinc-700/70 border border-zinc-600/70 p-2 rounded-lg text-white/90 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all hover:bg-zinc-700 cursor-pointer text-sm"
                    >
                      <option value={11155111}>Ethereum Sepolia</option>
                      <option value={84532}>Base Sepolia</option>
                      <option value={421614}>Arbitrum Sepolia</option>
                      <option value={11155420}>Optimism Sepolia</option>
                      <option value={80002}>Polygon Amoy</option>
                      <option value={534351}>Scroll Sepolia</option>
                      <option value={59141}>Linea Sepolia</option>
                      <option value={5003}>Mantle Sepolia</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Amount (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full bg-zinc-700/70 border border-zinc-600/70 p-2 rounded-lg text-white/90 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all hover:bg-zinc-700 text-sm"
                    placeholder="0.03"
                  />
                </div>
                
                <button
                  onClick={async () => {
                    if (transferFromChain === transferToChain) {
                      const { default: toast } = await import("react-hot-toast");
                      toast.error("Source and target chains cannot be the same.", {
                        icon: "⚠️",
                        duration: 4000,
                      });
                      return;
                    }
                    
                    if (!transferAmount || parseFloat(transferAmount) <= 0) {
                      const { default: toast } = await import("react-hot-toast");
                      toast.error("Please enter a valid amount.", {
                        icon: "⚠️",
                        duration: 4000,
                      });
                      return;
                    }
                    
                    try {
                      const { bridgeTokens } = await import("@/lib/nexus");
                      
                      const result = await bridgeTokens({
                        token: "ETH",
                        amount: transferAmount,
                        fromChainId: transferFromChain,
                        toChainId: transferToChain,
                      });
                      
                      console.log("Transfer Widget Result:", result);
                      
                      if (result.success) {
                        handleTransactionComplete();
                        const { default: toast } = await import("react-hot-toast");
                        toast.success("Transfer completed successfully!", {
                          icon: "🎉",
                          duration: 5000,
                        });
                      }
                    } catch (error) {
                      console.error("Transfer Widget Error:", error);
                      const { default: toast } = await import("react-hot-toast");
                      toast.error("Transfer failed. Please try again.", {
                        icon: "❌",
                        duration: 5000,
                      });
                    }
                  }}
                  disabled={!transferAmount || parseFloat(transferAmount) <= 0 || transferFromChain === transferToChain}
                  className="w-full bg-gradient-to-r from-green-600 via-green-700 to-cyan-700 hover:from-green-500 hover:via-green-600 hover:to-cyan-600 text-white py-3 px-4 rounded-lg transition-all font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 text-sm"
                >
                  💸 Transfer ETH
                </button>
              </div>
            )}

            {/* Swap Widget Card */}
            {activeTab === "swap" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      From Chain
                    </label>
                    <select
                      value={swapFromChain}
                      onChange={(e) => setSwapFromChain(Number(e.target.value))}
                      className="w-full bg-zinc-700/70 border border-zinc-600/70 p-2 rounded-lg text-white/90 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all hover:bg-zinc-700 cursor-pointer text-sm"
                    >
                      <option value={11155111}>Ethereum Sepolia</option>
                      <option value={84532}>Base Sepolia</option>
                      <option value={421614}>Arbitrum Sepolia</option>
                      <option value={11155420}>Optimism Sepolia</option>
                      <option value={80002}>Polygon Amoy</option>
                      <option value={534351}>Scroll Sepolia</option>
                      <option value={59141}>Linea Sepolia</option>
                      <option value={5003}>Mantle Sepolia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      To Chain
                    </label>
                    <select
                      value={swapToChain}
                      onChange={(e) => setSwapToChain(Number(e.target.value))}
                      className="w-full bg-zinc-700/70 border border-zinc-600/70 p-2 rounded-lg text-white/90 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all hover:bg-zinc-700 cursor-pointer text-sm"
                    >
                      <option value={11155111}>Ethereum Sepolia</option>
                      <option value={84532}>Base Sepolia</option>
                      <option value={421614}>Arbitrum Sepolia</option>
                      <option value={11155420}>Optimism Sepolia</option>
                      <option value={80002}>Polygon Amoy</option>
                      <option value={534351}>Scroll Sepolia</option>
                      <option value={59141}>Linea Sepolia</option>
                      <option value={5003}>Mantle Sepolia</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      From Token
                    </label>
                    <select
                      value={swapFromToken}
                      onChange={(e) => setSwapFromToken(e.target.value)}
                      className="w-full bg-zinc-700/70 border border-zinc-600/70 p-2 rounded-lg text-white/90 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all hover:bg-zinc-700 cursor-pointer text-sm"
                    >
                      <option value="ETH">ETH</option>
                      <option value="USDC">USDC</option>
                      <option value="USDT">USDT</option>
                      <option value="DAI">DAI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      To Token
                    </label>
                    <select
                      value={swapToToken}
                      onChange={(e) => setSwapToToken(e.target.value)}
                      className="w-full bg-zinc-700/70 border border-zinc-600/70 p-2 rounded-lg text-white/90 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all hover:bg-zinc-700 cursor-pointer text-sm"
                    >
                      <option value="ETH">ETH</option>
                      <option value="USDC">USDC</option>
                      <option value="USDT">USDT</option>
                      <option value="DAI">DAI</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Amount ({swapFromToken})
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    className="w-full bg-zinc-700/70 border border-zinc-600/70 p-2 rounded-lg text-white/90 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all hover:bg-zinc-700 text-sm"
                    placeholder="0.01"
                  />
                </div>
                
                <button
                  onClick={async () => {
                    if (swapFromChain === swapToChain) {
                      const { default: toast } = await import("react-hot-toast");
                      toast.error("Source and target chains cannot be the same.", {
                        icon: "⚠️",
                        duration: 4000,
                      });
                      return;
                    }
                    
                    if (swapFromToken === swapToToken) {
                      const { default: toast } = await import("react-hot-toast");
                      toast.error("From and to tokens cannot be the same.", {
                        icon: "⚠️",
                        duration: 4000,
                      });
                      return;
                    }
                    
                    if (!swapAmount || parseFloat(swapAmount) <= 0) {
                      const { default: toast } = await import("react-hot-toast");
                      toast.error("Please enter a valid amount.", {
                        icon: "⚠️",
                        duration: 4000,
                      });
                      return;
                    }
                    
                    try {
                      const { bridgeTokens } = await import("@/lib/nexus");
                      
                      const result = await bridgeTokens({
                        token: swapFromToken,
                        amount: swapAmount,
                        fromChainId: swapFromChain,
                        toChainId: swapToChain,
                      });
                      
                      console.log("Swap Widget Result:", result);
                      
                      if (result.success) {
                        handleTransactionComplete();
                        const { default: toast } = await import("react-hot-toast");
                        toast.success(`Swap ${swapAmount} ${swapFromToken} → ${swapToToken} completed successfully!`, {
                          icon: "🎉",
                          duration: 5000,
                        });
                      }
                    } catch (error) {
                      console.error("Swap Widget Error:", error);
                      const { default: toast } = await import("react-hot-toast");
                      toast.error("Swap failed. Please try again.", {
                        icon: "❌",
                        duration: 5000,
                      });
                    }
                  }}
                  disabled={!swapAmount || parseFloat(swapAmount) <= 0 || swapFromChain === swapToChain || swapFromToken === swapToToken}
                  className="w-full bg-gradient-to-r from-orange-600 via-orange-700 to-red-700 hover:from-orange-500 hover:via-orange-600 hover:to-red-600 text-white py-3 px-4 rounded-lg transition-all font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 text-sm"
                >
                  💱 Swap {swapFromToken} → {swapToToken}
                </button>
              </div>
            )}

            {/* Bridge & Execute Widget Card */}
            {activeTab === "bridgeExecute" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      From Chain
                    </label>
                    <select
                      value={bridgeExecuteFromChain}
                      onChange={(e) => setBridgeExecuteFromChain(Number(e.target.value))}
                      className="w-full bg-zinc-700/70 border border-zinc-600/70 p-2 rounded-lg text-white/90 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all hover:bg-zinc-700 cursor-pointer text-sm"
                    >
                      <option value={11155111}>Ethereum Sepolia</option>
                      <option value={84532}>Base Sepolia</option>
                      <option value={421614}>Arbitrum Sepolia</option>
                      <option value={11155420}>Optimism Sepolia</option>
                      <option value={80002}>Polygon Amoy</option>
                      <option value={534351}>Scroll Sepolia</option>
                      <option value={59141}>Linea Sepolia</option>
                      <option value={5003}>Mantle Sepolia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      To Chain
                    </label>
                    <select
                      value={bridgeExecuteToChain}
                      onChange={(e) => setBridgeExecuteToChain(Number(e.target.value))}
                      className="w-full bg-zinc-700/70 border border-zinc-600/70 p-2 rounded-lg text-white/90 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all hover:bg-zinc-700 cursor-pointer text-sm"
                    >
                      <option value={11155111}>Ethereum Sepolia</option>
                      <option value={84532}>Base Sepolia</option>
                      <option value={421614}>Arbitrum Sepolia</option>
                      <option value={11155420}>Optimism Sepolia</option>
                      <option value={80002}>Polygon Amoy</option>
                      <option value={534351}>Scroll Sepolia</option>
                      <option value={59141}>Linea Sepolia</option>
                      <option value={5003}>Mantle Sepolia</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Amount (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={bridgeExecuteAmount}
                    onChange={(e) => setBridgeExecuteAmount(e.target.value)}
                    className="w-full bg-zinc-700/70 border border-zinc-600/70 p-2 rounded-lg text-white/90 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all hover:bg-zinc-700 text-sm"
                    placeholder="0.05"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Execute Action
                  </label>
                  <select
                    value={bridgeExecuteAction}
                    onChange={(e) => setBridgeExecuteAction(e.target.value)}
                    className="w-full bg-zinc-700/70 border border-zinc-600/70 p-2 rounded-lg text-white/90 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all hover:bg-zinc-700 cursor-pointer text-sm"
                  >
                    <option value="stake">Stake ETH</option>
                    <option value="swap">Swap to USDC</option>
                    <option value="lend">Lend on Aave</option>
                    <option value="nft">Mint NFT</option>
                  </select>
                </div>
                
                <button
                  onClick={async () => {
                    if (bridgeExecuteFromChain === bridgeExecuteToChain) {
                      const { default: toast } = await import("react-hot-toast");
                      toast.error("Source and target chains cannot be the same.", {
                        icon: "⚠️",
                        duration: 4000,
                      });
                      return;
                    }
                    
                    if (!bridgeExecuteAmount || parseFloat(bridgeExecuteAmount) <= 0) {
                      const { default: toast } = await import("react-hot-toast");
                      toast.error("Please enter a valid amount.", {
                        icon: "⚠️",
                        duration: 4000,
                      });
                      return;
                    }
                    
                    try {
                      const { bridgeAndExecute } = await import("@/lib/nexus");
                      
                      const result = await bridgeAndExecute({
                        token: "ETH",
                        amount: bridgeExecuteAmount,
                        fromChainId: bridgeExecuteFromChain,
                        toChainId: bridgeExecuteToChain,
                        executeAction: bridgeExecuteAction,
                      });
                      
                      console.log("Bridge & Execute Widget Result:", result);
                      
                      if (result.success) {
                        handleTransactionComplete();
                        const { default: toast } = await import("react-hot-toast");
                        toast.success("Bridge & Execute completed successfully!", {
                          icon: "🎉",
                          duration: 5000,
                        });
                      }
                    } catch (error) {
                      console.error("Bridge & Execute Widget Error:", error);
                      const { default: toast } = await import("react-hot-toast");
                      toast.error("Bridge & Execute failed. Please try again.", {
                        icon: "❌",
                        duration: 5000,
                      });
                    }
                  }}
                  disabled={!bridgeExecuteAmount || parseFloat(bridgeExecuteAmount) <= 0 || bridgeExecuteFromChain === bridgeExecuteToChain}
                  className="w-full bg-gradient-to-r from-cyan-600 via-cyan-700 to-blue-700 hover:from-cyan-500 hover:via-cyan-600 hover:to-blue-600 text-white py-3 px-4 rounded-lg transition-all font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 text-sm"
                >
                  ⚡ Bridge & Execute
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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
          <h3 className="text-lg font-semibold text-white mb-4">
            Bridge Widget
          </h3>

          {/* Custom Bridge Implementation */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  From Chain
                </label>
                <select
                  value={bridgeFromChain}
                  onChange={(e) => setBridgeFromChain(Number(e.target.value))}
                  className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-zinc-800 cursor-pointer"
                >
                  <option value={11155111}>Ethereum Sepolia</option>
                  <option value={84532}>Base Sepolia</option>
                  <option value={421614}>Arbitrum Sepolia</option>
                  <option value={11155420}>Optimism Sepolia</option>
                  <option value={80002}>Polygon Amoy</option>
                  <option value={534351}>Scroll Sepolia</option>
                  <option value={59141}>Linea Sepolia</option>
                  <option value={5003}>Mantle Sepolia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  To Chain
                </label>
                <select
                  value={bridgeToChain}
                  onChange={(e) => setBridgeToChain(Number(e.target.value))}
                  className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-zinc-800 cursor-pointer"
                >
                  <option value={11155111}>Ethereum Sepolia</option>
                  <option value={84532}>Base Sepolia</option>
                  <option value={421614}>Arbitrum Sepolia</option>
                  <option value={11155420}>Optimism Sepolia</option>
                  <option value={80002}>Polygon Amoy</option>
                  <option value={534351}>Scroll Sepolia</option>
                  <option value={59141}>Linea Sepolia</option>
                  <option value={5003}>Mantle Sepolia</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">
                Amount (ETH)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={bridgeAmount}
                onChange={(e) => setBridgeAmount(e.target.value)}
                className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-zinc-800"
                placeholder="0.05"
              />
            </div>

            <button
              onClick={async () => {
                if (bridgeFromChain === bridgeToChain) {
                  const { default: toast } = await import("react-hot-toast");
                  toast.error("Source and target chains cannot be the same.", {
                    icon: "⚠️",
                    duration: 4000,
                  });
                  return;
                }

                if (!bridgeAmount || parseFloat(bridgeAmount) <= 0) {
                  const { default: toast } = await import("react-hot-toast");
                  toast.error("Please enter a valid amount.", {
                    icon: "⚠️",
                    duration: 4000,
                  });
                  return;
                }

                try {
                  const { bridgeTokens } = await import("@/lib/nexus");

                  const result = await bridgeTokens({
                    token: "ETH",
                    amount: bridgeAmount,
                    fromChainId: bridgeFromChain,
                    toChainId: bridgeToChain,
                  });

                  console.log("Bridge Widget Result:", result);

                  if (result.success) {
                    handleTransactionComplete();
                    const { default: toast } = await import("react-hot-toast");
                    toast.success("Bridge completed successfully!", {
                      icon: "🎉",
                      duration: 5000,
                    });
                  }
                } catch (error) {
                  console.error("Bridge Widget Error:", error);
                  const { default: toast } = await import("react-hot-toast");
                  toast.error("Bridge failed. Please try again.", {
                    icon: "❌",
                    duration: 5000,
                  });
                }
              }}
              disabled={
                !bridgeAmount ||
                parseFloat(bridgeAmount) <= 0 ||
                bridgeFromChain === bridgeToChain
              }
              className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 hover:from-blue-500 hover:via-blue-600 hover:to-purple-600 text-white py-4 px-6 rounded-xl transition-all font-bold shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
            >
              🌉 Bridge ETH (Widget)
            </button>
          </div>
        </div>
      )}

      {/* Transfer Widget */}
      {activeTab === "transfer" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">
            Transfer Widget
          </h3>

          {/* Custom Transfer Implementation */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  From Chain
                </label>
                <select
                  value={transferFromChain}
                  onChange={(e) => setTransferFromChain(Number(e.target.value))}
                  className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all hover:bg-zinc-800 cursor-pointer"
                >
                  <option value={11155111}>Ethereum Sepolia</option>
                  <option value={84532}>Base Sepolia</option>
                  <option value={421614}>Arbitrum Sepolia</option>
                  <option value={11155420}>Optimism Sepolia</option>
                  <option value={80002}>Polygon Amoy</option>
                  <option value={534351}>Scroll Sepolia</option>
                  <option value={59141}>Linea Sepolia</option>
                  <option value={5003}>Mantle Sepolia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  To Chain
                </label>
                <select
                  value={transferToChain}
                  onChange={(e) => setTransferToChain(Number(e.target.value))}
                  className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all hover:bg-zinc-800 cursor-pointer"
                >
                  <option value={11155111}>Ethereum Sepolia</option>
                  <option value={84532}>Base Sepolia</option>
                  <option value={421614}>Arbitrum Sepolia</option>
                  <option value={11155420}>Optimism Sepolia</option>
                  <option value={80002}>Polygon Amoy</option>
                  <option value={534351}>Scroll Sepolia</option>
                  <option value={59141}>Linea Sepolia</option>
                  <option value={5003}>Mantle Sepolia</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">
                Amount (ETH)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all hover:bg-zinc-800"
                placeholder="0.03"
              />
            </div>

            <button
              onClick={async () => {
                if (transferFromChain === transferToChain) {
                  const { default: toast } = await import("react-hot-toast");
                  toast.error("Source and target chains cannot be the same.", {
                    icon: "⚠️",
                    duration: 4000,
                  });
                  return;
                }
                
                if (!transferAmount || parseFloat(transferAmount) <= 0) {
                  const { default: toast } = await import("react-hot-toast");
                  toast.error("Please enter a valid amount.", {
                    icon: "⚠️",
                    duration: 4000,
                  });
                  return;
                }
                
                try {
                  const { bridgeTokens } = await import("@/lib/nexus");
                  
                  const result = await bridgeTokens({
                    token: "ETH",
                    amount: transferAmount,
                    fromChainId: transferFromChain,
                    toChainId: transferToChain,
                  });

                  console.log("Transfer Widget Result:", result);

                  if (result.success) {
                    handleTransactionComplete();
                    const { default: toast } = await import("react-hot-toast");
                    toast.success("Transfer completed successfully!", {
                      icon: "🎉",
                      duration: 5000,
                    });
                  }
                } catch (error) {
                  console.error("Transfer Widget Error:", error);
                  const { default: toast } = await import("react-hot-toast");
                  toast.error("Transfer failed. Please try again.", {
                    icon: "❌",
                    duration: 5000,
                  });
                }
              }}
              disabled={!transferAmount || parseFloat(transferAmount) <= 0 || transferFromChain === transferToChain}
              className="w-full bg-gradient-to-r from-green-600 via-green-700 to-cyan-700 hover:from-green-500 hover:via-green-600 hover:to-cyan-600 text-white py-4 px-6 rounded-xl transition-all font-bold shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
            >
              💸 Transfer ETH (Widget)
            </button>
          </div>
        </div>
      )}

      {/* Swap Widget */}
      {activeTab === "swap" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Swap Widget</h3>

          {/* Custom Swap Implementation */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  From Chain
                </label>
                <select
                  value={swapFromChain}
                  onChange={(e) => setSwapFromChain(Number(e.target.value))}
                  className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all hover:bg-zinc-800 cursor-pointer"
                >
                  <option value={11155111}>Ethereum Sepolia</option>
                  <option value={84532}>Base Sepolia</option>
                  <option value={421614}>Arbitrum Sepolia</option>
                  <option value={11155420}>Optimism Sepolia</option>
                  <option value={80002}>Polygon Amoy</option>
                  <option value={534351}>Scroll Sepolia</option>
                  <option value={59141}>Linea Sepolia</option>
                  <option value={5003}>Mantle Sepolia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  To Chain
                </label>
                <select
                  value={swapToChain}
                  onChange={(e) => setSwapToChain(Number(e.target.value))}
                  className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all hover:bg-zinc-800 cursor-pointer"
                >
                  <option value={11155111}>Ethereum Sepolia</option>
                  <option value={84532}>Base Sepolia</option>
                  <option value={421614}>Arbitrum Sepolia</option>
                  <option value={11155420}>Optimism Sepolia</option>
                  <option value={80002}>Polygon Amoy</option>
                  <option value={534351}>Scroll Sepolia</option>
                  <option value={59141}>Linea Sepolia</option>
                  <option value={5003}>Mantle Sepolia</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  From Token
                </label>
                <select
                  value={swapFromToken}
                  onChange={(e) => setSwapFromToken(e.target.value)}
                  className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all hover:bg-zinc-800 cursor-pointer"
                >
                  <option value="ETH">ETH</option>
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                  <option value="DAI">DAI</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  To Token
                </label>
                <select
                  value={swapToToken}
                  onChange={(e) => setSwapToToken(e.target.value)}
                  className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all hover:bg-zinc-800 cursor-pointer"
                >
                  <option value="ETH">ETH</option>
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                  <option value="DAI">DAI</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">
                Amount ({swapFromToken})
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={swapAmount}
                onChange={(e) => setSwapAmount(e.target.value)}
                className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all hover:bg-zinc-800"
                placeholder="0.01"
              />
            </div>

            <button
              onClick={async () => {
                if (swapFromChain === swapToChain) {
                  const { default: toast } = await import("react-hot-toast");
                  toast.error("Source and target chains cannot be the same.", {
                    icon: "⚠️",
                    duration: 4000,
                  });
                  return;
                }

                if (swapFromToken === swapToToken) {
                  const { default: toast } = await import("react-hot-toast");
                  toast.error("From and to tokens cannot be the same.", {
                    icon: "⚠️",
                    duration: 4000,
                  });
                  return;
                }

                if (!swapAmount || parseFloat(swapAmount) <= 0) {
                  const { default: toast } = await import("react-hot-toast");
                  toast.error("Please enter a valid amount.", {
                    icon: "⚠️",
                    duration: 4000,
                  });
                  return;
                }

                try {
                  const { bridgeTokens } = await import("@/lib/nexus");

                  const result = await bridgeTokens({
                    token: swapFromToken,
                    amount: swapAmount,
                    fromChainId: swapFromChain,
                    toChainId: swapToChain,
                  });

                  console.log("Swap Widget Result:", result);

                  if (result.success) {
                    handleTransactionComplete();
                    const { default: toast } = await import("react-hot-toast");
                    toast.success(
                      `Swap ${swapAmount} ${swapFromToken} → ${swapToToken} completed successfully!`,
                      {
                        icon: "🎉",
                        duration: 5000,
                      }
                    );
                  }
                } catch (error) {
                  console.error("Swap Widget Error:", error);
                  const { default: toast } = await import("react-hot-toast");
                  toast.error("Swap failed. Please try again.", {
                    icon: "❌",
                    duration: 5000,
                  });
                }
              }}
              disabled={
                !swapAmount ||
                parseFloat(swapAmount) <= 0 ||
                swapFromChain === swapToChain ||
                swapFromToken === swapToToken
              }
              className="w-full bg-gradient-to-r from-orange-600 via-orange-700 to-red-700 hover:from-orange-500 hover:via-orange-600 hover:to-red-600 text-white py-4 px-6 rounded-xl transition-all font-bold shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
            >
              💱 Swap {swapFromToken} → {swapToToken} (Widget)
            </button>
          </div>
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
            </p>
          </div>

          {/* Custom Bridge & Execute Implementation */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  From Chain
                </label>
                <select
                  value={bridgeExecuteFromChain}
                  onChange={(e) =>
                    setBridgeExecuteFromChain(Number(e.target.value))
                  }
                  className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all hover:bg-zinc-800 cursor-pointer"
                >
                  <option value={11155111}>Ethereum Sepolia</option>
                  <option value={84532}>Base Sepolia</option>
                  <option value={421614}>Arbitrum Sepolia</option>
                  <option value={11155420}>Optimism Sepolia</option>
                  <option value={80002}>Polygon Amoy</option>
                  <option value={534351}>Scroll Sepolia</option>
                  <option value={59141}>Linea Sepolia</option>
                  <option value={5003}>Mantle Sepolia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  To Chain
                </label>
                <select
                  value={bridgeExecuteToChain}
                  onChange={(e) =>
                    setBridgeExecuteToChain(Number(e.target.value))
                  }
                  className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all hover:bg-zinc-800 cursor-pointer"
                >
                  <option value={11155111}>Ethereum Sepolia</option>
                  <option value={84532}>Base Sepolia</option>
                  <option value={421614}>Arbitrum Sepolia</option>
                  <option value={11155420}>Optimism Sepolia</option>
                  <option value={80002}>Polygon Amoy</option>
                  <option value={534351}>Scroll Sepolia</option>
                  <option value={59141}>Linea Sepolia</option>
                  <option value={5003}>Mantle Sepolia</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">
                Amount (ETH)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={bridgeExecuteAmount}
                onChange={(e) => setBridgeExecuteAmount(e.target.value)}
                className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all hover:bg-zinc-800"
                placeholder="0.05"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">
                Execute Action
              </label>
              <select
                value={bridgeExecuteAction}
                onChange={(e) => setBridgeExecuteAction(e.target.value)}
                className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all hover:bg-zinc-800 cursor-pointer"
              >
                <option value="stake">Stake ETH</option>
                <option value="swap">Swap to USDC</option>
                <option value="lend">Lend on Aave</option>
                <option value="nft">Mint NFT</option>
              </select>
            </div>

            <button
              onClick={async () => {
                if (bridgeExecuteFromChain === bridgeExecuteToChain) {
                  const { default: toast } = await import("react-hot-toast");
                  toast.error("Source and target chains cannot be the same.", {
                    icon: "⚠️",
                    duration: 4000,
                  });
                  return;
                }

                if (
                  !bridgeExecuteAmount ||
                  parseFloat(bridgeExecuteAmount) <= 0
                ) {
                  const { default: toast } = await import("react-hot-toast");
                  toast.error("Please enter a valid amount.", {
                    icon: "⚠️",
                    duration: 4000,
                  });
                  return;
                }

                try {
                  // Use the same logic as the working Bridge & Execute modal
                  const { bridgeAndExecute } = await import("@/lib/nexus");

                  const result = await bridgeAndExecute({
                    token: "ETH",
                    amount: bridgeExecuteAmount,
                    fromChainId: bridgeExecuteFromChain,
                    toChainId: bridgeExecuteToChain,
                    executeAction: bridgeExecuteAction,
                  });

                  console.log("Bridge & Execute Widget Result:", result);

                  if (result.success) {
                    handleTransactionComplete();
                    // Show success message
                    const { default: toast } = await import("react-hot-toast");
                    toast.success("Bridge & Execute completed successfully!", {
                      icon: "🎉",
                      duration: 5000,
                    });
                  }
                } catch (error) {
                  console.error("Bridge & Execute Widget Error:", error);
                  const { default: toast } = await import("react-hot-toast");
                  toast.error("Bridge & Execute failed. Please try again.", {
                    icon: "❌",
                    duration: 5000,
                  });
                }
              }}
              disabled={
                !bridgeExecuteAmount ||
                parseFloat(bridgeExecuteAmount) <= 0 ||
                bridgeExecuteFromChain === bridgeExecuteToChain
              }
              className="w-full bg-gradient-to-r from-green-600 via-green-700 to-cyan-700 hover:from-green-500 hover:via-green-600 hover:to-cyan-600 text-white py-4 px-6 rounded-xl transition-all font-bold shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
            >
              ⚡ Bridge & Execute ETH (Widget)
            </button>
          </div>
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
