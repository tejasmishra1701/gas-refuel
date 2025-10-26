export const SUPPORTED_CHAINS = {
  sepolia: {
    id: 11155111,
    name: "Ethereum Sepolia",
    rpcUrl: "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    symbol: "ETH",
    explorer: "https://sepolia.etherscan.io",
    color: "#627EEA",
    icon: "⟠",
  },
  baseSepolia: {
    id: 84532,
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    symbol: "ETH",
    explorer: "https://sepolia.basescan.org",
    color: "#0052FF",
    icon: "🔵",
  },
  arbitrumSepolia: {
    id: 421614,
    name: "Arbitrum Sepolia",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    symbol: "ETH",
    explorer: "https://sepolia.arbiscan.io",
    color: "#28A0F0",
    icon: "🔷",
  },
  optimismSepolia: {
    id: 11155420,
    name: "Optimism Sepolia",
    rpcUrl: "https://sepolia.optimism.io",
    symbol: "ETH",
    explorer: "https://sepolia-optimism.etherscan.io",
    color: "#FF0420",
    icon: "🔴",
  },
  polygonAmoy: {
    id: 80002,
    name: "Polygon Amoy",
    rpcUrl: "https://rpc-amoy.polygon.technology",
    symbol: "MATIC",
    explorer: "https://amoy.polygonscan.com",
    color: "#8247E5",
    icon: "🟣",
  },
  monadSepolia: {
    id: 999999999,
    name: "Monad Sepolia",
    rpcUrl: "https://sepolia-rpc.monad.xyz",
    symbol: "MON",
    explorer: "https://sepolia.monadscan.xyz",
    color: "#00D4AA",
    icon: "🔷",
  },
} as const;

export type ChainKey = keyof typeof SUPPORTED_CHAINS;

// Array form for iteration (used in dashboard grid)
export const CHAIN_ARRAY = Object.entries(SUPPORTED_CHAINS).map(
  ([key, chain]) => ({
    key: key as ChainKey,
    ...chain,
  })
);

// Direct lookup map (used in bridge/refuel logic)
export const CHAIN_MAP: Record<ChainKey, (typeof SUPPORTED_CHAINS)[ChainKey]> =
  {
    sepolia: SUPPORTED_CHAINS.sepolia,
    baseSepolia: SUPPORTED_CHAINS.baseSepolia,
    arbitrumSepolia: SUPPORTED_CHAINS.arbitrumSepolia,
    optimismSepolia: SUPPORTED_CHAINS.optimismSepolia,
    polygonAmoy: SUPPORTED_CHAINS.polygonAmoy,
    monadSepolia: SUPPORTED_CHAINS.monadSepolia,
  };

// Gas amount presets for modal
export const GAS_PRESETS = [
  { label: "$5 (~25 txs)", usd: 5, eth: "0.002" },
  { label: "$10 (~50 txs)", usd: 10, eth: "0.004" },
  { label: "$20 (~100 txs)", usd: 20, eth: "0.008" },
  { label: "Custom", usd: 0, eth: "0" },
];
