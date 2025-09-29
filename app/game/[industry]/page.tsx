'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store/gameStore';
import { useGameLoop } from '@/hooks/useGameLoop';
import { CustomerStatus, Customer } from '@/lib/game/customers/types';
import { TICKS_PER_SECOND, ticksToSeconds } from '@/lib/game/core/constants';

export default function GamePage() {
  const { selectedIndustry, isGameStarted, isPaused, metrics, weeklyRevenue, weeklyExpenses, weeklyHistory, gameTime, currentWeek, customers, startGame, pauseGame, unpauseGame } = useGameStore();
  const router = useRouter();
  
  // Helper function to calculate progress percentage
  const getServiceProgress = (customer: Customer) => {
    const totalTicks = customer.service.duration * TICKS_PER_SECOND;
    const elapsedTicks = totalTicks - customer.serviceTimeLeft;
    const progress = Math.max(0, Math.min(100, (elapsedTicks / totalTicks) * 100));
    return progress;
  };
  
  // Initialize game loop
  useGameLoop();

  useEffect(() => {
    if (!selectedIndustry) {
      router.push('/');
    } else if (!isGameStarted) {
      // Auto-start the game when page loads
      startGame();
    }
  }, [selectedIndustry, router, isGameStarted, startGame]);

  if (!selectedIndustry) {
    return null; // Return null while redirecting
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">{selectedIndustry.icon}</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{selectedIndustry.name}</h1>
              <p className="text-gray-600">Manage your business</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {isPaused ? (
              <button
                onClick={unpauseGame}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                ▶ Resume
              </button>
            ) : (
              <button
                onClick={pauseGame}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                ⏸ Pause
              </button>
            )}
            <Link
              href="/"
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

                {/* Week Progress */}
                <div className="bg-white rounded-lg p-4 mb-6 shadow-lg">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-600 mb-2">Week {currentWeek}</div>
                    <div className="text-sm text-gray-600 mb-3">Business Week Progress</div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-indigo-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${(gameTime % 30) / 30 * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {Math.floor(gameTime % 30)}s / 30s (Week {currentWeek})
                    </div>
                  </div>
                </div>

                {/* Key Metrics: Cash, Last Week Revenue, Last Week Expenses, Total Reputation */}
                <div className="bg-white rounded-lg p-4 mb-6 shadow-lg">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">${metrics.cash}</div>
                      <div className="text-sm text-gray-600">Cash</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">${weeklyHistory.length > 0 ? weeklyHistory[weeklyHistory.length - 1].revenue : 0}</div>
                      <div className="text-sm text-gray-600">Last Week Revenue</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">${weeklyHistory.length > 0 ? weeklyHistory[weeklyHistory.length - 1].expenses : 0}</div>
                      <div className="text-sm text-gray-600">Last Week Expenses</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{metrics.reputation}</div>
                      <div className="text-sm text-gray-600">Total Reputation</div>
                    </div>
                  </div>
                </div>

                {/* Finance P&L */}
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
                            <th className="py-2 pr-4">Reputation</th>
                            <th className="py-2 pr-4">Rep Δ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {weeklyHistory.slice(-5).map((w) => (
                            <tr key={`week-${w.week}`} className="border-t">
                              <td className="py-2 pr-4">{w.week}</td>
                              <td className="py-2 pr-4 text-green-700">${w.revenue}</td>
                              <td className="py-2 pr-4 text-red-700">${w.expenses}</td>
                              <td className="py-2 pr-4 font-medium">${w.profit}</td>
                              <td className="py-2 pr-4">{w.reputation}</td>
                              <td className={`py-2 pr-4 ${w.reputationChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>{w.reputationChange}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Service Status summary removed (canvas shows statuses) */}

        {/* Game Area */}
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <div className="text-center">
            <div className="text-6xl mb-4">{selectedIndustry.icon}</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Welcome to your {selectedIndustry.name.toLowerCase()}!
            </h2>
            <p className="text-gray-600 mb-6">
              {selectedIndustry.description}
            </p>
            

            {/* Game Area */}
                    <div className="relative bg-gray-100 rounded-lg h-96 border-2 border-dashed border-gray-300 mb-6">
                      <div className="absolute top-4 left-4 text-sm text-gray-500">
                        Total: {customers.length} | Waiting: {customers.filter(c => c.status === CustomerStatus.Waiting).length} | In Service: {customers.filter(c => c.status === CustomerStatus.InService).length}
                      </div>
                      <div className="absolute top-4 right-4 text-sm text-gray-500">
                        Capacity: {customers.filter(c => c.status === CustomerStatus.InService).length}/2
                      </div>
              
                      {/* Render customers */}
                      {customers.map((customer) => (
                        <div
                          key={customer.id}
                          className="absolute"
                          style={{
                            left: `${customer.x}px`,
                            top: `${customer.y}px`,
                          }}
                        >
                  {/* Customer emoji */}
                  <div className="text-4xl mb-1">{customer.emoji}</div>
                  
                  {/* Service info bubble */}
                  <div className="bg-white rounded-lg p-2 shadow-lg border text-xs min-w-[120px]">
                    <div className="font-semibold text-gray-800">{customer.service.name}</div>
                    <div className="text-gray-600">${customer.service.price}</div>
                    <div className="text-gray-500">{customer.service.duration}s</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Status: {customer.status}
                    </div>
                            {customer.status === CustomerStatus.InService && (
                              <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-1">
                                  <div 
                                    key={`progress-${customer.id}-${customer.serviceTimeLeft}`}
                                    className="bg-blue-500 h-1 rounded-full"
                                    style={{ 
                                      width: `${getServiceProgress(customer)}%`
                                    }}
                                  />
                                </div>
                                <div className="text-xs text-blue-600 mt-1">
                                  {Math.ceil(ticksToSeconds(customer.serviceTimeLeft))}s remaining
                                </div>
                               
                              </div>
                            )}
                  </div>
                </div>
              ))}
            </div>

                    <div className="bg-gray-100 rounded-lg p-6">
                      {isPaused ? (
                        <div className="text-center">
                          <div className="text-4xl mb-2">⏸️</div>
                          <p className="text-gray-600 font-semibold">Game is Paused</p>
                          <p className="text-gray-500 mt-2">
                            Click &quot;Resume&quot; to continue the game. All progress is saved!
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-500">
                          Game is running automatically! Customers will spawn and be served automatically. Watch the progress bars to see service completion. Customers will disappear and pay you when their service is done!
                        </p>
                      )}
                    </div>
          </div>
        </div>
      </div>
    </div>
  );
}