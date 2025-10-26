# Chain Icons Documentation

## Overview

This document describes the chain icons used in the FuelFlow application and their sources.

## Icon Specifications

- **Format**: SVG (Scalable Vector Graphics)
- **Size**: 32x32px viewBox
- **Background**: Transparent
- **Colors**: Brand colors matching each chain's official branding

## Chain Icons

### Ethereum Sepolia

- **File**: `/public/chains/ethereum.svg`
- **Color**: #627EEA (Ethereum blue)
- **Design**: Diamond-shaped Ethereum logo
- **Source**: Custom SVG based on Ethereum branding

### Base Sepolia

- **File**: `/public/chains/base.svg`
- **Color**: #0052FF (Base blue)
- **Design**: Circle with diamond shape
- **Source**: Custom SVG based on Base branding

### Arbitrum Sepolia

- **File**: `/public/chains/arbitrum.svg`
- **Color**: #28A0F0 (Arbitrum blue)
- **Design**: Rounded rectangle with geometric shapes
- **Source**: Custom SVG based on Arbitrum branding

### Optimism Sepolia

- **File**: `/public/chains/optimism.svg`
- **Color**: #FF0420 (Optimism red)
- **Design**: Circle with diamond shape
- **Source**: Custom SVG based on Optimism branding

### Polygon Amoy

- **File**: `/public/chains/polygon.svg`
- **Color**: #8247E5 (Polygon purple)
- **Design**: Hexagonal shape with inner diamond
- **Source**: Custom SVG based on Polygon branding

### Monad Sepolia

- **File**: `/public/chains/monad.svg`
- **Color**: #00D4AA (Monad teal)
- **Design**: Circle with inner diamond
- **Source**: Custom SVG based on Monad branding

## Implementation

### ChainIcon Component

The `ChainIcon` component provides a consistent way to display chain icons throughout the application:

```typescript
import { ChainIcon } from "./ChainIcon";

<ChainIcon chainKey="sepolia" size={24} />;
```

### Features

- **Fallback Support**: If an icon fails to load, displays a colored circle with the chain symbol
- **Size Flexibility**: Icons can be scaled to any size
- **Error Handling**: Graceful degradation when icons are unavailable
- **Accessibility**: Proper alt text for screen readers

### Usage Examples

```typescript
// Small icon (24px)
<ChainIcon chainKey="baseSepolia" size={24} />

// Medium icon (32px)
<ChainIcon chainKey="arbitrumSepolia" size={32} />

// Large icon (48px)
<ChainIcon chainKey="sepolia" size={48} />
```

## Adding New Chain Icons

### Steps

1. **Create SVG File**: Add the chain logo as an SVG file in `/public/chains/`
2. **Update Chain Config**: Add the icon path and alt text to `lib/chains.ts`
3. **Test Fallback**: Ensure the fallback works if the icon fails to load

### Example

```typescript
// In lib/chains.ts
newChain: {
  id: 12345,
  name: "New Chain",
  rpcUrl: "https://rpc.newchain.com",
  symbol: "NEW",
  explorer: "https://explorer.newchain.com",
  color: "#FF0000",
  icon: "/chains/newchain.svg",
  iconAlt: "New Chain logo",
},
```

## Icon Sources

All icons are custom-created SVGs based on official chain branding:

- **Ethereum**: Based on official Ethereum diamond logo
- **Base**: Based on Coinbase Base branding
- **Arbitrum**: Based on Arbitrum geometric design
- **Optimism**: Based on Optimism red circle branding
- **Polygon**: Based on Polygon hexagonal logo
- **Monad**: Based on Monad teal branding

## Licensing

All custom-created icons are original works based on publicly available branding materials. They are created for educational and demonstration purposes in this hackathon project.

## Performance

- **Optimization**: SVG format ensures crisp display at all sizes
- **Caching**: Next.js Image component handles caching automatically
- **Bundle Size**: Minimal impact on bundle size
- **Loading**: Icons load asynchronously with fallback support

## Browser Support

- **Modern Browsers**: Full SVG support
- **Fallback**: Colored circles for older browsers
- **Accessibility**: Screen reader compatible

## Troubleshooting

### Icon Not Displaying

1. Check file path in `lib/chains.ts`
2. Verify SVG file exists in `/public/chains/`
3. Check browser console for errors
4. Ensure Next.js image optimization is configured

### Fallback Not Working

1. Verify `ChainIcon` component is imported correctly
2. Check that `CHAIN_MAP` includes the chain
3. Ensure fallback logic is implemented

### Performance Issues

1. Use appropriate icon sizes
2. Consider lazy loading for large lists
3. Monitor bundle size impact
