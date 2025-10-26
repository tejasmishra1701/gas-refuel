/**
 * Gas Estimation Utilities
 *
 * Provides gas cost estimation for different operations across chains.
 * Includes both static estimates and real-time API integration.
 */

export interface GasPrice {
  slow: number;
  standard: number;
  fast: number;
  instant: number;
}

export interface GasEstimate {
  low: string;
  medium: string;
  high: string;
}

export interface ChainGasConfig {
  chainId: number;
  gasPriceMultiplier: number;
  baseGasLimit: number;
}

/**
 * Static gas estimates for different operation types
 */
export const GAS_ESTIMATES = {
  singleTransfer: {
    low: "0.001",
    medium: "0.002",
    high: "0.003",
  },
  batchTransfer: {
    low: "0.005",
    medium: "0.008",
    high: "0.012",
  },
  bridgeAndExecute: {
    low: "0.003",
    medium: "0.005",
    high: "0.008",
  },
  swap: {
    low: "0.004",
    medium: "0.006",
    high: "0.010",
  },
  stake: {
    low: "0.002",
    medium: "0.004",
    high: "0.006",
  },
} as const;

/**
 * Chain-specific gas configurations
 */
export const CHAIN_GAS_CONFIGS: Record<number, ChainGasConfig> = {
  // Ethereum Sepolia
  11155111: {
    chainId: 11155111,
    gasPriceMultiplier: 1.0,
    baseGasLimit: 21000,
  },
  // Base Sepolia
  84532: {
    chainId: 84532,
    gasPriceMultiplier: 0.8,
    baseGasLimit: 21000,
  },
  // Arbitrum Sepolia
  421614: {
    chainId: 421614,
    gasPriceMultiplier: 0.1,
    baseGasLimit: 21000,
  },
  // Optimism Sepolia
  11155420: {
    chainId: 11155420,
    gasPriceMultiplier: 0.1,
    baseGasLimit: 21000,
  },
  // Polygon Amoy
  80002: {
    chainId: 80002,
    gasPriceMultiplier: 0.01,
    baseGasLimit: 21000,
  },
  // Monad Sepolia
  999999999: {
    chainId: 999999999,
    gasPriceMultiplier: 0.5,
    baseGasLimit: 21000,
  },
};

/**
 * Cache for gas prices (5-minute TTL)
 */
const gasPriceCache = new Map<number, { data: GasPrice; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches real-time gas prices from Etherscan API
 */
export async function fetchGasPrice(chainId: number): Promise<GasPrice> {
  // Check cache first
  const cached = gasPriceCache.get(chainId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Use different API endpoints based on chain
    let apiUrl: string;
    let apiKey: string;

    switch (chainId) {
      case 11155111: // Ethereum Sepolia
        apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || "";
        apiUrl = `https://api-sepolia.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${apiKey}`;
        break;
      case 84532: // Base Sepolia
        apiKey = process.env.NEXT_PUBLIC_BASESCAN_API_KEY || "";
        apiUrl = `https://api-sepolia.basescan.org/api?module=gastracker&action=gasoracle&apikey=${apiKey}`;
        break;
      case 421614: // Arbitrum Sepolia
        apiKey = process.env.NEXT_PUBLIC_ARBISCAN_API_KEY || "";
        apiUrl = `https://api-sepolia.arbiscan.io/api?module=gastracker&action=gasoracle&apikey=${apiKey}`;
        break;
      default:
        // Fallback to static estimates for unsupported chains
        return getStaticGasPrice(chainId);
    }

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "1" || !data.result) {
      throw new Error("Invalid API response");
    }

    const gasPrice: GasPrice = {
      slow: parseInt(data.result.SafeGasPrice) || 20,
      standard: parseInt(data.result.ProposeGasPrice) || 25,
      fast: parseInt(data.result.FastGasPrice) || 30,
      instant: parseInt(data.result.FastGasPrice) * 1.2 || 36,
    };

    // Cache the result
    gasPriceCache.set(chainId, { data: gasPrice, timestamp: Date.now() });

    return gasPrice;
  } catch (error) {
    console.warn(`Failed to fetch gas price for chain ${chainId}:`, error);
    return getStaticGasPrice(chainId);
  }
}

/**
 * Gets static gas price estimates for chains without API support
 */
function getStaticGasPrice(chainId: number): GasPrice {
  const config = CHAIN_GAS_CONFIGS[chainId];
  const basePrice = config?.gasPriceMultiplier || 1.0;

  return {
    slow: Math.round(20 * basePrice),
    standard: Math.round(25 * basePrice),
    fast: Math.round(30 * basePrice),
    instant: Math.round(36 * basePrice),
  };
}

/**
 * Estimates transfer cost based on gas price and operation type
 */
export function estimateTransferCost(
  chainId: number,
  gasPrice: GasPrice,
  operationType: keyof typeof GAS_ESTIMATES = "singleTransfer",
  speed: keyof GasPrice = "standard"
): string {
  const config = CHAIN_GAS_CONFIGS[chainId];
  if (!config) {
    return GAS_ESTIMATES[operationType].medium;
  }

  const gasLimit = config.baseGasLimit;
  const price = gasPrice[speed];

  // Calculate cost in ETH (gasLimit * gasPrice / 1e18)
  const costInWei = gasLimit * price;
  const costInEth = costInWei / 1e18;

  return costInEth.toFixed(6);
}

/**
 * Estimates batch transfer cost
 */
export function estimateBatchTransferCost(
  chainId: number,
  gasPrice: GasPrice,
  recipientCount: number,
  speed: keyof GasPrice = "standard"
): string {
  const config = CHAIN_GAS_CONFIGS[chainId];
  if (!config) {
    return GAS_ESTIMATES.batchTransfer.medium;
  }

  // Batch operations have higher gas limits
  const gasLimitPerTransfer = config.baseGasLimit * 1.5;
  const totalGasLimit = gasLimitPerTransfer * recipientCount;
  const price = gasPrice[speed];

  const costInWei = totalGasLimit * price;
  const costInEth = costInWei / 1e18;

  return costInEth.toFixed(6);
}

/**
 * Gets gas estimate for a specific operation
 */
export function getGasEstimate(
  operationType: keyof typeof GAS_ESTIMATES
): GasEstimate {
  return GAS_ESTIMATES[operationType];
}

/**
 * Formats gas estimate for display
 */
export function formatGasEstimate(estimate: string): string {
  const num = parseFloat(estimate);
  if (num < 0.001) {
    return `${(num * 1000).toFixed(3)} mETH`;
  }
  return `${num.toFixed(6)} ETH`;
}

/**
 * Gets recommended gas speed based on urgency
 */
export function getRecommendedGasSpeed(
  urgency: "low" | "medium" | "high"
): keyof GasPrice {
  switch (urgency) {
    case "low":
      return "slow";
    case "medium":
      return "standard";
    case "high":
      return "fast";
    default:
      return "standard";
  }
}

/**
 * Calculates total gas cost for multiple operations
 */
export function calculateTotalGasCost(
  operations: Array<{
    chainId: number;
    gasPrice: GasPrice;
    operationType: keyof typeof GAS_ESTIMATES;
    speed?: keyof GasPrice;
  }>
): string {
  let totalCost = 0;

  for (const op of operations) {
    const cost = estimateTransferCost(
      op.chainId,
      op.gasPrice,
      op.operationType,
      op.speed || "standard"
    );
    totalCost += parseFloat(cost);
  }

  return totalCost.toFixed(6);
}

/**
 * Clears gas price cache (useful for testing)
 */
export function clearGasPriceCache(): void {
  gasPriceCache.clear();
}
