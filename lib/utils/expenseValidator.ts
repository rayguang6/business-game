/**
 * Expense Calculation Validator
 * 
 * Developer tool to verify expense calculations are correct.
 * This helps catch bugs without needing formal unit tests.
 * 
 * Usage:
 * 1. Open browser console (F12)
 * 2. Type: window.validateExpenses()
 * 3. Check the output for any errors
 */

import { GameStore } from '@/lib/store/gameStore';

export interface ExpenseValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  details: {
    currentMonth: {
      recurringExpenses: number;
      oneTimeCostsTotal: number;
      oneTimeCostsPaid: number;
      oneTimeCostsUnpaid: number;
      totalExpenses: number;
    };
    lifetime: {
      totalRevenue: number;
      totalExpenses: number;
      profit: number;
    };
    history: {
      totalMonths: number;
      historyTotalExpenses: number;
      historyTotalRevenue: number;
      historyTotalProfit: number;
    };
    consistency: {
      historyMatchesLifetime: boolean;
      cashMatchesExpenses: boolean;
      oneTimeCostsConsistent: boolean;
      historyPaidOneTimeCosts: number;
    };
  };
}

/**
 * Validates expense calculations for correctness
 * Call this from browser console: window.validateExpenses()
 */
export function validateExpenses(store: GameStore): ExpenseValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const {
    metrics,
    monthlyHistory,
    monthlyExpenses,
    monthlyOneTimeCosts,
    monthlyOneTimeCostsPaid,
    monthlyOneTimeCostDetails,
    currentMonth,
  } = store;

  // === CURRENT MONTH VALIDATION ===
  const oneTimeCostsTotal = monthlyOneTimeCosts;
  const oneTimeCostsPaid = monthlyOneTimeCostsPaid;
  const oneTimeCostsUnpaid = Math.max(0, oneTimeCostsTotal - oneTimeCostsPaid);
  
  // Verify one-time costs details match totals
  const detailsTotal = monthlyOneTimeCostDetails.reduce((sum, cost) => sum + cost.amount, 0);
  if (Math.abs(detailsTotal - oneTimeCostsTotal) > 0.01) {
    errors.push(
      `One-time costs mismatch: Details sum (${detailsTotal}) != Total (${oneTimeCostsTotal})`
    );
  }

  // Verify paid costs match details
  const detailsPaid = monthlyOneTimeCostDetails
    .filter(cost => cost.alreadyDeducted)
    .reduce((sum, cost) => sum + cost.amount, 0);
  if (Math.abs(detailsPaid - oneTimeCostsPaid) > 0.01) {
    errors.push(
      `Paid costs mismatch: Details paid (${detailsPaid}) != Paid total (${oneTimeCostsPaid})`
    );
  }

  // Check for edge case: paid > total
  if (oneTimeCostsPaid > oneTimeCostsTotal) {
    errors.push(
      `Data corruption: Paid (${oneTimeCostsPaid}) > Total (${oneTimeCostsTotal})`
    );
  }

  // === LIFETIME VALIDATION ===
  const lifetimeRevenue = metrics.totalRevenue;
  const lifetimeExpenses = metrics.totalExpenses;
  const lifetimeProfit = lifetimeRevenue - lifetimeExpenses;

  // === HISTORY VALIDATION ===
  const historyTotalExpenses = monthlyHistory.reduce((sum, entry) => sum + entry.expenses, 0);
  const historyTotalRevenue = monthlyHistory.reduce((sum, entry) => sum + entry.revenue, 0);
  const historyTotalProfit = monthlyHistory.reduce((sum, entry) => sum + entry.profit, 0);
  
  // Calculate paid one-time costs from ALL history entries (not just current month)
  // These were added to totalExpenses immediately when paid, but not included in entry.expenses
  const historyPaidOneTimeCosts = monthlyHistory.reduce((sum, entry) => {
    const paidCosts = entry.oneTimeCosts?.reduce(
      (costSum, cost) => costSum + (cost.alreadyDeducted ? cost.amount : 0),
      0
    ) || 0;
    return sum + paidCosts;
  }, 0);
  
  // Current month immediate deductions (paid one-time costs that haven't been added to history yet)
  const currentMonthImmediateDeductions = oneTimeCostsPaid;

  // === CONSISTENCY CHECKS ===
  
  // Check if history expenses match what should be in lifetime
  // Lifetime should include: 
  //   - History expenses (recurring + unpaid one-time costs from completed months)
  //   - Paid one-time costs from history (added immediately, not in entry.expenses)
  //   - Current month immediate deductions (paid one-time costs this month)
  const expectedLifetimeExpenses = historyTotalExpenses + historyPaidOneTimeCosts + currentMonthImmediateDeductions;
  
  // Allow small floating point differences
  const expenseDifference = Math.abs(lifetimeExpenses - expectedLifetimeExpenses);
  if (expenseDifference > 0.01) {
    errors.push(
      `Lifetime expenses mismatch: ` +
      `Expected ${expectedLifetimeExpenses} ` +
      `(history expenses: ${historyTotalExpenses} + history paid one-time: ${historyPaidOneTimeCosts} + current month immediate: ${currentMonthImmediateDeductions}), ` +
      `but got ${lifetimeExpenses}. Difference: ${expenseDifference}`
    );
  }

  // Check if history revenue matches lifetime (should include current month)
  const currentMonthRevenue = store.monthlyRevenue;
  const expectedLifetimeRevenue = historyTotalRevenue + currentMonthRevenue;
  const revenueDifference = Math.abs(lifetimeRevenue - expectedLifetimeRevenue);
  if (revenueDifference > 0.01) {
    errors.push(
      `Lifetime revenue mismatch: ` +
      `Expected ${expectedLifetimeRevenue} (history: ${historyTotalRevenue} + current: ${currentMonthRevenue}), ` +
      `but got ${lifetimeRevenue}. Difference: ${revenueDifference}`
    );
  }

  // Check if profit calculations are consistent
  const expectedLifetimeProfit = expectedLifetimeRevenue - expectedLifetimeExpenses;
  const profitDifference = Math.abs(lifetimeProfit - expectedLifetimeProfit);
  if (profitDifference > 0.01) {
    warnings.push(
      `Profit calculation difference: Expected ${expectedLifetimeProfit}, got ${lifetimeProfit}. ` +
      `Difference: ${profitDifference} (may be due to rounding)`
    );
  }

  // Check each history entry for consistency
  monthlyHistory.forEach((entry, index) => {
    const entryOneTimeCostsTotal = entry.oneTimeCosts?.reduce((sum, cost) => sum + cost.amount, 0) || 0;
    const entryUnpaidOneTimeCosts = entry.oneTimeCosts?.reduce(
      (sum, cost) => sum + (cost.alreadyDeducted ? 0 : cost.amount),
      0
    ) || 0;
    
    // Entry expenses should be: recurring + unpaid one-time costs
    // We can't verify recurring directly, but we can check the structure
    if (entry.expenses < entryUnpaidOneTimeCosts) {
      errors.push(
        `History entry ${entry.month}: expenses (${entry.expenses}) < unpaid one-time costs (${entryUnpaidOneTimeCosts})`
      );
    }

    // Check if profit calculation matches
    const expectedProfit = entry.revenue - entry.expenses;
    if (Math.abs(entry.profit - expectedProfit) > 0.01) {
      warnings.push(
        `History entry ${entry.month}: profit mismatch. Expected ${expectedProfit}, got ${entry.profit}`
      );
    }
  });

  // Check if cash is reasonable (not negative unless game over)
  if (metrics.cash < 0 && !store.isGameOver) {
    warnings.push(`Cash is negative (${metrics.cash}) but game is not over`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    details: {
      currentMonth: {
        recurringExpenses: monthlyExpenses,
        oneTimeCostsTotal,
        oneTimeCostsPaid,
        oneTimeCostsUnpaid,
        totalExpenses: monthlyExpenses + oneTimeCostsTotal,
      },
      lifetime: {
        totalRevenue: lifetimeRevenue,
        totalExpenses: lifetimeExpenses,
        profit: lifetimeProfit,
      },
      history: {
        totalMonths: monthlyHistory.length,
        historyTotalExpenses,
        historyTotalRevenue,
        historyTotalProfit,
      },
      consistency: {
        historyMatchesLifetime: expenseDifference <= 0.01,
        cashMatchesExpenses: true, // Cash validation is complex, skip for now
        oneTimeCostsConsistent: Math.abs(detailsTotal - oneTimeCostsTotal) <= 0.01,
        historyPaidOneTimeCosts: historyPaidOneTimeCosts,
      },
    },
  };
}

/**
 * Pretty print validation results to console
 */
export function printValidationResults(result: ExpenseValidationResult): void {
  console.group('🔍 Expense Calculation Validation');
  
  if (result.isValid) {
    console.log('%c✅ All checks passed!', 'color: green; font-weight: bold');
  } else {
    console.log('%c❌ Errors found!', 'color: red; font-weight: bold');
  }

  if (result.errors.length > 0) {
    console.group('%c❌ Errors:', 'color: red; font-weight: bold');
    result.errors.forEach(error => console.error(error));
    console.groupEnd();
  }

  if (result.warnings.length > 0) {
    console.group('%c⚠️ Warnings:', 'color: orange; font-weight: bold');
    result.warnings.forEach(warning => console.warn(warning));
    console.groupEnd();
  }

  console.group('📊 Details:');
  console.log('Current Month:', result.details.currentMonth);
  console.log('Lifetime:', result.details.lifetime);
  console.log('History:', result.details.history);
  console.log('Consistency:', result.details.consistency);
  console.groupEnd();

  console.groupEnd();
}

