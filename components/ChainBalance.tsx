'use client';

import { formatBalance, formatUSD } from '@/lib/utils';
import { SUPPORTED_CHAINS, ChainKey } from '@/lib/chains';

interface ChainBalanceProps {
  chainKey: ChainKey;
  balance: bigint;
  isLoading?: boolean;
  onRefuel?: () => void;
}

export function ChainBalance({ chainKey, balance, isLoading, onRefuel }: ChainBalanceProps) {
  const chain = SUPPORTED_CHAINS[chainKey];
  const balanceStr = formatBalance(balance);
  const isLow = balance < BigInt(5e15); // Less than 0.005 ETH

  return (
    <div 
      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all"
      style={{ borderLeftColor: chain.color, borderLeftWidth: '3px' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{chain.icon}</span>
          <div>
            <h3 className="font-semibold text-white">{chain.name}</h3>
            <p className="text-sm text-zinc-500">{chain.symbol}</p>
          </div>
        </div>
        {isLow && (
          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
            Low Gas
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-zinc-800 rounded w-32 mb-2"></div>
          <div className="h-4 bg-zinc-800 rounded w-20"></div>
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold text-white mb-1">
            {balanceStr} {chain.symbol}
          </div>
          <div className="text-sm text-zinc-400 mb-4">
            {formatUSD(balanceStr)}
          </div>
        </>
      )}

      {onRefuel && (
        <button
          onClick={onRefuel}
          disabled={isLoading}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
        >
          Refuel This Chain
        </button>
      )}
    </div>
  );
}