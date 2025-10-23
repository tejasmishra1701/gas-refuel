'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SUPPORTED_CHAINS, CHAIN_ARRAY, ChainKey, GAS_PRESETS } from '@/lib/chains';
import { formatBalance } from '@/lib/utils';

interface RefuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetChain?: ChainKey;
  balances: Record<ChainKey, bigint>;
  onRefuel: (sourceChain: ChainKey, targetChain: ChainKey, amount: string) => Promise<void>;
}

export function RefuelModal({ isOpen, onClose, targetChain, balances, onRefuel }: RefuelModalProps) {
  const [selectedSource, setSelectedSource] = useState<ChainKey>('sepolia');
  const [selectedTarget, setSelectedTarget] = useState<ChainKey>(targetChain || 'baseSepolia');
  const [amount, setAmount] = useState('0.005');
  const [isRefueling, setIsRefueling] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (targetChain) setSelectedTarget(targetChain);
  }, [targetChain]);

  const handleDoRefuel = async () => {
    if (!onRefuel) return;
    
    setIsRefueling(true);
    try {
      await onRefuel(selectedSource, selectedTarget, amount);
      onClose();
    } catch (err) {
      console.error('Refuel failed', err);
    } finally {
      setIsRefueling(false);
    }
  };

  // Handle SSR
  if (!mounted || !isOpen) return null;

  const modalContent = (
    <>
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
        <div
          className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full mx-4 p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Refuel Gas</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">From</label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value as ChainKey)}
                className="w-full bg-zinc-800 p-2 rounded"
              >
                {CHAIN_ARRAY.map(chain => (
                  <option key={chain.key} value={chain.key}>
                    {chain.name} ({formatBalance(balances[chain.key] || BigInt(0))} ETH)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">To</label>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value as ChainKey)}
                className="w-full bg-zinc-800 p-2 rounded"
              >
                {CHAIN_ARRAY.filter(chain => chain.key !== selectedSource).map(chain => (
                  <option key={chain.key} value={chain.key}>
                    {chain.name} ({formatBalance(balances[chain.key] || BigInt(0))} ETH)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Amount (ETH)</label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-zinc-800 p-2 rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDoRefuel}
                disabled={isRefueling || !amount || parseFloat(amount) <= 0}
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isRefueling ? 'Refueling...' : 'Refuel'}
              </button>

              <button
                onClick={onClose}
                className="bg-zinc-700 hover:bg-zinc-600 text-white py-3 px-4 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(
    modalContent,
    document.body
  );
}