/**
 * Chain Compatibility Validation
 *
 * Provides utilities to validate chain compatibility,
 * supported tokens, and operation restrictions.
 */

import { CHAIN_MAP, ChainKey } from "./chains";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export interface ChainCompatibility {
  isCompatible: boolean;
  restrictions: string[];
  warnings: string[];
}

/**
 * Chain compatibility matrix
 */
const CHAIN_COMPATIBILITY: Record<ChainKey, ChainKey[]> = {
  sepolia: [
    "baseSepolia",
    "arbitrumSepolia",
    "optimismSepolia",
    "polygonAmoy",
    "monadSepolia",
  ],
  baseSepolia: ["sepolia", "arbitrumSepolia", "optimismSepolia"],
  arbitrumSepolia: ["sepolia", "baseSepolia", "optimismSepolia"],
  optimismSepolia: ["sepolia", "baseSepolia", "arbitrumSepolia"],
  polygonAmoy: ["sepolia"],
  monadSepolia: ["sepolia"],
};

/**
 * Supported tokens per chain
 */
const SUPPORTED_TOKENS: Record<ChainKey, string[]> = {
  sepolia: ["ETH", "USDC", "USDT", "DAI"],
  baseSepolia: ["ETH", "USDC"],
  arbitrumSepolia: ["ETH", "USDC", "USDT"],
  optimismSepolia: ["ETH", "USDC", "USDT"],
  polygonAmoy: ["MATIC", "USDC", "USDT"],
  monadSepolia: ["MON", "ETH"],
};

/**
 * Chain-specific restrictions
 */
const CHAIN_RESTRICTIONS: Record<ChainKey, string[]> = {
  sepolia: [],
  baseSepolia: [
    "Limited token support",
    "Higher gas costs for complex operations",
  ],
  arbitrumSepolia: ["Layer 2 specific limitations"],
  optimismSepolia: ["Layer 2 specific limitations"],
  polygonAmoy: ["Different native token (MATIC)", "Sidechain limitations"],
  monadSepolia: ["Experimental chain", "Limited ecosystem support"],
};

/**
 * Validates if two chains are compatible for bridging
 */
export function validateChainCompatibility(
  fromChain: ChainKey,
  toChain: ChainKey
): ValidationResult {
  if (fromChain === toChain) {
    return {
      isValid: false,
      error: "Source and target chains cannot be the same",
    };
  }

  const compatibleChains = CHAIN_COMPATIBILITY[fromChain];
  if (!compatibleChains || !compatibleChains.includes(toChain)) {
    return {
      isValid: false,
      error: `Cannot bridge from ${CHAIN_MAP[fromChain].name} to ${CHAIN_MAP[toChain].name}. These chains are not compatible.`,
    };
  }

  return { isValid: true };
}

/**
 * Gets all chains compatible with the given chain
 */
export function getCompatibleChains(chainKey: ChainKey): ChainKey[] {
  return CHAIN_COMPATIBILITY[chainKey] || [];
}

/**
 * Gets all supported tokens for a chain
 */
export function getSupportedTokens(chainKey: ChainKey): string[] {
  return SUPPORTED_TOKENS[chainKey] || [];
}

/**
 * Gets chain-specific restrictions
 */
export function getChainRestrictions(chainKey: ChainKey): string[] {
  return CHAIN_RESTRICTIONS[chainKey] || [];
}

/**
 * Validates if a token is supported on a chain
 */
export function validateTokenSupport(
  chainKey: ChainKey,
  token: string
): ValidationResult {
  const supportedTokens = getSupportedTokens(chainKey);

  if (!supportedTokens.includes(token.toUpperCase())) {
    return {
      isValid: false,
      error: `${token} is not supported on ${CHAIN_MAP[chainKey].name}`,
    };
  }

  return { isValid: true };
}

/**
 * Gets comprehensive chain compatibility information
 */
export function getChainCompatibilityInfo(
  fromChain: ChainKey,
  toChain: ChainKey
): ChainCompatibility {
  const compatibility = validateChainCompatibility(fromChain, toChain);

  if (!compatibility.isValid) {
    return {
      isCompatible: false,
      restrictions: [compatibility.error!],
      warnings: [],
    };
  }

  const fromRestrictions = getChainRestrictions(fromChain);
  const toRestrictions = getChainRestrictions(toChain);
  const restrictions = [...fromRestrictions, ...toRestrictions];

  const warnings: string[] = [];

  // Add warnings for experimental chains
  if (fromChain === "monadSepolia" || toChain === "monadSepolia") {
    warnings.push("Monad is an experimental chain. Use with caution.");
  }

  // Add warnings for layer 2 chains
  if (
    ["arbitrumSepolia", "optimismSepolia"].includes(fromChain) ||
    ["arbitrumSepolia", "optimismSepolia"].includes(toChain)
  ) {
    warnings.push("Layer 2 chains may have different gas fee structures.");
  }

  // Add warnings for polygon
  if (fromChain === "polygonAmoy" || toChain === "polygonAmoy") {
    warnings.push("Polygon uses MATIC as native token, not ETH.");
  }

  return {
    isCompatible: true,
    restrictions,
    warnings,
  };
}

/**
 * Validates if an operation is supported between chains
 */
export function validateOperationSupport(
  fromChain: ChainKey,
  toChain: ChainKey,
  operation: "transfer" | "swap" | "stake" | "bridge"
): ValidationResult {
  const compatibility = validateChainCompatibility(fromChain, toChain);
  if (!compatibility.isValid) {
    return compatibility;
  }

  // Check operation-specific restrictions
  switch (operation) {
    case "swap":
      if (fromChain === "polygonAmoy" || toChain === "polygonAmoy") {
        return {
          isValid: false,
          error: "Token swapping not supported with Polygon Amoy",
        };
      }
      break;

    case "stake":
      if (fromChain !== "sepolia") {
        return {
          isValid: false,
          error: "Staking only supported from Ethereum Sepolia",
        };
      }
      break;

    case "bridge":
      // Bridge is supported for all compatible chains
      break;

    case "transfer":
      // Transfer is supported for all compatible chains
      break;
  }

  return { isValid: true };
}

/**
 * Gets recommended chains for a given operation
 */
export function getRecommendedChains(
  operation: "transfer" | "swap" | "stake" | "bridge",
  excludeChain?: ChainKey
): ChainKey[] {
  const allChains = Object.keys(CHAIN_MAP) as ChainKey[];

  switch (operation) {
    case "transfer":
      return allChains.filter((chain) => chain !== excludeChain);

    case "swap":
      return allChains.filter(
        (chain) =>
          chain !== excludeChain &&
          chain !== "polygonAmoy" &&
          chain !== "monadSepolia"
      );

    case "stake":
      return ["sepolia"];

    case "bridge":
      return allChains.filter((chain) => chain !== excludeChain);

    default:
      return allChains.filter((chain) => chain !== excludeChain);
  }
}

/**
 * Validates minimum balance requirements for operations
 */
export function validateMinimumBalance(
  chainKey: ChainKey,
  balance: bigint,
  operation: "transfer" | "swap" | "stake" | "bridge"
): ValidationResult {
  const chain = CHAIN_MAP[chainKey];
  const balanceInEth = Number(balance) / 1e18;

  // Minimum balance requirements (in ETH)
  const minimumBalances: Record<ChainKey, Record<string, number>> = {
    sepolia: {
      transfer: 0.001,
      swap: 0.002,
      stake: 0.01,
      bridge: 0.001,
    },
    baseSepolia: {
      transfer: 0.0008,
      swap: 0.0016,
      stake: 0.008,
      bridge: 0.0008,
    },
    arbitrumSepolia: {
      transfer: 0.0001,
      swap: 0.0002,
      stake: 0.001,
      bridge: 0.0001,
    },
    optimismSepolia: {
      transfer: 0.0001,
      swap: 0.0002,
      stake: 0.001,
      bridge: 0.0001,
    },
    polygonAmoy: {
      transfer: 0.00001,
      swap: 0.00002,
      stake: 0.0001,
      bridge: 0.00001,
    },
    monadSepolia: {
      transfer: 0.0005,
      swap: 0.001,
      stake: 0.005,
      bridge: 0.0005,
    },
  };

  const minimumBalance = minimumBalances[chainKey]?.[operation] || 0.001;

  if (balanceInEth < minimumBalance) {
    return {
      isValid: false,
      error: `Insufficient balance. Minimum required: ${minimumBalance} ${chain.symbol}`,
    };
  }

  return { isValid: true };
}

/**
 * Gets chain-specific gas fee estimates
 */
export function getChainGasEstimate(
  chainKey: ChainKey,
  operation: "transfer" | "swap" | "stake" | "bridge"
): { low: string; medium: string; high: string } {
  const gasEstimates: Record<
    ChainKey,
    Record<string, { low: string; medium: string; high: string }>
  > = {
    sepolia: {
      transfer: { low: "0.001", medium: "0.002", high: "0.003" },
      swap: { low: "0.004", medium: "0.006", high: "0.010" },
      stake: { low: "0.002", medium: "0.004", high: "0.006" },
      bridge: { low: "0.001", medium: "0.002", high: "0.003" },
    },
    baseSepolia: {
      transfer: { low: "0.0008", medium: "0.0016", high: "0.0024" },
      swap: { low: "0.0032", medium: "0.0048", high: "0.008" },
      stake: { low: "0.0016", medium: "0.0032", high: "0.0048" },
      bridge: { low: "0.0008", medium: "0.0016", high: "0.0024" },
    },
    arbitrumSepolia: {
      transfer: { low: "0.0001", medium: "0.0002", high: "0.0003" },
      swap: { low: "0.0004", medium: "0.0006", high: "0.001" },
      stake: { low: "0.0002", medium: "0.0004", high: "0.0006" },
      bridge: { low: "0.0001", medium: "0.0002", high: "0.0003" },
    },
    optimismSepolia: {
      transfer: { low: "0.0001", medium: "0.0002", high: "0.0003" },
      swap: { low: "0.0004", medium: "0.0006", high: "0.001" },
      stake: { low: "0.0002", medium: "0.0004", high: "0.0006" },
      bridge: { low: "0.0001", medium: "0.0002", high: "0.0003" },
    },
    polygonAmoy: {
      transfer: { low: "0.00001", medium: "0.00002", high: "0.00003" },
      swap: { low: "0.00004", medium: "0.00006", high: "0.0001" },
      stake: { low: "0.00002", medium: "0.00004", high: "0.00006" },
      bridge: { low: "0.00001", medium: "0.00002", high: "0.00003" },
    },
    monadSepolia: {
      transfer: { low: "0.0005", medium: "0.001", high: "0.0015" },
      swap: { low: "0.002", medium: "0.003", high: "0.005" },
      stake: { low: "0.001", medium: "0.002", high: "0.003" },
      bridge: { low: "0.0005", medium: "0.001", high: "0.0015" },
    },
  };

  return (
    gasEstimates[chainKey]?.[operation] || {
      low: "0.001",
      medium: "0.002",
      high: "0.003",
    }
  );
}
