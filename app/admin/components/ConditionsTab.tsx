'use client';

import type { GameCondition, ConditionOperator } from '@/lib/types/conditions';
import { ConditionMetric } from '@/lib/types/conditions';
import { makeUniqueId, slugify } from './utils';

interface ConditionsTabProps {
  industryId: string;
  conditions: GameCondition[];
  conditionsLoading: boolean;
  conditionsStatus: string | null;
  selectedConditionId: string;
  isCreatingCondition: boolean;
  conditionForm: {
    id: string;
    name: string;
    description: string;
    metric: ConditionMetric;
    operator: ConditionOperator;
    value: string;
  };
  conditionSaving: boolean;
  conditionDeleting: boolean;
  onSelectCondition: (condition: GameCondition) => void;
  onCreateCondition: () => void;
  onSaveCondition: () => Promise<void>;
  onDeleteCondition: () => Promise<void>;
  onReset: () => void;
  onUpdateForm: (updates: Partial<{
    id: string;
    name: string;
    description: string;
    metric: ConditionMetric;
    operator: ConditionOperator;
    value: string;
  }>) => void;
}

export function ConditionsTab({
  industryId,
  conditions,
  conditionsLoading,
  conditionsStatus,
  selectedConditionId,
  isCreatingCondition,
  conditionForm,
  conditionSaving,
  conditionDeleting,
  onSelectCondition,
  onCreateCondition,
  onSaveCondition,
  onDeleteCondition,
  onReset,
  onUpdateForm,
}: ConditionsTabProps) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-semibold">Conditions</h2>
        <p className="text-sm text-slate-400 mt-1">
          Create metric-based conditions that can be checked by the game logic.
        </p>
      </div>
      <div className="p-6 space-y-6">
        {!industryId ? (
          <div className="text-sm text-slate-400">Select or create an industry first.</div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                {conditionsStatus && <span className="text-sm text-slate-300">{conditionsStatus}</span>}
              </div>
              <button
                type="button"
                onClick={onCreateCondition}
                disabled={conditionSaving || conditionDeleting}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + New Condition
              </button>
            </div>

            {conditionsLoading ? (
              <div className="text-sm text-slate-400">Loading conditions…</div>
            ) : conditions.length === 0 && !isCreatingCondition ? (
              <div className="text-sm text-slate-400">No conditions configured yet.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {conditions.map((condition) => (
                    <button
                      key={condition.id}
                      onClick={() => onSelectCondition(condition)}
                      className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                        selectedConditionId === condition.id && !isCreatingCondition
                          ? 'border-slate-400 bg-slate-800 text-slate-100'
                          : 'border-slate-600 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {condition.name}
                    </button>
                  ))}
                  {isCreatingCondition && (
                    <button className="px-3 py-2 rounded-lg border border-slate-400 bg-slate-800 text-slate-100 text-sm font-medium">
                      New Condition
                    </button>
                  )}
                </div>

                {(selectedConditionId || isCreatingCondition) && (
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">
                        Condition ID (auto-generated)
                      </label>
                      <input
                        value={conditionForm.id}
                        disabled={true}
                        className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-400 cursor-not-allowed"
                      />
                      <p className="text-xs text-slate-500 mt-1">ID will be auto-generated from name</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Name</label>
                      <input
                        value={conditionForm.name}
                        onChange={(e) => onUpdateForm({ name: e.target.value })}
                        onBlur={() => {
                          if (isCreatingCondition && conditionForm.name.trim()) {
                            const base = slugify(conditionForm.name.trim());
                            const unique = makeUniqueId(base, new Set(conditions.map((c) => c.id)));
                            onUpdateForm({ id: unique });
                          }
                        }}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={conditionForm.description}
                        onChange={(e) => onUpdateForm({ description: e.target.value })}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Metric</label>
                      <select
                        value={conditionForm.metric}
                        onChange={(e) => onUpdateForm({ metric: e.target.value as ConditionMetric })}
                        className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                      >
                        <option value={ConditionMetric.Cash}>Cash</option>
                        <option value={ConditionMetric.SkillLevel}>Skill Level</option>
                        <option value={ConditionMetric.Expenses}>Monthly Expenses</option>
                        <option value={ConditionMetric.GameTime}>Game Time (seconds)</option>
                        <option value={ConditionMetric.FreedomScore}>Freedom Score</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Operator</label>
                      <select
                        value={conditionForm.operator}
                        onChange={(e) => onUpdateForm({ operator: e.target.value as ConditionOperator })}
                        className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                      >
                        <option value="greater">&gt; Greater than</option>
                        <option value="less">&lt; Less than</option>
                        <option value="equals">= Equals</option>
                        <option value="greater_equal">&gt;= Greater or equal</option>
                        <option value="less_equal">&lt;= Less or equal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Value</label>
                      <input
                        type="number"
                        step="0.01"
                        value={conditionForm.value}
                        onChange={(e) => onUpdateForm({ value: e.target.value })}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>

                    <div className="md:col-span-2 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={onSaveCondition}
                        disabled={conditionSaving || conditionDeleting}
                        className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {conditionSaving ? 'Saving…' : 'Save Condition'}
                      </button>
                      {selectedConditionId && !isCreatingCondition && (
                        <button
                          type="button"
                          onClick={onDeleteCondition}
                          disabled={conditionSaving || conditionDeleting}
                          className="px-4 py-2 rounded-lg text-sm font-semibold border border-rose-600 text-rose-200 hover:bg-rose-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {conditionDeleting ? 'Deleting…' : 'Delete Condition'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={onReset}
                        disabled={conditionSaving || conditionDeleting}
                        className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCreatingCondition ? 'Cancel' : 'Reset'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

