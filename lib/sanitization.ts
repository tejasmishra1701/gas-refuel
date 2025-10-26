/**
 * Input Sanitization Utilities
 *
 * Provides functions to sanitize and validate user inputs to prevent
 * security vulnerabilities and ensure data integrity.
 */

/**
 * Sanitizes Ethereum address input
 * @param address - Raw address input from user
 * @returns Sanitized address string
 */
export function sanitizeAddress(address: string): string {
  if (!address || typeof address !== "string") {
    return "";
  }

  // Remove any whitespace and convert to lowercase
  const sanitized = address.trim().toLowerCase();

  // Basic validation - must start with 0x and be 42 characters
  if (!sanitized.startsWith("0x") || sanitized.length !== 42) {
    return "";
  }

  // Remove any non-hex characters
  const hexPart = sanitized.slice(2);
  const cleanHex = hexPart.replace(/[^0-9a-f]/g, "");

  return cleanHex.length === 40 ? `0x${cleanHex}` : "";
}

/**
 * Sanitizes amount input for ETH values
 * @param amount - Raw amount input from user
 * @returns Sanitized amount string
 */
export function sanitizeAmount(amount: string): string {
  if (!amount || typeof amount !== "string") {
    return "";
  }

  // Remove any whitespace
  const sanitized = amount.trim();

  // Allow only digits, decimal point, and optional minus sign
  const cleanAmount = sanitized.replace(/[^0-9.-]/g, "");

  // Ensure only one decimal point
  const parts = cleanAmount.split(".");
  if (parts.length > 2) {
    return parts[0] + "." + parts.slice(1).join("");
  }

  // Limit to 18 decimal places (ETH precision)
  if (parts.length === 2 && parts[1].length > 18) {
    return parts[0] + "." + parts[1].slice(0, 18);
  }

  // Convert to number and back to string to normalize
  const num = parseFloat(cleanAmount);
  if (isNaN(num) || num < 0) {
    return "";
  }

  return num.toString();
}

/**
 * Sanitizes chain ID input
 * @param chainId - Raw chain ID input
 * @returns Sanitized chain ID number
 */
export function sanitizeChainId(chainId: number | string): number {
  if (typeof chainId === "string") {
    const parsed = parseInt(chainId, 10);
    if (isNaN(parsed)) {
      return 0;
    }
    chainId = parsed;
  }

  // Ensure it's a positive integer
  if (!Number.isInteger(chainId) || chainId <= 0) {
    return 0;
  }

  // Limit to reasonable range (1 to 2^31-1)
  if (chainId > 2147483647) {
    return 0;
  }

  return chainId;
}

/**
 * Sanitizes CSV input content
 * @param content - Raw CSV content
 * @returns Sanitized CSV content
 */
export function sanitizeCSVInput(content: string): string {
  if (!content || typeof content !== "string") {
    return "";
  }

  // Remove any null bytes and control characters except newlines and tabs
  const sanitized = content
    .replace(/\0/g, "") // Remove null bytes
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control chars except \t, \n, \r
    .trim();

  // Limit line length to prevent memory issues
  const lines = sanitized.split("\n");
  const limitedLines = lines.map((line) => {
    if (line.length > 200) {
      return line.slice(0, 200);
    }
    return line;
  });

  return limitedLines.join("\n");
}

/**
 * Sanitizes file name input
 * @param filename - Raw filename input
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== "string") {
    return "";
  }

  // Remove any path separators and dangerous characters
  const sanitized = filename
    .replace(/[\/\\:*?"<>|]/g, "") // Remove path separators and invalid chars
    .replace(/\.\./g, "") // Remove parent directory references
    .trim();

  // Limit length
  return sanitized.slice(0, 255);
}

/**
 * Validates and sanitizes numeric input
 * @param value - Raw numeric input
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Sanitized numeric value
 */
export function sanitizeNumericInput(
  value: string | number,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER
): number {
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      return min;
    }
    value = parsed;
  }

  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}

/**
 * Sanitizes text input for display
 * @param text - Raw text input
 * @param maxLength - Maximum allowed length
 * @returns Sanitized text
 */
export function sanitizeTextInput(
  text: string,
  maxLength: number = 1000
): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  // Remove HTML tags and dangerous characters
  const sanitized = text
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[<>]/g, "") // Remove remaining angle brackets
    .trim();

  return sanitized.slice(0, maxLength);
}

/**
 * Validates that input contains only safe characters
 * @param input - Input to validate
 * @param allowedChars - Regex pattern of allowed characters
 * @returns True if input is safe
 */
export function isValidInput(
  input: string,
  allowedChars: RegExp = /^[a-zA-Z0-9\s\-_.,@]+$/
): boolean {
  if (!input || typeof input !== "string") {
    return false;
  }

  return allowedChars.test(input);
}

/**
 * Sanitizes URL input
 * @param url - Raw URL input
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== "string") {
    return "";
  }

  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }

    return parsed.toString();
  } catch {
    return "";
  }
}
