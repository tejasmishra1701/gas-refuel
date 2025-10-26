"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { SUPPORTED_CHAINS, CHAIN_ARRAY, ChainKey } from "@/lib/chains";
import { formatBalance } from "@/lib/utils";
import { ChainIcon } from "./ChainIcon";
import { bridgeTokens } from "@/lib/nexus";
import toast from "react-hot-toast";

interface BridgeExecuteModalProps {
  isOpen: boolean;
  onClose: () => void;
  balances: Record<ChainKey, bigint>;
  onExecute: (
    sourceChain: ChainKey,
    targetChain: ChainKey,
    amount: string,
    executeAction: string
  ) => Promise<void>;
}

const EXECUTE_ACTIONS = [
  {
    id: "stake",
    name: "Stake ETH",
    description: "Bridge ETH and stake on Lido",
    icon: "🏦",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "swap",
    name: "Swap to USDC",
    description: "Bridge ETH and swap to USDC",
    icon: "💱",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "lend",
    name: "Lend on Aave",
    description: "Bridge ETH and lend on Aave",
    icon: "💰",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "nft",
    name: "Mint NFT",
    description: "Bridge ETH and mint an NFT",
    icon: "🎨",
    color: "from-orange-500 to-red-500",
  },
];

export function BridgeExecuteModal({
  isOpen,
  onClose,
  balances,
  onExecute,
}: BridgeExecuteModalProps) {
  const [selectedSource, setSelectedSource] = useState<ChainKey>("sepolia");
  const [selectedTarget, setSelectedTarget] = useState<ChainKey>("baseSepolia");
  const [amount, setAmount] = useState("0.05");
  const [executeAction, setExecuteAction] = useState("stake");
  const [isExecuting, setIsExecuting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle body scroll when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  const handleExecute = async () => {
    if (!onExecute) return;

    setIsExecuting(true);
    try {
      await onExecute(selectedSource, selectedTarget, amount, executeAction);
      onClose();
    } catch (err) {
      console.error("Bridge & Execute failed", err);
    } finally {
      setIsExecuting(false);
    }
  };

  const selectedAction = EXECUTE_ACTIONS.find(
    (action) => action.id === executeAction
  );

  // Handle SSR
  if (!mounted || !isOpen) return null;

  const modalContent = (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content animate-fade-in">
        <div
          className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-700/50 rounded-3xl max-w-2xl w-full mx-4 p-8 shadow-2xl animate-slide-up backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <span className="text-3xl">🌉</span>
                Bridge & Execute
              </h2>
              <p className="text-sm text-zinc-400">
                Bridge ETH and execute an action on the destination chain
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800/50 transition-all hover:scale-110"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Bridge Configuration */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
                Bridge Configuration
              </h3>

              {/* From Chain */}
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wide">
                  From Chain
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <ChainIcon chainKey={selectedSource} size={24} />
                  <span className="text-sm text-zinc-400">
                    {SUPPORTED_CHAINS[selectedSource].name}
                  </span>
                </div>
                <select
                  value={selectedSource}
                  onChange={(e) =>
                    setSelectedSource(e.target.value as ChainKey)
                  }
                  className="w-full bg-zinc-800/70 border border-zinc-700/70 p-4 rounded-xl text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-zinc-800 cursor-pointer"
                >
                  {CHAIN_ARRAY.map((chain) => (
                    <option key={chain.key} value={chain.key}>
                      {chain.name} (
                      {formatBalance(balances[chain.key] || BigInt(0))} ETH)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  ↓
                </div>
              </div>

              {/* To Chain */}
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wide">
                  To Chain
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <ChainIcon chainKey={selectedTarget} size={24} />
                  <span className="text-sm text-zinc-400">
                    {SUPPORTED_CHAINS[selectedTarget].name}
                  </span>
                </div>
                <select
                  value={selectedTarget}
                  onChange={(e) =>
                    setSelectedTarget(e.target.value as ChainKey)
                  }
                  className="w-full bg-zinc-800/70 border border-zinc-700/70 p-4 rounded-xl text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-zinc-800 cursor-pointer"
                >
                  {CHAIN_ARRAY.filter(
                    (chain) => chain.key !== selectedSource
                  ).map((chain) => (
                    <option key={chain.key} value={chain.key}>
                      {chain.name} (
                      {formatBalance(balances[chain.key] || BigInt(0))} ETH)
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wide">
                  Amount (ETH)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-zinc-800/70 border border-zinc-700/70 p-4 rounded-xl text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-zinc-800 text-lg font-semibold"
                  placeholder="0.05"
                />
              </div>
            </div>

            {/* Right Column - Execute Action */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-gradient-to-b from-green-500 to-cyan-500 rounded-full"></span>
                Execute Action
              </h3>

              <div className="space-y-3">
                {EXECUTE_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => setExecuteAction(action.id)}
                    className={`w-full p-4 rounded-xl border transition-all text-left ${
                      executeAction === action.id
                        ? `bg-gradient-to-r ${action.color} text-white border-transparent shadow-lg`
                        : "bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/70 hover:border-zinc-600/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{action.icon}</span>
                      <div>
                        <div className="font-semibold text-sm">
                          {action.name}
                        </div>
                        <div className="text-xs opacity-80">
                          {action.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Action Preview */}
              {selectedAction && (
                <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-zinc-300 mb-2">
                    Action Preview
                  </h4>
                  <div className="text-sm text-zinc-400 space-y-1">
                    <div>
                      1. Bridge {amount} ETH from{" "}
                      {SUPPORTED_CHAINS[selectedSource].name}
                    </div>
                    <div>2. Execute: {selectedAction.name}</div>
                    <div>3. Result: {selectedAction.description}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-8 mt-8 border-t border-zinc-700/50">
            <button
              onClick={handleExecute}
              disabled={isExecuting || !amount || parseFloat(amount) <= 0}
              className="flex-1 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 hover:from-blue-500 hover:via-blue-600 hover:to-purple-600 text-white py-4 px-6 rounded-xl transition-all font-bold shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
            >
              {isExecuting ? "⏳ Executing..." : "🚀 Bridge & Execute"}
            </button>

            <button
              onClick={onClose}
              className="px-8 bg-zinc-800/70 hover:bg-zinc-700/70 text-white py-4 rounded-xl transition-all font-semibold border border-zinc-700/70 hover:border-zinc-600/70 hover:scale-105"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
