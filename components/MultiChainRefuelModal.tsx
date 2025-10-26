"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  SUPPORTED_CHAINS,
  CHAIN_ARRAY,
  ChainKey,
  GAS_PRESETS,
} from "@/lib/chains";
import { formatBalance } from "@/lib/utils";

interface RefuelTarget {
  chain: ChainKey;
  amount: string;
  enabled: boolean;
}

interface MultiChainRefuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  balances: Record<ChainKey, bigint>;
  onRefuelMultiple: (sourceChain: ChainKey, targets: RefuelTarget[]) => Promise<void>;
}

export function MultiChainRefuelModal({
  isOpen,
  onClose,
  balances,
  onRefuelMultiple,
}: MultiChainRefuelModalProps) {
  const [refuelTargets, setRefuelTargets] = useState<RefuelTarget[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("0.05");
  const [sourceChain, setSourceChain] = useState<ChainKey>("sepolia");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Initialize with all chains disabled
      setRefuelTargets(
        CHAIN_ARRAY.map((chain) => ({
          chain: chain.key,
          amount: "0.05",
          enabled: false,
        }))
      );
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleAmountChange = (chainKey: ChainKey, amount: string) => {
    setRefuelTargets((prev) =>
      prev.map((target) =>
        target.chain === chainKey ? { ...target, amount } : target
      )
    );
  };

  const handleEnabledChange = (chainKey: ChainKey, enabled: boolean) => {
    setRefuelTargets((prev) =>
      prev.map((target) =>
        target.chain === chainKey ? { ...target, enabled } : target
      )
    );
  };

  const handlePresetSelect = (preset: (typeof GAS_PRESETS)[0]) => {
    if (preset.label === "Custom") {
      // Apply custom amount to all enabled targets
      setRefuelTargets((prev) =>
        prev.map((target) => ({
          ...target,
          amount: target.enabled ? customAmount : target.amount,
        }))
      );
      return;
    }

    setRefuelTargets((prev) =>
      prev.map((target) => ({
        ...target,
        amount: preset.eth,
      }))
    );
  };

  const handleMultiRefuel = async () => {
    const enabledTargets = refuelTargets.filter((target) => target.enabled);

    if (enabledTargets.length === 0) {
      setError("Please select at least one chain to refuel");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await onRefuelMultiple(sourceChain, enabledTargets);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Multi-chain refuel failed"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const getTotalAmount = () => {
    return refuelTargets
      .filter((target) => target.enabled)
      .reduce((sum, target) => sum + parseFloat(target.amount || "0"), 0)
      .toFixed(4);
  };

  const getEnabledCount = () => {
    return refuelTargets.filter((target) => target.enabled).length;
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="bg-gradient-to-br from-zinc-900/95 to-zinc-950/95 backdrop-blur-xl border border-zinc-700/50 rounded-3xl p-8 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-2xl">🔄</span>
              Multi-Chain Refuel
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Source Chain Selection */}
            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Source Chain
              </h3>
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  Select source chain to refuel from
                </label>
                <select
                  value={sourceChain}
                  onChange={(e) => setSourceChain(e.target.value as ChainKey)}
                  className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                >
                  {CHAIN_ARRAY.map((chain) => (
                    <option key={chain.key} value={chain.key}>
                      {chain.name} ({formatBalance(balances[chain.key])} ETH)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preset Selection */}
            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Quick Amount Presets
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {GAS_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetSelect(preset)}
                    className="bg-zinc-700/50 hover:bg-zinc-600/50 text-white p-3 rounded-lg transition-all font-semibold text-sm"
                  >
                    <div className="font-bold">{preset.label}</div>
                    <div className="text-xs text-zinc-400">
                      {preset.eth} ETH
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <div className="mt-4 pt-4 border-t border-zinc-700/50">
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  Custom Amount (ETH)
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="flex-1 bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    placeholder="0.05"
                  />
                  <button
                    onClick={() =>
                      handlePresetSelect({ label: "Custom", eth: customAmount })
                    }
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-4 py-3 rounded-xl transition-all font-semibold"
                  >
                    Apply Custom
                  </button>
                </div>
              </div>
            </div>

            {/* Chain Selection */}
            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Select Chains to Refuel
              </h3>

              <div className="space-y-4">
                {refuelTargets.filter(target => target.chain !== sourceChain).map((target) => {
                  const chain = SUPPORTED_CHAINS[target.chain];
                  const currentBalance = formatBalance(balances[target.chain]);

                  return (
                    <div
                      key={target.chain}
                      className="flex items-center gap-4 p-4 bg-zinc-700/30 rounded-xl border border-zinc-600/30"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={target.enabled}
                          onChange={(e) =>
                            handleEnabledChange(target.chain, e.target.checked)
                          }
                          className="w-5 h-5 text-green-600 bg-zinc-800 border-zinc-600 rounded focus:ring-green-500 focus:ring-2"
                        />
                        <span className="text-2xl">{chain.icon}</span>
                        <div>
                          <div className="text-white font-semibold">
                            {chain.name}
                          </div>
                          <div className="text-zinc-400 text-sm">
                            Current: {currentBalance} ETH
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.0001"
                          min="0"
                          value={target.amount}
                          onChange={(e) =>
                            handleAmountChange(target.chain, e.target.value)
                          }
                          className="w-24 bg-zinc-800/70 border border-zinc-700/70 p-2 rounded-lg text-white/90 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm"
                          placeholder="0.05"
                        />
                        <span className="text-zinc-400 text-sm">ETH</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            {getEnabledCount() > 0 && (
              <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Refuel Summary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-zinc-700/50 rounded-lg p-3">
                    <div className="text-zinc-400">Chains Selected</div>
                    <div className="text-white font-semibold">
                      {getEnabledCount()}
                    </div>
                  </div>
                  <div className="bg-zinc-700/50 rounded-lg p-3">
                    <div className="text-zinc-400">Total Amount</div>
                    <div className="text-white font-semibold">
                      {getTotalAmount()} ETH
                    </div>
                  </div>
                  <div className="bg-zinc-700/50 rounded-lg p-3">
                    <div className="text-zinc-400">Estimated Cost</div>
                    <div className="text-white font-semibold">
                      ${(parseFloat(getTotalAmount()) * 2000).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4">
                <div className="text-red-300 text-sm">{error}</div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleMultiRefuel}
                disabled={getEnabledCount() === 0 || isProcessing}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing
                  ? "Processing..."
                  : `🔄 Refuel ${getEnabledCount()} Chains`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
