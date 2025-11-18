'use client';

import { GameMetric, EffectType } from '@/lib/game/effectManager';
import type { UpgradeDefinition, Requirement } from '@/lib/game/types';
import type { GameFlag } from '@/lib/data/flagRepository';
import type { GameCondition } from '@/lib/types/conditions';
import { RequirementsSelector } from './RequirementsSelector';
import { makeUniqueId, slugify } from './utils';

interface UpgradesTabProps {
  industryId: string;
  upgrades: UpgradeDefinition[];
  upgradesLoading: boolean;
  upgradeStatus: string | null;
  selectedUpgradeId: string;
  isCreatingUpgrade: boolean;
  upgradeForm: {
    id: string;
    name: string;
    description: string;
    icon: string;
    cost: string;
    timeCost?: string;
    maxLevel: string;
    setsFlag?: string;
    requirements: Requirement[];
  };
  effectsForm: Array<{ metric: GameMetric; type: EffectType; value: string }>;
  upgradeSaving: boolean;
  upgradeDeleting: boolean;
  flags: GameFlag[];
  flagsLoading: boolean;
  conditions: GameCondition[];
  conditionsLoading: boolean;
  metricOptions: Array<{ value: GameMetric; label: string }>;
  effectTypeOptions: Array<{ value: EffectType; label: string; hint: string }>;
  onSelectUpgrade: (upgrade: UpgradeDefinition) => void;
  onCreateUpgrade: () => void;
  onSaveUpgrade: () => Promise<void>;
  onDeleteUpgrade: () => Promise<void>;
  onReset: () => void;
  onUpdateForm: (updates: Partial<UpgradesTabProps['upgradeForm']>) => void;
  onUpdateEffects: (effects: UpgradesTabProps['effectsForm']) => void;
}

export function UpgradesTab({
  industryId,
  upgrades,
  upgradesLoading,
  upgradeStatus,
  selectedUpgradeId,
  isCreatingUpgrade,
  upgradeForm,
  effectsForm,
  upgradeSaving,
  upgradeDeleting,
  flags,
  flagsLoading,
  conditions,
  conditionsLoading,
  metricOptions,
  effectTypeOptions,
  onSelectUpgrade,
  onCreateUpgrade,
  onSaveUpgrade,
  onDeleteUpgrade,
  onReset,
  onUpdateForm,
  onUpdateEffects,
}: UpgradesTabProps) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-semibold">Upgrades</h2>
        <p className="text-sm text-slate-400 mt-1">Manage upgrades and their effects for the selected industry.</p>
      </div>
      <div className="p-6 space-y-6">
        {!industryId ? (
          <div className="text-sm text-slate-400">Select or create an industry first.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onCreateUpgrade}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-purple-500 text-purple-200 hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!industryId}
              >
                + New Upgrade
              </button>
              {upgradeStatus && <span className="text-sm text-slate-300">{upgradeStatus}</span>}
            </div>

            {upgradesLoading ? (
              <div className="text-sm text-slate-400">Loading upgrades…</div>
            ) : upgrades.length === 0 && !isCreatingUpgrade ? (
              <div className="text-sm text-slate-400">No upgrades configured yet.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {upgrades.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => onSelectUpgrade(u)}
                      className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                        selectedUpgradeId === u.id && !isCreatingUpgrade
                          ? 'border-purple-400 bg-purple-500/10 text-purple-200'
                          : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                      }`}
                    >
                      {u.icon} {u.name}
                    </button>
                  ))}
                </div>

                {(selectedUpgradeId || isCreatingUpgrade) && (
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Upgrade ID</label>
                      <input
                        value={upgradeForm.id}
                        onChange={(e) => onUpdateForm({ id: e.target.value })}
                        disabled={!isCreatingUpgrade && !!selectedUpgradeId}
                        className={`w-full rounded-lg border px-3 py-2 text-slate-200 ${
                          isCreatingUpgrade || !selectedUpgradeId
                            ? 'bg-slate-900 border-slate-600'
                            : 'bg-slate-800 border-slate-700 cursor-not-allowed'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Name</label>
                      <input
                        value={upgradeForm.name}
                        onChange={(e) => onUpdateForm({ name: e.target.value })}
                        onBlur={() => {
                          if (!upgradeForm.id && upgradeForm.name.trim()) {
                            const base = slugify(upgradeForm.name.trim());
                            const unique = makeUniqueId(base, new Set(upgrades.map((u) => u.id)));
                            onUpdateForm({ id: unique });
                          }
                        }}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Description</label>
                      <textarea
                        rows={3}
                        value={upgradeForm.description}
                        onChange={(e) => onUpdateForm({ description: e.target.value })}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Icon</label>
                      <input
                        value={upgradeForm.icon}
                        onChange={(e) => onUpdateForm({ icon: e.target.value })}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Cost (Cash)</label>
                      <input
                        type="number"
                        min="0"
                        value={upgradeForm.cost}
                        onChange={(e) => onUpdateForm({ cost: e.target.value })}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                      <p className="text-xs text-slate-400 mt-1">Cash cost (can be combined with time cost)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Time Cost (Hours, Optional)</label>
                      <input
                        type="number"
                        min="0"
                        value={upgradeForm.timeCost || ''}
                        onChange={(e) => onUpdateForm({ timeCost: e.target.value })}
                        placeholder="Leave empty for cash-only"
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                      <p className="text-xs text-slate-400 mt-1">Time cost (can be combined with cash cost)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Max Level</label>
                      <input
                        type="number"
                        min="1"
                        value={upgradeForm.maxLevel}
                        onChange={(e) => onUpdateForm({ maxLevel: e.target.value })}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Sets Flag</label>
                      <select
                        value={upgradeForm.setsFlag || ''}
                        onChange={(e) => onUpdateForm({ setsFlag: e.target.value })}
                        disabled={flagsLoading}
                        className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200 disabled:opacity-50"
                      >
                        <option value="">{flagsLoading ? 'Loading flags...' : 'None'}</option>
                        {!flagsLoading &&
                          flags.map((flag) => (
                            <option key={flag.id} value={flag.id}>
                              {flag.name} ({flag.id})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Requirements</label>
                      <RequirementsSelector
                        flags={flags}
                        conditions={conditions}
                        flagsLoading={flagsLoading}
                        conditionsLoading={conditionsLoading}
                        requirements={upgradeForm.requirements || []}
                        onRequirementsChange={(requirements) => onUpdateForm({ requirements })}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-300">Effects</h4>
                          <p className="text-xs text-slate-400 mt-1">
                            Choose a metric and how to apply it. Add = flat amount, Percent = +/-%, Multiply = × factor, Set = exact value.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateEffects([
                              ...effectsForm,
                              { metric: GameMetric.ServiceRooms, type: EffectType.Add, value: '0' },
                            ])
                          }
                          className="px-2 py-1 text-xs rounded-md border border-slate-600 text-slate-200 hover:bg-slate-800"
                        >
                          + Add Effect
                        </button>
                      </div>
                      <div className="space-y-2">
                        {effectsForm.map((ef, idx) => (
                          <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                            <select
                              value={ef.metric}
                              onChange={(e) =>
                                onUpdateEffects(
                                  effectsForm.map((row, i) =>
                                    i === idx ? { ...row, metric: e.target.value as GameMetric } : row
                                  )
                                )
                              }
                              className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                            >
                              {metricOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <select
                              value={ef.type}
                              onChange={(e) =>
                                onUpdateEffects(
                                  effectsForm.map((row, i) =>
                                    i === idx ? { ...row, type: e.target.value as EffectType } : row
                                  )
                                )
                              }
                              className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                            >
                              {effectTypeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <input
                              placeholder="value"
                              type="number"
                              value={ef.value}
                              onChange={(e) =>
                                onUpdateEffects(
                                  effectsForm.map((row, i) => (i === idx ? { ...row, value: e.target.value } : row))
                                )
                              }
                              className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => onUpdateEffects(effectsForm.filter((_, i) => i !== idx))}
                              className="px-2 py-2 text-xs rounded-md border border-rose-600 text-rose-200 hover:bg-rose-900"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={onSaveUpgrade}
                        disabled={upgradeSaving || upgradeDeleting}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                          upgradeSaving
                            ? 'bg-purple-900 text-purple-200 cursor-wait'
                            : 'bg-purple-600 hover:bg-purple-500 text-white'
                        }`}
                      >
                        {upgradeSaving ? 'Saving…' : 'Save Upgrade'}
                      </button>
                      <button
                        type="button"
                        onClick={onReset}
                        disabled={upgradeSaving || upgradeDeleting}
                        className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                      >
                        {isCreatingUpgrade ? 'Cancel' : 'Reset'}
                      </button>
                      {!isCreatingUpgrade && selectedUpgradeId && (
                        <button
                          type="button"
                          onClick={onDeleteUpgrade}
                          disabled={upgradeDeleting || upgradeSaving}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                            upgradeDeleting
                              ? 'bg-rose-900 text-rose-200 cursor-wait'
                              : 'bg-rose-600 hover:bg-rose-500 text-white'
                          }`}
                        >
                          {upgradeDeleting ? 'Deleting…' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

