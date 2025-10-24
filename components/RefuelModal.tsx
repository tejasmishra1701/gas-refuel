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

interface RefuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetChain?: ChainKey;
  balances: Record<ChainKey, bigint>;
  onRefuel: (
    sourceChain: ChainKey,
    targetChain: ChainKey,
    amount: string
  ) => Promise<void>;
}

export function RefuelModal({
  isOpen,
  onClose,
  targetChain,
  balances,
  onRefuel,
}: RefuelModalProps) {
  const [selectedSource, setSelectedSource] = useState<ChainKey>("sepolia");
  const [selectedTarget, setSelectedTarget] = useState<ChainKey>(
    targetChain || "baseSepolia"
  );
  const [amount, setAmount] = useState("0.005");
  const [isRefueling, setIsRefueling] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (targetChain) setSelectedTarget(targetChain);
  }, [targetChain]);

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

  const handleDoRefuel = async () => {
    if (!onRefuel) return;

    setIsRefueling(true);
    try {
      await onRefuel(selectedSource, selectedTarget, amount);
      onClose();
    } catch (err) {
      console.error("Refuel failed", err);
    } finally {
      setIsRefueling(false);
    }
  };

  // Handle SSR
  if (!mounted || !isOpen) return null;

  const modalContent = (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <div
          className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full mx-4 p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Refuel Gas</h2>
              <p className="text-sm text-zinc-400">
                Transfer ETH between chains
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* From Chain */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                From Chain
              </label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value as ChainKey)}
                className="w-full bg-zinc-800/50 border border-zinc-700/50 p-3 rounded-lg text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                {CHAIN_ARRAY.map((chain) => (
                  <option key={chain.key} value={chain.key}>
                    {chain.icon} {chain.name} (
                    {formatBalance(balances[chain.key] || BigInt(0))} ETH)
                  </option>
                ))}
              </select>
            </div>

            {/* To Chain */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                To Chain
              </label>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value as ChainKey)}
                className="w-full bg-zinc-800/50 border border-zinc-700/50 p-3 rounded-lg text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                {CHAIN_ARRAY.filter(
                  (chain) => chain.key !== selectedSource
                ).map((chain) => (
                  <option key={chain.key} value={chain.key}>
                    {chain.icon} {chain.name} (
                    {formatBalance(balances[chain.key] || BigInt(0))} ETH)
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Amount (ETH)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700/50 p-3 rounded-lg text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="0.005"
              />
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Quick Amounts
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GAS_PRESETS.slice(0, 4).map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setAmount(preset.eth)}
                    className="bg-zinc-800/50 hover:bg-zinc-700/50 text-white py-2 px-3 rounded-lg transition-colors text-sm border border-zinc-700/50 hover:border-zinc-600/50"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDoRefuel}
                disabled={isRefueling || !amount || parseFloat(amount) <= 0}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3 px-4 rounded-lg transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRefueling ? "Refueling..." : "Refuel Gas"}
              </button>

              <button
                onClick={onClose}
                className="px-6 bg-zinc-800/50 hover:bg-zinc-700/50 text-white py-3 rounded-lg transition-colors font-medium border border-zinc-700/50 hover:border-zinc-600/50"
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
