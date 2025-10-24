"use client";

import { useState, useEffect } from "react";
import { useAccount, useWalletClient, useBalance } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChainBalance } from "./ChainBalance";
import { RefuelModal } from "./RefuelModal";
import { CHAIN_ARRAY, ChainKey, CHAIN_MAP } from "@/lib/chains";
import { formatBalance } from "@/lib/utils";
import { initializeNexusSDK, bridgeTokens } from "@/lib/nexus";

export function GasDashboard() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [balances, setBalances] = useState<Record<ChainKey, bigint>>({
    sepolia: BigInt(0),
    baseSepolia: BigInt(0),
    arbitrumSepolia: BigInt(0),
    optimismSepolia: BigInt(0),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetChain, setTargetChain] = useState<ChainKey | undefined>();
  const [totalBalance, setTotalBalance] = useState<string>("0.00");
  const [nexusReady, setNexusReady] = useState(false);
  const [quickSourceChain, setQuickSourceChain] = useState<ChainKey>("sepolia");
  const [quickTargetChain, setQuickTargetChain] =
    useState<ChainKey>("baseSepolia");
  const [quickAmount, setQuickAmount] = useState("0.05");
  const [mounted, setMounted] = useState(false);

  // Fix hydration by ensuring client-side rendering
  useEffect(() => {
    setMounted(true);
    
    // Cleanup function
    return () => {
      setMounted(false);
    };
  }, []);

  // ✅ Initialize Nexus SDK when wallet connects
  useEffect(() => {
    if (!mounted) return;
    
    if (walletClient && !nexusReady) {
      initializeNexusSDK(walletClient)
        .then(() => {
          if (mounted) {
            console.log("✅ Nexus SDK initialized");
            setNexusReady(true);
          }
        })
        .catch((err) => {
          if (mounted) {
            console.error("❌ Nexus init error:", err);
            setNexusReady(false);
          }
        });
    }
  }, [mounted, walletClient, nexusReady]);

  // ✅ Use wagmi hooks to fetch balances for each chain
  const sepoliaBalance = useBalance({
    address,
    chainId: 11155111, // Ethereum Sepolia
  });

  const baseSepoliaBalance = useBalance({
    address,
    chainId: 84532, // Base Sepolia
  });

  const arbitrumSepoliaBalance = useBalance({
    address,
    chainId: 421614, // Arbitrum Sepolia
  });

  const optimismSepoliaBalance = useBalance({
    address,
    chainId: 11155420, // Optimism Sepolia
  });

  // ✅ Update balances when wagmi data changes
  useEffect(() => {
    // Prevent state updates if component is unmounted
    if (!mounted) return;
    
    if (!address || !isConnected) {
      setIsLoading(false);
      return;
    }

    const newBalances: Record<ChainKey, bigint> = {
      sepolia: sepoliaBalance.data?.value || BigInt(0),
      baseSepolia: baseSepoliaBalance.data?.value || BigInt(0),
      arbitrumSepolia: arbitrumSepoliaBalance.data?.value || BigInt(0),
      optimismSepolia: optimismSepoliaBalance.data?.value || BigInt(0),
    };

    console.log("🔄 Updating balances from wagmi hooks:", {
      sepolia: formatBalance(newBalances.sepolia),
      baseSepolia: formatBalance(newBalances.baseSepolia),
      arbitrumSepolia: formatBalance(newBalances.arbitrumSepolia),
      optimismSepolia: formatBalance(newBalances.optimismSepolia),
    });

    setBalances(newBalances);

    // Total balance
    const total = Object.values(newBalances).reduce(
      (acc, bal) => acc + bal,
      BigInt(0)
    );
    setTotalBalance(formatBalance(total));

    // Check if any balance is still loading
    const isLoading =
      sepoliaBalance.isLoading ||
      baseSepoliaBalance.isLoading ||
      arbitrumSepoliaBalance.isLoading ||
      optimismSepoliaBalance.isLoading;

    setIsLoading(isLoading);
  }, [
    mounted,
    address,
    isConnected,
    sepoliaBalance.data?.value,
    baseSepoliaBalance.data?.value,
    arbitrumSepoliaBalance.data?.value,
    optimismSepoliaBalance.data?.value,
    sepoliaBalance.isLoading,
    baseSepoliaBalance.isLoading,
    arbitrumSepoliaBalance.isLoading,
    optimismSepoliaBalance.isLoading,
  ]);

  // ✅ Open refuel modal
  const handleRefuelClick = (chain?: ChainKey) => {
    setTargetChain(chain);
    setIsModalOpen(true);
  };

  const handleQuickRefuel = async () => {
    console.log("🚀 Quick Refuel Button Clicked");
    console.log("Nexus Ready:", nexusReady);
    console.log("Source Chain:", quickSourceChain);
    console.log("Target Chain:", quickTargetChain);
    console.log("Amount:", quickAmount);

    if (!nexusReady) {
      alert("⚠️ Nexus SDK is still initializing. Please wait.");
      return;
    }

    if (!quickAmount || parseFloat(quickAmount) <= 0) {
      alert("⚠️ Please enter a valid amount.");
      return;
    }

    if (quickSourceChain === quickTargetChain) {
      alert("⚠️ Source and target chains cannot be the same.");
      return;
    }

    console.log("🚀 Starting Quick Refuel...");
    await handleRefuel(quickSourceChain, quickTargetChain, quickAmount);
  };

  // ✅ Refuel handler (now uses Nexus)
  const handleRefuel = async (
    sourceChain: ChainKey,
    targetChain: ChainKey,
    amount: string
  ) => {
    if (!walletClient || !address) {
      alert("⚠️ Wallet not connected");
      return;
    }

    if (!nexusReady) {
      alert("⚠️ Nexus SDK is still initializing. Please wait and try again.");
      return;
    }

    try {
      console.log("🚀 Starting cross-chain refuel via Nexus:", {
        from: sourceChain,
        to: targetChain,
        amount,
      });

      const fromChain = CHAIN_MAP[sourceChain];
      const toChain = CHAIN_MAP[targetChain];

      if (!fromChain || !toChain) {
        alert("Invalid chain selection.");
        return;
      }

      // Trigger Nexus transfer
      const result = await bridgeTokens({
        token: "ETH",
        amount,
        fromChainId: fromChain.id,
        toChainId: toChain.id,
      });

      console.log("✅ Refuel Result:", result);

      if (result.success) {
        alert(
          `✅ Refuel Successful!\n\n` +
            `From: ${fromChain.name}\n` +
            `To: ${toChain.name}\n` +
            `Amount: ${amount} ETH\n\n` +
            `${
              result.transactionHash ? "Tx: " + result.transactionHash : ""
            }\n` +
            `${result.explorerUrl ? result.explorerUrl : ""}`
        );

        setTimeout(() => window.location.reload(), 5000);
      } else {
        throw new Error(result.error || "Transfer failed");
      }
    } catch (error: unknown) {
      console.error("❌ Refuel failed:", error);

      let errorMsg = "Unknown error";
      if (error instanceof Error) {
        errorMsg = error.message;
      }
      if (errorMsg.includes("insufficient")) errorMsg = "Insufficient balance";
      if (errorMsg.includes("denied") || errorMsg.includes("rejected"))
        errorMsg = "Transaction rejected";

      alert(`❌ Refuel Failed\n\n${errorMsg}`);
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">⛽</div>
          <h1 className="text-4xl font-bold mb-4 text-white">Gas Refuel</h1>
          <p className="text-zinc-400 mb-8 text-lg">
            Never run out of gas on any chain
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              ⛽ Gas Dashboard
            </h1>
            <p className="text-zinc-400">
              Manage your cross-chain gas efficiently
            </p>
          </div>
          <ConnectButton />
        </div>

        {/* Total Balance Card */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-blue-100 text-sm mb-2">Total Gas Balance</p>
              <p className="text-4xl font-bold text-white mb-1">
                {totalBalance} ETH
              </p>
              <div className="flex items-center gap-2">
                {nexusReady ? (
                  <span className="text-xs text-green-200">
                    ✅ Cross-chain ready
                  </span>
                ) : (
                  <span className="text-xs text-yellow-200">
                    ⏳ Initializing...
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleRefuelClick()}
              disabled={!nexusReady}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-medium transition-colors backdrop-blur-sm border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Refuel Multiple Chains
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Chain Balances */}
          <div className="xl:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-6">
              Your Chains
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CHAIN_ARRAY.map((chain) => (
                <ChainBalance
                  key={chain.key}
                  chainKey={chain.key}
                  balance={balances[chain.key]}
                  isLoading={isLoading}
                  onRefuel={() => handleRefuelClick(chain.key)}
                />
              ))}
            </div>
          </div>

          {/* Quick Refuel Section */}
          <div className="xl:sticky xl:top-6">
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold mb-6 text-white">
                Quick Refuel
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    From
                  </label>
                  <select
                    value={quickSourceChain}
                    onChange={(e) =>
                      setQuickSourceChain(e.target.value as ChainKey)
                    }
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 p-3 rounded-lg text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {CHAIN_ARRAY.filter((c) => c.key !== quickTargetChain).map(
                      (chain) => (
                        <option key={chain.key} value={chain.key}>
                          {chain.name} ({formatBalance(balances[chain.key])}{" "}
                          ETH)
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    To
                  </label>
                  <select
                    value={quickTargetChain}
                    onChange={(e) =>
                      setQuickTargetChain(e.target.value as ChainKey)
                    }
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 p-3 rounded-lg text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {CHAIN_ARRAY.filter((c) => c.key !== quickSourceChain).map(
                      (chain) => (
                        <option key={chain.key} value={chain.key}>
                          {chain.name} ({formatBalance(balances[chain.key])}{" "}
                          ETH)
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Amount (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={quickAmount}
                    onChange={(e) => setQuickAmount(e.target.value)}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 p-3 rounded-lg text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0.05"
                  />
                </div>

                <button
                  onClick={handleQuickRefuel}
                  disabled={!nexusReady}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3 px-4 rounded-lg transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {nexusReady ? "Quick Refuel" : "Connecting..."}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <RefuelModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            targetChain={targetChain}
            balances={balances}
            onRefuel={handleRefuel}
          />
        )}
      </div>
    </div>
  );
}
