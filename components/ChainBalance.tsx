"use client";

import { formatBalance, formatUSD } from "@/lib/utils";
import { SUPPORTED_CHAINS, ChainKey } from "@/lib/chains";

interface ChainBalanceProps {
  chainKey: ChainKey;
  balance: bigint;
  isLoading?: boolean;
  onRefuel?: () => void;
}

export function ChainBalance({
  chainKey,
  balance,
  isLoading,
  onRefuel,
}: ChainBalanceProps) {
  const chain = SUPPORTED_CHAINS[chainKey];
  const balanceStr = formatBalance(balance);
  const isLow = balance < BigInt(5e15); // Less than 0.005 ETH

  return (
    <div
      className="card animate-slide-in"
      style={{ borderLeftColor: chain.color, borderLeftWidth: "3px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{chain.icon}</span>
          <div>
            <h3 className="font-semibold text-white text-sm">{chain.name}</h3>
            <p className="text-xs text-zinc-500">{chain.symbol}</p>
          </div>
        </div>
        {isLow && (
          <span className="status-indicator status-danger">⚠️ Low Gas</span>
        )}
      </div>

      {/* Balance */}
      {isLoading ? (
        <div className="animate-pulse mb-4">
          <div className="h-6 bg-zinc-800 rounded w-24 mb-2"></div>
          <div className="h-4 bg-zinc-800 rounded w-16"></div>
        </div>
      ) : (
        <div className="mb-4">
          <div className="text-xl font-bold text-white">
            {balanceStr} {chain.symbol}
          </div>
          <div className="text-sm text-zinc-400">{formatUSD(balanceStr)}</div>
        </div>
      )}

      {/* Action Button */}
      {onRefuel && (
        <button
          onClick={onRefuel}
          disabled={isLoading}
          className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Loading..." : "Refuel"}
        </button>
      )}
    </div>
  );
}
