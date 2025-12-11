'use client';

import type { GameEventConsequence } from '@/lib/types/gameEvents';

interface ConsequenceListProps {
  consequences: GameEventConsequence[];
  selectedConsequenceId: string;
  isCreatingConsequence: boolean;
  onSelectConsequence: (consequence: GameEventConsequence) => void;
  onCreateConsequence: () => void;
}

export function ConsequenceList({
  consequences,
  selectedConsequenceId,
  isCreatingConsequence,
  onSelectConsequence,
  onCreateConsequence,
}: ConsequenceListProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {consequences.map((consequence) => (
        <button
          key={consequence.id}
          type="button"
          onClick={() => onSelectConsequence(consequence)}
          className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
            selectedConsequenceId === consequence.id && !isCreatingConsequence
              ? 'border-amber-400 bg-amber-500/10 text-amber-200'
              : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
          }`}
        >
          {consequence.label || consequence.id}
        </button>
      ))}
      {consequences.length === 0 && !isCreatingConsequence && (
        <div className="text-slate-400 text-sm py-2">
          No consequences yet. Add your first consequence below.
        </div>
      )}
    </div>
  );
}