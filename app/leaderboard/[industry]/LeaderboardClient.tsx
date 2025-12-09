'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Industry } from '@/lib/features/industries';
import { LeaderboardEntry } from '@/lib/data/leaderboardRepository';
import GameButton from '@/app/components/ui/GameButton';

interface LeaderboardClientProps {
  industry: Industry;
  leaderboardEntries: LeaderboardEntry[];
}

export default function LeaderboardClient({ industry, leaderboardEntries }: LeaderboardClientProps) {
  const router = useRouter();

  const formatCash = (cash: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cash);
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
            <h2 className="text-2xl font-semibold mb-4">{industry.name}</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <GameButton
                color="blue"
                onClick={() => router.push('/leaderboard')}
              >
                ← All Industries
              </GameButton>
              <GameButton
                color="blue"
                onClick={() => router.push('/select-industry')}
              >
                ← Back to Industries
              </GameButton>
            </div>
          </div>

          {/* Leaderboard Table */}
          {leaderboardEntries.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
              <p className="text-xl mb-4">No entries yet</p>
              <p className="text-blue-100">
                Be the first to complete a game in this industry!
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
                      <th className="px-6 py-4 text-right font-semibold">Cash</th>
                      <th className="px-6 py-4 text-center font-semibold">Result</th>
                      <th className="px-6 py-4 text-left font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardEntries.map((entry, index) => (
                      <tr
                        key={entry.id}
                        className={`border-t border-white/10 ${
                          index % 2 === 0 ? 'bg-white/5' : 'bg-white/10'
                        }`}
                      >
                        <td className="px-6 py-4 font-bold text-lg">
                          #{index + 1}
                        </td>
                        <td className="px-6 py-4 font-medium">{entry.username}</td>
                        <td className="px-6 py-4 text-right font-semibold text-lg">
                          {formatCash(entry.cash)}
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="mt-6 text-center text-blue-100 text-sm">
            <p>Showing top {leaderboardEntries.length} entries</p>
            <p className="mt-2">Leaderboard sorted by final cash amount</p>
          </div>
        </div>
      </div>
    </div>
  );
}
