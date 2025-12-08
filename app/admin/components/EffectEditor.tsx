'use client';

import { GameMetric, EffectType } from '@/lib/game/effectManager';

export interface EffectFormData {
  metric: GameMetric;
  type: EffectType;
  value: string;
  durationMonths?: string; // Optional - only for marketing campaigns
}

interface EffectEditorProps {
  effect: EffectFormData;
  index: number;
  metricOptions: Array<{ value: GameMetric; label: string }>;
  effectTypeOptions: Array<{ value: EffectType; label: string; hint: string }>;
  showDuration?: boolean; // Whether to show duration field (default: false)
  onUpdate: (index: number, updates: Partial<EffectFormData>) => void;
  onRemove: (index: number) => void;
}

export function EffectEditor({
  effect,
  index,
  metricOptions,
  effectTypeOptions,
  showDuration = false,
  onUpdate,
  onRemove,
}: EffectEditorProps) {
  const gridCols = showDuration ? 'sm:grid-cols-5' : 'sm:grid-cols-4';

  return (
    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
      <div className={`grid grid-cols-1 ${gridCols} gap-2 items-start`}>
        {/* Metric Selector */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Metric</label>
          <select
            value={effect.metric}
            onChange={(e) => onUpdate(index, { metric: e.target.value as GameMetric })}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
          >
            {metricOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Effect Type Selector */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Type</label>
          <select
            value={effect.type}
            onChange={(e) => onUpdate(index, { type: e.target.value as EffectType })}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
            title={effectTypeOptions.find((opt) => opt.value === effect.type)?.hint}
          >
            {effectTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            {effectTypeOptions.find((opt) => opt.value === effect.type)?.hint}
          </p>
        </div>

        {/* Effect Value Input */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Effect Value</label>
          <input
            placeholder="e.g. 10, -5, 0.5"
            type="number"
            step="any"
            value={effect.value}
            onChange={(e) => onUpdate(index, { value: e.target.value })}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
          />
          <p className="text-xs text-slate-500 mt-1">Amount to add/change</p>
        </div>

        {/* Duration Input (optional) */}
        {showDuration && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Duration (months)</label>
            <input
              placeholder="Leave empty for permanent"
              type="number"
              min="0"
              value={effect.durationMonths ?? ''}
              onChange={(e) => onUpdate(index, { durationMonths: e.target.value })}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
            />
            <p className="text-xs text-slate-500 mt-1">Empty = permanent effect</p>
          </div>
        )}

        {/* Remove Button */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="w-full px-2 py-2 text-xs rounded-md border border-rose-600 text-rose-200 hover:bg-rose-900"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

