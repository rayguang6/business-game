'use client';

import React from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { RevenueCategory, type RevenueEntry } from '@/lib/store/types';
import { useGameStore } from '@/lib/store/gameStore';
import { Card } from '@/app/components/ui/Card';
import { SectionHeading } from '@/app/components/ui/SectionHeading';

export function HomeTab() {
  const {
    metrics,
    monthlyHistory,
    totalProfit,
    lastMonth,
    monthlyExpenses,
    monthlyExpenseBreakdown,
    monthlyRevenue,
    monthlyRevenueBreakdown,
  } = useFinanceData();

  const { leads = [], leadProgress = 0, conversionRate = 10 } = useGameStore();

  const recurringExpenses = monthlyExpenseBreakdown.filter((entry) => entry.category !== 'event');
  const eventExpenses = monthlyExpenseBreakdown.filter((entry) => entry.category === 'event');

  return (
    <div className="space-y-6">
      <SectionHeading>💰 Financial Overview</SectionHeading>
      
      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue Card */}
        <Card variant="success">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg" style={{ backgroundColor: 'var(--success)' }}>
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <h4 className="text-primary font-bold text-sm sm:text-base">Revenue</h4>
              <p className="text-secondary text-xs">Total Income</p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--success)' }}>
              ${metrics.totalRevenue.toLocaleString()}
            </div>
            <div className="text-secondary text-xs sm:text-sm mb-2">
              {lastMonth ? `Month ${lastMonth.month}: $${lastMonth.revenue.toLocaleString()}` : 'No data yet'}
            </div>
            <div className="text-sm font-semibold mb-4" style={{ color: 'var(--success)' }}>
              Current monthly: ${monthlyRevenue.toLocaleString()}
            </div>
            {monthlyRevenueBreakdown.length > 0 && (
              <div className="text-left text-xs sm:text-sm text-secondary mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                <div className="font-semibold text-primary mb-2">Revenue breakdown</div>
                <ul className="space-y-1.5">
                  {monthlyRevenueBreakdown.map((entry) => (
                    <li key={`rev-${entry.category}`} className="flex justify-between">
                      <span>{entry.label}</span>
                      <span className="font-semibold" style={{ color: 'var(--success)' }}>${entry.amount.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
        
        {/* Expenses Card */}
        <Card variant="error">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg" style={{ backgroundColor: 'var(--error)' }}>
              <span className="text-2xl">💸</span>
            </div>
            <div>
              <h4 className="text-primary font-bold text-sm sm:text-base">Expenses</h4>
              <p className="text-secondary text-xs">Total Costs</p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--error)' }}>
              ${metrics.totalExpenses.toLocaleString()}
            </div>
            <div className="text-secondary text-xs sm:text-sm mb-2">
              {lastMonth ? `Month ${lastMonth.month}: $${lastMonth.expenses.toLocaleString()}` : 'No data yet'}
            </div>
            <div className="text-sm font-semibold mb-4" style={{ color: 'var(--error)' }}>
              Current monthly: ${monthlyExpenses.toLocaleString()}
            </div>
            {monthlyExpenseBreakdown.length > 0 && (
              <div className="text-left text-xs sm:text-sm text-secondary mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                <div className="font-semibold text-primary mb-2">Expense breakdown</div>
                <ul className="space-y-1.5">
                  {recurringExpenses.map((entry, index) => (
                    <li key={`${entry.label}-${index}`} className="flex justify-between">
                      <span>
                        {entry.category === 'base'
                          ? 'Base operations'
                          : entry.category === 'upgrade'
                          ? entry.label
                          : entry.label}
                      </span>
                      <span className="font-semibold" style={{ color: 'var(--error)' }}>${entry.amount.toLocaleString()}</span>
                    </li>
                  ))}
                  <li className="flex justify-between text-tertiary pt-1 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                    <span className="font-semibold">Total (recurring)</span>
                    <span className="font-bold" style={{ color: 'var(--error)' }}>${monthlyExpenses.toLocaleString()}</span>
                  </li>
                  {eventExpenses.map((entry, index) => (
                    <li
                      key={`${entry.label}-event-${index}`}
                      className="flex justify-between"
                      style={{ color: 'var(--warning)' }}
                    >
                      <span>{entry.label}</span>
                      <span className="font-semibold">${entry.amount.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>

        {/* Profit Card */}
        <Card className="col-span-1 sm:col-span-2" style={{ borderColor: 'var(--game-primary)', backgroundColor: 'rgba(35, 170, 246, 0.1)' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg" style={{ backgroundColor: 'var(--game-primary)' }}>
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h4 className="text-primary font-bold text-sm sm:text-base">Net Profit</h4>
                <p className="text-secondary text-xs">Total Earnings</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className={`text-2xl sm:text-3xl font-bold ${totalProfit >= 0 ? '' : ''}`} style={{ color: totalProfit >= 0 ? 'var(--success)' : 'var(--error)' }}>
                ${totalProfit.toLocaleString()}
              </div>
              <div className={`text-sm ${totalProfit >= 0 ? '' : ''}`} style={{ color: totalProfit >= 0 ? 'var(--success)' : 'var(--error)' }}>
                {lastMonth ? `Month ${lastMonth.month}: $${lastMonth.profit.toLocaleString()}` : 'No data yet'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Lead Progress Card */}
      <Card variant="info">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg" style={{ backgroundColor: 'var(--info)' }}>
            <span className="text-2xl">👥</span>
          </div>
          <div>
            <h4 className="text-primary font-bold text-sm sm:text-base">Customer Progress</h4>
            <p className="text-secondary text-xs">Build leads toward your next customer</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Next Customer</span>
              <span className="font-semibold">{Math.round(leadProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, leadProgress)}%`,
                  backgroundColor: leadProgress >= 100 ? 'var(--success)' : 'var(--info)'
                }}
              />
            </div>
          </div>

          {/* Conversion Rate Display */}
          <div className="text-center">
            <div className="text-lg font-bold" style={{ color: 'var(--info)' }}>
              {conversionRate}%
            </div>
            <div className="text-xs text-secondary">Conversion Rate</div>
            <div className="text-xs text-tertiary mt-1">
              Each lead brings you {conversionRate}% closer to your next customer
            </div>
          </div>
        </div>
      </Card>

      {/* Monthly History */}
      <Card>
        <SectionHeading>
          <span style={{ color: 'var(--game-secondary)' }}>📈</span> Monthly Performance
        </SectionHeading>
        
        {monthlyHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted text-sm">No history yet. Complete a month to see data.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {monthlyHistory.slice(-5).reverse().map((w, index) => {
              // Calculate recurring vs one-time expenses
              const oneTimeCostsTotal = w.oneTimeCosts?.reduce((sum, cost) => sum + cost.amount, 0) || 0;
              const recurringExpenses = w.expenses - oneTimeCostsTotal;
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
              
              return (
                <Card key={`month-${w.month}`} className="bg-[var(--bg-tertiary)]">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base" style={{ color: 'var(--game-secondary)' }}>Month {w.month}</span>
                      {index === 0 && (
                        <span className="text-white px-2 py-1 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'var(--success)' }}>Latest</span>
                      )}
                    </div>
                    <div className="font-bold text-sm sm:text-base" style={{ color: w.profit >= 0 ? 'var(--success)' : 'var(--error)' }}>
                      Profit: ${w.profit.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Revenue Section */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-semibold">
                        <span style={{ color: 'var(--success)' }}>Revenue</span>
                        <span style={{ color: 'var(--success)' }}>${w.revenue.toLocaleString()}</span>
                      </div>
                      <div className="pl-3 space-y-1.5 text-xs sm:text-sm text-tertiary border-l-2" style={{ borderColor: 'rgba(16, 185, 129, 0.5)' }}>
                        {revenueBreakdown.map((entry, rbIndex) => (
                          <div key={rbIndex} className="flex justify-between">
                            <span>{entry.label}</span>
                            <span className="font-semibold" style={{ color: 'var(--success)' }}>${entry.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Expenses Section */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-semibold">
                        <span style={{ color: 'var(--error)' }}>Expenses</span>
                        <span style={{ color: 'var(--error)' }}>${w.expenses.toLocaleString()}</span>
                      </div>
                      <div className="pl-3 space-y-1.5 text-xs sm:text-sm text-tertiary border-l-2" style={{ borderColor: 'rgba(239, 68, 68, 0.5)' }}>
                        <div className="flex justify-between">
                          <span>Recurring costs</span>
                          <span className="font-semibold" style={{ color: 'var(--error)' }}>${recurringExpenses.toLocaleString()}</span>
                        </div>
                        {w.oneTimeCosts && w.oneTimeCosts.length > 0 && (
                          <>
                            {w.oneTimeCosts.map((cost, costIndex) => (
                              <div key={costIndex} className="flex justify-between">
                                <span>
                                  {cost.category === 'upgrade' && '🔧 '}
                                  {cost.category === 'repair' && '🔨 '}
                                  {cost.category === 'event' && '📋 '}
                                  {cost.category === 'staff' && '👋 '}
                                  {cost.label}
                                </span>
                                <span className="font-semibold" style={{ color: 'var(--warning)' }}>${cost.amount.toLocaleString()}</span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
