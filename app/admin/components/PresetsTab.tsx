'use client';

import { useEffect } from 'react';
import type { StaffPreset, StaffRoleConfig } from '@/lib/game/staffConfig';
import { makeUniqueId, slugify } from './utils';

interface PresetsTabProps {
  industryId: string;
  presets: StaffPreset[];
  roles: StaffRoleConfig[];
  loading: boolean;
  status: string | null;
  selectedId: string;
  isCreating: boolean;
  form: {
    id: string;
    roleId: string;
    name: string;
    salary?: string;
    serviceSpeed?: string;
  };
  saving: boolean;
  deleting: boolean;
  onSelectPreset: (preset: StaffPreset) => void;
  onCreatePreset: () => void;
  onSavePreset: () => Promise<void>;
  onDeletePreset: () => Promise<void>;
  onReset: () => void;
  onUpdateForm: (updates: Partial<PresetsTabProps['form']>) => void;
}

export function PresetsTab({
  industryId,
  presets,
  roles,
  loading,
  status,
  selectedId,
  isCreating,
  form,
  saving,
  deleting,
  onSelectPreset,
  onCreatePreset,
  onSavePreset,
  onDeletePreset,
  onReset,
  onUpdateForm,
}: PresetsTabProps) {
  // Keyboard shortcuts for save and delete
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Save shortcut (Command/Ctrl + Enter)
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        if ((selectedId || isCreating) && !saving && !deleting) {
          onSavePreset();
        }
      }
      // Delete shortcut (Command + Delete/Backspace) - prioritize Mac
      if (event.metaKey && (event.key === 'Delete' || event.key === 'Backspace') && !isCreating && selectedId) {
        event.preventDefault();
        event.stopPropagation();
        if (!saving && !deleting) {
          onDeletePreset();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [selectedId, isCreating, saving, deleting, onSavePreset, onDeletePreset]);

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-semibold">Staff Presets</h2>
        <p className="text-sm text-slate-400 mt-1">Manage initial staff presets for this industry.</p>
      </div>
      <div className="p-6 space-y-6">
        {!industryId ? (
          <div className="text-sm text-slate-400">Select or create an industry first.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onCreatePreset}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-emerald-500 text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!industryId || roles.length === 0}
              >
                + New Preset
              </button>
              {status && <span className="text-sm text-slate-300">{status}</span>}
            </div>

            {loading ? (
              <div className="text-sm text-slate-400">Loading presets…</div>
            ) : (
              <div className="space-y-4">
                {presets.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {presets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => onSelectPreset(preset)}
                        className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                          selectedId === preset.id && !isCreating
                            ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200'
                            : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                )}

                {(selectedId || isCreating) && (
                  roles.length > 0 ? (
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Preset ID</label>
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
                            const unique = makeUniqueId(base, new Set(presets.map((p) => p.id)));
                            onUpdateForm({ id: unique });
                          }
                        }}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Role</label>
                      <select
                        value={form.roleId}
                        onChange={(e) => onUpdateForm({ roleId: e.target.value })}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Salary Override</label>
                      <input
                        type="number"
                        min="0"
                        value={form.salary ?? ''}
                        onChange={(e) => onUpdateForm({ salary: e.target.value })}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Service Speed Override</label>
                      <input
                        type="number"
                        min="0"
                        value={form.serviceSpeed ?? ''}
                        onChange={(e) => onUpdateForm({ serviceSpeed: e.target.value })}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>
                    <div className="md:col-span-2 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={onSavePreset}
                        disabled={saving || deleting}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                          saving
                            ? 'bg-emerald-900 text-emerald-200 cursor-wait'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {saving ? 'Saving…' : 'Save Preset'}
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
                          onClick={onDeletePreset}
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
                              onClick={onSavePreset}
                              disabled={saving || deleting}
                              className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${
                                saving
                                  ? 'bg-emerald-900 text-emerald-200 cursor-wait'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              }`}
                            >
                              {saving ? '💾 Saving…' : '💾 Save (⌘↵)'}
                            </button>
                            {!isCreating && selectedId && (
                              <button
                                type="button"
                                onClick={onDeletePreset}
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
                  ) : (
                    <div className="text-sm text-rose-400 p-4 border border-rose-500/20 rounded-lg bg-rose-500/10">
                      Please create at least one role first before creating presets. Go to the Roles tab to create a role.
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
