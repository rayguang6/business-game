'use client';

import React, { useState } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { RevenueCategory, type RevenueEntry, type OneTimeCost, REVENUE_CATEGORY_LABELS } from '@/lib/store/types';
import { useGameStore } from '@/lib/store/gameStore';
import { Card } from '@/app/components/ui/Card';
import { SectionHeading } from '@/app/components/ui/SectionHeading';
import {
  getOneTimeCostIcon,
  getExpenseBreakdownIcon,
  getRevenueIcon,
  getIconForSourceType,
} from '@/lib/config/categoryConfig';
import { getRevenueDisplayLabel, getExpenseDisplayLabel } from '@/lib/utils/financialTracking';
import { SourceType } from '@/lib/config/sourceTypes';

export function HomeTab() {
  const {
    metrics,
    monthlyHistory,
    totalProfit,
    monthlyExpenses,
    monthlyExpenseBreakdown,
    monthlyRevenue,
    monthlyRevenueBreakdown,
    monthlyOneTimeCosts,
  } = useFinanceData();

  // Get real-time revenue and expense details
  const monthlyRevenueDetails = useGameStore((state) => state.monthlyRevenueDetails || []);
  const monthlyOneTimeCostDetails = useGameStore((state) => state.monthlyOneTimeCostDetails || []);
  const monthlyOneTimeCostsPaid = useGameStore((state) => state.monthlyOneTimeCostsPaid || 0);
  const currentMonth = useGameStore((state) => state.currentMonth);

  // Collapsible state for current month sections (auto-expanded by default)
  const [isRevenueExpanded, setIsRevenueExpanded] = useState(true);
  const [isOperatingExpensesExpanded, setIsOperatingExpensesExpanded] = useState(true);
  const [isOneTimeExpensesExpanded, setIsOneTimeExpensesExpanded] = useState(true);
  const [isMonthlyCostsExpanded, setIsMonthlyCostsExpanded] = useState(false);
  const [isMonthlyExpensesExpanded, setIsMonthlyExpensesExpanded] = useState(false);
  
  // Collapsible state for monthly history (per month)
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set());
  
  const toggleMonthExpansion = (month: number) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(month)) {
        newSet.delete(month);
      } else {
        newSet.add(month);
      }
      return newSet;
    });
  };
  
  const isMonthExpanded = (month: number) => expandedMonths.has(month);

  // Calculate current month projected totals (not yet deducted)
  // monthlyExpenses = recurring monthly expenses (base + upgrades + staff)
  // monthlyOneTimeCosts = total of all one-time purchases/expenses
  const currentMonthTotalExpenses = monthlyExpenses + monthlyOneTimeCosts;

  // Operating expenses breakdown (only recurring expenses - base, staff, upgrades)
  const operatingExpenses = monthlyExpenseBreakdown;
  
  // Separate one-time costs by category for better display
  const oneTimeCostsByCategory = {
    upgrade: monthlyOneTimeCostDetails.filter((c) => c.category === 'upgrade'),
    event: monthlyOneTimeCostDetails.filter((c) => c.category === 'event'),
    marketing: monthlyOneTimeCostDetails.filter((c) => c.category === 'marketing'),
    staff: monthlyOneTimeCostDetails.filter((c) => c.category === 'staff'),
  };

  // Calculate lifetime totals: Only use metrics (actual deducted amounts)
  // metrics.totalRevenue = all revenue that's been added to cash (completed months + current month)
  // metrics.totalExpenses = all expenses that have been deducted from cash
  //   - Completed months: all expenses (recurring + one-time costs)
  //   - Current month: one-time costs with deductNow=true (deducted immediately)
  //   - Current month recurring expenses: will be added at month end
  const lifetimeRevenue = metrics.totalRevenue; // Already includes current month revenue (added immediately)
  const lifetimeExpenses = metrics.totalExpenses; // Includes completed months + current month immediate deductions
  const lifetimeProfit = lifetimeRevenue - lifetimeExpenses;
  
  // Current month projected totals (for display purposes only)
  const currentMonthProjectedExpenses = monthlyExpenses + monthlyOneTimeCosts;
  const currentMonthProjectedProfit = monthlyRevenue - currentMonthProjectedExpenses;

  return (
    <div className="space-y-4">
      {/* Lifetime Totals - Moved to Top */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="flex flex-col">
            <div className="text-xs text-secondary mb-2 flex items-center gap-2">
              <span style={{ color: 'var(--game-primary)' }}>💰</span>
              <span>Total Revenue</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--success)' }}>
              ${lifetimeRevenue.toLocaleString()}
            </div>
            {monthlyHistory.length > 0 && (
              <div className="text-xs text-tertiary mt-1">
                {monthlyHistory.length} completed {monthlyHistory.length === 1 ? 'month' : 'months'}
                {monthlyRevenue > 0 && (
                  <span className="ml-1">+ ${monthlyRevenue.toLocaleString()} this month</span>
                )}
              </div>
            )}
          </div>
        </Card>
        
        <Card>
          <div className="flex flex-col">
            <div className="text-xs text-secondary mb-2 flex items-center gap-2">
              <span style={{ color: 'var(--game-primary)' }}>💸</span>
              <span>Total Expenses</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--error)' }}>
              ${lifetimeExpenses.toLocaleString()}
            </div>
            {monthlyHistory.length > 0 && (
              <div className="text-xs text-tertiary mt-1">
                Avg: ${Math.round(lifetimeExpenses / monthlyHistory.length).toLocaleString()}/mo
                {currentMonthProjectedExpenses > 0 && (
                  <span className="ml-1 opacity-75">
                    (+ ${currentMonthProjectedExpenses.toLocaleString()} projected)
                  </span>
                )}
              </div>
            )}
          </div>
        </Card>
        
        <Card>
          <div className="flex flex-col">
            <div className="text-xs text-secondary mb-2 flex items-center gap-2">
              <span style={{ color: 'var(--game-primary)' }}>📊</span>
              <span>Total Profit</span>
            </div>
            <div className={`text-2xl font-bold ${lifetimeProfit >= 0 ? '' : ''}`} style={{ color: lifetimeProfit >= 0 ? 'var(--success)' : 'var(--error)' }}>
              ${lifetimeProfit.toLocaleString()}
            </div>
            {lifetimeRevenue > 0 && (
              <div className="text-xs text-tertiary mt-1">
                Margin: {((lifetimeProfit / lifetimeRevenue) * 100).toFixed(1)}%
                {currentMonthProjectedProfit !== undefined && (
                  <span className="ml-1 opacity-75">
                    (this month: {((currentMonthProjectedProfit / monthlyRevenue) * 100).toFixed(1)}%)
                  </span>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Monthly Expenses - Burn Rate */}
      <Card>
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsMonthlyExpensesExpanded(!isMonthlyExpensesExpanded)}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div className="flex flex-col">
              <div className="text-sm font-semibold text-secondary">Monthly Expenses (Burn Rate)</div>
              <div className="text-xs text-tertiary">Recurring expenses deducted at month end</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <div className="text-3xl font-bold" style={{ color: 'var(--error)' }}>
                ${monthlyExpenses.toLocaleString()}/mo
              </div>
              {monthlyExpenses > 0 && (
                <div className="text-xs text-tertiary mt-1">
                  {metrics.cash > 0 ? (
                    <>Runway: {Math.floor(metrics.cash / monthlyExpenses)} months</>
                  ) : (
                    <>No cash remaining</>
                  )}
                </div>
              )}
            </div>
            <div className="text-lg" style={{ color: 'var(--error)' }}>
              {isMonthlyExpensesExpanded ? '▼' : '▶'}
            </div>
          </div>
        </div>
        
        {isMonthlyExpensesExpanded && operatingExpenses.length > 0 && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-secondary mb-2">Expense Breakdown</div>
              {operatingExpenses.map((entry, index) => {
                // Use sourceType for icon if available, otherwise use category
                const icon = entry.sourceType 
                  ? getIconForSourceType(entry.sourceType)
                  : getExpenseBreakdownIcon(entry.category);
                const displayLabel = getExpenseDisplayLabel(entry);
                
                return (
                  <div 
                    key={`monthly-exp-${index}`} 
                    className="flex justify-between items-center py-2 px-3 rounded" 
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                  >
                    <span className="text-sm text-tertiary flex items-center gap-2">
                      <span>{icon}</span>
                      <span>{displayLabel}</span>
                    </span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--error)' }}>
                      ${entry.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {isMonthlyExpensesExpanded && operatingExpenses.length === 0 && (
          <div className="mt-4 pt-4 border-t text-center text-tertiary text-sm" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            No recurring expenses yet
          </div>
        )}
      </Card>

      {/* Current Month - Main Focus */}
      <Card>
        <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base" style={{ color: 'var(--game-primary)' }}>
              📅 Month {currentMonth}
            </span>
            <span className="text-white px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: 'var(--success)' }}>
              Active
            </span>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-xs text-secondary mb-1">Projected Profit</div>
            <div className={`text-2xl font-bold ${currentMonthProjectedProfit >= 0 ? '' : ''}`} style={{ color: currentMonthProjectedProfit >= 0 ? 'var(--success)' : 'var(--error)' }}>
              ${currentMonthProjectedProfit.toLocaleString()}
            </div>
            <div className="text-xs text-tertiary mt-0.5 text-right max-w-[140px]">
              {monthlyOneTimeCostsPaid > 0 && monthlyOneTimeCostsPaid < monthlyOneTimeCosts ? (
                <>${monthlyOneTimeCostsPaid.toLocaleString()} already paid</>
              ) : monthlyOneTimeCostsPaid === monthlyOneTimeCosts && monthlyOneTimeCosts > 0 ? (
                <>One-time costs already deducted</>
              ) : (
                <>Recurring expenses deducted at month end</>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Revenue Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-baseline pb-2 border-b" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <span className="text-sm font-medium text-secondary">Revenue</span>
              <span className="text-xl font-bold" style={{ color: 'var(--success)' }}>
                ${monthlyRevenue.toLocaleString()}
              </span>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              {monthlyRevenueDetails.length > 0 ? (
                (() => {
                  // Group customer payments together, show others individually
                  const customerPayments = monthlyRevenueDetails
                    .filter((e) => e.category === RevenueCategory.Customer)
                    .reduce((sum, e) => sum + e.amount, 0);
                  
                  const otherRevenues = monthlyRevenueDetails.filter(
                    (e) => e.category !== RevenueCategory.Customer
                  );
                  
                  return (
                    <>
                      <div 
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() => setIsRevenueExpanded(!isRevenueExpanded)}
                      >
                        <span className="text-xs font-semibold text-secondary">Revenue Breakdown</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold" style={{ color: 'var(--success)' }}>
                            ${monthlyRevenue.toLocaleString()}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--success)' }}>
                            {isRevenueExpanded ? '▼' : '▶'}
                          </span>
                        </div>
                      </div>
                      {isRevenueExpanded && (
                        <div className="space-y-1.5 mt-2 pt-2 border-t" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                          {customerPayments > 0 && (
                            <div key="customer-payments" className="flex justify-between items-center py-1 px-2 rounded" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                              <span className="text-xs text-tertiary flex items-center gap-1.5">
                                <span>{getRevenueIcon(RevenueCategory.Customer)}</span>
                                <span>Customer payments</span>
                              </span>
                              <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>
                                ${customerPayments.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {otherRevenues.map((entry, index) => {
                            // Use sourceType for icon if available, otherwise fall back to category/label
                            const icon = entry.sourceType 
                              ? getIconForSourceType(entry.sourceType)
                              : getRevenueIcon(entry.category, entry.label, entry.sourceType);
                            const displayLabel = getRevenueDisplayLabel(entry);
                            
                            return (
                              <div key={`rev-${index}`} className="flex justify-between items-center py-1 px-2 rounded" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                                <span className="text-xs text-tertiary flex items-center gap-1.5">
                                  <span>{icon}</span>
                                  <span>{displayLabel}</span>
                                </span>
                                <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>
                                  ${entry.amount.toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()
              ) : (
                <div className="text-tertiary text-xs">No revenue yet</div>
              )}
            </div>
          </div>
          
          {/* Expenses Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-baseline pb-2 border-b" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-secondary">Total Expenses</span>
                <span className="text-xs text-tertiary">
                  {monthlyOneTimeCostsPaid > 0 ? (
                    <>
                      ${monthlyOneTimeCostsPaid.toLocaleString()} already paid, 
                      ${(currentMonthTotalExpenses - monthlyOneTimeCostsPaid).toLocaleString()} at month end
                    </>
                  ) : (
                    <>${monthlyExpenses.toLocaleString()} recurring + ${monthlyOneTimeCosts.toLocaleString()} one-time (deducted at month end)</>
                  )}
                </span>
              </div>
              <span className="text-xl font-bold" style={{ color: 'var(--error)' }}>
                ${currentMonthTotalExpenses.toLocaleString()}
              </span>
            </div>
            <div className="space-y-3">
              {/* Operating Expenses - Grouped */}
              {operatingExpenses.length > 0 && (
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setIsOperatingExpensesExpanded(!isOperatingExpensesExpanded)}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-secondary">Operating Expenses (Monthly)</span>
                      <span className="text-xs text-tertiary opacity-75">Deducted at month end</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: 'var(--error)' }}>
                        ${monthlyExpenses.toLocaleString()}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--error)' }}>
                        {isOperatingExpensesExpanded ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>
                  {isOperatingExpensesExpanded && (
                    <div className="space-y-1.5 mt-2 pt-2 border-t" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                      {operatingExpenses.map((entry, index) => {
                        // Use sourceType for icon if available, otherwise use category
                        const icon = entry.sourceType 
                          ? getIconForSourceType(entry.sourceType)
                          : getExpenseBreakdownIcon(entry.category);
                        const displayLabel = getExpenseDisplayLabel(entry);
                        
                        return (
                          <div key={`op-exp-${index}`} className="flex justify-between items-center py-1 px-2 rounded" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                            <span className="text-xs text-tertiary flex items-center gap-1.5">
                              <span>{icon}</span>
                              <span>{displayLabel}</span>
                            </span>
                            <span className="text-xs font-semibold" style={{ color: 'var(--error)' }}>
                              ${entry.amount.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              
              {/* One-Time Expenses - Grouped */}
              {monthlyOneTimeCostDetails.length > 0 && (
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                  <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setIsOneTimeExpensesExpanded(!isOneTimeExpensesExpanded)}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-secondary">One-Time Expenses</span>
                      <span className="text-xs text-tertiary opacity-75">
                        {monthlyOneTimeCostsPaid === monthlyOneTimeCosts 
                          ? 'All already deducted from cash' 
                          : monthlyOneTimeCostsPaid > 0
                          ? `$${monthlyOneTimeCostsPaid.toLocaleString()} paid, $${(monthlyOneTimeCosts - monthlyOneTimeCostsPaid).toLocaleString()} at month end`
                          : 'Deducted at month end'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: 'var(--warning)' }}>
                        ${monthlyOneTimeCosts.toLocaleString()}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--warning)' }}>
                        {isOneTimeExpensesExpanded ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>
                  {isOneTimeExpensesExpanded && (
                    <div className="space-y-1.5 mt-2 pt-2 border-t" style={{ borderColor: 'rgba(251, 191, 36, 0.3)' }}>
                      {monthlyOneTimeCostDetails.map((cost, index) => {
                        // Use sourceType for icon if available, otherwise use category
                        const icon = cost.sourceType 
                          ? getIconForSourceType(cost.sourceType)
                          : getOneTimeCostIcon(cost.category);
                        const displayLabel = getExpenseDisplayLabel(cost);
                        const isPaid = cost.alreadyDeducted;
                        
                        return (
                          <div key={`one-time-${index}`} className="flex justify-between items-center py-1 px-2 rounded" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                            <span className="text-xs text-tertiary flex items-center gap-1.5">
                              <span>{icon}</span>
                              <span>{displayLabel}</span>
                              {isPaid && (
                                <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}>
                                  Paid
                                </span>
                              )}
                            </span>
                            <span className="text-xs font-semibold" style={{ color: 'var(--warning)' }}>
                              ${cost.amount.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              
              {operatingExpenses.length === 0 && monthlyOneTimeCostDetails.length === 0 && (
                <div className="text-tertiary text-xs">No expenses yet</div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Monthly History */}
      {monthlyHistory.length > 0 && (
        <Card>
          <SectionHeading>
            <span style={{ color: 'var(--game-secondary)' }}>📈</span> Monthly History
          </SectionHeading>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {[...monthlyHistory].reverse().map((w, index) => {
              // Calculate one-time costs breakdown
              const oneTimeCostsTotal = w.oneTimeCosts?.reduce((sum, cost) => sum + cost.amount, 0) || 0;
              // w.expenses only includes expenses deducted at month end (recurring + unpaid one-time costs)
              // To get operating expenses, subtract only the unpaid one-time costs
              const unpaidOneTimeCosts = w.oneTimeCosts?.reduce((sum, cost) => sum + (cost.alreadyDeducted ? 0 : cost.amount), 0) || 0;
              const operatingExpenses = w.expenses - unpaidOneTimeCosts;
              const revenueBreakdown: RevenueEntry[] =
                w.revenueBreakdown && w.revenueBreakdown.length > 0
                  ? w.revenueBreakdown
                  : [
                      {
                        category: RevenueCategory.Customer,
                        label: 'Customer payments',
                        amount: w.revenue,
                      },
                    ];
              
              const isExpanded = isMonthExpanded(w.month);
              
              return (
                <Card key={`month-${w.month}`} className="bg-[var(--bg-tertiary)]">
                  {/* Summary Header - Always Visible */}
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleMonthExpansion(w.month)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: 'var(--game-secondary)' }}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm" style={{ color: 'var(--game-secondary)' }}>Month {w.month}</span>
                        {index === 0 && (
                          <span className="text-white px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: 'var(--success)' }}>Latest</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-end">
                        <div className="text-xs text-secondary mb-0.5">Revenue</div>
                        <div className="text-sm font-bold" style={{ color: 'var(--success)' }}>
                          ${w.revenue.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-xs text-secondary mb-0.5">Expenses</div>
                        <div className="text-sm font-bold" style={{ color: 'var(--error)' }}>
                          ${w.expenses.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-xs text-secondary mb-0.5">Profit</div>
                        <div className={`text-lg font-bold ${w.profit >= 0 ? '' : ''}`} style={{ color: w.profit >= 0 ? 'var(--success)' : 'var(--error)' }}>
                          ${w.profit.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Detailed Breakdown - Only when Expanded */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                      <div className="grid grid-cols-2 gap-6">
                        {/* Revenue Section */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-baseline pb-2 border-b" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                            <span className="text-sm font-medium text-secondary">Revenue</span>
                            <span className="text-lg font-bold" style={{ color: 'var(--success)' }}>
                              ${w.revenue.toLocaleString()}
                            </span>
                          </div>
                          <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <div className="space-y-1.5">
                              {revenueBreakdown.map((entry, rbIndex) => {
                                // Use sourceType for icon if available, otherwise fall back to category/label
                                const icon = entry.sourceType 
                                  ? getIconForSourceType(entry.sourceType)
                                  : getRevenueIcon(entry.category, entry.label, entry.sourceType);
                                const displayLabel = getRevenueDisplayLabel(entry);
                                
                                return (
                                  <div key={rbIndex} className="flex justify-between items-center py-1 px-2 rounded" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                                    <span className="text-xs text-tertiary flex items-center gap-1.5">
                                      <span>{icon}</span>
                                      <span>{displayLabel}</span>
                                    </span>
                                    <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>
                                      ${entry.amount.toLocaleString()}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        
                        {/* Expenses Section */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-baseline pb-2 border-b" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                            <span className="text-sm font-medium text-secondary">Total Expenses</span>
                            <span className="text-lg font-bold" style={{ color: 'var(--error)' }}>
                              ${w.expenses.toLocaleString()}
                            </span>
                          </div>
                          <div className="space-y-3">
                            {/* Operating Expenses - Grouped */}
                            {w.expenseBreakdown && w.expenseBreakdown.length > 0 ? (
                              <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <div className="flex justify-between items-center mb-2 pb-2 border-b" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                                  <span className="text-xs font-semibold text-secondary">Operating Expenses (Monthly)</span>
                                  <span className="text-xs font-bold" style={{ color: 'var(--error)' }}>
                                    ${operatingExpenses.toLocaleString()}
                                  </span>
                                </div>
                                <div className="space-y-1.5">
                                  {w.expenseBreakdown.map((expense, expIndex) => {
                                    // Use sourceType for icon if available, otherwise use category
                                    const icon = expense.sourceType 
                                      ? getIconForSourceType(expense.sourceType)
                                      : getExpenseBreakdownIcon(expense.category);
                                    const displayLabel = getExpenseDisplayLabel(expense);
                                    
                                    return (
                                      <div key={`exp-${expIndex}`} className="flex justify-between items-center py-1 px-2 rounded" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                                        <span className="text-xs text-tertiary flex items-center gap-1.5">
                                          <span>{icon}</span>
                                          <span>{displayLabel}</span>
                                        </span>
                                        <span className="text-xs font-semibold" style={{ color: 'var(--error)' }}>
                                          ${expense.amount.toLocaleString()}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-tertiary">Operating expenses</span>
                                  <span className="text-xs font-semibold" style={{ color: 'var(--error)' }}>
                                    ${operatingExpenses.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            )}
                            {/* One-Time Expenses - Grouped */}
                            {w.oneTimeCosts && w.oneTimeCosts.length > 0 && (
                              <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                                <div className="flex justify-between items-center mb-2 pb-2 border-b" style={{ borderColor: 'rgba(251, 191, 36, 0.3)' }}>
                                  <span className="text-xs font-semibold text-secondary">One-Time Expenses</span>
                                  <span className="text-xs font-bold" style={{ color: 'var(--warning)' }}>
                                    ${oneTimeCostsTotal.toLocaleString()}
                                  </span>
                                </div>
                                <div className="space-y-1.5">
                                  {w.oneTimeCosts.map((cost, costIndex) => {
                                    // Use sourceType for icon if available, otherwise use category
                                    const icon = cost.sourceType 
                                      ? getIconForSourceType(cost.sourceType)
                                      : getOneTimeCostIcon(cost.category);
                                    const displayLabel = getExpenseDisplayLabel(cost);
                                    
                                    return (
                                      <div key={`one-time-${costIndex}`} className="flex justify-between items-center py-1 px-2 rounded" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                                        <span className="text-xs text-tertiary flex items-center gap-1.5">
                                          <span>{icon}</span>
                                          <span>{displayLabel}</span>
                                        </span>
                                        <span className="text-xs font-semibold" style={{ color: 'var(--warning)' }}>
                                          ${cost.amount.toLocaleString()}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
