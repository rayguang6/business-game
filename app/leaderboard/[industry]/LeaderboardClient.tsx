'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Industry } from '@/lib/features/industries';
import { LeaderboardEntry, LeaderboardMetric } from '@/lib/data/leaderboardRepository';
import GameButton from '@/app/components/ui/GameButton';

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

  const [activeTab, setActiveTab] = useState<LeaderboardMetric>(currentMetric);
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleTabChange = (metric: LeaderboardMetric) => {
    setActiveTab(metric);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('metric', metric);
    router.push(`?${newSearchParams.toString()}`, { scroll: false });
  };

  // Get filtered and paginated entries for current tab
  const getCurrentLeaderboard = () => {
    const currentState = pagination[activeTab];
    const allEntries = currentState.entries;

    // Filter by search query
    const filteredEntries = searchQuery.trim() === ''
      ? allEntries
      : allEntries.filter(entry =>
          entry.username.toLowerCase().includes(searchQuery.toLowerCase())
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

  const goToPage = (page: number) => {
    setPagination(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        currentPage: Math.max(1, Math.min(page, prev[activeTab].totalPages))
      }
    }));
  };

  const formatValue = (entry: LeaderboardEntry): string => {
    if (activeTab === 'cash') {
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

  const getMetricLabel = (): string => {
    return activeTab === 'cash' ? 'Cash' : 'Leveraged Time';
  };

  const getMetricIcon = (): string => {
    return activeTab === 'cash' ? '💰' : '⏱️';
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

  const { entries: currentLeaderboard, totalEntries, totalPages, currentPage } = getCurrentLeaderboard();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-400 to-blue-700 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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

          {/* Search and Tabs */}
          <div className="flex flex-col items-center gap-6 mb-8">
            {/* Search Input */}
            <div className="w-full max-w-md">
              <input
                type="text"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => {
                  const query = e.target.value;
                  setSearchQuery(query);
                  // Reset to first page when searching
                  setPagination(prev => ({
                    ...prev,
                    [activeTab]: {
                      ...prev[activeTab],
                      currentPage: 1
                    }
                  }));
                }}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
              />
            </div>

            {/* Tabs */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1">
              <button
                onClick={() => handleTabChange('cash')}
                className={`px-6 py-3 rounded-md font-semibold transition-all duration-200 ${
                  activeTab === 'cash'
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
              >
                💰 Highest Cash
              </button>
              <button
                onClick={() => handleTabChange('leveragedTime')}
                className={`px-6 py-3 rounded-md font-semibold transition-all duration-200 ${
                  activeTab === 'leveragedTime'
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
              >
                ⏱️ Highest Leveraged Time
              </button>
            </div>
          </div>

          {/* Leaderboard Table */}
          {currentLeaderboard.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
              <p className="text-xl mb-4">
                {searchQuery.trim() !== '' ? 'No players found' : 'No entries yet'}
              </p>
              <p className="text-blue-100">
                {searchQuery.trim() !== ''
                  ? `No players match "${searchQuery}"`
                  : `Be the first to compete in the ${getMetricLabel().toLowerCase()} leaderboard for this industry!`
                }
              </p>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/20">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">Rank</th>
                      <th className="px-6 py-4 text-left font-semibold">Username</th>
                      <th className="px-6 py-4 text-right font-semibold">
                        {activeTab === 'cash' ? 'Cash' : 'Leveraged Time'}
                      </th>
                      <th className="px-6 py-4 text-center font-semibold">Result</th>
                      <th className="px-6 py-4 text-left font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentLeaderboard.map((entry, index) => {
                      // Calculate global rank (considering search and pagination)
                      const entriesPerPage = LEADERBOARD_DISPLAY_PAGE_SIZE;
                      const globalRank = (currentPage - 1) * entriesPerPage + index + 1;

                      return (
                        <tr
                          key={entry.id}
                          className={`border-t border-white/10 ${
                            index % 2 === 0 ? 'bg-white/5' : 'bg-white/10'
                          }`}
                        >
                          <td className="px-6 py-4 font-bold text-lg">
                            #{globalRank}
                          </td>
                        <td className="px-6 py-4 font-medium">{entry.username}</td>
                        <td className="px-6 py-4 text-right font-semibold text-lg">
                          {formatValue(entry)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1">
                            <span>{getGameResultIcon(entry.gameOverReason)}</span>
                            <span className="text-sm">{getGameResultLabel(entry.gameOverReason)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-blue-100">
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed backdrop-blur-sm rounded-lg font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-white/30"
              >
                ← Previous
              </button>

              <span className="px-6 py-2 bg-white/10 backdrop-blur-sm rounded-lg font-semibold text-white">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed backdrop-blur-sm rounded-lg font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-white/30"
              >
                Next →
              </button>
            </div>
          )}

          {/* Footer Info */}
          <div className="mt-4 text-center text-blue-100 text-sm">
            <p>
              Showing {currentLeaderboard.length} of {totalEntries} entries
              {searchQuery.trim() !== '' && ` (filtered by "${searchQuery}")`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}