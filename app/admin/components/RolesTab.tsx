'use client';

import { useEffect } from 'react';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import type { StaffRoleConfig } from '@/lib/game/staffConfig';
import type { GameFlag } from '@/lib/data/flagRepository';
import type { Requirement } from '@/lib/game/types';
import { RequirementsSelector } from './RequirementsSelector';
import { EffectsList } from './EffectsList';
import { NumberInput } from './NumberInput';
import { makeUniqueId, slugify } from './utils';

interface RolesTabProps {
  industryId: string;
  roles: StaffRoleConfig[];
  loading: boolean;
  selectedId: string;
  isCreating: boolean;
  form: {
    id: string;
    name: string;
    salary: string;
    effects: Array<{ metric: GameMetric; type: EffectType; value: string }>;
    spriteImage?: string;
    setsFlag?: string;
    requirements: Requirement[];
    order: string;
  };
  saving: boolean;
  deleting: boolean;
  flags: GameFlag[];
  flagsLoading: boolean;
  upgrades?: import('@/lib/game/types').UpgradeDefinition[];
  metricOptions: Array<{ value: GameMetric; label: string }>;
  effectTypeOptions: Array<{ value: EffectType; label: string; hint: string }>;
  onSelectRole: (role: StaffRoleConfig) => void;
  onCreateRole: () => void;
  onSaveRole: () => Promise<void>;
  onDeleteRole: () => Promise<void>;
  onReset: () => void;
  onUpdateForm: (updates: Partial<RolesTabProps['form']>) => void;
}

export function RolesTab({
  industryId,
  roles,
  loading,
  selectedId,
  isCreating,
  form,
  saving,
  deleting,
  flags,
  flagsLoading,
  upgrades = [],
  metricOptions,
  effectTypeOptions,
  onSelectRole,
  onCreateRole,
  onSaveRole,
  onDeleteRole,
  onReset,
  onUpdateForm,
}: RolesTabProps) {
  // Keyboard shortcuts for save and delete
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Save shortcut (Command/Ctrl + Enter)
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        if ((selectedId || isCreating) && !saving && !deleting) {
          onSaveRole();
        }
      }
      // Delete shortcut (Command + Delete/Backspace) - prioritize Mac
      if (event.metaKey && (event.key === 'Delete' || event.key === 'Backspace') && !isCreating && selectedId) {
        event.preventDefault();
        event.stopPropagation();
        if (!saving && !deleting) {
          onDeleteRole();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [selectedId, isCreating, saving, deleting, onSaveRole, onDeleteRole]);

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-semibold">Staff Roles</h2>
        <p className="text-sm text-slate-400 mt-1">Manage staff roles for this industry.</p>
      </div>
      <div className="p-6 space-y-6">
        {!industryId ? (
          <div className="text-sm text-slate-400">Select or create an industry first.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onCreateRole}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-indigo-500 text-indigo-200 hover:bg-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!industryId}
              >
                + New Role
              </button>
            </div>

            {loading ? (
              <div className="text-sm text-slate-400">Loading roles…</div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => onSelectRole(role)}
                      className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                        selectedId === role.id && !isCreating
                          ? 'border-indigo-400 bg-indigo-500/10 text-indigo-200'
                          : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                      }`}
                    >
                      {role.name}
                    </button>
                  ))}
                </div>

                {(selectedId || isCreating) && (
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Role ID</label>
                      <input
                        value={form.id}
                        onChange={(e) => onUpdateForm({ id: e.target.value })}
                        disabled={!isCreating && !!selectedId}
                        className={`w-full rounded-lg border px-3 py-2 text-slate-200 ${
                          isCreating || !selectedId
                            ? 'bg-slate-900 border-slate-600'
                            : 'bg-slate-800 border-slate-700 cursor-not-allowed'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Name</label>
                      <input
                        value={form.name}
                        onChange={(e) => onUpdateForm({ name: e.target.value })}
                        onBlur={() => {
                          if (!form.id && form.name.trim()) {
                            const base = slugify(form.name.trim());
                            const unique = makeUniqueId(base, new Set(roles.map((r) => r.id)));
                            onUpdateForm({ id: unique });
                          }
                        }}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Salary</label>
                      <NumberInput
                        min="0"
                        value={form.salary}
                        onChange={(e) => onUpdateForm({ salary: e.target.value })}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Order</label>
                      <NumberInput
                        value={form.order}
                        onChange={(e) => onUpdateForm({ order: e.target.value })}
                        placeholder="0"
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                      <p className="text-xs text-slate-400 mt-1">Lower numbers appear first (default: 0)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Sets Flag</label>
                      <select
                        value={form.setsFlag || ''}
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
                        upgrades={upgrades}
                        staffRoles={roles}
                        flagsLoading={flagsLoading}
                        requirements={form.requirements || []}
                        onRequirementsChange={(requirements) => onUpdateForm({ requirements })}
                      />
                    </div>

                    <EffectsList
                      effects={form.effects}
                      metricOptions={metricOptions}
                      effectTypeOptions={effectTypeOptions}
                      showDuration={false}
                      title="Effects (permanent)"
                      description="Staff effects are permanent while hired. Add = flat, Percent = +/-%, Multiply = × factor, Set = exact value."
                      defaultEffect={{
                        metric: metricOptions[0]?.value ?? GameMetric.ServiceSpeedMultiplier,
                        type: EffectType.Add,
                        value: '0',
                      }}
                      onEffectsChange={(effects) => onUpdateForm({ effects })}
                    />
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Sprite Image Path</label>
                      <input
                        value={form.spriteImage || ''}
                        onChange={(e) => onUpdateForm({ spriteImage: e.target.value })}
                        placeholder="/images/staff/staff1.png"
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Path to sprite sheet (16-frame animation). Leave empty to use default staff sprite.
                      </p>
                    </div>
                    <div className="md:col-span-2 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={onSaveRole}
                        disabled={saving || deleting}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                          saving
                            ? 'bg-indigo-900 text-indigo-200 cursor-wait'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        {saving ? 'Saving…' : 'Save Role'}
                      </button>
                      <button
                        type="button"
                        onClick={onReset}
                        disabled={saving || deleting}
                        className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                      >
                        {isCreating ? 'Cancel' : 'Reset'}
                      </button>
                      {!isCreating && selectedId && (
                        <button
                          type="button"
                          onClick={onDeleteRole}
                          disabled={deleting || saving}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                            deleting
                              ? 'bg-rose-900 text-rose-200 cursor-wait'
                              : 'bg-rose-600 hover:bg-rose-500 text-white'
                          }`}
                        >
                          {deleting ? 'Deleting…' : 'Delete'}
                        </button>
                      )}
                    </div>

                    {/* Floating Action Buttons */}
                    {(selectedId || isCreating) && (
                      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                        <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl px-6 py-3 shadow-2xl">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={onSaveRole}
                              disabled={saving || deleting}
                              className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${
                                saving
                                  ? 'bg-indigo-900 text-indigo-200 cursor-wait'
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                              }`}
                            >
                              {saving ? '💾 Saving…' : '💾 Save (⌘↵)'}
                            </button>
                            {!isCreating && selectedId && (
                              <button
                                type="button"
                                onClick={onDeleteRole}
                                disabled={deleting || saving}
                                className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${
                                  deleting
                                    ? 'bg-rose-900 text-rose-200 cursor-wait'
                                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                                }`}
                              >
                                {deleting ? '🗑️ Deleting…' : '🗑️ Delete (⌘⌫)'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
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
