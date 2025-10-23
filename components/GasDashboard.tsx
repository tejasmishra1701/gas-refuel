'use client';

import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ChainBalance } from './ChainBalance';
import { RefuelModal } from './RefuelModal';
import { CHAIN_ARRAY, ChainKey, CHAIN_MAP } from '@/lib/chains';
import { formatBalance } from '@/lib/utils';
import { initializeNexusSDK, bridgeTokens } from '@/lib/nexus';

export function GasDashboard() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
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
  const [totalBalance, setTotalBalance] = useState<string>('0.00');

  // ✅ Initialize Nexus SDK when wallet connects
  useEffect(() => {
    if (walletClient) {
      initializeNexusSDK(walletClient)
        .then(() => console.log('Nexus SDK initialized'))
        .catch((err) => console.error('Nexus init error:', err));
    }
  }, [walletClient]);

  // ✅ Fetch balances for all chains
  useEffect(() => {
    if (!address || !isConnected) {
      setIsLoading(false);
      return;
    }

    const fetchBalances = async () => {
      setIsLoading(true);
      const newBalances = { ...balances };

      for (const chain of CHAIN_ARRAY) {
        try {
          const response = await fetch(chain.rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_getBalance',
              params: [address, 'latest'],
              id: 1,
            }),
          });
          const data = await response.json();
          if (data.result) {
            newBalances[chain.key] = BigInt(data.result);
          }
        } catch (error) {
          console.error(`Error fetching balance for ${chain.name}:`, error);
        }
      }

      setBalances(newBalances);
      
      // Total balance
      const total = Object.values(newBalances).reduce((acc, bal) => acc + bal, BigInt(0));
      setTotalBalance(formatBalance(total));
      setIsLoading(false);
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [address, isConnected]);

  // ✅ Open refuel modal
  const handleRefuelClick = (chain?: ChainKey) => {
    setTargetChain(chain);
    setIsModalOpen(true);
  };

  // ✅ Refuel handler (now uses Nexus)
  const handleRefuel = async (sourceChain: ChainKey, targetChain: ChainKey, amount: string) => {
    if (!walletClient || !address) {
      alert('⚠️ Wallet not connected');
      return;
    }

    try {
      console.log('🚀 Starting cross-chain refuel via Nexus:', {
        from: sourceChain,
        to: targetChain,
        amount,
      });

      const fromChain = CHAIN_MAP[sourceChain];
      const toChain = CHAIN_MAP[targetChain];

      if (!fromChain || !toChain) {
        alert('Invalid chain selection.');
        return;
      }

      // Trigger Nexus transfer
      const result = await bridgeTokens({
        token: 'ETH',
        amount,
        fromChainId: fromChain.id,
        toChainId: toChain.id,
      });

      console.log('✅ Refuel Success:', result);
      alert(`✅ Refuel Successful!\nFrom: ${fromChain.name}\nTo: ${toChain.name}\nAmount: ${amount} ETH`);
    } catch (error: any) {
      console.error('❌ Refuel failed:', error);
      alert(`❌ Refuel failed: ${error?.message || 'Unknown error'}`);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-white">⛽ Gas Refuel</h1>
          <p className="text-zinc-400 mb-8">Never run out of gas on any chain</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">⛽ Gas Dashboard</h1>
            <p className="text-zinc-400">Manage your cross-chain gas efficiently</p>
          </div>
          <ConnectButton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Total Balance Card */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 mb-8">
              <p className="text-blue-100 text-sm mb-2">Total Gas Balance</p>
              <p className="text-4xl font-bold text-white mb-4">{totalBalance} ETH</p>
              <button
                onClick={() => handleRefuelClick()}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-lg font-medium transition-colors backdrop-blur-sm border border-white/10"
              >
                Refuel Multiple Chains
              </button>
            </div>

            {/* Chain Balances Grid */}
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
          <div className="lg:sticky lg:top-6">
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold mb-6 text-white/90">Quick Refuel</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">From</label>
                  <select
                    defaultValue="sepolia"
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 p-2.5 rounded-lg text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {CHAIN_ARRAY.map(chain => (
                      <option key={chain.key} value={chain.key}>
                        {chain.name} ({formatBalance(balances[chain.key])} ETH)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">To</label>
                  <select
                    defaultValue="baseSepolia"
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 p-2.5 rounded-lg text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {CHAIN_ARRAY.map(chain => (
                      <option key={chain.key} value={chain.key}>
                        {chain.name} ({formatBalance(balances[chain.key])} ETH)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Amount (ETH)</label>
                  <input
                    type="number"
                    step="0.0001"
                    defaultValue="0.005"
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 p-2.5 rounded-lg text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <button
                  onClick={() => handleRefuelClick()}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3 px-4 rounded-lg transition-all font-medium shadow-lg"
                >
                  Quick Refuel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Existing Modal */}
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
