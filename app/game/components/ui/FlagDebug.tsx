'use client';

import React from 'react';
import { useGameStore } from '@/lib/store/gameStore';

/**
 * Debug component to display all active flags
 * Useful for testing the flag system
 */
export function FlagDebug() {
  const flags = useGameStore((state) => state.flags);

  // Only show if there are any flags set
  if (Object.keys(flags).length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 backdrop-blur-sm border border-purple-500/50 rounded-lg p-3 text-xs max-w-xs z-50">
      <div className="font-bold text-purple-300 mb-2">Active Flags 🏁</div>
      <div className="space-y-1">
        {Object.entries(flags).map(([flagId, value]) => (
          <div key={flagId} className="flex items-center gap-2">
            <span className={value ? 'text-green-400' : 'text-gray-500'}>
              {value ? '✓' : '✗'}
            </span>
            <span className="text-slate-300 font-mono">{flagId}</span>
          </div>
        ))}
      </div>
      <div className="text-gray-500 text-[10px] mt-2">
        Debug view - remove in production
      </div>
    </div>
  );
}


