/**
 * Gas Price API Integration
 *
 * Provides real-time gas price fetching from various blockchain APIs
 * with fallback mechanisms and caching.
 */

import { GasPrice } from "./gasEstimation";

export interface GasPriceResponse {
  success: boolean;
  data?: GasPrice;
  error?: string;
  source: "api" | "fallback" | "cache";
}

export interface GasPriceProvider {
  name: string;
  getGasPrice(chainId: number): Promise<GasPriceResponse>;
}

/**
 * Etherscan Gas Price Provider
 */
class EtherscanProvider implements GasPriceProvider {
  name = "Etherscan";

  async getGasPrice(chainId: number): Promise<GasPriceResponse> {
    try {
      const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
      if (!apiKey) {
        throw new Error("Etherscan API key not configured");
      }

      let baseUrl: string;
      switch (chainId) {
        case 11155111: // Ethereum Sepolia
          baseUrl = "https://api-sepolia.etherscan.io/api";
          break;
        case 1: // Ethereum Mainnet
          baseUrl = "https://api.etherscan.io/api";
          break;
        default:
          throw new Error(`Unsupported chain ${chainId} for Etherscan`);
      }

      const url = `${baseUrl}?module=gastracker&action=gasoracle&apikey=${apiKey}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status !== "1" || !data.result) {
        throw new Error("Invalid API response format");
      }

      const gasPrice: GasPrice = {
        slow: parseInt(data.result.SafeGasPrice) || 20,
        standard: parseInt(data.result.ProposeGasPrice) || 25,
        fast: parseInt(data.result.FastGasPrice) || 30,
        instant: parseInt(data.result.FastGasPrice) * 1.2 || 36,
      };

      return {
        success: true,
        data: gasPrice,
        source: "api",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        source: "api",
      };
    }
  }
}

/**
 * Alchemy Gas Price Provider
 */
class AlchemyProvider implements GasPriceProvider {
  name = "Alchemy";

  async getGasPrice(chainId: number): Promise<GasPriceResponse> {
    try {
      const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
      if (!apiKey) {
        throw new Error("Alchemy API key not configured");
      }

      let network: string;
      switch (chainId) {
        case 11155111: // Ethereum Sepolia
          network = "eth-sepolia";
          break;
        case 1: // Ethereum Mainnet
          network = "eth-mainnet";
          break;
        case 84532: // Base Sepolia
          network = "base-sepolia";
          break;
        case 421614: // Arbitrum Sepolia
          network = "arb-sepolia";
          break;
        default:
          throw new Error(`Unsupported chain ${chainId} for Alchemy`);
      }

      const url = `https://${network}.g.alchemy.com/v2/${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_gasPrice",
          params: [],
          id: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const gasPriceInWei = parseInt(data.result, 16);
      const gasPriceInGwei = gasPriceInWei / 1e9;

      const gasPrice: GasPrice = {
        slow: Math.round(gasPriceInGwei * 0.8),
        standard: Math.round(gasPriceInGwei),
        fast: Math.round(gasPriceInGwei * 1.2),
        instant: Math.round(gasPriceInGwei * 1.5),
      };

      return {
        success: true,
        data: gasPrice,
        source: "api",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        source: "api",
      };
    }
  }
}

/**
 * Fallback Gas Price Provider
 */
class FallbackProvider implements GasPriceProvider {
  name = "Fallback";

  async getGasPrice(chainId: number): Promise<GasPriceResponse> {
    // Return static estimates based on chain
    const staticPrices: Record<number, GasPrice> = {
      11155111: { slow: 20, standard: 25, fast: 30, instant: 36 }, // Ethereum Sepolia
      84532: { slow: 16, standard: 20, fast: 24, instant: 30 }, // Base Sepolia
      421614: { slow: 2, standard: 2.5, fast: 3, instant: 3.6 }, // Arbitrum Sepolia
      11155420: { slow: 2, standard: 2.5, fast: 3, instant: 3.6 }, // Optimism Sepolia
      80002: { slow: 0.2, standard: 0.25, fast: 0.3, instant: 0.36 }, // Polygon Amoy
      999999999: { slow: 10, standard: 12.5, fast: 15, instant: 18 }, // Monad Sepolia
    };

    const gasPrice = staticPrices[chainId] || staticPrices[11155111];

    return {
      success: true,
      data: gasPrice,
      source: "fallback",
    };
  }
}

/**
 * Gas Price Service with multiple providers and caching
 */
class GasPriceService {
  private providers: GasPriceProvider[] = [
    new EtherscanProvider(),
    new AlchemyProvider(),
    new FallbackProvider(),
  ];

  private cache = new Map<string, { data: GasPrice; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Gets gas price for a specific chain
   */
  async getGasPrice(chainId: number): Promise<GasPriceResponse> {
    const cacheKey = `gas_price_${chainId}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return {
        success: true,
        data: cached.data,
        source: "cache",
      };
    }

    // Try providers in order
    for (const provider of this.providers) {
      try {
        const result = await provider.getGasPrice(chainId);

        if (result.success && result.data) {
          // Cache successful result
          this.cache.set(cacheKey, {
            data: result.data,
            timestamp: Date.now(),
          });

          return result;
        }
      } catch (error) {
        console.warn(
          `Provider ${provider.name} failed for chain ${chainId}:`,
          error
        );
        continue;
      }
    }

    // All providers failed, return error
    return {
      success: false,
      error: "All gas price providers failed",
      source: "fallback",
    };
  }

  /**
   * Gets gas prices for multiple chains
   */
  async getGasPrices(
    chainIds: number[]
  ): Promise<Record<number, GasPriceResponse>> {
    const results: Record<number, GasPriceResponse> = {};

    const promises = chainIds.map(async (chainId) => {
      results[chainId] = await this.getGasPrice(chainId);
    });

    await Promise.allSettled(promises);
    return results;
  }

  /**
   * Clears the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const gasPriceService = new GasPriceService();

// Export convenience functions
export async function fetchGasPrice(
  chainId: number
): Promise<GasPriceResponse> {
  return gasPriceService.getGasPrice(chainId);
}

export async function fetchGasPrices(
  chainIds: number[]
): Promise<Record<number, GasPriceResponse>> {
  return gasPriceService.getGasPrices(chainIds);
}

export function clearGasPriceCache(): void {
  gasPriceService.clearCache();
}
