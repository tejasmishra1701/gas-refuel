import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBalance(balance: bigint, decimals: number = 18): string {
  const value = Number(balance) / Math.pow(10, decimals);
  if (value === 0) return '0.00';
  if (value < 0.001) return '<0.001';
  if (value < 1) return value.toFixed(4);
  return value.toFixed(3);
}

export function formatUSD(ethAmount: string, ethPrice: number = 2500): string {
  const usd = parseFloat(ethAmount) * ethPrice;
  return `$${usd.toFixed(2)}`;
}

export function shortenAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function parseEthInput(value: string): bigint {
  try {
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed <= 0) return BigInt(0);
    return BigInt(Math.floor(parsed * 1e18));
  } catch {
    return BigInt(0);
  }
}