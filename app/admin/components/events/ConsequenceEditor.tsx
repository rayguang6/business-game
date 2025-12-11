'use client';

import { GameMetric, EffectType } from '@/lib/game/effectManager';
import { EventEffectType } from '@/lib/types/gameEvents';
import { NumberInput } from '../NumberInput';
import { EventEffectEditor, EventEffectFormData } from './EventEffectEditor';
import { DelayedConsequenceEditor, DelayedConsequenceFormData } from './DelayedConsequenceEditor';

export interface ConsequenceFormData {
  id: string;
  label: string;
  description: string;
  weight: string;
  effects: EventEffectFormData[];
  delayedConsequence?: DelayedConsequenceFormData;
}

interface ConsequenceEditorProps {
  consequenceForm: ConsequenceFormData;
  isCreatingConsequence: boolean;
  eventTitle: string;
  metricOptions: Array<{ value: GameMetric; label: string }>;
  effectTypeOptions: Array<{ value: EffectType; label: string; hint: string }>;
  flags: import('@/lib/data/flagRepository').GameFlag[];
  flagsLoading: boolean;
  upgrades?: import('@/lib/game/types').UpgradeDefinition[];
  staffRoles?: import('@/lib/game/staffConfig').StaffRoleConfig[];
  marketingCampaigns?: import('@/lib/store/slices/marketingSlice').MarketingCampaign[];
  onUpdate: (updates: Partial<ConsequenceFormData>) => void;
  onSave: () => void;
  onReset: () => void;
  onDelete?: () => void;
}

export function ConsequenceEditor({
  consequenceForm,
  isCreatingConsequence,
  eventTitle,
  metricOptions,
  effectTypeOptions,
  flags,
  flagsLoading,
  upgrades = [],
  staffRoles = [],
  marketingCampaigns = [],
  onUpdate,
  onSave,
  onReset,
  onDelete,
}: ConsequenceEditorProps) {
  const updateEffects = (index: number, effect: EventEffectFormData) => {
    const newEffects = [...consequenceForm.effects];
    newEffects[index] = effect;
    onUpdate({ effects: newEffects });
  };

  const removeEffect = (index: number) => {
    const newEffects = consequenceForm.effects.filter((_, i) => i !== index);
    onUpdate({ effects: newEffects });
  };

  const addEffect = (effectType: EventEffectType) => {
    let newEffect: EventEffectFormData;
    switch (effectType) {
      case EventEffectType.Cash:
        newEffect = { type: EventEffectType.Cash, amount: '0', label: '' };
        break;
      case EventEffectType.Exp:
        newEffect = { type: EventEffectType.Exp, amount: '0' };
        break;
      case EventEffectType.DynamicCash:
        newEffect = { type: EventEffectType.DynamicCash, expression: 'expenses*1', label: '' };
        break;
      case EventEffectType.Metric:
        newEffect = {
          type: EventEffectType.Metric,
          metric: metricOptions[0].value,
          effectType: effectTypeOptions[0].value,
          value: '0',
          durationMonths: '',
        };
        break;
      default:
        return;
    }
    onUpdate({ effects: [...consequenceForm.effects, newEffect] });
  };

  return (
    <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-700 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">Consequence ID (optional)</label>
          <input
            value={consequenceForm.id}
            onChange={(e) => onUpdate({ id: e.target.value })}
            placeholder="Auto-generated if empty"
            disabled={!isCreatingConsequence}
            className={`w-full rounded-lg border px-3 py-2 text-slate-200 ${
              isCreatingConsequence ? 'bg-slate-900 border-slate-600' : 'bg-slate-800 border-slate-700 cursor-not-allowed'
            }`}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">Weight</label>
          <NumberInput
            min="1"
            value={consequenceForm.weight}
            onChange={(e) => onUpdate({ weight: e.target.value })}
            className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-1">Label (optional)</label>
        <input
          value={consequenceForm.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-1">Description (optional)</label>
        <textarea
          rows={2}
          value={consequenceForm.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
        />
      </div>

      {/* Effects editor */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-300">Effects</span>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => addEffect(EventEffectType.Cash)}
              className="px-2 py-1 text-xs rounded border border-emerald-500 text-emerald-200 hover:bg-emerald-500/10"
            >
              + Cash
            </button>
            <button
              type="button"
              onClick={() => addEffect(EventEffectType.Exp)}
              className="px-2 py-1 text-xs rounded border border-emerald-500 text-emerald-200 hover:bg-emerald-500/10"
            >
              + Skill Level
            </button>
            <button
              type="button"
              onClick={() => addEffect(EventEffectType.DynamicCash)}
              className="px-2 py-1 text-xs rounded border border-purple-500 text-purple-200 hover:bg-purple-500/10"
            >
              + Dynamic Cash
            </button>
            <button
              type="button"
              onClick={() => addEffect(EventEffectType.Metric)}
              className="px-2 py-1 text-xs rounded border border-indigo-500 text-indigo-200 hover:bg-indigo-500/10"
            >
              + Metric Effect
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {consequenceForm.effects.map((ef, idx) => (
            <EventEffectEditor
              key={idx}
              effect={ef}
              index={idx}
              eventTitle={eventTitle}
              metricOptions={metricOptions}
              effectTypeOptions={effectTypeOptions}
              onUpdate={updateEffects}
              onRemove={removeEffect}
            />
          ))}
        </div>
      </div>

      {/* Delayed Consequence */}
      <DelayedConsequenceEditor
        delayedConsequence={consequenceForm.delayedConsequence}
        eventTitle={eventTitle}
        metricOptions={metricOptions}
        effectTypeOptions={effectTypeOptions}
        flags={flags}
        flagsLoading={flagsLoading}
        upgrades={upgrades}
        staffRoles={staffRoles}
        marketingCampaigns={marketingCampaigns}
        onUpdate={(delayedConsequence) => onUpdate({ delayedConsequence })}
      />

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSave}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition bg-amber-600 hover:bg-amber-500 text-white"
        >
          Save Consequence
        </button>
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
        >
          {isCreatingConsequence ? 'Cancel' : 'Reset'}
        </button>
        {onDelete && !isCreatingConsequence && (
          <button
            type="button"
            onClick={onDelete}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition bg-rose-600 hover:bg-rose-500 text-white"
          >
            Delete Consequence
          </button>
        )}
      </div>
    </div>
  );
}