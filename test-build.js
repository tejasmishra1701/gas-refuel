#!/usr/bin/env node

// Simple build test script
const { execSync } = require("child_process");

console.log("🧪 Testing Gas Refuel build...\n");

try {
  // Test TypeScript compilation
  console.log("📝 Checking TypeScript...");
  execSync("npx tsc --noEmit", { stdio: "inherit" });
  console.log("✅ TypeScript check passed\n");

  // Test ESLint
  console.log("🔍 Running ESLint...");
  execSync("npm run lint", { stdio: "inherit" });
  console.log("✅ ESLint check passed\n");

  // Test build
  console.log("🏗️  Testing build...");
  execSync("npm run build", { stdio: "inherit" });
  console.log("✅ Build successful\n");

  console.log("🎉 All tests passed! Ready for deployment! 🚀");
} catch (error) {
  console.error("❌ Test failed:", error.message);
  process.exit(1);
}
