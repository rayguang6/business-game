'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Industry } from '@/lib/features/industries';
import { LeaderboardEntry, LeaderboardMetric } from '@/lib/data/leaderboardRepository';
import GameButton from '@/app/components/ui/GameButton';
import { getMetricIcon } from '@/lib/game/metrics/registry';
import { GameMetric } from '@/lib/game/effectManager';

interface LeaderboardClientProps {
  industry: Industry;
  cashLeaderboard: LeaderboardEntry[];
  leveragedTimeLeaderboard: LeaderboardEntry[];
  currentMetric: LeaderboardMetric;
}

interface PaginationState {
  cash: { entries: LeaderboardEntry[]; currentPage: number; totalPages: number };
  leveragedTime: { entries: LeaderboardEntry[]; currentPage: number; totalPages: number };
}

// Leaderboard configuration
const LEADERBOARD_DISPLAY_PAGE_SIZE = 20; // Show 20 entries per page on client

export default function LeaderboardClient({
  industry,
  cashLeaderboard,
  leveragedTimeLeaderboard,
  currentMetric
}: LeaderboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQueries, setSearchQueries] = useState<{cash: string; leveragedTime: string}>({
    cash: '',
    leveragedTime: ''
  });
  const [pagination, setPagination] = useState<PaginationState>({
    cash: {
      entries: cashLeaderboard,
      currentPage: 1,
      totalPages: Math.ceil(cashLeaderboard.length / LEADERBOARD_DISPLAY_PAGE_SIZE)
    },
    leveragedTime: {
      entries: leveragedTimeLeaderboard,
      currentPage: 1,
      totalPages: Math.ceil(leveragedTimeLeaderboard.length / LEADERBOARD_DISPLAY_PAGE_SIZE)
    },
  });


  // Get filtered and paginated entries for a specific metric
  const getLeaderboardData = (metric: LeaderboardMetric) => {
    const currentState = pagination[metric];
    const allEntries = currentState.entries;

    // Filter by search query
    const filteredEntries = searchQueries[metric].trim() === ''
      ? allEntries
      : allEntries.filter(entry =>
          entry.username.toLowerCase().includes(searchQueries[metric].toLowerCase())
        );

    // Calculate pagination
    const totalFilteredPages = Math.ceil(filteredEntries.length / LEADERBOARD_DISPLAY_PAGE_SIZE);
    const startIndex = (currentState.currentPage - 1) * LEADERBOARD_DISPLAY_PAGE_SIZE;
    const endIndex = startIndex + LEADERBOARD_DISPLAY_PAGE_SIZE;

    return {
      entries: filteredEntries.slice(startIndex, endIndex),
      totalEntries: filteredEntries.length,
      totalPages: totalFilteredPages,
      currentPage: Math.min(currentState.currentPage, totalFilteredPages) || 1
    };
  };

  const goToPage = (metric: LeaderboardMetric, page: number) => {
    setPagination(prev => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        currentPage: Math.max(1, Math.min(page, prev[metric].totalPages))
      }
    }));
  };

  const formatValue = (entry: LeaderboardEntry, metric: LeaderboardMetric): string => {
    if (metric === 'cash') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(entry.cash);
    } else {
      // Format leveraged time capacity as hours with 1 decimal place
      return entry.leveragedTimeCapacity !== null
        ? `${entry.leveragedTimeCapacity.toFixed(1)}h`
        : '0.0h';
    }
  };

  const getMetricLabel = (metric: LeaderboardMetric): string => {
    return metric === 'cash' ? 'Cash' : 'Leveraged Time';
  };

  const getMetricIconForLeaderboard = (metric: LeaderboardMetric): string | null => {
    const gameMetric = metric === 'cash' ? GameMetric.Cash : GameMetric.LeveragedTime;
    return getMetricIcon(gameMetric);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const getGameResultIcon = (reason: 'victory' | 'cash' | 'time' | null): string => {
    switch (reason) {
      case 'victory':
        return '🏆';
      case 'cash':
        return '💸';
      case 'time':
        return '⏰';
      default:
        return '❌';
    }
  };

  const getGameResultLabel = (reason: 'victory' | 'cash' | 'time' | null): string => {
    switch (reason) {
      case 'victory':
        return 'Victory';
      case 'cash':
        return 'Out of Cash';
      case 'time':
        return 'Out of Time';
      default:
        return 'Game Over';
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-400 to-blue-700 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <GameButton
              color="blue"
              onClick={() => router.push('/')}
            >
              ← Back to Home
            </GameButton>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
            <h2 className="text-2xl font-semibold mb-4">{industry.name}</h2>
          </div>

          {/* Search Inputs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Cash Leaderboard Search */}
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                {getMetricIconForLeaderboard('cash') ? (
                  <img
                    src={getMetricIconForLeaderboard('cash')!}
                    alt="Cash"
                    className="w-6 h-6"
                  />
                ) : (
                  <>💰</>
                )}
                Highest Cash
              </h3>
              <input
                type="text"
                placeholder="Search by username..."
                value={searchQueries.cash}
                onChange={(e) => {
                  const query = e.target.value;
                  setSearchQueries(prev => ({ ...prev, cash: query }));
                  // Reset to first page when searching
                  setPagination(prev => ({
                    ...prev,
                    cash: {
                      ...prev.cash,
                      currentPage: 1
                    }
                  }));
                }}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
              />
            </div>

            {/* Leveraged Time Leaderboard Search */}
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                {getMetricIconForLeaderboard('leveragedTime') ? (
                  <img
                    src={getMetricIconForLeaderboard('leveragedTime')!}
                    alt="Time"
                    className="w-6 h-6"
                  />
                ) : (
                  <>⏱️</>
                )}
                Highest Leveraged Time
              </h3>
              <input
                type="text"
                placeholder="Search by username..."
                value={searchQueries.leveragedTime}
                onChange={(e) => {
                  const query = e.target.value;
                  setSearchQueries(prev => ({ ...prev, leveragedTime: query }));
                  // Reset to first page when searching
                  setPagination(prev => ({
                    ...prev,
                    leveragedTime: {
                      ...prev.leveragedTime,
                      currentPage: 1
                    }
                  }));
                }}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
              />
            </div>
          </div>

          {/* Leaderboard Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cash Leaderboard */}
            <div>
              {(() => {
                const cashData = getLeaderboardData('cash');
                return (
                  <>
                    {cashData.entries.length === 0 ? (
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
                        <p className="text-xl mb-4">
                          {searchQueries.cash.trim() !== '' ? 'No players found' : 'No entries yet'}
                        </p>
                        <p className="text-blue-100">
                          {searchQueries.cash.trim() !== ''
                            ? `No players match "${searchQueries.cash}"`
                            : 'Be the first to compete in the cash leaderboard for this industry!'
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-white/20">
                              <tr>
                                <th className="px-4 py-3 text-left font-semibold">Rank</th>
                                <th className="px-4 py-3 text-left font-semibold">Username</th>
                                <th className="px-4 py-3 text-right font-semibold">Cash</th>
                                <th className="px-4 py-3 text-center font-semibold">Result</th>
                                <th className="px-4 py-3 text-left font-semibold">Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cashData.entries.map((entry, index) => {
                                // Calculate global rank (considering search and pagination)
                                const entriesPerPage = LEADERBOARD_DISPLAY_PAGE_SIZE;
                                const globalRank = (cashData.currentPage - 1) * entriesPerPage + index + 1;

                                return (
                                  <tr
                                    key={`cash-${entry.id}`}
                                    className={`border-t border-white/10 ${
                                      index % 2 === 0 ? 'bg-white/5' : 'bg-white/10'
                                    }`}
                                  >
                                    <td className="px-4 py-3 font-bold text-lg">
                                      #{globalRank}
                                    </td>
                                    <td className="px-4 py-3 font-medium">{entry.username}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-lg">
                                      {formatValue(entry, 'cash')}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className="inline-flex items-center gap-1">
                                        <span>{getGameResultIcon(entry.gameOverReason)}</span>
                                        <span className="text-sm">{getGameResultLabel(entry.gameOverReason)}</span>
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-blue-100">
                                      {formatDate(entry.createdAt)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Cash Pagination */}
                    {cashData.totalPages > 1 && (
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <button
                          onClick={() => goToPage('cash', cashData.currentPage - 1)}
                          disabled={cashData.currentPage <= 1}
                          className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed backdrop-blur-sm rounded-lg font-semibold text-white text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-white/30"
                        >
                          ←
                        </button>

                        <span className="px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg font-semibold text-white text-sm">
                          {cashData.currentPage} of {cashData.totalPages}
                        </span>

                        <button
                          onClick={() => goToPage('cash', cashData.currentPage + 1)}
                          disabled={cashData.currentPage >= cashData.totalPages}
                          className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed backdrop-blur-sm rounded-lg font-semibold text-white text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-white/30"
                        >
                          →
                        </button>
                      </div>
                    )}

                    {/* Cash Footer Info */}
                    <div className="mt-2 text-center text-blue-100 text-xs">
                      <p>
                        Showing {cashData.entries.length} of {cashData.totalEntries} entries
                        {searchQueries.cash.trim() !== '' && ` (filtered by "${searchQueries.cash}")`}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Leveraged Time Leaderboard */}
            <div>
              {(() => {
                const timeData = getLeaderboardData('leveragedTime');
                return (
                  <>
                    {timeData.entries.length === 0 ? (
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
                        <p className="text-xl mb-4">
                          {searchQueries.leveragedTime.trim() !== '' ? 'No players found' : 'No entries yet'}
                        </p>
                        <p className="text-blue-100">
                          {searchQueries.leveragedTime.trim() !== ''
                            ? `No players match "${searchQueries.leveragedTime}"`
                            : 'Be the first to compete in the leveraged time leaderboard for this industry!'
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-white/20">
                              <tr>
                                <th className="px-4 py-3 text-left font-semibold">Rank</th>
                                <th className="px-4 py-3 text-left font-semibold">Username</th>
                                <th className="px-4 py-3 text-right font-semibold">Time</th>
                                <th className="px-4 py-3 text-center font-semibold">Result</th>
                                <th className="px-4 py-3 text-left font-semibold">Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {timeData.entries.map((entry, index) => {
                                // Calculate global rank (considering search and pagination)
                                const entriesPerPage = LEADERBOARD_DISPLAY_PAGE_SIZE;
                                const globalRank = (timeData.currentPage - 1) * entriesPerPage + index + 1;

                                return (
                                  <tr
                                    key={`time-${entry.id}`}
                                    className={`border-t border-white/10 ${
                                      index % 2 === 0 ? 'bg-white/5' : 'bg-white/10'
                                    }`}
                                  >
                                    <td className="px-4 py-3 font-bold text-lg">
                                      #{globalRank}
                                    </td>
                                    <td className="px-4 py-3 font-medium">{entry.username}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-lg">
                                      {formatValue(entry, 'leveragedTime')}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className="inline-flex items-center gap-1">
                                        <span>{getGameResultIcon(entry.gameOverReason)}</span>
                                        <span className="text-sm">{getGameResultLabel(entry.gameOverReason)}</span>
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-blue-100">
                                      {formatDate(entry.createdAt)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Leveraged Time Pagination */}
                    {timeData.totalPages > 1 && (
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <button
                          onClick={() => goToPage('leveragedTime', timeData.currentPage - 1)}
                          disabled={timeData.currentPage <= 1}
                          className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed backdrop-blur-sm rounded-lg font-semibold text-white text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-white/30"
                        >
                          ←
                        </button>

                        <span className="px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg font-semibold text-white text-sm">
                          {timeData.currentPage} of {timeData.totalPages}
                        </span>

                        <button
                          onClick={() => goToPage('leveragedTime', timeData.currentPage + 1)}
                          disabled={timeData.currentPage >= timeData.totalPages}
                          className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed backdrop-blur-sm rounded-lg font-semibold text-white text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-white/30"
                        >
                          →
                        </button>
                      </div>
                    )}

                    {/* Leveraged Time Footer Info */}
                    <div className="mt-2 text-center text-blue-100 text-xs">
                      <p>
                        Showing {timeData.entries.length} of {timeData.totalEntries} entries
                        {searchQueries.leveragedTime.trim() !== '' && ` (filtered by "${searchQueries.leveragedTime}")`}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}