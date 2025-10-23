'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia, optimismSepolia, baseSepolia, arbitrumSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

const config = getDefaultConfig({
  appName: 'Gas Refuel',
  projectId: 'e397ba97ad3be14af2fc3ecc0e645e93', // Get this from cloud.walletconnect.com
  chains: [sepolia, baseSepolia, arbitrumSepolia, optimismSepolia],
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}