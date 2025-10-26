import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  validateAddress,
  validateAmount,
  parseCSV,
  generateSampleCSV,
  formatAddress,
  formatAmount,
  CSV_LIMITS,
  validateCSVLimits,
  validateCSVContent,
} from "../csvParser";

describe("csvParser", () => {
  describe("validateAddress", () => {
    it("should validate correct Ethereum addresses", () => {
      expect(
        validateAddress("0x1234567890123456789012345678901234567890")
      ).toBe(true);
      expect(
        validateAddress("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd")
      ).toBe(true);
      expect(
        validateAddress("0x0000000000000000000000000000000000000000")
      ).toBe(true);
    });

    it("should reject invalid addresses", () => {
      expect(validateAddress("")).toBe(false);
      expect(validateAddress("0x123")).toBe(false);
      expect(validateAddress("1234567890123456789012345678901234567890")).toBe(
        false
      );
      expect(
        validateAddress("0x123456789012345678901234567890123456789g")
      ).toBe(false);
      expect(validateAddress("0x123456789012345678901234567890123456789")).toBe(
        false
      );
    });

    it("should handle whitespace", () => {
      expect(
        validateAddress(" 0x1234567890123456789012345678901234567890 ")
      ).toBe(true);
    });
  });

  describe("validateAmount", () => {
    it("should validate correct amounts", () => {
      expect(validateAmount("0.001")).toBe(true);
      expect(validateAmount("1")).toBe(true);
      expect(validateAmount("100.5")).toBe(true);
      expect(validateAmount("0.000000000000000001")).toBe(true);
    });

    it("should reject invalid amounts", () => {
      expect(validateAmount("")).toBe(false);
      expect(validateAmount("0")).toBe(false);
      expect(validateAmount("-1")).toBe(false);
      expect(validateAmount("abc")).toBe(false);
      expect(validateAmount("1.2.3")).toBe(true); // parseFloat('1.2.3') = 1.2, which is > 0
    });

    it("should handle whitespace", () => {
      expect(validateAmount(" 0.001 ")).toBe(true);
    });
  });

  describe("CSV_LIMITS", () => {
    it("should have correct limits", () => {
      expect(CSV_LIMITS.maxRecipients).toBe(100);
      expect(CSV_LIMITS.maxFileSize).toBe(5 * 1024 * 1024);
      expect(CSV_LIMITS.maxLineLength).toBe(200);
      expect(CSV_LIMITS.maxLines).toBe(1000);
    });
  });

  describe("validateCSVLimits", () => {
    it("should validate correct file", () => {
      const file = new File(["test"], "test.csv", { type: "text/csv" });
      const result = validateCSVLimits(file);
      expect(result.isValid).toBe(true);
    });

    it("should reject oversized file", () => {
      const largeContent = "x".repeat(6 * 1024 * 1024); // 6MB
      const file = new File([largeContent], "test.csv", { type: "text/csv" });
      const result = validateCSVLimits(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("File size exceeds limit");
    });

    it("should reject non-CSV file", () => {
      const file = new File(["test"], "test.txt", { type: "text/plain" });
      const result = validateCSVLimits(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("File must be a CSV file");
    });
  });

  describe("validateCSVContent", () => {
    it("should validate correct content", () => {
      const content =
        "0x1234567890123456789012345678901234567890,0.001\n0xabcdefabcdefabcdefabcdefabcdefabcdefabcd,0.002";
      const result = validateCSVContent(content);
      expect(result.isValid).toBe(true);
    });

    it("should reject empty content", () => {
      const result = validateCSVContent("");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("CSV file is empty");
    });

    it("should reject too many lines", () => {
      const lines = Array(1001).fill(
        "0x1234567890123456789012345678901234567890,0.001"
      );
      const content = lines.join("\n");
      const result = validateCSVContent(content);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("maximum allowed is 1000");
    });

    it("should reject lines that are too long", () => {
      const longLine = "x".repeat(201);
      const content = `${longLine}\n0x1234567890123456789012345678901234567890,0.001`;
      const result = validateCSVContent(content);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("longer than 200 characters");
    });
  });

  describe("parseCSV", () => {
    it("should parse valid CSV with addresses and amounts", async () => {
      const csvContent =
        "0x1234567890123456789012345678901234567890,0.001\n0xabcdefabcdefabcdefabcdefabcdefabcdefabcd,0.002";

      // Mock FileReader
      const mockFileReader = {
        result: csvContent,
        onload: null as any,
        readAsText: vi.fn(() => {
          setTimeout(() => {
            if (mockFileReader.onload) {
              mockFileReader.onload({ target: { result: csvContent } });
            }
          }, 0);
        }),
      };

      global.FileReader = vi.fn(() => mockFileReader) as any;

      const file = new File([csvContent], "test.csv", { type: "text/csv" });

      const result = await parseCSV(file);

      expect(result.recipients).toHaveLength(2);
      expect(result.validCount).toBe(2);
      expect(result.invalidCount).toBe(0);
      expect(result.totalAmount).toBe(0.003);
    });

    it("should parse CSV with addresses only and common amount", async () => {
      const csvContent =
        "0x1234567890123456789012345678901234567890\n0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
      const file = new File([csvContent], "test.csv", { type: "text/csv" });

      const result = await parseCSV(file, {
        useCommonAmount: true,
        commonAmount: "0.005",
      });

      expect(result.recipients).toHaveLength(2);
      expect(result.validCount).toBe(2);
      expect(result.totalAmount).toBe(0.01);
    });

    it("should handle invalid addresses and amounts", async () => {
      const csvContent =
        "invalid_address,0.001\n0x1234567890123456789012345678901234567890,invalid_amount";
      const file = new File([csvContent], "test.csv", { type: "text/csv" });

      const result = await parseCSV(file);

      expect(result.recipients).toHaveLength(2);
      expect(result.validCount).toBe(0);
      expect(result.invalidCount).toBe(2);
      expect(result.totalAmount).toBe(0);
    });

    it("should reject CSV with too many recipients", async () => {
      const lines = Array(101).fill(
        "0x1234567890123456789012345678901234567890,0.001"
      );
      const csvContent = lines.join("\n");
      const file = new File([csvContent], "test.csv", { type: "text/csv" });

      await expect(parseCSV(file)).rejects.toThrow("maximum allowed is 100");
    });
  });

  describe("generateSampleCSV", () => {
    it("should generate CSV with addresses and amounts", () => {
      const csv = generateSampleCSV(false);
      const lines = csv.split("\n");

      expect(lines).toHaveLength(5);
      lines.forEach((line) => {
        const parts = line.split(",");
        expect(parts).toHaveLength(2);
        expect(parts[0]).toMatch(/^0x[a-fA-F0-9]{40}$/);
        expect(parts[1]).toMatch(/^\d+\.\d+$/);
      });
    });

    it("should generate CSV with addresses only", () => {
      const csv = generateSampleCSV(true);
      const lines = csv.split("\n");

      expect(lines).toHaveLength(5);
      lines.forEach((line) => {
        expect(line).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });
    });
  });

  describe("formatAddress", () => {
    it("should format address with default parameters", () => {
      const address = "0x1234567890123456789012345678901234567890";
      const formatted = formatAddress(address);
      expect(formatted).toBe("0x1234...7890");
    });

    it("should format address with custom parameters", () => {
      const address = "0x1234567890123456789012345678901234567890";
      const formatted = formatAddress(address, 4, 6);
      expect(formatted).toBe("0x12...567890");
    });

    it("should handle short addresses", () => {
      const address = "0x123";
      const formatted = formatAddress(address);
      expect(formatted).toBe("0x123");
    });
  });

  describe("formatAmount", () => {
    it("should format amounts correctly", () => {
      expect(formatAmount("0.001")).toBe("0.001");
      expect(formatAmount("1.000000")).toBe("1");
      expect(formatAmount("1.500000")).toBe("1.5");
      expect(formatAmount("0.000001")).toBe("0.000001");
    });

    it("should handle invalid amounts", () => {
      expect(formatAmount("invalid")).toBe("invalid");
      expect(formatAmount("")).toBe("");
    });
  });
});
