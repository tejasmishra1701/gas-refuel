import { useState, useEffect, useCallback } from "react";
import { Transaction } from "@/components/TransactionHistory";
import { ChainKey } from "@/lib/chains";

const STORAGE_KEY = "gas-refuel-transactions";

export function useTransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load transactions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setTransactions(parsed);
      }
      // Start with empty transaction history - transactions will appear as users interact
    } catch (error) {
      console.error("Failed to load transaction history:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
      } catch (error) {
        console.error("Failed to save transaction history:", error);
      }
    }
  }, [transactions, isLoading]);

  const addTransaction = useCallback(
    (transaction: Omit<Transaction, "id" | "timestamp">) => {
      const newTransaction: Transaction = {
        ...transaction,
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };

      setTransactions((prev) => [newTransaction, ...prev]);
      return newTransaction;
    },
    []
  );

  const updateTransaction = useCallback(
    (id: string, updates: Partial<Transaction>) => {
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx))
      );
    },
    []
  );

  const clearHistory = useCallback(() => {
    setTransactions([]);
  }, []);

  const getTransactionById = useCallback(
    (id: string) => {
      return transactions.find((tx) => tx.id === id);
    },
    [transactions]
  );

  const getTransactionsByChain = useCallback(
    (chainKey: string) => {
      return transactions.filter(
        (tx) => tx.fromChain === chainKey || tx.toChain === chainKey
      );
    },
    [transactions]
  );

  const getRecentTransactions = useCallback(
    (limit: number = 5) => {
      return transactions.slice(0, limit);
    },
    [transactions]
  );

  return {
    transactions,
    isLoading,
    addTransaction,
    updateTransaction,
    clearHistory,
    getTransactionById,
    getTransactionsByChain,
    getRecentTransactions,
  };
}
