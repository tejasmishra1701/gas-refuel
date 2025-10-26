import { describe, it, expect } from "vitest";
import { formatBalance, formatUSD, parseEthInput } from "../utils";

describe("utils", () => {
  describe("formatBalance", () => {
    it("should format balance correctly", () => {
      expect(formatBalance(BigInt(1000000000000000000))).toBe(
        "1.000000000000000000"
      );
      expect(formatBalance(BigInt(1500000000000000000))).toBe(
        "1.500000000000000000"
      );
      expect(formatBalance(BigInt(1000000000000000))).toBe(
        "0.001000000000000000"
      );
      expect(formatBalance(BigInt(0))).toBe("0.000000000000000000");
    });

    it("should handle large balances", () => {
      expect(formatBalance(BigInt(1000000000000000000000))).toBe(
        "1000.000000000000000000"
      );
    });
  });

  describe("formatUSD", () => {
    it("should format USD values", () => {
      expect(formatUSD("1.0")).toBe("$2500.00");
      expect(formatUSD("1.5")).toBe("$3750.00");
      expect(formatUSD("0.001")).toBe("$2.50");
      expect(formatUSD("1000")).toBe("$2500000.00");
    });

    it("should handle invalid inputs", () => {
      expect(formatUSD("invalid")).toBe("$NaN");
      expect(formatUSD("")).toBe("$NaN");
    });
  });

  describe("parseEthInput", () => {
    it("should parse valid ETH inputs", () => {
      expect(parseEthInput("1.0")).toBe(BigInt(1000000000000000000));
      expect(parseEthInput("0.001")).toBe(BigInt(1000000000000000));
      expect(parseEthInput("1.5")).toBe(BigInt(1500000000000000000));
    });

    it("should handle invalid inputs", () => {
      expect(parseEthInput("")).toBe(BigInt(0));
      expect(parseEthInput("0")).toBe(BigInt(0));
      expect(parseEthInput("-1")).toBe(BigInt(0));
      expect(parseEthInput("invalid")).toBe(BigInt(0));
    });

    it("should handle edge cases", () => {
      expect(parseEthInput("0.000000000000000001")).toBe(BigInt(1));
      expect(parseEthInput("999999999999999999999")).toBe(
        BigInt(999999999999999999999000000000000000000)
      );
    });
  });
});
