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

interface MultipleRefuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  balances: Record<ChainKey, bigint>;
  onRefuelMultiple: (
    sourceChain: ChainKey,
    targets: RefuelTarget[]
  ) => Promise<void>;
}

export function MultipleRefuelModal({
  isOpen,
  onClose,
  balances,
  onRefuelMultiple,
}: MultipleRefuelModalProps) {
  const [selectedSource, setSelectedSource] = useState<ChainKey>("sepolia");
  const [targets, setTargets] = useState<RefuelTarget[]>([]);
  const [isRefueling, setIsRefueling] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize targets when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialTargets: RefuelTarget[] = CHAIN_ARRAY.filter(
        (chain) => chain.key !== selectedSource
      ).map((chain) => ({
        chain: chain.key,
        amount: "0.005",
        enabled: false,
      }));
      setTargets(initialTargets);
    }
  }, [isOpen, selectedSource]);

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

  const updateTarget = (index: number, updates: Partial<RefuelTarget>) => {
    setTargets((prev) =>
      prev.map((target, i) =>
        i === index ? { ...target, ...updates } : target
      )
    );
  };

  const toggleTarget = (index: number) => {
    updateTarget(index, { enabled: !targets[index].enabled });
  };

  const setAllTargetsAmount = (amount: string) => {
    setTargets((prev) => prev.map((target) => ({ ...target, amount })));
  };

  const getTotalAmount = () => {
    return targets
      .filter((target) => target.enabled)
      .reduce((sum, target) => sum + parseFloat(target.amount || "0"), 0);
  };

  const getEnabledTargets = () => {
    return targets.filter((target) => target.enabled);
  };

  const handleDoRefuel = async () => {
    if (!onRefuelMultiple) return;

    const enabledTargets = getEnabledTargets();
    if (enabledTargets.length === 0) {
      alert("Please select at least one target chain");
      return;
    }

    const totalAmount = getTotalAmount();
    if (totalAmount <= 0) {
      alert("Please enter valid amounts for selected chains");
      return;
    }

    // Check if source has enough balance for all transfers
    const sourceBalance = balances[selectedSource];
    const requiredAmount = BigInt(Math.floor(totalAmount * 1e18));

    if (sourceBalance < requiredAmount) {
      alert(
        `Insufficient balance. You need ${totalAmount} ETH but only have ${formatBalance(
          sourceBalance
        )} ETH`
      );
      return;
    }

    setIsRefueling(true);
    try {
      await onRefuelMultiple(selectedSource, enabledTargets);
      onClose();
    } catch (err) {
      console.error("Multiple refuel failed", err);
    } finally {
      setIsRefueling(false);
    }
  };

  // Handle SSR
  if (!mounted || !isOpen) return null;

  const modalContent = (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content animate-fade-in">
        <div
          className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-700/50 rounded-3xl max-w-4xl w-full mx-4 p-8 shadow-2xl animate-slide-up backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <span className="text-2xl">⛽</span>
                Refuel Multiple Chains
              </h2>
              <p className="text-sm text-zinc-400">
                Transfer ETH from one chain to multiple chains simultaneously
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800/50 transition-all hover:scale-110"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>

          <div className="space-y-6">
            {/* Source Chain */}
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wide">
                From Chain
              </label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value as ChainKey)}
                className="w-full bg-zinc-800/70 border border-zinc-700/70 p-4 rounded-xl text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-zinc-800 cursor-pointer"
              >
                {CHAIN_ARRAY.map((chain) => (
                  <option key={chain.key} value={chain.key}>
                    {chain.icon} {chain.name} (
                    {formatBalance(balances[chain.key] || BigInt(0))} ETH)
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wide">
                Quick Amounts (Applied to All)
              </label>
              <div className="grid grid-cols-4 gap-3">
                {GAS_PRESETS.slice(0, 4).map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setAllTargetsAmount(preset.eth)}
                    className="bg-zinc-800/70 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-purple-600/30 text-white py-3 px-4 rounded-xl transition-all text-sm font-semibold border border-zinc-700/70 hover:border-blue-500/50 hover:scale-105"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Chains */}
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wide">
                Target Chains
              </label>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {targets.map((target, index) => {
                  const chain = CHAIN_ARRAY.find((c) => c.key === target.chain);
                  if (!chain) return null;

                  return (
                    <div
                      key={target.chain}
                      className={`p-4 rounded-xl border transition-all ${
                        target.enabled
                          ? "bg-blue-900/20 border-blue-500/50"
                          : "bg-zinc-800/50 border-zinc-700/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleTarget(index)}
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                            target.enabled
                              ? "bg-blue-500 border-blue-500"
                              : "border-zinc-600 hover:border-zinc-500"
                          }`}
                        >
                          {target.enabled && (
                            <span className="text-white text-sm">✓</span>
                          )}
                        </button>

                        <div className="flex-1 flex items-center gap-3">
                          <span className="text-2xl">{chain.icon}</span>
                          <div>
                            <div className="font-semibold text-white">
                              {chain.name}
                            </div>
                            <div className="text-sm text-zinc-400">
                              Balance:{" "}
                              {formatBalance(
                                balances[target.chain] || BigInt(0)
                              )}{" "}
                              ETH
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
                              updateTarget(index, { amount: e.target.value })
                            }
                            disabled={!target.enabled}
                            className={`w-24 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                              target.enabled
                                ? "bg-zinc-700/70 border border-zinc-600 text-white focus:ring-2 focus:ring-blue-500"
                                : "bg-zinc-800/30 border border-zinc-700/30 text-zinc-500 cursor-not-allowed"
                            }`}
                            placeholder="0.005"
                          />
                          <span className="text-sm text-zinc-400">ETH</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            {getEnabledTargets().length > 0 && (
              <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-blue-300 font-semibold">
                      Total Transfer Summary
                    </div>
                    <div className="text-xs text-zinc-400">
                      {getEnabledTargets().length} chain
                      {getEnabledTargets().length !== 1 ? "s" : ""} selected
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                      {getTotalAmount().toFixed(4)} ETH
                    </div>
                    <div className="text-xs text-zinc-400">
                      From{" "}
                      {CHAIN_ARRAY.find((c) => c.key === selectedSource)?.name}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleDoRefuel}
                disabled={
                  isRefueling ||
                  getEnabledTargets().length === 0 ||
                  getTotalAmount() <= 0
                }
                className="flex-1 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 hover:from-blue-500 hover:via-blue-600 hover:to-purple-600 text-white py-4 px-6 rounded-xl transition-all font-bold shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              >
                {isRefueling
                  ? "⏳ Refueling..."
                  : `🚀 Refuel ${getEnabledTargets().length} Chain${
                      getEnabledTargets().length !== 1 ? "s" : ""
                    }`}
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
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
