/**
 * Wallet Connection Utilities
 * 
 * Provides utilities for handling wallet connections and common errors
 */

export interface WalletError {
  code: number;
  message: string;
  data?: any;
}

export interface ConnectionResult {
  success: boolean;
  error?: WalletError;
  address?: string;
}

/**
 * Common MetaMask error codes
 */
export const METAMASK_ERROR_CODES = {
  USER_REJECTED: 4001,
  UNAUTHORIZED: 4100,
  UNSUPPORTED_METHOD: 4200,
  DISCONNECTED: 4900,
  CHAIN_DISCONNECTED: 4901,
  CHAIN_UNSUPPORTED: 4902,
} as const;

/**
 * Handles MetaMask connection errors and provides user-friendly messages
 */
export function handleWalletError(error: any): WalletError {
  const errorCode = error?.code || error?.error?.code;
  const errorMessage = error?.message || error?.error?.message || 'Unknown error';

  switch (errorCode) {
    case METAMASK_ERROR_CODES.USER_REJECTED:
      return {
        code: errorCode,
        message: 'Connection rejected by user. Please try again.',
      };
    
    case METAMASK_ERROR_CODES.UNAUTHORIZED:
      return {
        code: errorCode,
        message: 'Unauthorized. Please check your MetaMask permissions.',
      };
    
    case METAMASK_ERROR_CODES.UNSUPPORTED_METHOD:
      return {
        code: errorCode,
        message: 'Unsupported method. Please update MetaMask.',
      };
    
    case METAMASK_ERROR_CODES.DISCONNECTED:
      return {
        code: errorCode,
        message: 'MetaMask is disconnected. Please connect your wallet.',
      };
    
    case METAMASK_ERROR_CODES.CHAIN_DISCONNECTED:
      return {
        code: errorCode,
        message: 'Chain is disconnected. Please switch to a supported network.',
      };
    
    case METAMASK_ERROR_CODES.CHAIN_UNSUPPORTED:
      return {
        code: errorCode,
        message: 'Unsupported chain. Please switch to a supported network.',
      };
    
    default:
      return {
        code: errorCode || 0,
        message: errorMessage,
      };
  }
}

/**
 * Checks if MetaMask is installed and available
 */
export function isMetaMaskInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).ethereum?.isMetaMask;
}

/**
 * Checks if the current network is supported
 */
export function isSupportedNetwork(chainId: number): boolean {
  const supportedChains = [
    11155111, // Ethereum Sepolia
    84532,    // Base Sepolia
    421614,   // Arbitrum Sepolia
    11155420, // Optimism Sepolia
    80002,    // Polygon Amoy
    999999999, // Monad Sepolia
  ];
  
  return supportedChains.includes(chainId);
}

/**
 * Gets a user-friendly network name
 */
export function getNetworkName(chainId: number): string {
  const networkNames: Record<number, string> = {
    11155111: 'Ethereum Sepolia',
    84532: 'Base Sepolia',
    421614: 'Arbitrum Sepolia',
    11155420: 'Optimism Sepolia',
    80002: 'Polygon Amoy',
    999999999: 'Monad Sepolia',
  };
  
  return networkNames[chainId] || `Unknown Network (${chainId})`;
}

/**
 * Requests account access with proper error handling
 */
export async function requestAccountAccess(): Promise<ConnectionResult> {
  if (!isMetaMaskInstalled()) {
    return {
      success: false,
      error: {
        code: 0,
        message: 'MetaMask is not installed. Please install MetaMask to continue.',
      },
    };
  }

  try {
    const accounts = await (window as any).ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (accounts && accounts.length > 0) {
      return {
        success: true,
        address: accounts[0],
      };
    } else {
      return {
        success: false,
        error: {
          code: 0,
          message: 'No accounts found. Please create an account in MetaMask.',
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      error: handleWalletError(error),
    };
  }
}

/**
 * Requests network switch with proper error handling
 */
export async function requestNetworkSwitch(chainId: number): Promise<ConnectionResult> {
  if (!isMetaMaskInstalled()) {
    return {
      success: false,
      error: {
        code: 0,
        message: 'MetaMask is not installed.',
      },
    };
  }

  try {
    await (window as any).ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });

    return { success: true };
  } catch (error: any) {
    // If the chain is not added to MetaMask, try to add it
    if (error.code === 4902) {
      return await addNetwork(chainId);
    }
    
    return {
      success: false,
      error: handleWalletError(error),
    };
  }
}

/**
 * Adds a network to MetaMask
 */
async function addNetwork(chainId: number): Promise<ConnectionResult> {
  const chainConfigs: Record<number, any> = {
    11155111: {
      chainId: '0xaa36a7',
      chainName: 'Ethereum Sepolia',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
      blockExplorerUrls: ['https://sepolia.etherscan.io'],
    },
    84532: {
      chainId: '0x14a34',
      chainName: 'Base Sepolia',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://sepolia.base.org'],
      blockExplorerUrls: ['https://sepolia.basescan.org'],
    },
    421614: {
      chainId: '0x66eee',
      chainName: 'Arbitrum Sepolia',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
      blockExplorerUrls: ['https://sepolia.arbiscan.io'],
    },
    11155420: {
      chainId: '0xaa37aa',
      chainName: 'Optimism Sepolia',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://sepolia.optimism.io'],
      blockExplorerUrls: ['https://sepolia-optimism.etherscan.io'],
    },
    80002: {
      chainId: '0x13882',
      chainName: 'Polygon Amoy',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      rpcUrls: ['https://rpc-amoy.polygon.technology'],
      blockExplorerUrls: ['https://amoy.polygonscan.com'],
    },
    999999999: {
      chainId: '0x3b9ac9ff',
      chainName: 'Monad Sepolia',
      nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
      rpcUrls: ['https://sepolia-rpc.monad.xyz'],
      blockExplorerUrls: ['https://sepolia.monadscan.xyz'],
    },
  };

  const config = chainConfigs[chainId];
  if (!config) {
    return {
      success: false,
      error: {
        code: 0,
        message: `Unsupported chain ID: ${chainId}`,
      },
    };
  }

  try {
    await (window as any).ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [config],
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: handleWalletError(error),
    };
  }
}

/**
 * Gets the current network information
 */
export async function getCurrentNetwork(): Promise<{ chainId: number; networkName: string } | null> {
  if (!isMetaMaskInstalled()) return null;

  try {
    const chainId = await (window as any).ethereum.request({
      method: 'eth_chainId',
    });

    const numericChainId = parseInt(chainId, 16);
    return {
      chainId: numericChainId,
      networkName: getNetworkName(numericChainId),
    };
  } catch (error) {
    console.error('Failed to get current network:', error);
    return null;
  }
}
