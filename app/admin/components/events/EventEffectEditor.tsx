'use client';

import { useState } from 'react';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import { EventEffectType } from '@/lib/types/gameEvents';
import { NumberInput } from '../NumberInput';

export type EventEffectFormData =
  | { type: EventEffectType.Cash; amount: string; label?: string }
  | { type: EventEffectType.DynamicCash; expression: string; label?: string }
  | { type: EventEffectType.Exp; amount: string }
  | { type: EventEffectType.Metric; metric: GameMetric; effectType: EffectType; value: string; durationMonths: string; priority?: string };

interface EventEffectEditorProps {
  effect: EventEffectFormData;
  index: number;
  eventTitle: string;
  metricOptions: Array<{ value: GameMetric; label: string }>;
  effectTypeOptions: Array<{ value: EffectType; label: string; hint: string }>;
  onUpdate: (index: number, effect: EventEffectFormData) => void;
  onRemove: (index: number) => void;
}

export function EventEffectEditor({
  effect,
  index,
  eventTitle,
  metricOptions,
  effectTypeOptions,
  onUpdate,
  onRemove,
}: EventEffectEditorProps) {
  const [showLabelTooltip, setShowLabelTooltip] = useState<string | null>(null);

  const getGridCols = () => {
    if (effect.type === EventEffectType.Metric) return 'grid-cols-1 sm:grid-cols-6';
    if (effect.type === EventEffectType.DynamicCash) return 'grid-cols-1 sm:grid-cols-4';
    return 'grid-cols-1 sm:grid-cols-3';
  };

  const handleTypeChange = (newType: EventEffectType) => {
    let newEffect: EventEffectFormData;
    switch (newType) {
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
          priority: '',
        };
        break;
      default:
        return;
    }
    onUpdate(index, newEffect);
  };

  return (
    <div className={`grid gap-2 items-end ${getGridCols()}`}>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Type</label>
        <select
          value={effect.type}
          onChange={(e) => handleTypeChange(e.target.value as EventEffectType)}
          className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
        >
          <option value={EventEffectType.Cash}>Cash</option>
          <option value={EventEffectType.Exp}>EXP</option>
          <option value={EventEffectType.DynamicCash}>Dynamic Cash</option>
          <option value={EventEffectType.Metric}>Metric Effect</option>
        </select>
      </div>

      {effect.type === EventEffectType.Cash || effect.type === EventEffectType.Exp ? (
        <>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Amount</label>
            <NumberInput
              value={effect.amount}
              onChange={(e) => onUpdate(index, { ...effect, amount: e.target.value })}
              className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
            />
          </div>
          {effect.type === EventEffectType.Cash && (
            <div className="relative">
              <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                Label
                <button
                  type="button"
                  onClick={() => setShowLabelTooltip(showLabelTooltip === `cash-${index}` ? null : `cash-${index}`)}
                  className="text-slate-500 hover:text-slate-300 cursor-pointer text-xs"
                  aria-label="Help"
                >
                  ?
                </button>
                {showLabelTooltip === `cash-${index}` && (
                  <div className="absolute left-0 top-6 z-50 w-64 p-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg text-xs text-slate-300">
                    <p className="mb-1">Used in PnL display. Takes priority over choice/consequence names.</p>
                    <p>If empty, shows: "{eventTitle} - [choice label]"</p>
                    <button
                      type="button"
                      onClick={() => setShowLabelTooltip(null)}
                      className="mt-2 text-slate-400 hover:text-slate-200 text-xs"
                    >
                      Close
                    </button>
                  </div>
                )}
              </label>
              <input
                placeholder="e.g. Partnership Bonus, Client Payment"
                value={effect.label ?? ''}
                onChange={(e) => onUpdate(index, { ...effect, label: e.target.value })}
                className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
              />
            </div>
          )}
        </>
      ) : effect.type === EventEffectType.DynamicCash ? (
        <>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Expression</label>
            <input
              value={effect.expression}
              onChange={(e) => onUpdate(index, { ...effect, expression: e.target.value })}
              placeholder="expenses*3"
              className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
            />
          </div>
          <div className="relative">
            <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
              Label (optional)
              <button
                type="button"
                onClick={() => setShowLabelTooltip(showLabelTooltip === `dynamic-${index}` ? null : `dynamic-${index}`)}
                className="text-slate-500 hover:text-slate-300 cursor-pointer text-xs"
                aria-label="Help"
              >
                ?
              </button>
              {showLabelTooltip === `dynamic-${index}` && (
                <div className="absolute left-0 top-6 z-50 w-64 p-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg text-xs text-slate-300">
                  <p className="mb-1">Used in PnL display. Takes priority over choice/consequence names.</p>
                  <p>If empty, shows: "{eventTitle} - [choice label]"</p>
                  <button
                    type="button"
                    onClick={() => setShowLabelTooltip(null)}
                    className="mt-2 text-slate-400 hover:text-slate-200 text-xs"
                  >
                    Close
                  </button>
                </div>
              )}
            </label>
            <input
              placeholder="e.g. Partnership Bonus, Client Payment"
              value={effect.label ?? ''}
              onChange={(e) => onUpdate(index, { ...effect, label: e.target.value })}
              className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
            />
          </div>
        </>
      ) : effect.type === EventEffectType.Metric ? (
        <>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Metric</label>
            <select
              value={effect.metric}
                  onChange={(e) => onUpdate(index, { ...effect, metric: e.target.value as GameMetric })}
              className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
            >
              {metricOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Effect Type</label>
            <select
              value={effect.effectType}
                  onChange={(e) => onUpdate(index, { ...effect, effectType: e.target.value as EffectType })}
              className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
            >
              {effectTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Value</label>
            <NumberInput
              value={effect.value}
                  onChange={(e) => onUpdate(index, { ...effect, value: e.target.value })}
              className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Duration (months)</label>
            <NumberInput
              min="0"
              step="1"
              placeholder="Empty = permanent"
              value={effect.durationMonths}
                  onChange={(e) => onUpdate(index, { ...effect, durationMonths: e.target.value })}
              className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
            />
          </div>
        </>
      ) : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-xs text-rose-300 hover:text-rose-200 px-2 py-1 rounded"
        >
          Remove
        </button>
      </div>
    </div>
  );
}