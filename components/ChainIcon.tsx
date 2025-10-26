"use client";

import Image from "next/image";
import { useState } from "react";
import { ChainKey, CHAIN_MAP } from "@/lib/chains";

interface ChainIconProps {
  chainKey: ChainKey;
  size?: number;
  className?: string;
}

export function ChainIcon({
  chainKey,
  size = 24,
  className = "",
}: ChainIconProps) {
  const chain = CHAIN_MAP[chainKey];
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    // Fallback to colored circle with chain letter
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-full font-bold text-white ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: chain.color,
          fontSize: size * 0.5,
        }}
      >
        {chain.symbol[0]}
      </div>
    );
  }

  return (
    <div className={`relative inline-flex ${className}`}>
      <Image
        src={chain.icon}
        alt={chain.iconAlt}
        width={size}
        height={size}
        className="object-contain"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

export function ChainIconSkeleton({ size = 24 }: { size?: number }) {
  return (
    <div
      className="animate-pulse bg-zinc-700 rounded-full"
      style={{ width: size, height: size }}
    />
  );
}
