'use client';

import React from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';

export function FinanceTab() {
  const { metrics, weeklyHistory, totalProfit, lastWeek } = useFinanceData();

  return (
    <div>
      <h3 className="text-lg font-bold mb-3 text-white">Financial Overview</h3>
      
      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Revenue Card */}
        <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-xl p-4 border-2 border-green-600 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Revenue</h4>
              <p className="text-green-200 text-xs">Total Income</p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">${metrics.totalRevenue}</div>
            <div className="text-green-300 text-xs">
              {lastWeek ? `Week ${lastWeek.week}: $${lastWeek.revenue}` : 'No data yet'}
            </div>
          </div>
        </div>
        
        {/* Expenses Card */}
        <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-xl p-4 border-2 border-red-600 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💸</span>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Expenses</h4>
              <p className="text-red-200 text-xs">Total Costs</p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">${metrics.totalExpenses}</div>
            <div className="text-red-300 text-xs">
              {lastWeek ? `Week ${lastWeek.week}: $${lastWeek.expenses}` : 'No data yet'}
            </div>
          </div>
        </div>
        
        {/* Profit Card */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-4 border-2 border-blue-600 relative overflow-hidden col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Net Profit</h4>
                <p className="text-blue-200 text-xs">Total Earnings</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${totalProfit}
              </div>
              <div className={`text-sm ${totalProfit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {lastWeek ? `Week ${lastWeek.week}: $${lastWeek.profit}` : 'No data yet'}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Weekly History */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h4 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
          <span className="text-yellow-400">📈</span>
          Weekly Performance
        </h4>
        
        {weeklyHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-sm">No history yet. Complete a week to see data.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {weeklyHistory.slice(-5).reverse().map((w, index) => (
              <div key={`week-${w.week}`} className="bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 font-bold text-sm">Week {w.week}</span>
                    {index === 0 && (
                      <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">Latest</span>
                    )}
                  </div>
                  <div className={`font-bold ${w.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${w.profit}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Revenue:</span>
                    <span className="text-green-400">${w.revenue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expenses:</span>
                    <span className="text-red-400">${w.expenses}</span>
                  </div>
                </div>
                
                {/* Progress bar for profit */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Performance</span>
                    <span>{w.profit >= 0 ? '+' : ''}{Math.round((w.profit / Math.max(w.revenue, 1)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        w.profit >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(Math.abs((w.profit / Math.max(w.revenue, 1)) * 100), 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
