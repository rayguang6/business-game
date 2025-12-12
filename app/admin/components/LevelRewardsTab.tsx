'use client';

import { useEffect } from 'react';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import type { LevelReward } from '@/lib/data/levelRewardsRepository';
import { EffectEditor, type EffectFormData } from './EffectEditor';
import { EffectsList } from './EffectsList';
import { NumberInput } from './NumberInput';
import { METRIC_OPTIONS, EFFECT_TYPE_OPTIONS } from '../utils/constants';

interface LevelRewardsTabProps {
  industryId: string;
  levelRewards: LevelReward[];
  levelRewardsLoading: boolean;
  selectedLevelRewardId: string;
  isCreatingLevelReward: boolean;
  levelRewardForm: {
    id: string;
    level: string;
    title: string;
    rank: string;
    narrative: string;
    effects: Array<{ metric: GameMetric; type: EffectType; value: string }>;
    unlocksFlags: string[];
  };
  levelRewardSaving: boolean;
  levelRewardDeleting: boolean;
  flags: import('@/lib/data/flagRepository').GameFlag[];
  flagsLoading: boolean;
  onSelectLevelReward: (reward: LevelReward) => void;
  onCreateLevelReward: () => void;
  onSaveLevelReward: () => Promise<void>;
  onDeleteLevelReward: () => Promise<void>;
  onReset: () => void;
  onUpdateForm: (updates: Partial<LevelRewardsTabProps['levelRewardForm']>) => void;
  onAddEffect: () => void;
  onRemoveEffect: (index: number) => void;
  onUpdateEffect: (index: number, updates: Partial<{ metric: GameMetric; type: EffectType; value: string }>) => void;
  onAddFlag: () => void;
  onRemoveFlag: (index: number) => void;
  onUpdateFlag: (index: number, value: string) => void;
}

export function LevelRewardsTab({
  industryId,
  levelRewards,
  levelRewardsLoading,
  selectedLevelRewardId,
  isCreatingLevelReward,
  levelRewardForm,
  levelRewardSaving,
  levelRewardDeleting,
  flags,
  flagsLoading,
  onSelectLevelReward,
  onCreateLevelReward,
  onSaveLevelReward,
  onDeleteLevelReward,
  onReset,
  onUpdateForm,
  onAddEffect,
  onRemoveEffect,
  onUpdateEffect,
  onAddFlag,
  onRemoveFlag,
  onUpdateFlag,
}: LevelRewardsTabProps) {
  // Keyboard shortcuts for save and delete
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Save shortcut (Command/Ctrl + Enter)
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        if ((selectedLevelRewardId || isCreatingLevelReward) && !levelRewardSaving && !levelRewardDeleting) {
          onSaveLevelReward();
        }
      }
      // Delete shortcut (Command + Delete/Backspace)
      if (event.metaKey && (event.key === 'Delete' || event.key === 'Backspace') && !isCreatingLevelReward && selectedLevelRewardId) {
        event.preventDefault();
        event.stopPropagation();
        if (!levelRewardSaving && !levelRewardDeleting) {
          onDeleteLevelReward();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [selectedLevelRewardId, isCreatingLevelReward, levelRewardSaving, levelRewardDeleting, onSaveLevelReward, onDeleteLevelReward]);

  const handleEffectsChange = (newEffects: EffectFormData[]) => {
    onUpdateForm({
      effects: newEffects.map((e) => ({
        metric: e.metric,
        type: e.type,
        value: e.value,
      })),
    });
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-semibold">Level Rewards</h2>
        <p className="text-sm text-slate-400 mt-1">
          Configure rewards that unlock when players level up. Level 1 is the starting level.
        </p>
      </div>
      <div className="p-6 space-y-6">
        {!industryId ? (
          <div className="text-sm text-slate-400">Select or create an industry first.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onCreateLevelReward}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-purple-500 text-purple-200 hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!industryId}
              >
                + New Level Reward
              </button>
            </div>

            {levelRewardsLoading ? (
              <div className="text-sm text-slate-400">Loading level rewards…</div>
            ) : levelRewards.length === 0 && !isCreatingLevelReward ? (
              <div className="text-sm text-slate-400">No level rewards configured yet.</div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {levelRewards
                    .sort((a, b) => a.level - b.level)
                    .map((reward) => (
                      <button
                        key={reward.id}
                        onClick={() => onSelectLevelReward(reward)}
                        className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                          selectedLevelRewardId === reward.id && !isCreatingLevelReward
                            ? 'border-purple-400 bg-purple-500/10 text-purple-200'
                            : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                        }`}
                      >
                        Level {reward.level}: {reward.title}
                      </button>
                    ))}
                </div>

                {(selectedLevelRewardId || isCreatingLevelReward) && (
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Level</label>
                      <NumberInput
                        value={levelRewardForm.level}
                        onChange={(e) => onUpdateForm({ level: e.target.value })}
                        placeholder="1"
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                      <p className="text-xs text-slate-400 mt-1">Level number (1, 2, 3, ...)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Title</label>
                      <input
                        value={levelRewardForm.title}
                        onChange={(e) => onUpdateForm({ title: e.target.value })}
                        placeholder="e.g., Early Skill Builder"
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Rank</label>
                      <input
                        value={levelRewardForm.rank}
                        onChange={(e) => onUpdateForm({ rank: e.target.value })}
                        placeholder="e.g., Novice"
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                      <p className="text-xs text-slate-400 mt-1">Level rank name (shared across multiple levels)</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Narrative</label>
                      <textarea
                        rows={2}
                        value={levelRewardForm.narrative}
                        onChange={(e) => onUpdateForm({ narrative: e.target.value })}
                        placeholder="e.g., Your work looks slightly better; people start replying more often."
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>

                    {/* Effects */}
                    <EffectsList
                      effects={levelRewardForm.effects.map((e) => ({
                        metric: e.metric,
                        type: e.type,
                        value: e.value,
                      }))}
                      metricOptions={METRIC_OPTIONS}
                      effectTypeOptions={EFFECT_TYPE_OPTIONS}
                      title="Effects"
                      description="Effects applied when this level is reached"
                      onEffectsChange={handleEffectsChange}
                    />

                    {/* Unlocks Flags */}
                    <div className="md:col-span-2">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-1">Unlocks Flags</label>
                          <p className="text-xs text-slate-400 mt-1">
                            Flags to set when this level is reached (e.g., unlock_medium_jobs)
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={onAddFlag}
                          className="px-2 py-1 text-xs rounded-md border border-slate-600 text-slate-200 hover:bg-slate-800"
                        >
                          + Add Flag
                        </button>
                      </div>
                      <div className="space-y-2">
                        {levelRewardForm.unlocksFlags.map((flag, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <select
                              value={flag}
                              onChange={(e) => onUpdateFlag(index, e.target.value)}
                              className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                            >
                              <option value="">Select a flag...</option>
                              {!flagsLoading &&
                                flags.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.name}
                                  </option>
                                ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => onRemoveFlag(index)}
                              className="px-2 py-2 text-xs rounded-md border border-rose-600 text-rose-200 hover:bg-rose-900"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        {levelRewardForm.unlocksFlags.length === 0 && (
                          <p className="text-xs text-slate-500 italic">No flags added yet. Click "+ Add Flag" to add one.</p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="md:col-span-2 flex gap-3">
                      <button
                        type="button"
                        onClick={onSaveLevelReward}
                        disabled={levelRewardSaving || levelRewardDeleting}
                        className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {levelRewardSaving ? 'Saving...' : 'Save Level Reward'}
                      </button>
                      {selectedLevelRewardId && !isCreatingLevelReward && (
                        <button
                          type="button"
                          onClick={onDeleteLevelReward}
                          disabled={levelRewardSaving || levelRewardDeleting}
                          className="px-4 py-2 rounded-lg border border-rose-600 text-rose-200 hover:bg-rose-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {levelRewardDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={onReset}
                        disabled={levelRewardSaving || levelRewardDeleting}
                        className="px-4 py-2 rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reset
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
