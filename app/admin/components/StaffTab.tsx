'use client';

import { GameMetric, EffectType } from '@/lib/game/effectManager';
import type { StaffRoleConfig, StaffPreset } from '@/lib/game/staffConfig';
import type { GameFlag } from '@/lib/data/flagRepository';
import type { GameCondition } from '@/lib/types/conditions';
import type { Requirement } from '@/lib/game/types';
import { RequirementsSelector } from './RequirementsSelector';
import { EffectsList } from './EffectsList';
import { makeUniqueId, slugify } from './utils';

interface StaffTabProps {
  industryId: string;
  staffRoles: StaffRoleConfig[];
  staffPresets: StaffPreset[];
  staffLoading: boolean;
  staffStatus: string | null;
  selectedRoleId: string;
  isCreatingRole: boolean;
  roleForm: {
    id: string;
    name: string;
    salary: string;
    effects: Array<{ metric: GameMetric; type: EffectType; value: string }>;
    spriteImage?: string;
    setsFlag?: string;
    requirements: Requirement[];
  };
  roleSaving: boolean;
  roleDeleting: boolean;
  selectedPresetId: string;
  isCreatingPreset: boolean;
  presetForm: {
    id: string;
    roleId: string;
    name: string;
    salary?: string;
    serviceSpeed?: string;
  };
  presetSaving: boolean;
  presetDeleting: boolean;
  flags: GameFlag[];
  flagsLoading: boolean;
  conditions: GameCondition[];
  conditionsLoading: boolean;
  metricOptions: Array<{ value: GameMetric; label: string }>;
  effectTypeOptions: Array<{ value: EffectType; label: string; hint: string }>;
  onSelectRole: (role: StaffRoleConfig) => void;
  onCreateRole: () => void;
  onSaveRole: () => Promise<void>;
  onDeleteRole: () => Promise<void>;
  onResetRole: () => void;
  onUpdateRoleForm: (updates: Partial<StaffTabProps['roleForm']>) => void;
  onSelectPreset: (preset: StaffPreset) => void;
  onCreatePreset: () => void;
  onSavePreset: () => Promise<void>;
  onDeletePreset: () => Promise<void>;
  onResetPreset: () => void;
  onUpdatePresetForm: (updates: Partial<StaffTabProps['presetForm']>) => void;
}

export function StaffTab({
  industryId,
  staffRoles,
  staffPresets,
  staffLoading,
  staffStatus,
  selectedRoleId,
  isCreatingRole,
  roleForm,
  roleSaving,
  roleDeleting,
  selectedPresetId,
  isCreatingPreset,
  presetForm,
  presetSaving,
  presetDeleting,
  flags,
  flagsLoading,
  conditions,
  conditionsLoading,
  metricOptions,
  effectTypeOptions,
  onSelectRole,
  onCreateRole,
  onSaveRole,
  onDeleteRole,
  onResetRole,
  onUpdateRoleForm,
  onSelectPreset,
  onCreatePreset,
  onSavePreset,
  onDeletePreset,
  onResetPreset,
  onUpdatePresetForm,
}: StaffTabProps) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-semibold">Staff</h2>
        <p className="text-sm text-slate-400 mt-1">Manage staff roles and initial presets for this industry.</p>
      </div>
      <div className="p-6 space-y-6">
        {!industryId ? (
          <div className="text-sm text-slate-400">Select or create an industry first.</div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onCreateRole}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-indigo-500 text-indigo-200 hover:bg-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!industryId}
              >
                + New Role
              </button>
              {staffStatus && <span className="text-sm text-slate-300">{staffStatus}</span>}
            </div>

            {staffLoading ? (
              <div className="text-sm text-slate-400">Loading staff…</div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Roles</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {staffRoles.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => onSelectRole(role)}
                        className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                          selectedRoleId === role.id && !isCreatingRole
                            ? 'border-indigo-400 bg-indigo-500/10 text-indigo-200'
                            : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                        }`}
                      >
                        {role.name}
                      </button>
                    ))}
                  </div>

                  {(selectedRoleId || isCreatingRole) && (
                    <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1">Role ID</label>
                        <input
                          value={roleForm.id}
                          onChange={(e) => onUpdateRoleForm({ id: e.target.value })}
                          disabled={!isCreatingRole && !!selectedRoleId}
                          className={`w-full rounded-lg border px-3 py-2 text-slate-200 ${
                            isCreatingRole || !selectedRoleId
                              ? 'bg-slate-900 border-slate-600'
                              : 'bg-slate-800 border-slate-700 cursor-not-allowed'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1">Name</label>
                        <input
                          value={roleForm.name}
                          onChange={(e) => onUpdateRoleForm({ name: e.target.value })}
                          onBlur={() => {
                            if (!roleForm.id && roleForm.name.trim()) {
                              const base = slugify(roleForm.name.trim());
                              const unique = makeUniqueId(base, new Set(staffRoles.map((r) => r.id)));
                              onUpdateRoleForm({ id: unique });
                            }
                          }}
                          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1">Salary</label>
                        <input
                          type="number"
                          min="0"
                          value={roleForm.salary}
                          onChange={(e) => onUpdateRoleForm({ salary: e.target.value })}
                          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1">Sets Flag</label>
                        <select
                          value={roleForm.setsFlag || ''}
                          onChange={(e) => onUpdateRoleForm({ setsFlag: e.target.value })}
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
                          requirements={roleForm.requirements || []}
                          onRequirementsChange={(requirements) => onUpdateRoleForm({ requirements })}
                        />
                      </div>

                      <EffectsList
                        effects={roleForm.effects}
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
                        onEffectsChange={(effects) => onUpdateRoleForm({ effects })}
                      />
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-300 mb-1">Sprite Image Path</label>
                        <input
                          value={roleForm.spriteImage || ''}
                          onChange={(e) => onUpdateRoleForm({ spriteImage: e.target.value })}
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
                          disabled={roleSaving || roleDeleting}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                            roleSaving
                              ? 'bg-indigo-900 text-indigo-200 cursor-wait'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          }`}
                        >
                          {roleSaving ? 'Saving…' : 'Save Role'}
                        </button>
                        <button
                          type="button"
                          onClick={onResetRole}
                          disabled={roleSaving || roleDeleting}
                          className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                        >
                          {isCreatingRole ? 'Cancel' : 'Reset'}
                        </button>
                        {!isCreatingRole && selectedRoleId && (
                          <button
                            type="button"
                            onClick={onDeleteRole}
                            disabled={roleDeleting || roleSaving}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                              roleDeleting
                                ? 'bg-rose-900 text-rose-200 cursor-wait'
                                : 'bg-rose-600 hover:bg-rose-500 text-white'
                            }`}
                          >
                            {roleDeleting ? 'Deleting…' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </form>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Initial Presets</h3>
                    <button
                      onClick={onCreatePreset}
                      className="px-3 py-2 text-sm font-medium rounded-lg border border-emerald-500 text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!industryId}
                    >
                      + New Preset
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {staffPresets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => onSelectPreset(preset)}
                        className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                          selectedPresetId === preset.id && !isCreatingPreset
                            ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200'
                            : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>

                  {(selectedPresetId || isCreatingPreset) && (
                    <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1">Preset ID</label>
                        <input
                          value={presetForm.id}
                          onChange={(e) => onUpdatePresetForm({ id: e.target.value })}
                          disabled={!isCreatingPreset && !!selectedPresetId}
                          className={`w-full rounded-lg border px-3 py-2 text-slate-200 ${
                            isCreatingPreset || !selectedPresetId
                              ? 'bg-slate-900 border-slate-600'
                              : 'bg-slate-800 border-slate-700 cursor-not-allowed'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1">Name (optional)</label>
                        <input
                          value={presetForm.name}
                          onChange={(e) => onUpdatePresetForm({ name: e.target.value })}
                          onBlur={() => {
                            if (!presetForm.id && presetForm.name.trim()) {
                              const base = slugify(presetForm.name.trim());
                              const unique = makeUniqueId(base, new Set(staffPresets.map((p) => p.id)));
                              onUpdatePresetForm({ id: unique });
                            }
                          }}
                          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1">Role</label>
                        <select
                          value={presetForm.roleId}
                          onChange={(e) => onUpdatePresetForm({ roleId: e.target.value })}
                          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                        >
                          {staffRoles.map((role) => (
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
                          value={presetForm.salary ?? ''}
                          onChange={(e) => onUpdatePresetForm({ salary: e.target.value })}
                          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1">Service Speed Override</label>
                        <input
                          type="number"
                          min="0"
                          value={presetForm.serviceSpeed ?? ''}
                          onChange={(e) => onUpdatePresetForm({ serviceSpeed: e.target.value })}
                          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                        />
                      </div>
                      <div className="md:col-span-2 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={onSavePreset}
                          disabled={presetSaving || presetDeleting}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                            presetSaving
                              ? 'bg-emerald-900 text-emerald-200 cursor-wait'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {presetSaving ? 'Saving…' : 'Save Preset'}
                        </button>
                        <button
                          type="button"
                          onClick={onResetPreset}
                          disabled={presetSaving || presetDeleting}
                          className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                        >
                          {isCreatingPreset ? 'Cancel' : 'Reset'}
                        </button>
                        {!isCreatingPreset && selectedPresetId && (
                          <button
                            type="button"
                            onClick={onDeletePreset}
                            disabled={presetDeleting || presetSaving}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                              presetDeleting
                                ? 'bg-rose-900 text-rose-200 cursor-wait'
                                : 'bg-rose-600 hover:bg-rose-500 text-white'
                            }`}
                          >
                            {presetDeleting ? 'Deleting…' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

