'use client';

import { useEffect } from 'react';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import type { GameFlag } from '@/lib/data/flagRepository';
import type { MarketingCampaign } from '@/lib/store/slices/marketingSlice';
import type { Requirement, UpgradeDefinition } from '@/lib/game/types';
import type { StaffRoleConfig } from '@/lib/game/staffConfig';
import { RequirementsSelector } from './RequirementsSelector';
import { EffectsList } from './EffectsList';
import { makeUniqueId, slugify } from './utils';

interface MarketingTabProps {
  campaigns: MarketingCampaign[];
  campaignsLoading: boolean;
  campaignStatus: string | null;
  selectedCampaignId: string;
  isCreatingCampaign: boolean;
  campaignForm: {
    id: string;
    name: string;
    description: string;
    cost: string;
    timeCost?: string;
    cooldownSeconds: string;
    setsFlag?: string;
    requirements: Requirement[];
    order: string;
  };
  campaignEffectsForm: Array<{
    metric: GameMetric;
    type: EffectType;
    value: string;
    durationSeconds: string;
  }>;
  campaignSaving: boolean;
  campaignDeleting: boolean;
  flags: GameFlag[];
  flagsLoading: boolean;
  upgrades?: UpgradeDefinition[];
  staffRoles?: StaffRoleConfig[];
  metricOptions: Array<{ value: GameMetric; label: string }>;
  effectTypeOptions: Array<{ value: EffectType; label: string; hint: string }>;
  onSelectCampaign: (campaign: MarketingCampaign) => void;
  onCreateCampaign: () => void;
  onSaveCampaign: () => Promise<void>;
  onDeleteCampaign: () => Promise<void>;
  onReset: () => void;
  onUpdateForm: (updates: Partial<MarketingTabProps['campaignForm']>) => void;
  onUpdateEffects: (effects: MarketingTabProps['campaignEffectsForm']) => void;
}

export function MarketingTab({
  campaigns,
  campaignsLoading,
  campaignStatus,
  selectedCampaignId,
  isCreatingCampaign,
  campaignForm,
  campaignEffectsForm,
  campaignSaving,
  campaignDeleting,
  flags,
  flagsLoading,
  upgrades = [],
  staffRoles = [],
  metricOptions,
  effectTypeOptions,
  onSelectCampaign,
  onCreateCampaign,
  onSaveCampaign,
  onDeleteCampaign,
  onReset,
  onUpdateForm,
  onUpdateEffects,
}: MarketingTabProps) {
  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        if ((selectedCampaignId || isCreatingCampaign) && !campaignSaving && !campaignDeleting) {
          onSaveCampaign();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedCampaignId, isCreatingCampaign, campaignSaving, campaignDeleting, onSaveCampaign]);

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-semibold">Marketing Campaigns</h2>
        <p className="text-sm text-slate-400 mt-1">Create campaigns with cost, duration, and temporary effects.</p>
      </div>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onCreateCampaign}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-pink-500 text-pink-200 hover:bg-pink-500/10"
          >
            + New Campaign
          </button>
          {campaignStatus && <span className="text-sm text-slate-300">{campaignStatus}</span>}
        </div>

        {campaignsLoading ? (
          <div className="text-sm text-slate-400">Loading campaigns…</div>
        ) : campaigns.length === 0 && !isCreatingCampaign ? (
          <div className="text-sm text-slate-400">No campaigns yet.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {campaigns.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectCampaign(c)}
                  className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                    selectedCampaignId === c.id && !isCreatingCampaign
                      ? 'border-pink-400 bg-pink-500/10 text-pink-200'
                      : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {(selectedCampaignId || isCreatingCampaign) && (
              <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Campaign ID</label>
                  <input
                    value={campaignForm.id}
                    onChange={(e) => onUpdateForm({ id: e.target.value })}
                    disabled={!isCreatingCampaign && !!selectedCampaignId}
                    className={`w-full rounded-lg border px-3 py-2 text-slate-200 ${
                      isCreatingCampaign || !selectedCampaignId
                        ? 'bg-slate-900 border-slate-600'
                        : 'bg-slate-800 border-slate-700 cursor-not-allowed'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Name</label>
                  <input
                    value={campaignForm.name}
                    onChange={(e) => onUpdateForm({ name: e.target.value })}
                    onBlur={() => {
                      if (!campaignForm.id && campaignForm.name.trim()) {
                        const base = slugify(campaignForm.name.trim());
                        const unique = makeUniqueId(base, new Set(campaigns.map((c) => c.id)));
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
                    value={campaignForm.description}
                    onChange={(e) => onUpdateForm({ description: e.target.value })}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Cost (Cash)</label>
                  <input
                    type="number"
                    min="0"
                    value={campaignForm.cost}
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
                    value={campaignForm.timeCost || ''}
                    onChange={(e) => onUpdateForm({ timeCost: e.target.value })}
                    placeholder="Leave empty for cash-only"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  />
                  <p className="text-xs text-slate-400 mt-1">Time cost (can be combined with cash cost)</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Cooldown (seconds)</label>
                  <input
                    type="number"
                    min="0"
                    value={campaignForm.cooldownSeconds}
                    onChange={(e) => onUpdateForm({ cooldownSeconds: e.target.value })}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Order</label>
                  <input
                    type="number"
                    value={campaignForm.order}
                    onChange={(e) => onUpdateForm({ order: e.target.value })}
                    placeholder="0"
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  />
                  <p className="text-xs text-slate-400 mt-1">Lower numbers appear first (default: 0)</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1">Sets Flag</label>
                  <select
                    value={campaignForm.setsFlag || ''}
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
                    staffRoles={staffRoles}
                    flagsLoading={flagsLoading}
                    requirements={campaignForm.requirements || []}
                    onRequirementsChange={(requirements) => onUpdateForm({ requirements })}
                  />
                </div>

                <EffectsList
                  effects={campaignEffectsForm.map(ef => ({
                    ...ef,
                    durationSeconds: ef.durationSeconds ?? '',
                  }))}
                  metricOptions={metricOptions}
                  effectTypeOptions={effectTypeOptions}
                  showDuration={true}
                  title="Effects (temporary)"
                  description="Add = flat, Percent = +/-%, Multiply = × factor, Set = exact value."
                  defaultEffect={{
                    metric: GameMetric.LeadsPerMonth,
                    type: EffectType.Add,
                    value: '0',
                    durationSeconds: '',
                  }}
                  onEffectsChange={(effects) => {
                    onUpdateEffects(effects.map(ef => ({
                      ...ef,
                      durationSeconds: ef.durationSeconds || '',
                    })));
                  }}
                />

                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={onSaveCampaign}
                    disabled={campaignSaving || campaignDeleting}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      campaignSaving
                        ? 'bg-pink-900 text-pink-200 cursor-wait'
                        : 'bg-pink-600 hover:bg-pink-500 text-white'
                    }`}
                  >
                    {campaignSaving ? 'Saving…' : 'Save Campaign'}
                  </button>
                  <button
                    type="button"
                    onClick={onReset}
                    disabled={campaignSaving || campaignDeleting}
                    className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                  >
                    {isCreatingCampaign ? 'Cancel' : 'Reset'}
                  </button>
                  {!isCreatingCampaign && selectedCampaignId && (
                    <button
                      type="button"
                      onClick={onDeleteCampaign}
                      disabled={campaignDeleting || campaignSaving}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        campaignDeleting
                          ? 'bg-rose-900 text-rose-200 cursor-wait'
                          : 'bg-rose-600 hover:bg-rose-500 text-white'
                      }`}
                    >
                      {campaignDeleting ? 'Deleting…' : 'Delete'}
                    </button>
                  )}
                </div>

                {/* Floating Save Button */}
                {(selectedCampaignId || isCreatingCampaign) && (
                  <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                    <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl px-6 py-3 shadow-2xl">
                      <button
                        type="button"
                        onClick={onSaveCampaign}
                        disabled={campaignSaving || campaignDeleting}
                        className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${
                          campaignSaving
                            ? 'bg-pink-900 text-pink-200 cursor-wait'
                            : 'bg-pink-600 hover:bg-pink-500 text-white'
                        }`}
                      >
                        {campaignSaving ? '💾 Saving…' : '💾 Save Campaign (⌘↵)'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

