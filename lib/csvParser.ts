/**
 * CSV Parser utilities for batch wallet refueling
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
  useCommonAmount: boolean;
  commonAmount: string;
}

/**
 * Validates if a string is a valid Ethereum address
 */
export function validateAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  
  // Check if it starts with 0x and has 42 characters total (0x + 40 hex chars)
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  return addressRegex.test(address);
}

/**
 * Validates if a string is a valid positive number
 */
export function validateAmount(amount: string): boolean {
  if (!amount || typeof amount !== 'string') return false;
  
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && isFinite(num);
}

/**
 * Parses a CSV file and returns validated recipients
 * Supports both individual amounts and common amount mode
 */
export async function parseCSV(file: File, options?: CSVUploadOptions): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        const recipients: CSVRecipient[] = [];
        let totalAmount = 0;
        let validCount = 0;
        let invalidCount = 0;
        
        lines.forEach((line, index) => {
          const parts = line.split(',').map(part => part.trim());
          
          // Handle different CSV formats based on options
          let address: string;
          let amount: string;
          
          if (options?.useCommonAmount) {
            // Only address required when using common amount
            if (parts.length !== 1) {
              recipients.push({
                address: parts[0] || '',
                amount: options.commonAmount,
                isValid: false,
                error: `Line ${index + 1}: Expected format "address" (common amount mode)`
              });
              invalidCount++;
              return;
            }
            address = parts[0];
            amount = options.commonAmount;
          } else {
            // Traditional format: address,amount
            if (parts.length !== 2) {
              recipients.push({
                address: parts[0] || '',
                amount: parts[1] || '',
                isValid: false,
                error: `Line ${index + 1}: Expected format "address,amount"`
              });
              invalidCount++;
              return;
            }
            [address, amount] = parts;
          }
          
          const isAddressValid = validateAddress(address);
          const isAmountValid = validateAmount(amount);
          
          let error: string | undefined;
          if (!isAddressValid && !isAmountValid) {
            error = 'Invalid address and amount';
          } else if (!isAddressValid) {
            error = 'Invalid Ethereum address';
          } else if (!isAmountValid) {
            error = 'Invalid amount (must be > 0)';
          }
          
          const isValid = isAddressValid && isAmountValid;
          
          if (isValid) {
            totalAmount += parseFloat(amount);
            validCount++;
          } else {
            invalidCount++;
          }
          
          recipients.push({
            address,
            amount,
            isValid,
            error
          });
        });
        
        resolve({
          recipients,
          totalAmount,
          validCount,
          invalidCount
        });
      } catch (error) {
        reject(new Error('Failed to parse CSV file: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read CSV file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Generates a sample CSV content for template download
 */
export function generateSampleCSV(useCommonAmount: boolean = false): string {
  if (useCommonAmount) {
    return `0x1234567890123456789012345678901234567890
0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
0x9876543210987654321098765432109876543210
0x1111111111111111111111111111111111111111
0x2222222222222222222222222222222222222222`;
  }
  
  return `0x1234567890123456789012345678901234567890,0.005
0xabcdefabcdefabcdefabcdefabcdefabcdefabcd,0.01
0x9876543210987654321098765432109876543210,0.002
0x1111111111111111111111111111111111111111,0.001
0x2222222222222222222222222222222222222222,0.003`;
}

/**
 * Downloads a sample CSV file
 */
export function downloadSampleCSV(useCommonAmount: boolean = false): void {
  const csvContent = generateSampleCSV(useCommonAmount);
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = useCommonAmount ? 'sample_addresses.csv' : 'sample_wallet_refuel.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  window.URL.revokeObjectURL(url);
}

/**
 * Formats an address for display (shows first 6 and last 4 characters)
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
