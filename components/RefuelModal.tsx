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
      <div className="modal-content animate-fade-in">
        <div
          className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-700/50 rounded-3xl max-w-lg w-full mx-4 p-8 shadow-2xl animate-slide-up backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <span className="text-2xl">⛽</span>
                Refuel Gas
              </h2>
              <p className="text-sm text-zinc-400">
                Transfer ETH between chains instantly
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
            {/* From Chain */}
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
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value as ChainKey)}
                className="w-full bg-zinc-800/70 border border-zinc-700/70 p-4 rounded-xl text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-zinc-800 cursor-pointer"
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
                placeholder="0.005"
              />
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wide">
                Quick Amounts
              </label>
              <div className="grid grid-cols-2 gap-3">
                {GAS_PRESETS.slice(0, 4).map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setAmount(preset.eth)}
                    className="bg-zinc-800/70 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-purple-600/30 text-white py-3 px-4 rounded-xl transition-all text-sm font-semibold border border-zinc-700/70 hover:border-blue-500/50 hover:scale-105"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleDoRefuel}
                disabled={isRefueling || !amount || parseFloat(amount) <= 0}
                className="flex-1 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 hover:from-blue-500 hover:via-blue-600 hover:to-purple-600 text-white py-4 px-6 rounded-xl transition-all font-bold shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              >
                {isRefueling ? "⏳ Refueling..." : "🚀 Refuel Gas"}
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
