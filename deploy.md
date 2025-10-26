# 🚀 Vercel Deployment Guide

## Pre-deployment Checklist ✅

### 1. **Build Test**

```bash
npm run build
```

- ✅ Should complete without errors
- ✅ All TypeScript types resolved
- ✅ No linting errors

### 2. **Environment Variables**

- ✅ WalletConnect Project ID: `e397ba97ad3be14af2fc3ecc0e645e93`
- ✅ No sensitive API keys exposed
- ✅ All RPC URLs are public

### 3. **Dependencies**

- ✅ All packages are compatible with Vercel
- ✅ No native dependencies
- ✅ Next.js 16.0.0 supported

## Deployment Steps

### Option 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (your account)
# - Link to existing project? N
# - Project name: gas-refuel
# - Directory: ./
# - Override settings? N
```

### Option 2: GitHub Integration

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import project from GitHub
4. Vercel will auto-detect Next.js
5. Deploy!

## Post-deployment

### 1. **Test Live Site**

- ✅ Wallet connection works
- ✅ All chains load properly
- ✅ No console errors
- ✅ Responsive design

### 2. **Update README**

- Add live demo link
- Update screenshots if needed

## Potential Issues & Solutions

### Issue: Build Fails

**Solution:** Check for:

- TypeScript errors
- Missing dependencies
- Environment variables

### Issue: Wallet Connection Fails

**Solution:**

- Check WalletConnect Project ID
- Ensure HTTPS (Vercel provides this)

### Issue: RPC Errors

**Solution:**

- All RPC URLs are public testnet endpoints
- Should work on Vercel

## Expected Result

- ✅ Live demo at `https://gas-refuel-xxx.vercel.app`
- ✅ All features working
- ✅ Ready for hackathon submission
