"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  SUPPORTED_CHAINS,
  CHAIN_ARRAY,
  ChainKey,
  GAS_PRESETS,
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

interface RefuelTarget {
  chain: ChainKey;
  amount: string;
  enabled: boolean;
}

interface MultipleRefuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  balances: Record<ChainKey, bigint>;
  onRefuelMultiple: (
    sourceChain: ChainKey,
    targets: RefuelTarget[]
  ) => Promise<void>;
  onCSVBatchRefuel: (
    sourceChain: ChainKey,
    targetChain: ChainKey,
    recipients: Array<{ address: string; amount: string }>
  ) => Promise<void>;
}

export function MultipleRefuelModal({
  isOpen,
  onClose,
  balances,
  onRefuelMultiple,
  onCSVBatchRefuel,
}: MultipleRefuelModalProps) {
  const [activeTab, setActiveTab] = useState<"manual" | "csv">("manual");
  const [selectedSource, setSelectedSource] = useState<ChainKey>("sepolia");
  const [selectedTarget, setSelectedTarget] = useState<ChainKey>("baseSepolia");
  const [targets, setTargets] = useState<RefuelTarget[]>([]);
  const [isRefueling, setIsRefueling] = useState(false);
  const [mounted, setMounted] = useState(false);

  // CSV state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedCSV, setParsedCSV] = useState<ParsedCSV | null>(null);
  const [isParsingCSV, setIsParsingCSV] = useState(false);
  const [useCommonAmount, setUseCommonAmount] = useState(false);
  const [commonAmount, setCommonAmount] = useState("0.005");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize targets when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialTargets: RefuelTarget[] = CHAIN_ARRAY.filter(
        (chain) => chain.key !== selectedSource
      ).map((chain) => ({
        chain: chain.key,
        amount: "0.005",
        enabled: false,
      }));
      setTargets(initialTargets);

      // Reset CSV state when modal opens
      setCsvFile(null);
      setParsedCSV(null);
      setUseCommonAmount(false);
      setCommonAmount("0.005");
      setActiveTab("manual");
    }
  }, [isOpen, selectedSource]);

  // CSV handling functions
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Please select a CSV file");
      return;
    }

    setCsvFile(file);
    setIsParsingCSV(true);

    try {
      const options: CSVUploadOptions = {
        useCommonAmount,
        commonAmount,
      };
      const parsed = await parseCSV(file, options);
      setParsedCSV(parsed);
    } catch (error) {
      console.error("CSV parsing error:", error);
      alert("Failed to parse CSV file. Please check the format.");
      setCsvFile(null);
      setParsedCSV(null);
    } finally {
      setIsParsingCSV(false);
    }
  };

  const removeCSVRecipient = (index: number) => {
    if (!parsedCSV) return;

    const newRecipients = parsedCSV.recipients.filter((_, i) => i !== index);
    const validRecipients = newRecipients.filter((r) => r.isValid);
    const totalAmount = validRecipients.reduce(
      (sum, r) => sum + parseFloat(r.amount),
      0
    );

    setParsedCSV({
      recipients: newRecipients,
      totalAmount,
      validCount: validRecipients.length,
      invalidCount: newRecipients.length - validRecipients.length,
    });
  };

  const handleCSVRefuel = async () => {
    if (!parsedCSV || !onCSVBatchRefuel) return;

    const validRecipients = parsedCSV.recipients.filter((r) => r.isValid);
    if (validRecipients.length === 0) {
      alert("No valid recipients found");
      return;
    }

    setIsRefueling(true);
    try {
      await onCSVBatchRefuel(
        selectedSource,
        selectedTarget,
        validRecipients.map((r) => ({ address: r.address, amount: r.amount }))
      );
      onClose();
    } catch (err) {
      console.error("CSV refuel failed", err);
    } finally {
      setIsRefueling(false);
    }
  };

  // Handle body scroll when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  const updateTarget = (index: number, updates: Partial<RefuelTarget>) => {
    setTargets((prev) =>
      prev.map((target, i) =>
        i === index ? { ...target, ...updates } : target
      )
    );
  };

  const toggleTarget = (index: number) => {
    updateTarget(index, { enabled: !targets[index].enabled });
  };

  const setAllTargetsAmount = (amount: string) => {
    setTargets((prev) => prev.map((target) => ({ ...target, amount })));
  };

  const getTotalAmount = () => {
    return targets
      .filter((target) => target.enabled)
      .reduce((sum, target) => sum + parseFloat(target.amount || "0"), 0);
  };

  const getEnabledTargets = () => {
    return targets.filter((target) => target.enabled);
  };

  const handleDoRefuel = async () => {
    if (!onRefuelMultiple) return;

    const enabledTargets = getEnabledTargets();
    if (enabledTargets.length === 0) {
      alert("Please select at least one target chain");
      return;
    }

    const totalAmount = getTotalAmount();
    if (totalAmount <= 0) {
      alert("Please enter valid amounts for selected chains");
      return;
    }

    // Check if source has enough balance for all transfers
    const sourceBalance = balances[selectedSource];
    const requiredAmount = BigInt(Math.floor(totalAmount * 1e18));

    if (sourceBalance < requiredAmount) {
      alert(
        `Insufficient balance. You need ${totalAmount} ETH but only have ${formatBalance(
          sourceBalance
        )} ETH`
      );
      return;
    }

    setIsRefueling(true);
    try {
      await onRefuelMultiple(selectedSource, enabledTargets);
      onClose();
    } catch (err) {
      console.error("Multiple refuel failed", err);
    } finally {
      setIsRefueling(false);
    }
  };

  // Handle SSR
  if (!mounted || !isOpen) return null;

  const modalContent = (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content animate-fade-in">
        <div
          className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-700/50 rounded-3xl max-w-4xl w-full mx-4 p-8 shadow-2xl animate-slide-up backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <span className="text-2xl">⛽</span>
                Refuel Multiple Chains
              </h2>
              <p className="text-sm text-zinc-400">
                Transfer ETH from one chain to multiple chains simultaneously
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800/50 transition-all hover:scale-110"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("manual")}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                activeTab === "manual"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800/70 text-zinc-400 hover:text-white hover:bg-zinc-700/70"
              }`}
            >
              Manual Selection
            </button>
            <button
              onClick={() => setActiveTab("csv")}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                activeTab === "csv"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800/70 text-zinc-400 hover:text-white hover:bg-zinc-700/70"
              }`}
            >
              CSV Upload
            </button>
          </div>

          <div className="space-y-6">
            {/* Source Chain */}
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wide">
                From Chain
              </label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value as ChainKey)}
                className="w-full bg-zinc-800/70 border border-zinc-700/70 p-4 rounded-xl text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-zinc-800 cursor-pointer"
              >
                {CHAIN_ARRAY.map((chain) => (
                  <option key={chain.key} value={chain.key}>
                    {chain.icon} {chain.name} (
                    {formatBalance(balances[chain.key] || BigInt(0))} ETH)
                  </option>
                ))}
              </select>
            </div>

            {/* Target Chain (for CSV) */}
            {activeTab === "csv" && (
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wide">
                  To Chain
                </label>
                <select
                  value={selectedTarget}
                  onChange={(e) =>
                    setSelectedTarget(e.target.value as ChainKey)
                  }
                  className="w-full bg-zinc-800/70 border border-zinc-700/70 p-4 rounded-xl text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-zinc-800 cursor-pointer"
                >
                  {CHAIN_ARRAY.filter(
                    (chain) => chain.key !== selectedSource
                  ).map((chain) => (
                    <option key={chain.key} value={chain.key}>
                      {chain.icon} {chain.name} (
                      {formatBalance(balances[chain.key] || BigInt(0))} ETH)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Manual Tab Content */}
            {activeTab === "manual" && (
              <>
                {/* Quick Amount Buttons */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wide">
                    Quick Amounts (Applied to All)
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {GAS_PRESETS.slice(0, 4).map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => setAllTargetsAmount(preset.eth)}
                        className="bg-zinc-800/70 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-purple-600/30 text-white py-3 px-4 rounded-xl transition-all text-sm font-semibold border border-zinc-700/70 hover:border-blue-500/50 hover:scale-105"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Chains */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wide">
                    Target Chains
                  </label>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {targets.map((target, index) => {
                      const chain = CHAIN_ARRAY.find(
                        (c) => c.key === target.chain
                      );
                      if (!chain) return null;

                      return (
                        <div
                          key={target.chain}
                          className={`p-4 rounded-xl border transition-all ${
                            target.enabled
                              ? "bg-blue-900/20 border-blue-500/50"
                              : "bg-zinc-800/50 border-zinc-700/50"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => toggleTarget(index)}
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                                target.enabled
                                  ? "bg-blue-500 border-blue-500"
                                  : "border-zinc-600 hover:border-zinc-500"
                              }`}
                            >
                              {target.enabled && (
                                <span className="text-white text-sm">✓</span>
                              )}
                            </button>

                            <div className="flex-1 flex items-center gap-3">
                              <span className="text-2xl">{chain.icon}</span>
                              <div>
                                <div className="font-semibold text-white">
                                  {chain.name}
                                </div>
                                <div className="text-sm text-zinc-400">
                                  Balance:{" "}
                                  {formatBalance(
                                    balances[target.chain] || BigInt(0)
                                  )}{" "}
                                  ETH
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.0001"
                                min="0"
                                value={target.amount}
                                onChange={(e) =>
                                  updateTarget(index, {
                                    amount: e.target.value,
                                  })
                                }
                                disabled={!target.enabled}
                                className={`w-24 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                                  target.enabled
                                    ? "bg-zinc-700/70 border border-zinc-600 text-white focus:ring-2 focus:ring-blue-500"
                                    : "bg-zinc-800/30 border border-zinc-700/30 text-zinc-500 cursor-not-allowed"
                                }`}
                                placeholder="0.005"
                              />
                              <span className="text-sm text-zinc-400">ETH</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary */}
                {getEnabledTargets().length > 0 && (
                  <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-blue-300 font-semibold">
                          Total Transfer Summary
                        </div>
                        <div className="text-xs text-zinc-400">
                          {getEnabledTargets().length} chain
                          {getEnabledTargets().length !== 1 ? "s" : ""} selected
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">
                          {getTotalAmount().toFixed(4)} ETH
                        </div>
                        <div className="text-xs text-zinc-400">
                          From{" "}
                          {
                            CHAIN_ARRAY.find((c) => c.key === selectedSource)
                              ?.name
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* CSV Tab Content */}
            {activeTab === "csv" && (
              <>
                {/* Common Amount Option */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wide">
                    Amount Mode
                  </label>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setUseCommonAmount(false)}
                        className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                          !useCommonAmount
                            ? "bg-blue-600 text-white"
                            : "bg-zinc-800/70 text-zinc-400 hover:text-white hover:bg-zinc-700/70"
                        }`}
                      >
                        Individual Amounts
                      </button>
                      <button
                        onClick={() => setUseCommonAmount(true)}
                        className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                          useCommonAmount
                            ? "bg-blue-600 text-white"
                            : "bg-zinc-800/70 text-zinc-400 hover:text-white hover:bg-zinc-700/70"
                        }`}
                      >
                        Common Amount
                      </button>
                    </div>
                    
                    {useCommonAmount && (
                      <div>
                        <label className="block text-sm font-semibold text-zinc-300 mb-2 uppercase tracking-wide">
                          Common Amount (ETH)
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          min="0"
                          value={commonAmount}
                          onChange={(e) => setCommonAmount(e.target.value)}
                          className="w-full bg-zinc-800/70 border border-zinc-700/70 p-3 rounded-xl text-white/90 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-zinc-800 text-lg font-semibold"
                          placeholder="0.005"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* CSV Upload Section */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wide">
                    Upload CSV File
                  </label>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label
                        htmlFor="csv-upload"
                        className="flex-1 bg-zinc-800/70 border border-zinc-700/70 p-4 rounded-xl text-white/90 hover:bg-zinc-800 cursor-pointer transition-all text-center"
                      >
                        {isParsingCSV
                          ? "Parsing..."
                          : csvFile
                          ? csvFile.name
                          : "Choose CSV File"}
                      </label>
                      <button
                        onClick={() => downloadSampleCSV(useCommonAmount)}
                        className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl transition-all border border-blue-500/30 hover:border-blue-400/50"
                      >
                        📄 Sample
                      </button>
                    </div>

                    <div className="text-xs text-zinc-500">
                      {useCommonAmount ? (
                        <>
                          Format: address (one per line)
                          <br />
                          Example: 0x1234...
                          <br />
                          <span className="text-blue-400">All wallets will receive {commonAmount} ETH</span>
                        </>
                      ) : (
                        <>
                          Format: address,amount (one per line)
                          <br />
                          Example: 0x1234...,0.005
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* CSV Preview */}
                {parsedCSV && (
                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wide">
                      CSV Preview ({parsedCSV.validCount} valid,{" "}
                      {parsedCSV.invalidCount} invalid)
                    </label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {parsedCSV.recipients.map((recipient, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border flex items-center justify-between ${
                            recipient.isValid
                              ? "bg-green-900/20 border-green-500/30"
                              : "bg-red-900/20 border-red-500/30"
                          }`}
                        >
                          <div className="flex-1">
                            <div className="font-mono text-sm">
                              {formatAddress(recipient.address)}
                            </div>
                            <div className="text-xs text-zinc-400">
                              {recipient.amount} ETH
                              {recipient.error && (
                                <span className="text-red-400 ml-2">
                                  - {recipient.error}
                                </span>
                              )}
                            </div>
                          </div>
                          {!recipient.isValid && (
                            <button
                              onClick={() => removeCSVRecipient(index)}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CSV Summary */}
                {parsedCSV && parsedCSV.validCount > 0 && (
                  <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-green-300 font-semibold">
                          CSV Transfer Summary
                        </div>
                        <div className="text-xs text-zinc-400">
                          {parsedCSV.validCount} wallet
                          {parsedCSV.validCount !== 1 ? "s" : ""} ready
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">
                          {parsedCSV.totalAmount.toFixed(4)} ETH
                        </div>
                        <div className="text-xs text-zinc-400">
                          To{" "}
                          {
                            CHAIN_ARRAY.find((c) => c.key === selectedTarget)
                              ?.name
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {activeTab === "manual" ? (
                <button
                  onClick={handleDoRefuel}
                  disabled={
                    isRefueling ||
                    getEnabledTargets().length === 0 ||
                    getTotalAmount() <= 0
                  }
                  className="flex-1 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 hover:from-blue-500 hover:via-blue-600 hover:to-purple-600 text-white py-4 px-6 rounded-xl transition-all font-bold shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                >
                  {isRefueling
                    ? "⏳ Refueling..."
                    : `🚀 Refuel ${getEnabledTargets().length} Chain${
                        getEnabledTargets().length !== 1 ? "s" : ""
                      }`}
                </button>
              ) : (
                <button
                  onClick={handleCSVRefuel}
                  disabled={
                    isRefueling || !parsedCSV || parsedCSV.validCount === 0
                  }
                  className="flex-1 bg-gradient-to-r from-green-600 via-green-700 to-blue-700 hover:from-green-500 hover:via-green-600 hover:to-blue-600 text-white py-4 px-6 rounded-xl transition-all font-bold shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                >
                  {isRefueling
                    ? "⏳ Refueling..."
                    : `🚀 Refuel ${parsedCSV?.validCount || 0} Wallet${
                        (parsedCSV?.validCount || 0) !== 1 ? "s" : ""
                      }`}
                </button>
              )}

              <button
                onClick={onClose}
                className="px-8 bg-zinc-800/70 hover:bg-zinc-700/70 text-white py-4 rounded-xl transition-all font-semibold border border-zinc-700/70 hover:border-zinc-600/70 hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
