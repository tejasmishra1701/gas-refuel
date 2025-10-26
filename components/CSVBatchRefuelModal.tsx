"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SUPPORTED_CHAINS, CHAIN_ARRAY, ChainKey } from "@/lib/chains";
import { formatBalance } from "@/lib/utils";
import { ChainIcon } from "./ChainIcon";
import {
  downloadSampleCSV,
  formatAddress,
  validateAddress,
  validateAmount,
  type ParsedCSV,
  type CSVRecipient,
} from "@/lib/csvParser";

interface CSVBatchRefuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  balances: Record<ChainKey, bigint>;
  onCSVBatchRefuel: (
    sourceChain: ChainKey,
    targetChain: ChainKey,
    recipients: CSVRecipient[]
  ) => Promise<void>;
}

export function CSVBatchRefuelModal({
  isOpen,
  onClose,
  balances,
  onCSVBatchRefuel,
}: CSVBatchRefuelModalProps) {
  const [parsedData, setParsedData] = useState<ParsedCSV | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceChain, setSourceChain] = useState<ChainKey>("sepolia");
  const [targetChain, setTargetChain] = useState<ChainKey>("baseSepolia");
  const [csvFormat, setCsvFormat] = useState<
    "addresses-only" | "addresses-amounts"
  >("addresses-amounts");
  const [commonAmount, setCommonAmount] = useState("0.005");

  // CSV parsing options
  const delimiter = ",";
  const addressColumn = 0;
  const amountColumn = 1;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      const text = await file.text();

      // Parse CSV based on format selection
      if (csvFormat === "addresses-only") {
        // Parse addresses only and use common amount
        const lines = text.split("\n").filter((line) => line.trim());
        const recipients: CSVRecipient[] = lines.map((line) => {
          const address = line.trim();
          return {
            address,
            amount: commonAmount,
            isValid: validateAddress(address),
            error: validateAddress(address)
              ? undefined
              : "Invalid address format",
          };
        });

        const parsed: ParsedCSV = {
          recipients,
          totalAmount: recipients.reduce(
            (sum, r) => sum + parseFloat(r.amount),
            0
          ),
          validCount: recipients.filter((r) => r.isValid).length,
          invalidCount: recipients.filter((r) => !r.isValid).length,
        };
        setParsedData(parsed);
      } else {
        // Parse addresses and amounts using the existing parser
        const lines = text
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        const recipients: CSVRecipient[] = [];
        let totalAmount = 0;
        let validCount = 0;
        let invalidCount = 0;

        lines.forEach((line) => {
          const parts = line.split(delimiter).map((part) => part.trim());

          if (parts.length >= 2) {
            const address = parts[addressColumn] || "";
            const amount = parts[amountColumn] || "";

            const isValidAddress = validateAddress(address);
            const isValidAmount = validateAmount(amount);

            recipients.push({
              address,
              amount,
              isValid: isValidAddress && isValidAmount,
              error: !isValidAddress
                ? "Invalid address"
                : !isValidAmount
                ? "Invalid amount"
                : undefined,
            });

            if (isValidAddress && isValidAmount) {
              totalAmount += parseFloat(amount);
              validCount++;
            } else {
              invalidCount++;
            }
          } else {
            recipients.push({
              address: parts[0] || "",
              amount: "",
              isValid: false,
              error: "Insufficient columns",
            });
            invalidCount++;
          }
        });

        const parsed: ParsedCSV = {
          recipients,
          totalAmount,
          validCount,
          invalidCount,
        };
        setParsedData(parsed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV file");
      setParsedData(null);
    }
  };

  const handleDownloadSample = () => {
    downloadSampleCSV();
  };

  const handleBatchRefuel = async () => {
    if (!parsedData) return;

    setIsProcessing(true);
    setError(null);

    try {
      await onCSVBatchRefuel(sourceChain, targetChain, parsedData.recipients);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Batch refuel failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const getTotalAmount = () => {
    if (!parsedData) return "0";
    return parsedData.recipients
      .reduce((sum, recipient) => {
        return sum + parseFloat(recipient.amount || "0");
      }, 0)
      .toFixed(4);
  };

  const getTotalRecipients = () => {
    return parsedData?.recipients.length || 0;
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="bg-gradient-to-br from-zinc-900/95 to-zinc-950/95 backdrop-blur-xl border border-zinc-700/50 rounded-3xl p-8 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-2xl">📋</span>
              CSV Batch Import
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Chain Selection */}
            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Chain Selection
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">
                    Source Chain
                  </label>
                  <div className="flex items-center gap-3 mb-2">
                    <ChainIcon chainKey={sourceChain} size={20} />
                    <span className="text-sm text-zinc-400">
                      {SUPPORTED_CHAINS[sourceChain].name}
                    </span>
                  </div>
                  <select
                    value={sourceChain}
                    onChange={(e) => setSourceChain(e.target.value as ChainKey)}
                    className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  >
                    {CHAIN_ARRAY.map((chain) => (
                      <option key={chain.key} value={chain.key}>
                        {chain.name} ({formatBalance(balances[chain.key])} ETH)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">
                    Target Chain
                  </label>
                  <div className="flex items-center gap-3 mb-2">
                    <ChainIcon chainKey={targetChain} size={20} />
                    <span className="text-sm text-zinc-400">
                      {SUPPORTED_CHAINS[targetChain].name}
                    </span>
                  </div>
                  <select
                    value={targetChain}
                    onChange={(e) => setTargetChain(e.target.value as ChainKey)}
                    className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  >
                    {CHAIN_ARRAY.filter((c) => c.key !== sourceChain).map(
                      (chain) => (
                        <option key={chain.key} value={chain.key}>
                          {chain.name} ({formatBalance(balances[chain.key])}{" "}
                          ETH)
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* CSV Format Selection */}
            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                CSV Format
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-3 p-4 bg-zinc-700/30 rounded-xl border border-zinc-600/30 cursor-pointer hover:bg-zinc-700/50 transition-all">
                      <input
                        type="radio"
                        name="csvFormat"
                        value="addresses-amounts"
                        checked={csvFormat === "addresses-amounts"}
                        onChange={(e) =>
                          setCsvFormat(e.target.value as "addresses-amounts")
                        }
                        className="w-4 h-4 text-purple-600 bg-zinc-800 border-zinc-600 focus:ring-purple-500 focus:ring-2"
                      />
                      <div>
                        <div className="text-white font-semibold">
                          Addresses + Amounts
                        </div>
                        <div className="text-zinc-400 text-sm">
                          CSV contains both addresses and amounts
                        </div>
                      </div>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center gap-3 p-4 bg-zinc-700/30 rounded-xl border border-zinc-600/30 cursor-pointer hover:bg-zinc-700/50 transition-all">
                      <input
                        type="radio"
                        name="csvFormat"
                        value="addresses-only"
                        checked={csvFormat === "addresses-only"}
                        onChange={(e) =>
                          setCsvFormat(e.target.value as "addresses-only")
                        }
                        className="w-4 h-4 text-purple-600 bg-zinc-800 border-zinc-600 focus:ring-purple-500 focus:ring-2"
                      />
                      <div>
                        <div className="text-white font-semibold">
                          Addresses Only
                        </div>
                        <div className="text-zinc-400 text-sm">
                          CSV with only addresses, use common amount
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {csvFormat === "addresses-only" && (
                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">
                      Common Amount (ETH)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={commonAmount}
                      onChange={(e) => setCommonAmount(e.target.value)}
                      className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="0.005"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* File Upload Section */}
            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Upload CSV File
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">
                    CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleDownloadSample}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2 rounded-lg transition-all font-semibold"
                  >
                    📥 Download Sample CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            {parsedData && (
              <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Preview ({getTotalRecipients()} recipients)
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-zinc-700/50 rounded-lg p-3">
                      <div className="text-zinc-400">Total Recipients</div>
                      <div className="text-white font-semibold">
                        {getTotalRecipients()}
                      </div>
                    </div>
                    <div className="bg-zinc-700/50 rounded-lg p-3">
                      <div className="text-zinc-400">Total Amount</div>
                      <div className="text-white font-semibold">
                        {getTotalAmount()} ETH
                      </div>
                    </div>
                    <div className="bg-zinc-700/50 rounded-lg p-3">
                      <div className="text-zinc-400">Estimated Cost</div>
                      <div className="text-white font-semibold">
                        ${(parseFloat(getTotalAmount()) * 2000).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-700">
                          <th className="text-left p-2 text-zinc-300">
                            Address
                          </th>
                          <th className="text-left p-2 text-zinc-300">
                            Amount
                          </th>
                          <th className="text-left p-2 text-zinc-300">Chain</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.recipients
                          .slice(0, 10)
                          .map((recipient, index) => (
                            <tr
                              key={index}
                              className="border-b border-zinc-800"
                            >
                              <td className="p-2 text-zinc-400 font-mono text-xs">
                                {formatAddress(recipient.address)}
                              </td>
                              <td className="p-2 text-white">
                                {recipient.amount} ETH
                              </td>
                              <td className="p-2 text-zinc-400">
                                {SUPPORTED_CHAINS[targetChain]?.name ||
                                  targetChain}
                              </td>
                            </tr>
                          ))}
                        {parsedData.recipients.length > 10 && (
                          <tr>
                            <td
                              colSpan={3}
                              className="p-2 text-center text-zinc-500"
                            >
                              ... and {parsedData.recipients.length - 10} more
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4">
                <div className="text-red-300 text-sm">{error}</div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchRefuel}
                disabled={!parsedData || isProcessing}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing
                  ? "Processing..."
                  : `🚀 Batch Refuel ${getTotalRecipients()} Recipients`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
