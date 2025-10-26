"use client";

import { useState, useEffect } from "react";
import { isMetaMaskInstalled, getCurrentNetwork, isSupportedNetwork, requestNetworkSwitch } from "@/lib/walletUtils";
import { SUPPORTED_CHAINS } from "@/lib/chains";

interface WalletErrorDisplayProps {
  isConnected: boolean;
  address?: string;
}

export function WalletErrorDisplay({ isConnected, address }: WalletErrorDisplayProps) {
  const [currentNetwork, setCurrentNetwork] = useState<{ chainId: number; networkName: string } | null>(null);
  const [showError, setShowError] = useState(false);
  const [switchingNetwork, setSwitchingNetwork] = useState<string | null>(null);

  const handleNetworkSwitch = async (chainKey: keyof typeof SUPPORTED_CHAINS) => {
    const chain = SUPPORTED_CHAINS[chainKey];
    setSwitchingNetwork(chainKey);
    
    try {
      const result = await requestNetworkSwitch(chain.id);
      if (result.success) {
        // Refresh network info after successful switch
        const network = await getCurrentNetwork();
        setCurrentNetwork(network);
        setShowError(false);
      } else {
        console.error('Network switch failed:', result.error);
      }
    } catch (error) {
      console.error('Network switch error:', error);
    } finally {
      setSwitchingNetwork(null);
    }
  };

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
          <div className="flex-1">
            <h3 className="text-yellow-400 font-semibold">Unsupported Network</h3>
            <p className="text-yellow-300 text-sm">
              You're connected to <strong>{currentNetwork.networkName}</strong> (Chain ID: {currentNetwork.chainId}).
              Please switch to a supported testnet.
            </p>
            <div className="text-yellow-200 text-xs mt-2 mb-3">
              Supported networks: Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia, Optimism Sepolia, Polygon Amoy, Monad Sepolia
            </div>
            
            {/* Network switching buttons */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => (
                <button
                  key={key}
                  onClick={() => handleNetworkSwitch(key as keyof typeof SUPPORTED_CHAINS)}
                  disabled={switchingNetwork === key}
                  className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg px-3 py-2 text-xs text-yellow-200 hover:text-yellow-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {switchingNetwork === key ? (
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 border border-yellow-300 border-t-transparent rounded-full animate-spin"></div>
                      Switching...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <img 
                        src={chain.icon} 
                        alt={chain.iconAlt} 
                        className="w-4 h-4"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {chain.name}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
