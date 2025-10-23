// lib/nexus.ts
import { NexusSDK } from '@avail-project/nexus-core';
import type { BridgeParams, TransferParams, UserAsset } from '@avail-project/nexus-core';
import { SUPPORTED_CHAINS } from './chains';

/** Singleton instance */
let sdkInstance: NexusSDK | null = null;

/** Initialize Nexus SDK with wallet provider */
export async function initializeNexusSDK(walletClient: any) {
  if (sdkInstance) return sdkInstance;

  try {
    const provider = await walletClient.getProvider();

    const sdk = new NexusSDK({ network: 'testnet' });
    await sdk.initialize(provider);

    sdkInstance = sdk;
    console.log('✅ Nexus SDK initialized');
    return sdk;
  } catch (error) {
    console.error('❌ Nexus SDK init failed', error);
    throw error;
  }
}

/** Return existing SDK instance */
export function getNexusSDK(): NexusSDK {
  if (!sdkInstance) throw new Error('Nexus SDK not initialized');
  return sdkInstance;
}

/** Get unified balances for wallet address */
export async function getUnifiedBalances(address: `0x${string}`): Promise<Record<string, bigint>> {
  if (!sdkInstance) throw new Error('Nexus SDK not initialized');

  try {
    const assets: UserAsset[] = await sdkInstance.getUnifiedBalances({ address });
    const balances: Record<string, bigint> = {};

    for (const chainKey in SUPPORTED_CHAINS) {
      const chain = SUPPORTED_CHAINS[chainKey as keyof typeof SUPPORTED_CHAINS];
      const asset = assets.find(a =>
        a.symbol === 'ETH' &&
        a.breakdown?.some(b => b.chain.id === chain.id)
      );

      const chainBalance = asset?.breakdown?.find(b => b.chain.id === chain.id)?.balance || 0;
      balances[chainKey] = BigInt(chainBalance);
    }

    return balances;
  } catch (error) {
    console.error('❌ Failed to fetch unified balances', error);
    return {};
  }
}

/** Simulate cross-chain transfer */
export async function simulateBridge(params: {
  token: string;
  amount: string;
  fromChainId: number;
  toChainId: number;
}) {
  if (!sdkInstance) throw new Error('Nexus SDK not initialized');

  const simulation = await sdkInstance.simulateTransfer({
    token: params.token,
    amount: parseFloat(params.amount),
    chainId: params.toChainId,
    recipient: '0x0000000000000000000000000000000000000000',
  });

  return simulation;
}

/** Execute cross-chain transfer (refuel) */
export async function bridgeTokens(params: {
  token: string;
  amount: string;
  fromChainId: number;
  toChainId: number;
  recipient?: `0x${string}`;
}) {
  if (!sdkInstance) throw new Error('Nexus SDK not initialized');

  const transferParams: TransferParams = {
    token: params.token,
    amount: parseFloat(params.amount),
    chainId: params.toChainId,
    recipient: params.recipient,
    sourceChains: [params.fromChainId],
  };

  try {
    const result = await sdkInstance.transfer(transferParams);
    return result;
  } catch (error) {
    console.error('❌ Bridge failed', error);
    throw error;
  }
}
