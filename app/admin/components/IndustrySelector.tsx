'use client';

import { useState } from 'react';
import type { Industry } from '@/lib/features/industries';

interface IndustrySelectorProps {
  industries: Industry[];
  selectedIndustryId: string | null;
  loading: boolean;
  error: string | null;
  onSelectIndustry: (industry: Industry) => void;
  className?: string;
}

export function IndustrySelector({
  industries,
  selectedIndustryId,
  loading,
  error,
  onSelectIndustry,
  className = '',
}: IndustrySelectorProps) {
  const [isChanging, setIsChanging] = useState(false);

  const handleSelectIndustry = (industry: Industry) => {
    if (industry.id === selectedIndustryId) {
      return; // Already selected
    }
    setIsChanging(true);
    onSelectIndustry(industry);
    // Reset changing state after a brief delay
    setTimeout(() => setIsChanging(false), 300);
  };

  if (loading) {
    return (
      <div className={`bg-slate-900 border border-slate-800 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-2 text-slate-400">
          <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-sm">Loading industries...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-slate-900 border border-red-800 rounded-xl p-4 ${className}`}>
        <div className="text-sm text-rose-400">{error}</div>
      </div>
    );
  }

  if (industries.length === 0) {
    return (
      <div className={`bg-slate-900 border border-slate-800 rounded-xl p-4 ${className}`}>
        <div className="text-sm text-slate-400">
          No industries available. Create one in the Industries tab.
        </div>
      </div>
    );
  }

  const selectedIndustry = industries.find((i) => i.id === selectedIndustryId);

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl shadow-lg ${className}`}>
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {industries.map((industry) => {
            const isSelected = industry.id === selectedIndustryId;
            return (
              <button
                key={industry.id}
                onClick={() => handleSelectIndustry(industry)}
                disabled={isChanging}
                className={`px-3 py-2 rounded-lg border transition-all text-sm font-medium ${
                  isSelected
                    ? 'border-blue-400 bg-blue-500/20 text-blue-200 shadow-lg shadow-blue-500/20'
                    : 'border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-slate-600 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{industry.icon}</span>
                  <span className="truncate">{industry.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

