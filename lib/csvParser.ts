/**
 * CSV Parser Utility for Batch Wallet Refuel
 *
 * Handles parsing, validation, and sample generation for CSV files
 * containing recipient addresses and amounts for batch refueling.
 */

export interface CSVRecipient {
  address: string;
  amount: string;
  isValid: boolean;
  error?: string;
}

export interface ParsedCSV {
  recipients: CSVRecipient[];
  totalAmount: number;
  validCount: number;
  invalidCount: number;
}

export interface CSVUploadOptions {
  useCommonAmount?: boolean;
  commonAmount?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * CSV file limits for batch operations
 */
export const CSV_LIMITS = {
  maxRecipients: 100,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxLineLength: 200,
  maxLines: 1000,
} as const;

/**
 * Validates CSV file against limits
 */
export function validateCSVLimits(file: File): ValidationResult {
  // Check file size
  if (file.size > CSV_LIMITS.maxFileSize) {
    return {
      isValid: false,
      error: `File size exceeds limit of ${
        CSV_LIMITS.maxFileSize / (1024 * 1024)
      }MB`,
    };
  }

  // Check file type
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return {
      isValid: false,
      error: "File must be a CSV file",
    };
  }

  return { isValid: true };
}

/**
 * Validates CSV content against limits
 */
export function validateCSVContent(content: string): ValidationResult {
  const lines = content.split("\n").filter((line) => line.trim().length > 0);

  // Check line count
  if (lines.length > CSV_LIMITS.maxLines) {
    return {
      isValid: false,
      error: `CSV contains ${lines.length} lines, maximum allowed is ${CSV_LIMITS.maxLines}`,
    };
  }

  // Check for empty file
  if (lines.length === 0) {
    return {
      isValid: false,
      error: "CSV file is empty",
    };
  }

  // Check line lengths
  const longLines = lines.filter(
    (line) => line.length > CSV_LIMITS.maxLineLength
  );
  if (longLines.length > 0) {
    return {
      isValid: false,
      error: `CSV contains lines longer than ${CSV_LIMITS.maxLineLength} characters`,
    };
  }

  return { isValid: true };
}

/**
 * Validates Ethereum address format
 */
export function validateAddress(address: string): boolean {
  if (!address) return false;

  // Remove any whitespace
  const cleanAddress = address.trim();

  // Check if it starts with 0x and has 42 characters total
  if (!cleanAddress.startsWith("0x") || cleanAddress.length !== 42) {
    return false;
  }

  // Check if the remaining 40 characters are valid hex
  const hexPart = cleanAddress.slice(2);
  return /^[0-9a-fA-F]{40}$/.test(hexPart);
}

/**
 * Validates amount format
 */
export function validateAmount(amount: string): boolean {
  if (!amount) return false;

  const cleanAmount = amount.trim();

  // Check if it's a valid number
  const num = parseFloat(cleanAmount);

  // Must be a positive number
  return !isNaN(num) && num > 0;
}

/**
 * Parses CSV file and validates addresses and amounts
 */
export async function parseCSV(
  file: File,
  options?: CSVUploadOptions
): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    // Validate file limits first
    const fileValidation = validateCSVLimits(file);
    if (!fileValidation.isValid) {
      reject(new Error(fileValidation.error));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;

        // Validate content limits
        const contentValidation = validateCSVContent(text);
        if (!contentValidation.isValid) {
          reject(new Error(contentValidation.error));
          return;
        }

        const lines = text
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        // Check recipient count limit
        if (lines.length > CSV_LIMITS.maxRecipients) {
          reject(
            new Error(
              `CSV contains ${lines.length} recipients, maximum allowed is ${CSV_LIMITS.maxRecipients}`
            )
          );
          return;
        }

        const recipients: CSVRecipient[] = [];
        let totalAmount = 0;
        let validCount = 0;
        let invalidCount = 0;

        lines.forEach((line, index) => {
          const parts = line.split(",").map((part) => part.trim());

          let address: string;
          let amount: string;

          if (options?.useCommonAmount) {
            // Format: address only, use common amount
            address = parts[0];
            amount = options.commonAmount || "0";
          } else {
            // Format: address,amount
            if (parts.length !== 2) {
              recipients.push({
                address: "",
                amount: "",
                isValid: false,
                error: `Line ${index + 1}: Expected format "address,amount"`,
              });
              invalidCount++;
              return;
            }

            address = parts[0];
            amount = parts[1];
          }

          // Validate address and amount
          const addressValid = validateAddress(address);
          const amountValid = validateAmount(amount);

          let error: string | undefined;
          if (!addressValid && !amountValid) {
            error = "Invalid address and amount";
          } else if (!addressValid) {
            error = "Invalid address format";
          } else if (!amountValid) {
            error = "Invalid amount";
          }

          const isValid = addressValid && amountValid;

          if (isValid) {
            validCount++;
            totalAmount += parseFloat(amount);
          } else {
            invalidCount++;
          }

          recipients.push({
            address,
            amount,
            isValid,
            error,
          });
        });

        resolve({
          recipients,
          totalAmount,
          validCount,
          invalidCount,
        });
      } catch (error) {
        reject(
          new Error("Failed to parse CSV file: " + (error as Error).message)
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read CSV file"));
    };

    reader.readAsText(file);
  });
}

/**
 * Generates sample CSV content for download
 */
export function generateSampleCSV(useCommonAmount = false): string {
  if (useCommonAmount) {
    return `0x1234567890123456789012345678901234567890
0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
0x9876543210987654321098765432109876543210
0x1111111111111111111111111111111111111111
0x2222222222222222222222222222222222222222`;
  } else {
    return `0x1234567890123456789012345678901234567890,0.005
0xabcdefabcdefabcdefabcdefabcdefabcdefabcd,0.01
0x9876543210987654321098765432109876543210,0.002
0x1111111111111111111111111111111111111111,0.008
0x2222222222222222222222222222222222222222,0.003`;
  }
}

/**
 * Downloads sample CSV file
 */
export function downloadSampleCSV(useCommonAmount = false): void {
  const csvContent = generateSampleCSV(useCommonAmount);
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = useCommonAmount
    ? "sample_addresses.csv"
    : "sample_wallet_refuel.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.URL.revokeObjectURL(url);
}

/**
 * Formats address for display (truncated)
 */
export function formatAddress(
  address: string,
  startChars = 6,
  endChars = 4
): string {
  if (!address || address.length < startChars + endChars) {
    return address;
  }

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Formats amount for display
 */
export function formatAmount(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;

  // Show up to 6 decimal places, remove trailing zeros
  return num.toFixed(6).replace(/\.?0+$/, "");
}
