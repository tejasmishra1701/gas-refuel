"use client";

import { useState, useEffect } from "react";
import { isMetaMaskInstalled, getCurrentNetwork, isSupportedNetwork } from "@/lib/walletUtils";

interface WalletErrorDisplayProps {
  isConnected: boolean;
  address?: string;
}

export function WalletErrorDisplay({ isConnected, address }: WalletErrorDisplayProps) {
  const [currentNetwork, setCurrentNetwork] = useState<{ chainId: number; networkName: string } | null>(null);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const checkNetwork = async () => {
      const network = await getCurrentNetwork();
      setCurrentNetwork(network);
      
      if (network && !isSupportedNetwork(network.chainId)) {
        setShowError(true);
      } else {
        setShowError(false);
      }
    };

    if (isConnected && address) {
      checkNetwork();
    }
  }, [isConnected, address]);

  if (!isMetaMaskInstalled()) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="text-red-400 text-xl">⚠️</div>
          <div>
            <h3 className="text-red-400 font-semibold">MetaMask Not Installed</h3>
            <p className="text-red-300 text-sm">
              Please install MetaMask browser extension to use this application.
            </p>
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-200 hover:text-red-100 underline text-sm mt-1 inline-block"
            >
              Download MetaMask →
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (showError && currentNetwork) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="text-yellow-400 text-xl">⚠️</div>
          <div>
            <h3 className="text-yellow-400 font-semibold">Unsupported Network</h3>
            <p className="text-yellow-300 text-sm">
              You're connected to <strong>{currentNetwork.networkName}</strong> (Chain ID: {currentNetwork.chainId}).
              Please switch to a supported testnet.
            </p>
            <div className="text-yellow-200 text-xs mt-2">
              Supported networks: Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia, Optimism Sepolia, Polygon Amoy, Monad Sepolia
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
