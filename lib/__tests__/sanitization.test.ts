import { describe, it, expect } from "vitest";
import {
  sanitizeAddress,
  sanitizeAmount,
  sanitizeChainId,
  sanitizeCSVInput,
  sanitizeFilename,
  sanitizeNumericInput,
  sanitizeTextInput,
  isValidInput,
  sanitizeUrl,
} from "../sanitization";

describe("sanitization", () => {
  describe("sanitizeAddress", () => {
    it("should sanitize valid addresses", () => {
      expect(
        sanitizeAddress("0x1234567890123456789012345678901234567890")
      ).toBe("0x1234567890123456789012345678901234567890");
      expect(
        sanitizeAddress(" 0x1234567890123456789012345678901234567890 ")
      ).toBe("0x1234567890123456789012345678901234567890");
      expect(
        sanitizeAddress("0X1234567890123456789012345678901234567890")
      ).toBe("0x1234567890123456789012345678901234567890");
    });

    it("should reject invalid addresses", () => {
      expect(sanitizeAddress("")).toBe("");
      expect(sanitizeAddress("0x123")).toBe("");
      expect(sanitizeAddress("1234567890123456789012345678901234567890")).toBe(
        ""
      );
      expect(
        sanitizeAddress("0x123456789012345678901234567890123456789g")
      ).toBe("");
    });

    it("should handle non-string inputs", () => {
      expect(sanitizeAddress(null as any)).toBe("");
      expect(sanitizeAddress(undefined as any)).toBe("");
      expect(sanitizeAddress(123 as any)).toBe("");
    });
  });

  describe("sanitizeAmount", () => {
    it("should sanitize valid amounts", () => {
      expect(sanitizeAmount("1.0")).toBe("1");
      expect(sanitizeAmount("0.001")).toBe("0.001");
      expect(sanitizeAmount(" 1.5 ")).toBe("1.5");
      expect(sanitizeAmount("100.123456789012345678")).toBe(
        "100.12345678901235"
      );
    });

    it("should reject invalid amounts", () => {
      expect(sanitizeAmount("")).toBe("");
      expect(sanitizeAmount("-1")).toBe("");
      expect(sanitizeAmount("abc")).toBe("");
      expect(sanitizeAmount("1.2.3")).toBe("1.23");
    });

    it("should handle edge cases", () => {
      expect(sanitizeAmount("0")).toBe("0");
      expect(sanitizeAmount("0.0")).toBe("0");
    });
  });

  describe("sanitizeChainId", () => {
    it("should sanitize valid chain IDs", () => {
      expect(sanitizeChainId(1)).toBe(1);
      expect(sanitizeChainId("11155111")).toBe(11155111);
      expect(sanitizeChainId(84532)).toBe(84532);
    });

    it("should reject invalid chain IDs", () => {
      expect(sanitizeChainId(0)).toBe(0);
      expect(sanitizeChainId(-1)).toBe(0);
      expect(sanitizeChainId("invalid")).toBe(0);
      expect(sanitizeChainId(2147483648)).toBe(0);
    });
  });

  describe("sanitizeCSVInput", () => {
    it("should sanitize valid CSV content", () => {
      const content =
        "0x1234567890123456789012345678901234567890,0.001\n0xabcdefabcdefabcdefabcdefabcdefabcdefabcd,0.002";
      const result = sanitizeCSVInput(content);
      expect(result).toBe(content);
    });

    it("should remove dangerous characters", () => {
      const content = "0x1234567890123456789012345678901234567890,0.001\0";
      const result = sanitizeCSVInput(content);
      expect(result).not.toContain("\0");
    });

    it("should limit line length", () => {
      const longLine = "x".repeat(250);
      const content = `${longLine}\n0x1234567890123456789012345678901234567890,0.001`;
      const result = sanitizeCSVInput(content);
      const lines = result.split("\n");
      expect(lines[0].length).toBe(200);
    });
  });

  describe("sanitizeFilename", () => {
    it("should sanitize valid filenames", () => {
      expect(sanitizeFilename("test.csv")).toBe("test.csv");
      expect(sanitizeFilename("my-file.csv")).toBe("my-file.csv");
    });

    it("should remove dangerous characters", () => {
      expect(sanitizeFilename("test/../file.csv")).toBe("testfile.csv");
      expect(sanitizeFilename("test|file.csv")).toBe("testfile.csv");
      expect(sanitizeFilename("test:file.csv")).toBe("testfile.csv");
    });

    it("should limit length", () => {
      const longName = "x".repeat(300);
      const result = sanitizeFilename(longName);
      expect(result.length).toBe(255);
    });
  });

  describe("sanitizeNumericInput", () => {
    it("should sanitize valid numeric inputs", () => {
      expect(sanitizeNumericInput("10", 0, 100)).toBe(10);
      expect(sanitizeNumericInput(5.5, 0, 10)).toBe(5.5);
    });

    it("should enforce min/max bounds", () => {
      expect(sanitizeNumericInput("5", 10, 20)).toBe(10);
      expect(sanitizeNumericInput("25", 10, 20)).toBe(20);
    });

    it("should handle invalid inputs", () => {
      expect(sanitizeNumericInput("invalid", 0, 100)).toBe(0);
      expect(sanitizeNumericInput("", 0, 100)).toBe(0);
    });
  });

  describe("sanitizeTextInput", () => {
    it("should sanitize valid text", () => {
      expect(sanitizeTextInput("Hello World")).toBe("Hello World");
      expect(sanitizeTextInput("  Hello World  ")).toBe("Hello World");
    });

    it("should remove HTML tags", () => {
      expect(sanitizeTextInput('<script>alert("xss")</script>')).toBe(
        'alert("xss")'
      );
      expect(sanitizeTextInput("<b>Bold</b> text")).toBe("Bold text");
    });

    it("should limit length", () => {
      const longText = "x".repeat(1500);
      const result = sanitizeTextInput(longText, 1000);
      expect(result.length).toBe(1000);
    });
  });

  describe("isValidInput", () => {
    it("should validate safe inputs", () => {
      expect(isValidInput("Hello World")).toBe(true);
      expect(isValidInput("user@example.com")).toBe(true);
      expect(isValidInput("123-456-7890")).toBe(true);
    });

    it("should reject dangerous inputs", () => {
      expect(isValidInput('<script>alert("xss")</script>')).toBe(false);
      expect(isValidInput("test; DROP TABLE users;")).toBe(false);
    });

    it("should handle custom patterns", () => {
      const emailPattern = /^[a-zA-Z0-9@._-]+$/;
      expect(isValidInput("user@example.com", emailPattern)).toBe(true);
      expect(isValidInput("user@example.com<script>", emailPattern)).toBe(
        false
      );
    });
  });

  describe("sanitizeUrl", () => {
    it("should sanitize valid URLs", () => {
      expect(sanitizeUrl("https://example.com")).toBe("https://example.com/");
      expect(sanitizeUrl("http://example.com")).toBe("http://example.com/");
    });

    it("should reject invalid URLs", () => {
      expect(sanitizeUrl('javascript:alert("xss")')).toBe("");
      expect(sanitizeUrl("ftp://example.com")).toBe("");
      expect(sanitizeUrl("invalid-url")).toBe("");
    });

    it("should handle edge cases", () => {
      expect(sanitizeUrl("")).toBe("");
      expect(sanitizeUrl("not-a-url")).toBe("");
    });
  });
});
