'use client';

import type { GameEventChoice } from '@/lib/types/gameEvents';

interface ChoiceListProps {
  choices: GameEventChoice[];
  selectedChoiceId: string;
  isCreatingChoice: boolean;
  onSelectChoice: (choice: GameEventChoice) => void;
  onCreateChoice: () => void;
}

export function ChoiceList({
  choices,
  selectedChoiceId,
  isCreatingChoice,
  onSelectChoice,
  onCreateChoice,
}: ChoiceListProps) {
  const sortedChoices = [...choices].sort((a, b) => {
    // Null orders sort to the end
    const aOrder = a.order ?? Infinity;
    const bOrder = b.order ?? Infinity;
    return aOrder - bOrder;
  });

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {sortedChoices.map((choice) => (
        <button
          key={choice.id}
          type="button"
          onClick={() => onSelectChoice(choice)}
          className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
            selectedChoiceId === choice.id && !isCreatingChoice
              ? 'border-fuchsia-400 bg-fuchsia-500/10 text-fuchsia-200'
              : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
          }`}
        >
          {choice.label}
        </button>
      ))}
      {choices.length === 0 && !isCreatingChoice && (
        <div className="text-slate-400 text-sm py-2">
          No choices yet. Add your first choice below.
        </div>
      )}
    </div>
  );
}