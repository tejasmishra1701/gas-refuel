"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  SUPPORTED_CHAINS,
  CHAIN_ARRAY,
  ChainKey,
} from "@/lib/chains";
import { formatBalance } from "@/lib/utils";
import {
  parseCSV,
  downloadSampleCSV,
  formatAddress,
  type ParsedCSV,
  type CSVRecipient,
  type CSVUploadOptions,
} from "@/lib/csvParser";

interface CSVBatchRefuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  balances: Record<ChainKey, bigint>;
  onCSVBatchRefuel: (recipients: CSVRecipient[]) => Promise<void>;
}

export function CSVBatchRefuelModal({
  isOpen,
  onClose,
  balances,
  onCSVBatchRefuel,
}: CSVBatchRefuelModalProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCSV | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadOptions, setUploadOptions] = useState<CSVUploadOptions>({
    hasHeader: true,
    delimiter: ",",
    addressColumn: 0,
    amountColumn: 1,
    chainColumn: 2,
  });

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setError(null);

    try {
      const text = await file.text();
      const parsed = parseCSV(text, uploadOptions);
      setParsedData(parsed);
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
      await onCSVBatchRefuel(parsedData.recipients);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Batch refuel failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const getTotalAmount = () => {
    if (!parsedData) return "0";
    return parsedData.recipients.reduce((sum, recipient) => {
      return sum + parseFloat(recipient.amount || "0");
    }, 0).toFixed(4);
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

            {/* CSV Options */}
            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                CSV Format Options
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">
                    Address Column
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={uploadOptions.addressColumn}
                    onChange={(e) => setUploadOptions({
                      ...uploadOptions,
                      addressColumn: parseInt(e.target.value)
                    })}
                    className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">
                    Amount Column
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={uploadOptions.amountColumn}
                    onChange={(e) => setUploadOptions({
                      ...uploadOptions,
                      amountColumn: parseInt(e.target.value)
                    })}
                    className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">
                    Chain Column
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={uploadOptions.chainColumn}
                    onChange={(e) => setUploadOptions({
                      ...uploadOptions,
                      chainColumn: parseInt(e.target.value)
                    })}
                    className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">
                    Delimiter
                  </label>
                  <select
                    value={uploadOptions.delimiter}
                    onChange={(e) => setUploadOptions({
                      ...uploadOptions,
                      delimiter: e.target.value
                    })}
                    className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  >
                    <option value=",">Comma (,)</option>
                    <option value=";">Semicolon (;)</option>
                    <option value="\t">Tab</option>
                  </select>
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
                      <div className="text-white font-semibold">{getTotalRecipients()}</div>
                    </div>
                    <div className="bg-zinc-700/50 rounded-lg p-3">
                      <div className="text-zinc-400">Total Amount</div>
                      <div className="text-white font-semibold">{getTotalAmount()} ETH</div>
                    </div>
                    <div className="bg-zinc-700/50 rounded-lg p-3">
                      <div className="text-zinc-400">Estimated Cost</div>
                      <div className="text-white font-semibold">${(parseFloat(getTotalAmount()) * 2000).toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-700">
                          <th className="text-left p-2 text-zinc-300">Address</th>
                          <th className="text-left p-2 text-zinc-300">Amount</th>
                          <th className="text-left p-2 text-zinc-300">Chain</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.recipients.slice(0, 10).map((recipient, index) => (
                          <tr key={index} className="border-b border-zinc-800">
                            <td className="p-2 text-zinc-400 font-mono text-xs">
                              {formatAddress(recipient.address)}
                            </td>
                            <td className="p-2 text-white">{recipient.amount} ETH</td>
                            <td className="p-2 text-zinc-400">
                              {SUPPORTED_CHAINS[recipient.chain as ChainKey]?.name || recipient.chain}
                            </td>
                          </tr>
                        ))}
                        {parsedData.recipients.length > 10 && (
                          <tr>
                            <td colSpan={3} className="p-2 text-center text-zinc-500">
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
                {isProcessing ? "Processing..." : `🚀 Batch Refuel ${getTotalRecipients()} Recipients`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
