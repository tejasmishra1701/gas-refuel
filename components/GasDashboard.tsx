"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
} from "react";
import { useAccount, useWalletClient, useBalance } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChainBalance } from "./ChainBalance";
import { RefuelModal } from "./RefuelModal";
import { MultipleRefuelModal } from "./MultipleRefuelModal";
import { TransactionHistory } from "./TransactionHistory";
import { BridgeExecuteModal } from "./BridgeExecuteModal";
import { NexusWidgets } from "./NexusWidgets";
import { CHAIN_ARRAY, ChainKey, CHAIN_MAP } from "@/lib/chains";
import { formatBalance } from "@/lib/utils";
import {
  initializeNexusSDK,
  bridgeTokens,
  bridgeToRecipient,
  bridgeAndExecute,
} from "@/lib/nexus";
import { useTransactionHistory } from "@/lib/useTransactionHistory";
import toast, { Toaster } from "react-hot-toast";

export function GasDashboard() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [balances, setBalances] = useState<Record<ChainKey, bigint>>({
    sepolia: BigInt(0),
    baseSepolia: BigInt(0),
    arbitrumSepolia: BigInt(0),
    optimismSepolia: BigInt(0),
    polygonAmoy: BigInt(0),
    monadSepolia: BigInt(0),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMultipleRefuelModalOpen, setIsMultipleRefuelModalOpen] =
    useState(false);
  const [isBridgeExecuteModalOpen, setIsBridgeExecuteModalOpen] =
    useState(false);
  const [targetChain, setTargetChain] = useState<ChainKey | undefined>();
  const [nexusReady, setNexusReady] = useState(false);
  const [quickSourceChain, setQuickSourceChain] = useState<ChainKey>("sepolia");
  const [quickTargetChain, setQuickTargetChain] =
    useState<ChainKey>("baseSepolia");
  const [quickAmount, setQuickAmount] = useState("0.05");
  const [mounted, setMounted] = useState(false);

  // Transaction history
  const {
    transactions,
    isLoading: isHistoryLoading,
    addTransaction,
    updateTransaction,
  } = useTransactionHistory();

  // Fix hydration by ensuring client-side rendering
  useEffect(() => {
    // Use a small delay to ensure hydration is complete
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);

    return () => {
      clearTimeout(timer);
      setMounted(false);
    };
  }, []);

  // ✅ Initialize Nexus SDK when wallet connects
  useEffect(() => {
    if (!mounted) return;

    if (walletClient && !nexusReady) {
      // Set a timeout to prevent infinite "connecting" state
      const timeout = setTimeout(() => {
        if (mounted && !nexusReady) {
          console.warn("⚠️ Nexus SDK initialization timeout, continuing...");
          setNexusReady(true);
        }
      }, 5000); // 5 second timeout

      initializeNexusSDK(walletClient)
        .then(() => {
          if (mounted) {
            clearTimeout(timeout);
            console.log("✅ Nexus SDK initialized");
            setNexusReady(true);
          }
        })
        .catch((err) => {
          if (mounted) {
            clearTimeout(timeout);
            console.error("❌ Nexus init error:", err);
            // Even if initialization fails, mark as ready for basic functionality
            if (
              err?.message?.includes("fee grant") ||
              err?.message?.includes("Network Error") ||
              err?.message?.includes("XAR_CA_SDK")
            ) {
              console.warn("⚠️ Continuing without full Nexus functionality...");
              setNexusReady(true);
            } else {
              setNexusReady(false);
            }
          }
        });

      return () => clearTimeout(timeout);
    }
  }, [mounted, walletClient, nexusReady]);

  // ✅ Persist wallet connection state for 5 minutes
  useEffect(() => {
    if (isConnected && address) {
      // Store connection state in localStorage with timestamp
      const connectionData = {
        connected: true,
        address: address,
        timestamp: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes from now
      };
      localStorage.setItem("wallet-connected", JSON.stringify(connectionData));
    } else {
      localStorage.removeItem("wallet-connected");
    }
  }, [isConnected, address]);

  // ✅ Check for expired wallet connection on mount
  useEffect(() => {
    const checkWalletPersistence = () => {
      try {
        const stored = localStorage.getItem("wallet-connected");
        if (stored) {
          const connectionData = JSON.parse(stored);
          const now = Date.now();

          if (connectionData.expiresAt && now < connectionData.expiresAt) {
            // Connection is still valid, show remaining time
            const remainingMinutes = Math.ceil(
              (connectionData.expiresAt - now) / (60 * 1000)
            );
            console.log(
              `🕒 Wallet connection valid for ${remainingMinutes} more minutes`
            );
          } else {
            // Connection expired, clean up
            localStorage.removeItem("wallet-connected");
            console.log("⏰ Wallet connection expired, cleaned up");
          }
        }
      } catch (error) {
        console.error("Error checking wallet persistence:", error);
        localStorage.removeItem("wallet-connected");
      }
    };

    checkWalletPersistence();
  }, []);

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

  const polygonAmoyBalance = useBalance({
    address,
    chainId: 80002, // Polygon Amoy
  });

  const monadSepoliaBalance = useBalance({
    address,
    chainId: 999999999, // Monad Sepolia
  });

  // ✅ Computed total balance - updates automatically when any balance changes
  const totalBalance = useMemo(() => {
    if (!address || !isConnected) return "0.00";

    const total = Object.values(balances).reduce(
      (acc, bal) => acc + bal,
      BigInt(0)
    );

    return formatBalance(total);
  }, [address, isConnected, balances]);

  // ✅ Function to manually refresh balances with retry logic
  const refreshBalances = useCallback(
    async (retryCount = 0) => {
      if (!address || !isConnected) return;

      console.log(
        `🔄 Manually refreshing balances... (attempt ${retryCount + 1})`
      );

      // Trigger refetch for all balance hooks with individual error handling
      try {
        const results = await Promise.allSettled([
          sepoliaBalance.refetch(),
          baseSepoliaBalance.refetch(),
          arbitrumSepoliaBalance.refetch(),
          optimismSepoliaBalance.refetch(),
          polygonAmoyBalance.refetch(),
          monadSepoliaBalance.refetch(),
        ]);

        // Check for failed requests
        const failedRequests = results.filter(
          (result) => result.status === "rejected"
        );
        if (failedRequests.length > 0 && retryCount < 2) {
          console.warn(
            `⚠️ ${failedRequests.length} balance requests failed, retrying...`
          );
          setTimeout(() => refreshBalances(retryCount + 1), 2000);
          return;
        }

        console.log("✅ Balances refreshed successfully");
      } catch (error) {
        console.error("❌ Error refreshing balances:", error);
        if (retryCount < 2) {
          console.log("🔄 Retrying balance refresh...");
          setTimeout(() => refreshBalances(retryCount + 1), 2000);
        }
      }
    },
    [
      address,
      isConnected,
      sepoliaBalance,
      baseSepoliaBalance,
      arbitrumSepoliaBalance,
      optimismSepoliaBalance,
      polygonAmoyBalance,
      monadSepoliaBalance,
    ]
  );

  // ✅ Debug function to log current balance state
  const logBalanceState = useCallback(() => {
    console.log("📊 Current Balance State:", {
      address,
      isConnected,
      balances: Object.fromEntries(
        Object.entries(balances).map(([key, value]) => [
          key,
          formatBalance(value),
        ])
      ),
      wagmiData: {
        sepolia: sepoliaBalance.data?.value
          ? formatBalance(sepoliaBalance.data.value)
          : "loading",
        baseSepolia: baseSepoliaBalance.data?.value
          ? formatBalance(baseSepoliaBalance.data.value)
          : "loading",
        arbitrumSepolia: arbitrumSepoliaBalance.data?.value
          ? formatBalance(arbitrumSepoliaBalance.data.value)
          : "loading",
        optimismSepolia: optimismSepoliaBalance.data?.value
          ? formatBalance(optimismSepoliaBalance.data.value)
          : "loading",
        polygonAmoy: polygonAmoyBalance.data?.value
          ? formatBalance(polygonAmoyBalance.data.value)
          : "loading",
        monadSepolia: monadSepoliaBalance.data?.value
          ? formatBalance(monadSepoliaBalance.data.value)
          : "loading",
      },
    });
  }, [
    address,
    isConnected,
    balances,
    sepoliaBalance,
    baseSepoliaBalance,
    arbitrumSepoliaBalance,
    optimismSepoliaBalance,
    polygonAmoyBalance,
    monadSepoliaBalance,
  ]);

  // ✅ Enhanced function to force balance refresh after transactions
  const forceBalanceRefresh = useCallback(async () => {
    if (!address || !isConnected) return;

    console.log("🔄 Force refreshing balances after transaction...");
    logBalanceState(); // Log state before refresh

    // Multiple refresh attempts with different strategies
    const refreshStrategies = [
      // Immediate refresh
      () => refreshBalances(),
      // Refresh with small delay
      () =>
        new Promise((resolve) =>
          setTimeout(() => refreshBalances().then(resolve), 1000)
        ),
      // Refresh with medium delay
      () =>
        new Promise((resolve) =>
          setTimeout(() => refreshBalances().then(resolve), 3000)
        ),
      // Refresh with longer delay
      () =>
        new Promise((resolve) =>
          setTimeout(() => refreshBalances().then(resolve), 5000)
        ),
    ];

    try {
      // Execute all refresh strategies
      await Promise.allSettled(refreshStrategies.map((strategy) => strategy()));
      console.log("✅ Force balance refresh completed");
      logBalanceState(); // Log state after refresh
    } catch (error) {
      console.error("❌ Error in force balance refresh:", error);
    }
  }, [address, isConnected, refreshBalances, logBalanceState]);

  // ✅ Update balances when wagmi data changes - using useLayoutEffect for hydration safety
  useLayoutEffect(() => {
    // Only run after hydration is complete
    if (!mounted) return;

    // Use requestAnimationFrame to ensure we're after the render cycle
    const updateBalances = () => {
      if (!address || !isConnected) {
        setIsLoading(false);
        return;
      }

      const newBalances: Record<ChainKey, bigint> = {
        sepolia: sepoliaBalance.data?.value || BigInt(0),
        baseSepolia: baseSepoliaBalance.data?.value || BigInt(0),
        arbitrumSepolia: arbitrumSepoliaBalance.data?.value || BigInt(0),
        optimismSepolia: optimismSepoliaBalance.data?.value || BigInt(0),
        polygonAmoy: polygonAmoyBalance.data?.value || BigInt(0),
        monadSepolia: monadSepoliaBalance.data?.value || BigInt(0),
      };

      console.log("🔄 Updating balances from wagmi hooks:", {
        sepolia: formatBalance(newBalances.sepolia),
        baseSepolia: formatBalance(newBalances.baseSepolia),
        arbitrumSepolia: formatBalance(newBalances.arbitrumSepolia),
        optimismSepolia: formatBalance(newBalances.optimismSepolia),
        polygonAmoy: formatBalance(newBalances.polygonAmoy),
        monadSepolia: formatBalance(newBalances.monadSepolia),
      });

      setBalances(newBalances);

      // Check if any balance is still loading
      const isLoading =
        sepoliaBalance.isLoading ||
        baseSepoliaBalance.isLoading ||
        arbitrumSepoliaBalance.isLoading ||
        optimismSepoliaBalance.isLoading ||
        polygonAmoyBalance.isLoading ||
        monadSepoliaBalance.isLoading;

      setIsLoading(isLoading);
    };

    // Use requestAnimationFrame to ensure we're after hydration
    const rafId = requestAnimationFrame(updateBalances);

    return () => cancelAnimationFrame(rafId);
  }, [
    mounted,
    address,
    isConnected,
    sepoliaBalance.data?.value,
    baseSepoliaBalance.data?.value,
    arbitrumSepoliaBalance.data?.value,
    optimismSepoliaBalance.data?.value,
    polygonAmoyBalance.data?.value,
    monadSepoliaBalance.data?.value,
    sepoliaBalance.isLoading,
    baseSepoliaBalance.isLoading,
    arbitrumSepoliaBalance.isLoading,
    optimismSepoliaBalance.isLoading,
    polygonAmoyBalance.isLoading,
    monadSepoliaBalance.isLoading,
  ]);

  // ✅ Open refuel modal
  const handleRefuelClick = (chain?: ChainKey) => {
    setTargetChain(chain);
    setIsModalOpen(true);
  };

  // ✅ Open multiple refuel modal
  const handleMultipleRefuelClick = () => {
    setIsMultipleRefuelModalOpen(true);
  };

  // ✅ Open Bridge & Execute modal
  const handleBridgeExecuteClick = () => {
    setIsBridgeExecuteModalOpen(true);
  };

  const handleCSVBatchRefuelClick = () => {
    setIsMultipleRefuelModalOpen(true);
  };

  const handleQuickRefuel = async () => {
    console.log("🚀 Quick Refuel Button Clicked");
    console.log("Nexus Ready:", nexusReady);
    console.log("Source Chain:", quickSourceChain);
    console.log("Target Chain:", quickTargetChain);
    console.log("Amount:", quickAmount);

    if (!nexusReady) {
      toast.error("Nexus SDK is still initializing. Please wait.", {
        icon: "⏳",
        duration: 4000,
      });
      return;
    }

    if (!quickAmount || parseFloat(quickAmount) <= 0) {
      toast.error("Please enter a valid amount.", {
        icon: "⚠️",
        duration: 4000,
      });
      return;
    }

    if (quickSourceChain === quickTargetChain) {
      toast.error("Source and target chains cannot be the same.", {
        icon: "⚠️",
        duration: 4000,
      });
      return;
    }

    console.log("🚀 Starting Quick Refuel...");
    await handleRefuel(quickSourceChain, quickTargetChain, quickAmount);
  };

  // ✅ Validate if transfer is possible
  const validateTransfer = (
    sourceChain: ChainKey,
    targetChain: ChainKey,
    amount: string
  ): string | null => {
    if (sourceChain === targetChain) {
      return "Source and target chains cannot be the same";
    }

    if (!amount || parseFloat(amount) <= 0) {
      return "Please enter a valid amount";
    }

    const sourceChainData = CHAIN_MAP[sourceChain];

    // Check if user has sufficient balance
    const sourceBalance = balances[sourceChain];
    const requiredAmount = BigInt(Math.floor(parseFloat(amount) * 1e18));

    if (sourceBalance < requiredAmount) {
      return `Insufficient ${sourceChainData.symbol} balance on ${sourceChainData.name}`;
    }

    return null; // No validation errors
  };

  // ✅ Refuel handler (now uses Nexus)
  const handleRefuel = async (
    sourceChain: ChainKey,
    targetChain: ChainKey,
    amount: string
  ) => {
    if (!walletClient || !address) {
      toast.error("Wallet not connected", {
        icon: "⚠️",
        duration: 4000,
      });
      return;
    }

    if (!nexusReady) {
      toast.error(
        "Nexus SDK is still initializing. Please wait and try again.",
        {
          icon: "⏳",
          duration: 4000,
        }
      );
      return;
    }

    // Validate transfer before attempting
    const validationError = validateTransfer(sourceChain, targetChain, amount);
    if (validationError) {
      toast.error(validationError, {
        icon: "⚠️",
        duration: 4000,
      });
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
        toast.error("Invalid chain selection.", {
          icon: "⚠️",
          duration: 4000,
        });
        return;
      }

      // Add transaction to history (pending)
      const transaction = addTransaction({
        fromChain: sourceChain,
        toChain: targetChain,
        amount,
        status: "pending",
      });

      // Show loading toast
      const loadingToast = toast.loading("Processing refuel transaction...", {
        icon: "🔄",
      });

      // Get chain data for token symbols
      const sourceChainData = CHAIN_MAP[sourceChain];
      const targetChainData = CHAIN_MAP[targetChain];

      // For cross-chain transfers, we need to use ETH as the universal token
      // The SDK will handle the conversion from source chain token to ETH
      const transferToken = "ETH"; // Always use ETH for cross-chain transfers

      // Trigger Nexus transfer
      const result = await bridgeTokens({
        token: transferToken, // Use ETH for all cross-chain transfers
        amount,
        fromChainId: sourceChainData.id,
        toChainId: targetChainData.id,
      });

      console.log("✅ Refuel Result:", result);

      if (result.success) {
        // Update transaction status
        updateTransaction(transaction.id, {
          status: "completed",
          hash: (result as any).txHash || (result as any).transactionHash,
          explorerUrl: result.explorerUrl,
        });

        toast.dismiss(loadingToast);

        toast.success(
          (t) => (
            <div className="flex flex-col gap-2">
              <div className="font-bold text-lg">🎉 Refuel Successful!</div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">From:</span>
                  <span className="font-semibold">{fromChain.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">To:</span>
                  <span className="font-semibold">{toChain.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Amount:</span>
                  <span className="font-semibold">{amount} ETH</span>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                {result.explorerUrl && (
                  <a
                    href={result.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                    onClick={() => toast.dismiss(t.id)}
                  >
                    <svg
                      className="w-3 h-3"
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
                    View Transaction
                  </a>
                )}
                {(result as any).txHash && (
                  <a
                    href={`${fromChain.explorer}/tx/${(result as any).txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-400 hover:text-green-300 underline flex items-center gap-1"
                    onClick={() => toast.dismiss(t.id)}
                  >
                    <svg
                      className="w-3 h-3"
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
                    Source Chain
                  </a>
                )}
              </div>
            </div>
          ),
          {
            duration: 8000,
            style: {
              maxWidth: "500px",
            },
          }
        );

        // Force refresh balances after successful refuel
        // Cross-chain transactions can take time to propagate
        console.log("🎉 Refuel successful, forcing balance refresh...");

        // Show user notification about balance refresh
        toast.loading("Refreshing balances...", {
          id: "balance-refresh",
          duration: 10000,
        });

        forceBalanceRefresh().finally(() => {
          toast.dismiss("balance-refresh");
        });
      } else {
        // Check if this is a user rejection
        const errorMessage = (result as any).error || "Transfer failed";
        const isUserRejection =
          errorMessage.includes("denied") ||
          errorMessage.includes("rejected") ||
          errorMessage.includes("User rejected") ||
          errorMessage.includes("User denied");

        if (isUserRejection) {
          // User rejected the transaction - don't show error, just dismiss loading
          toast.dismiss(loadingToast);
          return; // Exit gracefully without throwing error
        }

        // Update transaction status to failed for actual errors
        updateTransaction(transaction.id, {
          status: "failed",
        });

        toast.dismiss(loadingToast);
        throw new Error(errorMessage);
      }
    } catch (error: unknown) {
      console.error("❌ Refuel failed:", error);

      let errorMsg = "Unknown error";
      if (error instanceof Error) {
        errorMsg = error.message;
      }

      // Handle specific error types
      if (errorMsg.includes("insufficient")) {
        errorMsg = "Insufficient balance";
      } else if (errorMsg.includes("denied") || errorMsg.includes("rejected")) {
        errorMsg = "Transaction rejected";
      } else if (
        errorMsg.includes("Failed to fetch") ||
        errorMsg.includes("Network Error") ||
        errorMsg.includes("fetch")
      ) {
        errorMsg =
          "Network connection failed. Please check your internet connection and try again.";
      } else if (errorMsg.includes("Token not supported")) {
        const sourceChainData = CHAIN_MAP[sourceChain];
        const targetChainData = CHAIN_MAP[targetChain];
        errorMsg = `Cross-chain transfer failed. ${sourceChainData.symbol} from ${sourceChainData.name} cannot be transferred to ${targetChainData.name}. Try using ETH for cross-chain transfers.`;
      } else if (errorMsg.includes("timeout") || errorMsg.includes("TIMEOUT")) {
        errorMsg = "Request timed out. Please try again.";
      } else if (errorMsg.includes("CORS") || errorMsg.includes("cors")) {
        errorMsg = "Network access denied. Please try again.";
      }

      toast.error(errorMsg, {
        icon: "❌",
        duration: 6000,
      });
    }
  };

  // ✅ Multiple refuel handler
  const handleMultipleRefuel = async (
    sourceChain: ChainKey,
    targets: Array<{ chain: ChainKey; amount: string; enabled: boolean }>
  ) => {
    if (!walletClient || !address) {
      toast.error("Wallet not connected", {
        icon: "⚠️",
        duration: 4000,
      });
      return;
    }

    if (!nexusReady) {
      toast.error(
        "Nexus SDK is still initializing. Please wait and try again.",
        {
          icon: "⏳",
          duration: 4000,
        }
      );
      return;
    }

    const enabledTargets = targets.filter((target) => target.enabled);
    if (enabledTargets.length === 0) {
      toast.error("Please select at least one target chain", {
        icon: "⚠️",
        duration: 4000,
      });
      return;
    }

    try {
      console.log("🚀 Starting multiple chain refuel:", {
        from: sourceChain,
        targets: enabledTargets,
      });

      const fromChain = CHAIN_MAP[sourceChain];
      if (!fromChain) {
        toast.error("Invalid source chain selection.", {
          icon: "⚠️",
          duration: 4000,
        });
        return;
      }

      // Show loading toast with progress
      const loadingToast = toast.loading(
        `Processing ${enabledTargets.length} refuel transactions...`,
        {
          icon: "🔄",
        }
      );

      // Execute all transfers in parallel
      const transferPromises = enabledTargets.map(async (target) => {
        const toChain = CHAIN_MAP[target.chain];
        if (!toChain) {
          throw new Error(`Invalid target chain: ${target.chain}`);
        }

        // Add transaction to history (pending)
        const transaction = addTransaction({
          fromChain: sourceChain,
          toChain: target.chain,
          amount: target.amount,
          status: "pending",
        });

        try {
          // Execute the transfer
          const result = await bridgeTokens({
            token: "ETH", // Always use ETH for cross-chain transfers
            amount: target.amount,
            fromChainId: fromChain.id,
            toChainId: toChain.id,
          });

          if (result.success) {
            // Update transaction status
            updateTransaction(transaction.id, {
              status: "completed",
              hash: (result as any).txHash || (result as any).transactionHash,
              explorerUrl: result.explorerUrl,
            });

            return {
              success: true,
              target: target.chain,
              amount: target.amount,
              result,
            };
          } else {
            // Update transaction status to failed
            updateTransaction(transaction.id, {
              status: "failed",
            });

            throw new Error((result as any).error || "Transfer failed");
          }
        } catch (error) {
          // Update transaction status to failed
          updateTransaction(transaction.id, {
            status: "failed",
          });

          throw error;
        }
      });

      // Wait for all transfers to complete
      const results = await Promise.allSettled(transferPromises);

      toast.dismiss(loadingToast);

      // Count successful and failed transfers
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (successful > 0) {
        toast.success(
          (t) => (
            <div className="flex flex-col gap-2">
              <div className="font-bold text-lg">
                🎉 Multiple Refuel Complete!
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">From:</span>
                  <span className="font-semibold">{fromChain.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Successful:</span>
                  <span className="font-semibold text-green-400">
                    {successful} transfer{successful !== 1 ? "s" : ""}
                  </span>
                </div>
                {failed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Failed:</span>
                    <span className="font-semibold text-red-400">
                      {failed} transfer{failed !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ),
          {
            duration: 8000,
            style: {
              maxWidth: "500px",
            },
          }
        );
      }

      if (failed > 0) {
        toast.error(
          `${failed} transfer${
            failed !== 1 ? "s" : ""
          } failed. Check transaction history for details.`,
          {
            icon: "❌",
            duration: 6000,
          }
        );
      }

      // Force refresh balances after all transfers
      console.log("🎉 Multiple refuel complete, forcing balance refresh...");
      toast.loading("Refreshing balances...", {
        id: "balance-refresh",
        duration: 10000,
      });

      forceBalanceRefresh().finally(() => {
        toast.dismiss("balance-refresh");
      });
    } catch (error: unknown) {
      console.error("❌ Multiple refuel failed:", error);

      let errorMsg = "Unknown error";
      if (error instanceof Error) {
        errorMsg = error.message;
      }

      toast.error(errorMsg, {
        icon: "❌",
        duration: 6000,
      });
    }
  };

  // ✅ CSV Batch Refuel handler
  const handleCSVBatchRefuel = async (
    sourceChain: ChainKey,
    targetChain: ChainKey,
    recipients: Array<{ address: string; amount: string }>
  ) => {
    if (!walletClient || !address) {
      toast.error("Wallet not connected", {
        icon: "⚠️",
        duration: 4000,
      });
      return;
    }

    if (!nexusReady) {
      toast.error(
        "Nexus SDK is still initializing. Please wait and try again.",
        {
          icon: "⏳",
          duration: 4000,
        }
      );
      return;
    }

    if (recipients.length === 0) {
      toast.error("No recipients provided", {
        icon: "⚠️",
        duration: 4000,
      });
      return;
    }

    try {
      console.log("🚀 Starting CSV batch refuel:", {
        from: sourceChain,
        to: targetChain,
        recipients: recipients.length,
      });

      const fromChain = CHAIN_MAP[sourceChain];
      const toChain = CHAIN_MAP[targetChain];

      if (!fromChain || !toChain) {
        toast.error("Invalid chain selection.", {
          icon: "⚠️",
          duration: 4000,
        });
        return;
      }

      // Calculate total amount needed
      const totalAmount = recipients.reduce(
        (sum, r) => sum + parseFloat(r.amount),
        0
      );

      // Check if source has enough balance
      const sourceBalance = balances[sourceChain];
      const requiredAmount = BigInt(Math.floor(totalAmount * 1e18));

      if (sourceBalance < requiredAmount) {
        toast.error(
          `Insufficient balance. You need ${totalAmount.toFixed(
            4
          )} ETH but only have ${formatBalance(sourceBalance)} ETH`,
          {
            icon: "⚠️",
            duration: 6000,
          }
        );
        return;
      }

      // Show initial loading toast
      const loadingToast = toast.loading(
        `Starting batch refuel of ${recipients.length} wallets...`,
        {
          icon: "🔄",
        }
      );

      const BATCH_SIZE = 5;
      const totalBatches = Math.ceil(recipients.length / BATCH_SIZE);
      let completedTransfers = 0;
      let successfulTransfers = 0;
      let failedTransfers = 0;

      // Process in batches
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * BATCH_SIZE;
        const endIndex = Math.min(startIndex + BATCH_SIZE, recipients.length);
        const batch = recipients.slice(startIndex, endIndex);

        // Update progress toast
        toast.loading(
          `Processing batch ${
            batchIndex + 1
          } of ${totalBatches} (${completedTransfers}/${
            recipients.length
          } completed)...`,
          {
            id: loadingToast,
            icon: "🔄",
          }
        );

        // Execute batch transfers
        const batchPromises = batch.map(async (recipient) => {
          // Add transaction to history (pending)
          const transaction = addTransaction({
            fromChain: sourceChain,
            toChain: targetChain,
            amount: recipient.amount,
            status: "pending",
          });

          try {
            // Execute the transfer to specific recipient
            const result = await bridgeToRecipient({
              token: "ETH",
              amount: recipient.amount,
              fromChainId: fromChain.id,
              toChainId: toChain.id,
              recipient: recipient.address,
            });

            if (result.success) {
              // Update transaction status
              updateTransaction(transaction.id, {
                status: "completed",
                hash: (result as any).txHash || (result as any).transactionHash,
                explorerUrl: result.explorerUrl,
              });

              return {
                success: true,
                recipient: recipient.address,
                amount: recipient.amount,
                result,
              };
            } else {
              // Update transaction status to failed
              updateTransaction(transaction.id, {
                status: "failed",
              });

              throw new Error((result as any).error || "Transfer failed");
            }
          } catch (error) {
            // Update transaction status to failed
            updateTransaction(transaction.id, {
              status: "failed",
            });

            throw error;
          }
        });

        // Wait for batch to complete
        const batchResults = await Promise.allSettled(batchPromises);

        // Count results
        batchResults.forEach((result) => {
          completedTransfers++;
          if (result.status === "fulfilled") {
            successfulTransfers++;
          } else {
            failedTransfers++;
          }
        });

        // Small delay between batches to avoid overwhelming the network
        if (batchIndex < totalBatches - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Show final results
      if (successfulTransfers > 0) {
        toast.success(
          (t) => (
            <div className="flex flex-col gap-2">
              <div className="font-bold text-lg">
                🎉 CSV Batch Refuel Complete!
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">From:</span>
                  <span className="font-semibold">{fromChain.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">To:</span>
                  <span className="font-semibold">{toChain.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Amount:</span>
                  <span className="font-semibold">
                    {totalAmount.toFixed(4)} ETH
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Successful:</span>
                  <span className="font-semibold text-green-400">
                    {successfulTransfers} transfer
                    {successfulTransfers !== 1 ? "s" : ""}
                  </span>
                </div>
                {failedTransfers > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Failed:</span>
                    <span className="font-semibold text-red-400">
                      {failedTransfers} transfer
                      {failedTransfers !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ),
          {
            duration: 10000,
            style: {
              maxWidth: "500px",
            },
          }
        );
      }

      if (failedTransfers > 0) {
        toast.error(
          `${failedTransfers} transfer${
            failedTransfers !== 1 ? "s" : ""
          } failed. Check transaction history for details.`,
          {
            icon: "❌",
            duration: 6000,
          }
        );
      }

      // Force refresh balances after all transfers
      console.log("🎉 CSV batch refuel complete, forcing balance refresh...");
      toast.loading("Refreshing balances...", {
        id: "balance-refresh",
        duration: 10000,
      });

      forceBalanceRefresh().finally(() => {
        toast.dismiss("balance-refresh");
      });
    } catch (error: unknown) {
      console.error("❌ CSV batch refuel failed:", error);

      let errorMsg = "Unknown error";
      if (error instanceof Error) {
        errorMsg = error.message;
      }

      toast.error(errorMsg, {
        icon: "❌",
        duration: 6000,
      });
    }
  };

  // ✅ Bridge & Execute handler
  const handleBridgeExecute = async (
    sourceChain: ChainKey,
    targetChain: ChainKey,
    amount: string,
    executeAction: string
  ) => {
    if (!walletClient || !address) {
      toast.error("Wallet not connected", {
        icon: "⚠️",
        duration: 4000,
      });
      return;
    }

    if (!nexusReady) {
      toast.error(
        "Nexus SDK is still initializing. Please wait and try again.",
        {
          icon: "⏳",
          duration: 4000,
        }
      );
      return;
    }

    // Validate transfer before attempting
    const validationError = validateTransfer(sourceChain, targetChain, amount);
    if (validationError) {
      toast.error(validationError, {
        icon: "⚠️",
        duration: 4000,
      });
      return;
    }

    try {
      console.log("🌉⚡ Starting Bridge & Execute:", {
        from: sourceChain,
        to: targetChain,
        amount,
        action: executeAction,
      });

      const fromChain = CHAIN_MAP[sourceChain];
      const toChain = CHAIN_MAP[targetChain];

      if (!fromChain || !toChain) {
        toast.error("Invalid chain selection.", {
          icon: "⚠️",
          duration: 4000,
        });
        return;
      }

      // Add transaction to history (pending)
      const transaction = addTransaction({
        fromChain: sourceChain,
        toChain: targetChain,
        amount,
        status: "pending",
      });

      // Show loading toast
      const loadingToast = toast.loading("Processing Bridge & Execute...", {
        icon: "🔄",
      });

      // Get chain data for token symbols
      const sourceChainData = CHAIN_MAP[sourceChain];
      const targetChainData = CHAIN_MAP[targetChain];

      // For cross-chain transfers, we need to use ETH as the universal token
      const transferToken = "ETH"; // Always use ETH for cross-chain transfers

      // Trigger Bridge & Execute
      const result = await bridgeAndExecute({
        token: transferToken, // Use ETH for all cross-chain transfers
        amount,
        fromChainId: sourceChainData.id,
        toChainId: targetChainData.id,
        executeAction,
      });

      console.log("✅ Bridge & Execute Result:", result);

      if (result.success) {
        // Update transaction status
        updateTransaction(transaction.id, {
          status: "completed",
          hash: (result as any).txHash || (result as any).transactionHash,
          explorerUrl: result.explorerUrl,
        });

        toast.dismiss(loadingToast);

        toast.success(
          (t) => (
            <div className="flex flex-col gap-2">
              <div className="font-bold text-lg">
                🎉 Bridge & Execute Successful!
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">From:</span>
                  <span className="font-semibold">{fromChain.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">To:</span>
                  <span className="font-semibold">{toChain.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Amount:</span>
                  <span className="font-semibold">{amount} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Action:</span>
                  <span className="font-semibold capitalize">
                    {executeAction}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                {result.explorerUrl && (
                  <a
                    href={result.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                    onClick={() => toast.dismiss(t.id)}
                  >
                    <svg
                      className="w-3 h-3"
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
                    View Transaction
                  </a>
                )}
                {(result as any).txHash && (
                  <a
                    href={`${fromChain.explorer}/tx/${(result as any).txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-400 hover:text-green-300 underline flex items-center gap-1"
                    onClick={() => toast.dismiss(t.id)}
                  >
                    <svg
                      className="w-3 h-3"
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
                    Source Chain
                  </a>
                )}
              </div>
            </div>
          ),
          {
            duration: 10000,
            style: {
              maxWidth: "500px",
            },
          }
        );

        // Force refresh balances after successful refuel
        // Cross-chain transactions can take time to propagate
        console.log("🎉 Refuel successful, forcing balance refresh...");

        // Show user notification about balance refresh
        toast.loading("Refreshing balances...", {
          id: "balance-refresh",
          duration: 10000,
        });

        forceBalanceRefresh().finally(() => {
          toast.dismiss("balance-refresh");
        });
      } else {
        // Update transaction status to failed
        updateTransaction(transaction.id, {
          status: "failed",
        });

        toast.dismiss(loadingToast);
        throw new Error((result as any).error || "Bridge & Execute failed");
      }
    } catch (error: unknown) {
      console.error("❌ Bridge & Execute failed:", error);

      let errorMsg = "Unknown error";
      if (error instanceof Error) {
        errorMsg = error.message;
      }
      if (errorMsg.includes("insufficient")) errorMsg = "Insufficient balance";
      if (errorMsg.includes("denied") || errorMsg.includes("rejected"))
        errorMsg = "Transaction rejected";
      if (errorMsg.includes("Token not supported")) {
        errorMsg = `${sourceChain} token is not supported on ${targetChain}. Please try bridging from a different chain.`;
      }

      toast.error(errorMsg, {
        icon: "❌",
        duration: 6000,
      });
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div
            className="absolute bottom-1/4 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse-slow"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="text-center relative z-10">
          <div className="text-6xl mb-6 animate-pulse">⛽</div>
          {/* <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-zinc-800 border-t-blue-500 mx-auto mb-6"></div>
          </div> */}
          <p className="text-zinc-400 text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center p-6 relative overflow-hidden">
        {/* Animated background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div
            className="absolute bottom-1/4 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse-slow"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="text-center max-w-lg relative z-10 animate-fade-in">
          <div className="text-8xl mb-8 animate-pulse-slow">⛽</div>
          <h1 className="text-6xl font-display mb-6 text-white bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
            FuelFlow
          </h1>
          <p className="text-xl text-zinc-400 mb-8 font-body max-w-2xl mx-auto text-center">
            Your Cross-Chain Gas Station • Powered by Avail Nexus SDK
          </p>
          <p className="text-zinc-400 mb-10 text-xl leading-relaxed">
            Never run out of gas on any chain.
            <br />
            <span className="text-zinc-500 text-base">
              Bridge ETH seamlessly across multiple networks.
            </span>
          </p>
          <div className="flex justify-center scale-110 hover:scale-125 transition-transform">
            <ConnectButton />
          </div>

          {/* Feature badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-zinc-900/50 border border-zinc-800/50 rounded-full text-sm text-zinc-400 backdrop-blur-sm">
              🚀 Fast Transfers
            </span>
            <span className="px-4 py-2 bg-zinc-900/50 border border-zinc-800/50 rounded-full text-sm text-zinc-400 backdrop-blur-sm">
              🔒 Secure
            </span>
            <span className="px-4 py-2 bg-zinc-900/50 border border-zinc-800/50 rounded-full text-sm text-zinc-400 backdrop-blur-sm">
              ⚡ Low Fees
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Prevent rendering during hydration to avoid state update conflicts
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse-slow"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>
        <div className="text-center z-10">
          <div className="text-6xl mb-4 opacity-50">⛽</div>
          <h1 className="text-4xl font-display text-white mb-2">FuelFlow</h1>
          <p className="text-zinc-400 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#18181b",
            color: "#fff",
            border: "1px solid #27272a",
            borderRadius: "12px",
            padding: "16px",
          },
          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black relative overflow-auto">
        {/* Animated background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse-slow"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4 animate-fade-in">
            <div>
              <h1 className="text-4xl font-display text-white mb-2 flex items-center gap-3">
                <span className="text-5xl">⛽</span> FuelFlow
              </h1>
              <p className="text-zinc-400 text-lg font-body">
                Your Cross-Chain Gas Station
              </p>
            </div>
            <div className="scale-105 hover:scale-110 transition-transform">
              <ConnectButton />
            </div>
          </div>

          {/* Total Balance Card */}
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-3xl p-8 mb-10 shadow-2xl border border-blue-500/20 backdrop-blur-xl animate-slide-up hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-3 uppercase tracking-wider">
                  Total Gas Balance
                </p>
                <div className="text-5xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
                  <span className="font-mono">{totalBalance}</span>
                  <span className="text-2xl">ETH</span>
                  {isLoading && (
                    <div className="w-6 h-6 border-2 border-blue-200 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {nexusReady ? (
                    <span className="text-sm text-green-300 bg-green-500/20 px-3 py-1 rounded-full flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Cross-chain ready
                    </span>
                  ) : (
                    <span className="text-sm text-yellow-300 bg-yellow-500/20 px-3 py-1 rounded-full flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                      Initializing...
                    </span>
                  )}
                  <button
                    onClick={forceBalanceRefresh}
                    className="text-sm text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full hover:bg-blue-500/30 transition-colors flex items-center gap-2"
                    disabled={isLoading}
                  >
                    <span className="text-xs">🔄</span>
                    Refresh
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleMultipleRefuelClick}
                  disabled={!nexusReady}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-xl font-semibold transition-all backdrop-blur-sm border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Refuel Multiple Chains
                </button>
                <button
                  onClick={handleBridgeExecuteClick}
                  disabled={!nexusReady}
                  className="bg-gradient-to-r from-green-600/20 to-cyan-600/20 hover:from-green-500/30 hover:to-cyan-500/30 text-white px-6 py-4 rounded-xl font-semibold transition-all backdrop-blur-sm border border-green-500/30 hover:border-green-400/50 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  ⚡ Bridge & Execute
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chain Balances */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
                  Your Chains
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {CHAIN_ARRAY.map((chain, index) => (
                    <div
                      key={chain.key}
                      className="animate-slide-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <ChainBalance
                        chainKey={chain.key}
                        balance={balances[chain.key]}
                        isLoading={isLoading}
                        onRefuel={() => handleRefuelClick(chain.key)}
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Quick Refuel Section */}
            <div className="lg:sticky lg:top-6 lg:h-fit">
              <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl border border-zinc-700/50 rounded-3xl p-8 shadow-2xl hover:border-zinc-600/50 transition-all duration-300 hover:shadow-blue-500/10">
                <h2 className="text-2xl font-bold mb-8 text-white flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  Quick Refuel
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wide">
                      From
                    </label>
                    <select
                      value={quickSourceChain}
                      onChange={(e) =>
                        setQuickSourceChain(e.target.value as ChainKey)
                      }
                      className="w-full bg-zinc-800/70 border border-zinc-700/70 p-4 rounded-xl text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-zinc-800 cursor-pointer"
                    >
                      {CHAIN_ARRAY.filter(
                        (c) => c.key !== quickTargetChain
                      ).map((chain) => (
                        <option key={chain.key} value={chain.key}>
                          {chain.name} ({formatBalance(balances[chain.key])}{" "}
                          ETH)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      ↓
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wide">
                      To
                    </label>
                    <select
                      value={quickTargetChain}
                      onChange={(e) =>
                        setQuickTargetChain(e.target.value as ChainKey)
                      }
                      className="w-full bg-zinc-800/70 border border-zinc-700/70 p-4 rounded-xl text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-zinc-800 cursor-pointer"
                    >
                      {CHAIN_ARRAY.filter(
                        (c) => c.key !== quickSourceChain
                      ).map((chain) => (
                        <option key={chain.key} value={chain.key}>
                          {chain.name} ({formatBalance(balances[chain.key])}{" "}
                          ETH)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wide">
                      Amount (ETH)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={quickAmount}
                      onChange={(e) => setQuickAmount(e.target.value)}
                      className="w-full bg-zinc-800/70 border border-zinc-700/70 p-4 rounded-xl text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-zinc-800 text-lg font-semibold"
                      placeholder="0.05"
                    />
                  </div>

                  <button
                    onClick={handleQuickRefuel}
                    disabled={!nexusReady}
                    className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 hover:from-blue-500 hover:via-blue-600 hover:to-purple-600 text-white py-4 px-6 rounded-xl transition-all font-bold text-lg shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-blue-500/30"
                  >
                    {nexusReady ? "🚀 Quick Refuel" : "⏳ Connecting..."}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Full Width Three Columns */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
            {/* Transaction History */}
            <TransactionHistory
              transactions={transactions}
              isLoading={isHistoryLoading}
            />

            {/* Nexus Widgets */}
            <NexusWidgets
              balances={balances}
              onTransactionComplete={() => {
                // Refresh balances when widget transactions complete
                setTimeout(() => {
                  refreshBalances();
                }, 1000);
                setTimeout(() => {
                  refreshBalances();
                }, 3000);
                setTimeout(() => {
                  refreshBalances();
                }, 5000);
              }}
            />

            {/* Bulk Fuel Station */}
            <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl border border-zinc-700/50 rounded-3xl p-6 shadow-2xl hover:border-zinc-600/50 transition-all duration-300 hover:shadow-green-500/10">
              <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                <span className="text-xl">📊</span>
                Bulk Fuel Station
              </h2>
              <div className="space-y-4">
                <p className="text-sm text-zinc-400 mb-4">
                  Refuel multiple chains at once using CSV files or batch
                  operations for maximum efficiency.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={handleMultipleRefuelClick}
                    className="w-full bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 hover:from-green-500 hover:via-green-600 hover:to-emerald-600 text-white py-3 px-4 rounded-xl transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 text-sm"
                  >
                    🔄 Multi-Chain Refuel
                  </button>

                  <button
                    onClick={handleCSVBatchRefuelClick}
                    className="w-full bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-500 hover:via-purple-600 hover:to-indigo-600 text-white py-3 px-4 rounded-xl transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 text-sm"
                  >
                    📋 CSV Batch Import
                  </button>
                </div>

                <div className="pt-3 border-t border-zinc-700/50">
                  <div className="text-xs text-zinc-500 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                      <span>Batch operations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                      <span>CSV file support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                      <span>Gas optimization</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modals */}
          {isModalOpen && (
            <RefuelModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              targetChain={targetChain}
              balances={balances}
              onRefuel={handleRefuel}
            />
          )}

          {isMultipleRefuelModalOpen && (
            <MultipleRefuelModal
              isOpen={isMultipleRefuelModalOpen}
              onClose={() => setIsMultipleRefuelModalOpen(false)}
              balances={balances}
              onRefuelMultiple={handleMultipleRefuel}
              onCSVBatchRefuel={handleCSVBatchRefuel}
            />
          )}

          {isBridgeExecuteModalOpen && (
            <BridgeExecuteModal
              isOpen={isBridgeExecuteModalOpen}
              onClose={() => setIsBridgeExecuteModalOpen(false)}
              balances={balances}
              onExecute={handleBridgeExecute}
            />
          )}
        </div>
      </div>
    </>
  );
}
