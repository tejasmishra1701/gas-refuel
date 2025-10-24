import { NexusSDK } from "@avail-project/nexus-core";
import type { WalletClient } from "viem";
import type { UserAsset } from "@avail-project/nexus-core";

class NexusService {
  private sdk: NexusSDK;
  private initialized = false;

  constructor(network: "mainnet" | "testnet" = "testnet") {
    this.sdk = new NexusSDK({ network: network as any });
  }

  async initialize(walletClient: WalletClient | any) {
    if (this.initialized) {
      console.log("✅ Nexus already initialized");
      return;
    }

    try {
      // Get the actual Ethereum provider
      let provider;

      if (typeof window !== "undefined") {
        // Priority order for getting provider
        if ((window as any).ethereum) {
          provider = (window as any).ethereum;
        } else if (walletClient?.transport) {
          // Fallback to transport if available
          provider = walletClient.transport;
        } else {
          throw new Error(
            "No Ethereum provider found. Please install MetaMask."
          );
        }
      } else {
        throw new Error("Window is not defined - must be in browser");
      }

      console.log("🔄 Initializing Nexus SDK with provider...");
      await this.sdk.initialize(provider);
      this.initialized = true;
      console.log("✅ Nexus SDK initialized successfully");
    } catch (error) {
      console.error("❌ Nexus initialization failed:", error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  /** Get utils only after SDK is initialized */
  get utils() {
    if (!this.initialized) throw new Error("SDK not initialized");
    return this.sdk.utils;
  }

  async getBalances(): Promise<UserAsset[]> {
    if (!this.initialized) throw new Error("SDK not initialized");
    return this.sdk.getUnifiedBalances();
  }

  async getBalance(token: string): Promise<UserAsset | undefined> {
    if (!this.initialized) throw new Error("SDK not initialized");
    return this.sdk.getUnifiedBalance(token);
  }

  async bridge(params: {
    token: string;
    amount: string | number;
    fromChainId: number;
    toChainId: number;
    sourceChains?: number[];
  }) {
    if (!this.initialized) {
      throw new Error(
        "SDK not initialized. Please wait for wallet connection."
      );
    }

    console.log("🌉 Starting bridge operation:", params);

    try {
      // Use transfer() for cross-chain token movement
      const result = await this.sdk.transfer({
        token: params.token as any,
        amount: params.amount,
        chainId: params.toChainId as any,
        recipient: await this.getSignerAddress(),
        sourceChains: params.sourceChains ?? [params.fromChainId],
      });

      console.log("✅ Bridge result:", result);
      return result;
    } catch (error: any) {
      console.error("❌ Bridge failed:", error);
      throw new Error(error?.message || "Bridge operation failed");
    }
  }

  async simulateBridge(params: {
    token: string;
    amount: string | number;
    fromChainId: number;
    toChainId: number;
  }) {
    if (!this.initialized) throw new Error("SDK not initialized");

    try {
      return await this.sdk.simulateTransfer({
        token: params.token as any,
        amount: params.amount,
        chainId: params.toChainId as any,
        recipient: await this.getSignerAddress(),
      });
    } catch (error) {
      console.error("Simulation failed:", error);
      throw error;
    }
  }

  private async getSignerAddress(): Promise<`0x${string}`> {
    if (!this.initialized) throw new Error("SDK not initialized");

    try {
      // Try to get address from window.ethereum first
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({
          method: "eth_accounts",
        });

        if (accounts && accounts.length > 0) {
          return accounts[0] as `0x${string}`;
        }
      }

      // Fallback to SDK provider
      const provider = this.sdk.getEVMProviderWithCA();
      const accounts: any = await provider.request({
        method: "eth_accounts",
        params: [],
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      return accounts[0] as `0x${string}`;
    } catch (error) {
      console.error("Failed to get signer address:", error);
      throw error;
    }
  }

  async deinit() {
    if (!this.initialized) return;

    try {
      await this.sdk.deinit();
      this.initialized = false;
      console.log("Nexus SDK deinitialized");
    } catch (error) {
      console.error("Error deinitializing SDK:", error);
    }
  }
}

// Export singleton instance (testnet for hackathon)
export const nexusService = new NexusService("testnet");

/** For GasDashboard.tsx */
export const initializeNexusSDK = async (walletClient: WalletClient) => {
  await nexusService.initialize(walletClient);
};

export const bridgeTokens = async (params: {
  token: string;
  amount: string | number;
  fromChainId: number;
  toChainId: number;
}) => {
  return nexusService.bridge(params);
};

export const getNexusSDK = () => nexusService;
