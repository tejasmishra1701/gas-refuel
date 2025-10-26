"use client";

import { useState, useEffect } from "react";
// import { formatBalance } from "@/lib/utils"; // Not used in this component
import { CHAIN_MAP, ChainKey } from "@/lib/chains";

export interface Transaction {
  id: string;
  fromChain: ChainKey;
  toChain: ChainKey;
  amount: string;
  status: "pending" | "completed" | "failed";
  timestamp: number;
  hash?: string;
  explorerUrl?: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export function TransactionHistory({
  transactions,
  isLoading,
}: TransactionHistoryProps) {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    // Update current time every minute for accurate "time ago" display
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return "✅";
      case "pending":
        return "⏳";
      case "failed":
        return "❌";
      default:
        return "❓";
    }
  };

  const getStatusColor = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case "pending":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      case "failed":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      default:
        return "text-zinc-400 bg-zinc-500/20 border-zinc-500/30";
    }
  };

  const formatTimeAgo = (timestamp: number, currentTime: number) => {
    const diff = currentTime - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl border border-zinc-700/50 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold mb-8 text-white flex items-center gap-2">
          <span className="text-2xl">📜</span>
          Transaction History
        </h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-zinc-800 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl border border-zinc-700/50 rounded-3xl p-8 shadow-2xl hover:border-zinc-600/50 transition-all duration-300">
      <h2 className="text-2xl font-bold mb-8 text-white flex items-center gap-2">
        <span className="text-2xl">📜</span>
        Transaction History
        {transactions.length > 0 && (
          <span className="text-sm bg-zinc-800/50 text-zinc-400 px-3 py-1 rounded-full ml-2">
            {transactions.length}
          </span>
        )}
      </h2>

      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 opacity-50">📝</div>
          <h3 className="text-xl font-semibold text-zinc-400 mb-2">
            No transactions yet
          </h3>
          <p className="text-zinc-500 text-sm">
            Your refuel transactions will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
          {transactions.map((tx) => {
            const fromChain = CHAIN_MAP[tx.fromChain];
            const toChain = CHAIN_MAP[tx.toChain];

            return (
              <div
                key={tx.id}
                className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 hover:bg-zinc-800/70 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: fromChain.color + "20" }}
                      >
                        {fromChain.icon}
                      </div>
                      <span className="text-zinc-300 text-sm">→</span>
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: toChain.color + "20" }}
                      >
                        {toChain.icon}
                      </div>
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">
                        {fromChain.name} → {toChain.name}
                      </div>
                      <div className="text-zinc-400 text-xs">
                        {formatTimeAgo(tx.timestamp, currentTime)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                        tx.status
                      )}`}
                    >
                      {getStatusIcon(tx.status)} {tx.status}
                    </span>

                    {tx.explorerUrl && (
                      <a
                        href={tx.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="View on Explorer"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-white">
                    {tx.amount} ETH
                  </div>
                  <div className="text-zinc-400 text-sm">
                    {new Date(tx.timestamp).toLocaleString()}
                  </div>
                </div>

                {tx.hash && (
                  <div className="mt-3 pt-3 border-t border-zinc-700/50">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span>Hash:</span>
                      <code className="bg-zinc-900/50 px-2 py-1 rounded font-mono">
                        {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
