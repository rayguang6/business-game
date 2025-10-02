'use client';

import React from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';

export function FinancePNL() {
  const { metrics, weeklyHistory } = useFinanceData();

  return (
    <div className="bg-white rounded-lg p-4 mb-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Finance P&L</h3>
      <div className="grid grid-cols-3 gap-4 text-center mb-4">
        <div>
          <div className="text-xl font-bold text-purple-700">${metrics.totalRevenue}</div>
          <div className="text-xs text-gray-600">Total Revenue</div>
        </div>
        <div>
          <div className="text-xl font-bold text-red-700">${metrics.totalExpenses}</div>
          <div className="text-xs text-gray-600">Total Expenses</div>
        </div>
        <div>
          <div className="text-xl font-bold">${metrics.totalRevenue - metrics.totalExpenses}</div>
          <div className="text-xs text-gray-600">Total Profit</div>
        </div>
      </div>
      <div className="text-sm text-gray-500 mb-2">Recent Weeks</div>
      {weeklyHistory.length === 0 ? (
        <div className="text-sm text-gray-500">No history yet. Complete a week to see data.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-4">Week</th>
                <th className="py-2 pr-4">Revenue</th>
                <th className="py-2 pr-4">Expenses</th>
                <th className="py-2 pr-4">Profit</th>
              </tr>
            </thead>
            <tbody>
              {weeklyHistory.slice(-5).map((w) => (
                <tr key={`week-${w.week}`} className="border-t">
                  <td className="py-2 pr-4">{w.week}</td>
                  <td className="py-2 pr-4 text-green-700">${w.revenue}</td>
                  <td className="py-2 pr-4 text-red-700">${w.expenses}</td>
                  <td className="py-2 pr-4 font-medium">${w.profit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


