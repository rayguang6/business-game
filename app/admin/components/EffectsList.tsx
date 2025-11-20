'use client';

import { GameMetric, EffectType } from '@/lib/game/effectManager';
import { EffectEditor, type EffectFormData } from './EffectEditor';

interface EffectsListProps {
  effects: EffectFormData[];
  metricOptions: Array<{ value: GameMetric; label: string }>;
  effectTypeOptions: Array<{ value: EffectType; label: string; hint: string }>;
  showDuration?: boolean; // Whether to show duration field (default: false)
  title?: string; // Optional custom title
  description?: string; // Optional description text
  emptyMessage?: string; // Message when no effects
  defaultEffect?: Partial<EffectFormData>; // Default values for new effects
  onEffectsChange: (effects: EffectFormData[]) => void;
}

export function EffectsList({
  effects,
  metricOptions,
  effectTypeOptions,
  showDuration = false,
  title = 'Effects',
  description,
  emptyMessage = 'No effects added yet. Click "+ Add Effect" to add one.',
  defaultEffect = {
    metric: metricOptions[0]?.value ?? GameMetric.ServiceSpeedMultiplier,
    type: EffectType.Add,
    value: '0',
    ...(showDuration ? { durationSeconds: '' } : {}),
  },
  onEffectsChange,
}: EffectsListProps) {
  const handleUpdate = (index: number, updates: Partial<EffectFormData>) => {
    const newEffects = [...effects];
    newEffects[index] = { ...newEffects[index], ...updates };
    onEffectsChange(newEffects);
  };

  const handleRemove = (index: number) => {
    const newEffects = effects.filter((_, i) => i !== index);
    onEffectsChange(newEffects);
  };

  const handleAdd = () => {
    const newEffect: EffectFormData = {
      metric: defaultEffect.metric ?? (metricOptions[0]?.value ?? GameMetric.ServiceSpeedMultiplier),
      type: defaultEffect.type ?? EffectType.Add,
      value: defaultEffect.value ?? '0',
      ...(showDuration ? { durationSeconds: defaultEffect.durationSeconds ?? '' } : {}),
    };
    console.log('[EffectsList] Adding new effect:', newEffect);
    console.log('[EffectsList] Current effects:', effects);
    onEffectsChange([...effects, newEffect]);
  };

  return (
    <div className="md:col-span-2">
      <div className="flex items-start justify-between mb-2">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">{title}</label>
          {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="px-2 py-1 text-xs rounded-md border border-slate-600 text-slate-200 hover:bg-slate-800"
        >
          + Add Effect
        </button>
      </div>
      <div className="space-y-3">
        {effects.map((effect, index) => (
          <EffectEditor
            key={index}
            effect={effect}
            index={index}
            metricOptions={metricOptions}
            effectTypeOptions={effectTypeOptions}
            showDuration={showDuration}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
          />
        ))}
        {effects.length === 0 && (
          <p className="text-xs text-slate-500 italic">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
}

