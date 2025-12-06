'use client';

import React, { useState, useEffect } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { RevenueCategory, type RevenueEntry, type OneTimeCost, type TimeSpentEntry, REVENUE_CATEGORY_LABELS } from '@/lib/store/types';
import { useGameStore } from '@/lib/store/gameStore';
import { useConfigStore } from '@/lib/store/configStore';
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
import { DEFAULT_INDUSTRY_ID, getStartingTime, getBusinessMetrics } from '@/lib/game/config';
import { effectManager, GameMetric } from '@/lib/game/effectManager';
import type { IndustryId } from '@/lib/game/types';

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
  
  // Get tracking data
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const configStatus = useConfigStore((state) => state.configStatus);
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  const totalLeadsSpawned = useGameStore((state) => state.metrics.totalLeadsSpawned || 0);
  const totalCustomersGenerated = useGameStore((state) => state.metrics.totalCustomersGenerated || 0);
  const customersServed = useGameStore((state) => state.customersServed || 0);
  const customersLeftImpatient = useGameStore((state) => state.customersLeftImpatient || 0);
  const customersServiceFailed = useGameStore((state) => state.customersServiceFailed || 0);
  const monthlyLeadsSpawned = useGameStore((state) => state.monthlyLeadsSpawned || 0);
  const monthlyCustomersGenerated = useGameStore((state) => state.monthlyCustomersGenerated || 0);
  const monthlyCustomersServed = useGameStore((state) => state.monthlyCustomersServed || 0);
  const monthlyCustomersLeftImpatient = useGameStore((state) => state.monthlyCustomersLeftImpatient || 0);
  const monthlyCustomersServiceFailed = useGameStore((state) => state.monthlyCustomersServiceFailed || 0);
  const totalTimeSpent = useGameStore((state) => state.metrics.totalTimeSpent || 0);
  const monthlyTimeSpent = useGameStore((state) => state.monthlyTimeSpent || 0);
  const monthlyTimeSpentDetails = useGameStore((state) => state.monthlyTimeSpentDetails || []);
  
  // Safely get starting time - handle case when config isn't loaded yet
  let startingTime = 0;
  try {
    if (configStatus === 'ready') {
      const businessMetrics = getBusinessMetrics(industryId);
      if (businessMetrics) {
        startingTime = getStartingTime(industryId);
      }
    }
  } catch (error) {
    // If config access fails, use default
    console.warn('[HomeTab] Error accessing config, using defaults', error);
  }
  
  const totalTime = metrics.myTime + metrics.leveragedTime;
  const showTime = startingTime > 0 || totalTime > 0;

  // Collapsible state for current month sections (auto-expanded by default)
  const [isRevenueExpanded, setIsRevenueExpanded] = useState(true);
  const [isOperatingExpensesExpanded, setIsOperatingExpensesExpanded] = useState(true);
  const [isOneTimeExpensesExpanded, setIsOneTimeExpensesExpanded] = useState(true);
  const [isMonthlyCostsExpanded, setIsMonthlyCostsExpanded] = useState(false);
  const [isMonthlyExpensesExpanded, setIsMonthlyExpensesExpanded] = useState(false);
  const [isTimeSpentExpanded, setIsTimeSpentExpanded] = useState(true);
  
  // Collapsible state for monthly history (per month)
  // Initialize with current month expanded by default
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set([currentMonth]));
  
  // Auto-expand current month when it changes (new month starts)
  useEffect(() => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      newSet.add(currentMonth);
      return newSet;
    });
  }, [currentMonth]);
  
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

  // Calculate unpaid one-time costs (those not yet deducted)
  // Some one-time costs are deducted immediately (deductNow: true), others are deferred to month end
  const unpaidOneTimeCosts = Math.max(0, monthlyOneTimeCosts - monthlyOneTimeCostsPaid);
  
  // Calculate current month projected totals (not yet deducted)
  // monthlyExpenses = recurring monthly expenses (base + upgrades + staff)
  // unpaidOneTimeCosts = one-time costs that will be deducted at month end
  // Note: Already-paid one-time costs (deductNow: true) are NOT included here as they're already deducted
  const currentMonthTotalExpenses = monthlyExpenses + unpaidOneTimeCosts;

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
  //   - Completed months: all expenses (recurring + unpaid one-time costs)
  //   - Current month: one-time costs with deductNow=true (deducted immediately)
  //   - Current month recurring expenses: will be added at month end
  const lifetimeRevenue = metrics.totalRevenue; // Already includes current month revenue (added immediately)
  const lifetimeExpenses = metrics.totalExpenses; // Includes completed months + current month immediate deductions
  const lifetimeProfit = lifetimeRevenue - lifetimeExpenses;
  
  // Current month projected totals (for display purposes only)
  // Only includes expenses that will be deducted at month end (recurring + unpaid one-time costs)
  const currentMonthProjectedExpenses = monthlyExpenses + unpaidOneTimeCosts;
  const currentMonthProjectedProfit = monthlyRevenue - currentMonthProjectedExpenses;

  // Create current month entry to merge with history
  const currentMonthEntry = {
    month: currentMonth,
    revenue: monthlyRevenue,
    expenses: currentMonthTotalExpenses,
    oneTimeCosts: monthlyOneTimeCostDetails,
    profit: currentMonthProjectedProfit,
    exp: metrics.exp,
    expChange: 0,
    level: Math.floor(metrics.exp / 100),
    levelChange: 0,
    revenueBreakdown: monthlyRevenueDetails,
    expenseBreakdown: operatingExpenses,
    leadsSpawned: monthlyLeadsSpawned,
    customersGenerated: monthlyCustomersGenerated,
    customersServed: monthlyCustomersServed,
    customersLeftImpatient: monthlyCustomersLeftImpatient,
    customersServiceFailed: monthlyCustomersServiceFailed,
    timeSpent: monthlyTimeSpent,
    timeSpentDetails: monthlyTimeSpentDetails,
  };

  // Combine current month with history (current month first, then history)
  const allMonths = [currentMonthEntry, ...monthlyHistory];

  return (
    <div className="space-y-4">
      {/* Lifetime Totals - Leads, Customers, Time - At Top */}
      <div className="grid grid-cols-3 gap-3">
        {/* Total Leads Card */}
        <Card>
          <div className="flex flex-col items-center text-center py-2">
            <span className="text-xl mb-1">💡</span>
            <div className="text-xs text-secondary mb-1">Total Leads</div>
            <div className="text-xl font-bold" style={{ color: 'var(--game-primary)' }}>
              {totalLeadsSpawned.toLocaleString()}
            </div>
          </div>
        </Card>

        {/* Total Customers Card */}
        <Card>
          <div className="flex flex-col items-center text-center py-2">
            <span className="text-xl mb-1">👥</span>
            <div className="text-xs text-secondary mb-1">Total Customers</div>
            <div className="text-xl font-bold mb-1.5" style={{ color: 'var(--game-primary)' }}>
              {totalCustomersGenerated.toLocaleString()}
            </div>
            <div className="pt-1.5 border-t w-full" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center px-1">
                  <span className="text-tertiary flex items-center gap-1">
                    <span>✅</span>
                    <span>Served</span>
                  </span>
                  <span className="font-semibold" style={{ color: 'var(--success)' }}>
                    {customersServed.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-tertiary flex items-center gap-1">
                    <span>💨</span>
                    <span>Left</span>
                  </span>
                  <span className="font-semibold" style={{ color: 'var(--warning)' }}>
                    {customersLeftImpatient.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-tertiary flex items-center gap-1">
                    <span>❌</span>
                    <span>Failed</span>
                  </span>
                  <span className="font-semibold" style={{ color: 'var(--error)' }}>
                    {customersServiceFailed.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Total Time Spent Card */}
        {showTime && (
          <Card>
            <div className="flex flex-col items-center text-center py-2">
              <span className="text-xl mb-1">⏰</span>
              <div className="text-xs text-secondary mb-1">Total Time Spent</div>
              <div className="text-xl font-bold" style={{ color: 'var(--warning)' }}>
                {totalTimeSpent.toFixed(1)}h
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Lifetime Totals - Financial */}
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

      {/* Monthly History */}
      {allMonths.length > 0 && (
        <Card>
          <SectionHeading>
            <span style={{ color: 'var(--game-secondary)' }}>📈</span> Monthly History
          </SectionHeading>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {[currentMonthEntry, ...[...monthlyHistory].reverse()].map((w, index) => {
              const isCurrentMonth = w.month === currentMonth;
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
                <Card 
                  key={`month-${w.month}`} 
                  className="bg-[var(--bg-tertiary)]"
                  style={isCurrentMonth ? { 
                    border: '2px solid var(--game-primary)', 
                    backgroundColor: 'rgba(59, 130, 246, 0.15)' 
                  } : {}}
                >
                  {/* Summary Header - Always Visible */}
                  <div 
                    className="cursor-pointer"
                    onClick={() => toggleMonthExpansion(w.month)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: 'var(--game-secondary)' }}>
                          {isExpanded ? '▼' : '▶'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${isCurrentMonth ? '' : ''}`} style={{ color: isCurrentMonth ? 'var(--game-primary)' : 'var(--game-secondary)' }}>
                            Month {w.month}
                          </span>
                          {isCurrentMonth && (
                            <span className="text-white px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: 'var(--game-primary)' }}>Active</span>
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
                    {/* Leads, Customers, Time - Always Visible */}
                    {(w.leadsSpawned !== undefined || 
                      w.customersGenerated !== undefined || 
                      (showTime && w.timeSpent !== undefined)) && (
                      <div className="flex items-center gap-4 text-xs pt-2 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        {w.leadsSpawned !== undefined && (
                          <div className="flex items-center gap-1.5">
                            <span>💡</span>
                            <span className="text-tertiary">Leads:</span>
                            <span className="font-semibold" style={{ color: 'var(--game-primary)' }}>
                              {(w.leadsSpawned ?? 0).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {w.customersGenerated !== undefined && (
                          <div className="flex items-center gap-1.5">
                            <span>👥</span>
                            <span className="text-tertiary">Customers:</span>
                            <span className="font-semibold" style={{ color: 'var(--game-primary)' }}>
                              {(w.customersGenerated ?? 0).toLocaleString()}
                            </span>
                            <span className="text-tertiary ml-1">
                              (✅{(w.customersServed ?? 0).toLocaleString()} 💨{(w.customersLeftImpatient ?? 0).toLocaleString()} ❌{(w.customersServiceFailed ?? 0).toLocaleString()})
                            </span>
                          </div>
                        )}
                        {showTime && w.timeSpent !== undefined && (
                          <div className="flex items-center gap-1.5">
                            <span>⏰</span>
                            <span className="text-tertiary">Time:</span>
                            <span className="font-semibold" style={{ color: 'var(--warning)' }}>
                              {(w.timeSpent ?? 0).toFixed(1)}h
                            </span>
                          </div>
                        )}
                      </div>
                    )}
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
                      
                      {/* Time Spent Breakdown - Full Width */}
                      {showTime && w.timeSpent !== undefined && w.timeSpent > 0 && (
                        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                          <div className="space-y-3">
                            <div className="flex justify-between items-baseline pb-2 border-b" style={{ borderColor: 'rgba(251, 191, 36, 0.3)' }}>
                              <span className="text-sm font-medium text-secondary">Time Spent</span>
                              <span className="text-lg font-bold" style={{ color: 'var(--warning)' }}>
                                {(w.timeSpent ?? 0).toFixed(1)}h
                              </span>
                            </div>
                            {w.timeSpentDetails && w.timeSpentDetails.length > 0 ? (
                              <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                                <div className="space-y-1.5">
                                  {w.timeSpentDetails.map((timeEntry, timeIndex) => {
                                    // Use sourceType for icon if available, otherwise fallback to default time icon
                                    const icon = timeEntry.sourceType 
                                      ? getIconForSourceType(timeEntry.sourceType)
                                      : '⏰';
                                    const displayLabel = timeEntry.sourceName || timeEntry.label || 'Time spent';
                                    
                                    return (
                                      <div key={`time-${timeIndex}`} className="flex justify-between items-center py-1 px-2 rounded" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                                        <span className="text-xs text-tertiary flex items-center gap-1.5">
                                          <span>{icon}</span>
                                          <span>{displayLabel}</span>
                                        </span>
                                        <span className="text-xs font-semibold" style={{ color: 'var(--warning)' }}>
                                          {timeEntry.amount.toFixed(1)}h
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-tertiary">Time spent</span>
                                  <span className="text-xs font-semibold" style={{ color: 'var(--warning)' }}>
                                    {(w.timeSpent ?? 0).toFixed(1)}h
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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
