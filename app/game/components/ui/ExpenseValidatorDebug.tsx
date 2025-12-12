'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { validateExpenses, printValidationResults, type ExpenseValidationResult } from '@/lib/utils/expenseValidator';

/**
 * Debug component to validate expense calculations
 * Only visible in development mode
 * 
 * Press 'V' key to toggle, or click the button
 */
export function ExpenseValidatorDebug() {
  // 🔒 HOOKS FIRST — ALWAYS
  const [isVisible, setIsVisible] = useState(false);
  const [lastResult, setLastResult] = useState<ExpenseValidationResult | null>(null);
  const store = useGameStore();

  // Expose validation function to window for console access
  React.useEffect(() => {
    // @ts-expect-error - Adding to window for debugging
    window.validateExpenses = () => {
      const result = validateExpenses(store);
      printValidationResults(result);
      return result;
    };

    // @ts-expect-error Adding debug function to window
    window.getExpenseDetails = () => {
      return {
        currentMonth: {
          recurringExpenses: store.monthlyExpenses,
          oneTimeCostsTotal: store.monthlyOneTimeCosts,
          oneTimeCostsPaid: store.monthlyOneTimeCostsPaid,
          oneTimeCostsUnpaid: Math.max(0, store.monthlyOneTimeCosts - store.monthlyOneTimeCostsPaid),
        },
        lifetime: {
          totalRevenue: store.metrics.totalRevenue,
          totalExpenses: store.metrics.totalExpenses,
          profit: store.metrics.totalRevenue - store.metrics.totalExpenses,
        },
        history: {
          totalMonths: store.monthlyHistory.length,
          historyTotalExpenses: store.monthlyHistory.reduce((sum, e) => sum + e.expenses, 0),
          historyTotalRevenue: store.monthlyHistory.reduce((sum, e) => sum + e.revenue, 0),
        },
      };
    };

    return () => {
      // @ts-expect-error Removing debug function from window
      delete window.validateExpenses;
      // @ts-expect-error Removing debug function from window
      delete window.getExpenseDetails;
    };
  }, [store]);

  // Keyboard shortcut: Press 'V' to toggle (development mode only)
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.key === 'v' || e.key === 'V') && e.target === document.body) {
        setIsVisible(prev => !prev);
        if (!isVisible) {
          // Auto-validate when opening
          const result = validateExpenses(store);
          setLastResult(result);
          printValidationResults(result);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible, store]);

  // 🧱 GUARD AFTER HOOKS
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isVisible) {
    return null; // Hidden - only accessible via 'V' key
  }

  const result = lastResult || validateExpenses(store);
  if (!lastResult) {
    setLastResult(result);
    printValidationResults(result);
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black/90 backdrop-blur-sm border border-purple-500/50 rounded-lg p-4 text-xs max-w-md z-50 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="font-bold text-purple-300">Expense Validator 🔍</div>
        <button
          onClick={() => {
            setIsVisible(false);
          }}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 mb-3">
        <button
          onClick={() => {
            const newResult = validateExpenses(store);
            setLastResult(newResult);
            printValidationResults(newResult);
            // Force re-render
            setIsVisible(false);
            setTimeout(() => setIsVisible(true), 10);
          }}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded text-xs font-semibold"
        >
          🔄 Re-validate
        </button>
        <div className="text-gray-400 text-[10px]">
          Press 'V' to toggle • Check console for details
        </div>
      </div>

      {result.isValid ? (
        <div className="text-green-400 font-semibold mb-2">✅ All checks passed!</div>
      ) : (
        <div className="text-red-400 font-semibold mb-2">❌ Errors found!</div>
      )}

      {result.errors.length > 0 && (
        <div className="mb-3">
          <div className="text-red-400 font-semibold mb-1">Errors:</div>
          <div className="space-y-1">
            {result.errors.map((error, i) => (
              <div key={i} className="text-red-300 text-[10px] bg-red-900/20 p-1.5 rounded">
                {error}
              </div>
            ))}
          </div>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="mb-3">
          <div className="text-orange-400 font-semibold mb-1">Warnings:</div>
          <div className="space-y-1">
            {result.warnings.map((warning, i) => (
              <div key={i} className="text-orange-300 text-[10px] bg-orange-900/20 p-1.5 rounded">
                {warning}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 text-[10px]">
        <div>
          <div className="text-gray-400 mb-1">Current Month:</div>
          <div className="text-gray-300 ml-2">
            Recurring: ${result.details.currentMonth.recurringExpenses.toLocaleString()}<br />
            One-time: ${result.details.currentMonth.oneTimeCostsTotal.toLocaleString()}<br />
            &nbsp;&nbsp;Paid: ${result.details.currentMonth.oneTimeCostsPaid.toLocaleString()}<br />
            &nbsp;&nbsp;Unpaid: ${result.details.currentMonth.oneTimeCostsUnpaid.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-gray-400 mb-1">Lifetime:</div>
          <div className="text-gray-300 ml-2">
            Revenue: ${result.details.lifetime.totalRevenue.toLocaleString()}<br />
            Expenses: ${result.details.lifetime.totalExpenses.toLocaleString()}<br />
            Profit: ${result.details.lifetime.profit.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-gray-400 mb-1">History:</div>
          <div className="text-gray-300 ml-2">
            Months: {result.details.history.totalMonths}<br />
            Total Expenses: ${result.details.history.historyTotalExpenses.toLocaleString()}<br />
            Total Revenue: ${result.details.history.historyTotalRevenue.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

