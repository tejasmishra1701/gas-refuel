"use client";

import { formatBalance, formatUSD } from "@/lib/utils";
import { SUPPORTED_CHAINS, ChainKey } from "@/lib/chains";
import { ChainIcon } from "./ChainIcon";

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
      className="bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 border border-zinc-800/70 rounded-2xl p-6 hover:border-zinc-700 transition-all duration-300 group backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] relative overflow-hidden"
      style={{ borderLeftColor: chain.color, borderLeftWidth: "4px" }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50 group-hover:scale-110 transition-transform">
              <ChainIcon chainKey={chainKey} size={48} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{chain.name}</h3>
              <p className="text-xs text-zinc-400 font-medium">
                {chain.symbol}
              </p>
            </div>
          </div>
          {isLow && (
            <span className="text-xs bg-red-500/20 text-red-300 px-3 py-1.5 rounded-full font-semibold border border-red-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></span>
              Low Gas
            </span>
          )}
        </div>

        {/* Balance */}
        {isLoading ? (
          <div className="animate-pulse mb-5">
            <div className="h-7 bg-zinc-800 rounded-lg w-32 mb-2"></div>
            <div className="h-5 bg-zinc-800 rounded w-20"></div>
          </div>
        ) : (
          <div className="mb-5">
            <div className="text-2xl font-bold text-white mb-1">
              {balanceStr} {chain.symbol}
            </div>
            <div className="text-sm text-zinc-400 font-medium">
              {formatUSD(balanceStr)}
            </div>
          </div>
        )}

        {/* Action Button */}
        {onRefuel && (
          <button
            onClick={onRefuel}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-zinc-800/70 to-zinc-800/50 hover:from-blue-600/20 hover:to-purple-600/20 text-white py-3 px-4 rounded-xl transition-all text-sm font-semibold border border-zinc-700/70 hover:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed group-hover:shadow-lg"
            style={{
              background: isLoading
                ? undefined
                : `linear-gradient(135deg, ${chain.color}15, transparent)`,
            }}
          >
            {isLoading ? "Loading..." : "⚡ Refuel"}
          </button>
        )}
      </div>
    </div>
  );
}
