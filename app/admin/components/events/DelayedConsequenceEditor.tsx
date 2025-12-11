'use client';

import { useState } from 'react';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import type { Requirement } from '@/lib/game/types';
import { EventEffectType } from '@/lib/types/gameEvents';
import { RequirementsSelector } from '../RequirementsSelector';
import type { GameCondition } from '@/lib/types/conditions';
import { NumberInput } from '../NumberInput';
import { EventEffectEditor, EventEffectFormData } from './EventEffectEditor';

export interface DelayedConsequenceFormData {
  id: string;
  delaySeconds: string;
  successRequirements: Requirement[];
  successEffects: EventEffectFormData[];
  failureEffects?: EventEffectFormData[];
  label?: string;
  successDescription?: string;
  failureDescription?: string;
}

interface DelayedConsequenceEditorProps {
  delayedConsequence: DelayedConsequenceFormData | undefined;
  eventTitle: string;
  metricOptions: Array<{ value: GameMetric; label: string }>;
  effectTypeOptions: Array<{ value: EffectType; label: string; hint: string }>;
  industryId: string;
  onUpdate: (delayedConsequence: DelayedConsequenceFormData | undefined) => void;
}

export function DelayedConsequenceEditor({
  delayedConsequence,
  eventTitle,
  metricOptions,
  effectTypeOptions,
  industryId,
  onUpdate,
}: DelayedConsequenceEditorProps) {
  const [showLabelTooltip, setShowLabelTooltip] = useState<string | null>(null);

  const updateSuccessEffects = (index: number, effect: EventEffectFormData) => {
    if (!delayedConsequence) return;
    const newEffects = [...delayedConsequence.successEffects];
    newEffects[index] = effect;
    onUpdate({ ...delayedConsequence, successEffects: newEffects });
  };

  const removeSuccessEffect = (index: number) => {
    if (!delayedConsequence) return;
    const newEffects = delayedConsequence.successEffects.filter((_, i) => i !== index);
    onUpdate({ ...delayedConsequence, successEffects: newEffects });
  };

  const addSuccessEffect = (effectType: EventEffectType) => {
    if (!delayedConsequence) return;
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
    onUpdate({ ...delayedConsequence, successEffects: [...delayedConsequence.successEffects, newEffect] });
  };

  const updateFailureEffects = (index: number, effect: EventEffectFormData) => {
    if (!delayedConsequence?.failureEffects) return;
    const newEffects = [...delayedConsequence.failureEffects];
    newEffects[index] = effect;
    onUpdate({ ...delayedConsequence, failureEffects: newEffects });
  };

  const removeFailureEffect = (index: number) => {
    if (!delayedConsequence?.failureEffects) return;
    const newEffects = delayedConsequence.failureEffects.filter((_, i) => i !== index);
    onUpdate({ ...delayedConsequence, failureEffects: newEffects });
  };

  const addFailureEffect = (effectType: EventEffectType) => {
    if (!delayedConsequence) return;
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
    onUpdate({ ...delayedConsequence, failureEffects: [...(delayedConsequence.failureEffects || []), newEffect] });
  };

  return (
    <div className="space-y-4">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-slate-300">Delayed Consequence (optional)</span>
            <button
              type="button"
              onClick={() => setShowLabelTooltip(showLabelTooltip === 'delayed-consequence' ? null : 'delayed-consequence')}
              className="text-slate-500 hover:text-slate-300 cursor-pointer text-xs"
              aria-label="Help"
            >
              ?
            </button>
            {showLabelTooltip === 'delayed-consequence' && (
              <div className="absolute left-0 top-6 z-50 w-64 p-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg text-xs text-slate-300">
                <p className="mb-1">Delayed consequences trigger after a specified delay and can have success/failure outcomes.</p>
                <p>Success effects apply when requirements are met (or no requirements set).</p>
                <p>Failure effects apply only when requirements are set but not met.</p>
                <button
                  type="button"
                  onClick={() => setShowLabelTooltip(null)}
                  className="mt-2 text-slate-400 hover:text-slate-200 text-xs"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (delayedConsequence) {
              onUpdate(undefined);
            } else {
              onUpdate({
                id: `delayed-${Date.now()}`,
                delaySeconds: '10',
                successRequirements: [],
                successEffects: [],
                failureEffects: undefined,
                label: '',
                successDescription: '',
                failureDescription: '',
              });
            }
          }}
          className={`px-2 py-1 text-xs rounded border ${
            delayedConsequence
              ? 'border-red-500 text-red-200 hover:bg-red-500/10'
              : 'border-blue-500 text-blue-200 hover:bg-blue-500/10'
          }`}
        >
          {delayedConsequence ? 'Remove Delayed' : '+ Add Delayed'}
        </button>
      </div>

      {delayedConsequence && (
        <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-700 space-y-4">
          {/* Basic fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Delay (seconds)</label>
              <NumberInput
                min="1"
                value={delayedConsequence.delaySeconds}
                onChange={(e) => onUpdate({ ...delayedConsequence, delaySeconds: e.target.value })}
                className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Label</label>
              <input
                value={delayedConsequence.label ?? ''}
                onChange={(e) => onUpdate({ ...delayedConsequence, label: e.target.value })}
                className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
              />
            </div>
          </div>

          {/* Success Requirements */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Success Requirements (optional)</label>
            <RequirementsSelector
              industryId={industryId}
              requirements={delayedConsequence.successRequirements}
              onRequirementsChange={(requirements) => onUpdate({ ...delayedConsequence, successRequirements: requirements })}
            />
          </div>

          {/* Success Effects */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-300">Success Effects</span>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => addSuccessEffect(EventEffectType.Cash)}
                  className="px-2 py-1 text-xs rounded border border-emerald-500 text-emerald-200 hover:bg-emerald-500/10"
                >
                  + Cash
                </button>
                <button
                  type="button"
                  onClick={() => addSuccessEffect(EventEffectType.Exp)}
                  className="px-2 py-1 text-xs rounded border border-emerald-500 text-emerald-200 hover:bg-emerald-500/10"
                >
                  + EXP
                </button>
                <button
                  type="button"
                  onClick={() => addSuccessEffect(EventEffectType.DynamicCash)}
                  className="px-2 py-1 text-xs rounded border border-purple-500 text-purple-200 hover:bg-purple-500/10"
                >
                  + Dynamic Cash
                </button>
                <button
                  type="button"
                  onClick={() => addSuccessEffect(EventEffectType.Metric)}
                  className="px-2 py-1 text-xs rounded border border-indigo-500 text-indigo-200 hover:bg-indigo-500/10"
                >
                  + Metric Effect
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {delayedConsequence.successEffects.map((ef, idx) => (
                <EventEffectEditor
                  key={idx}
                  effect={ef}
                  index={idx}
                  eventTitle={eventTitle}
                  metricOptions={metricOptions}
                  effectTypeOptions={effectTypeOptions}
                  onUpdate={updateSuccessEffects}
                  onRemove={removeSuccessEffect}
                />
              ))}
            </div>
          </div>

          {/* Success Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1">Success Description (optional)</label>
            <textarea
              rows={2}
              value={delayedConsequence.successDescription ?? ''}
              onChange={(e) => onUpdate({ ...delayedConsequence, successDescription: e.target.value })}
              className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
            />
          </div>

          {/* Failure Effects (Optional) */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-slate-300">Failure Effects (optional)</span>
                  <button
                    type="button"
                    onClick={() => setShowLabelTooltip(showLabelTooltip === 'delayed-failure-effects' ? null : 'delayed-failure-effects')}
                    className="text-slate-500 hover:text-slate-300 cursor-pointer text-xs"
                    aria-label="Help"
                  >
                    ?
                  </button>
                  {showLabelTooltip === 'delayed-failure-effects' && (
                    <div className="absolute left-0 top-6 z-50 w-64 p-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg text-xs text-slate-300">
                      <p>Applied when requirements are not met.</p>
                      <p className="mt-1">Optional - if not provided, no effects will be applied on failure. These effects will only trigger if success requirements are set and not met.</p>
                      <button
                        type="button"
                        onClick={() => setShowLabelTooltip(null)}
                        className="mt-2 text-slate-400 hover:text-slate-200 text-xs"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (delayedConsequence.failureEffects) {
                    onUpdate({ ...delayedConsequence, failureEffects: undefined });
                  } else {
                    onUpdate({ ...delayedConsequence, failureEffects: [] });
                  }
                }}
                className={`px-2 py-1 text-xs rounded border ${
                  delayedConsequence.failureEffects
                    ? 'border-red-500 text-red-200 hover:bg-red-500/10'
                    : 'border-blue-500 text-blue-200 hover:bg-blue-500/10'
                }`}
              >
                {delayedConsequence.failureEffects ? 'Remove Failure' : '+ Add Failure'}
              </button>
            </div>
            {delayedConsequence.failureEffects && (
              <div className="space-y-2">
                <div className="flex gap-2 flex-wrap mb-2">
                  <button
                    type="button"
                    onClick={() => addFailureEffect(EventEffectType.Cash)}
                    className="px-2 py-1 text-xs rounded border border-emerald-500 text-emerald-200 hover:bg-emerald-500/10"
                  >
                    + Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => addFailureEffect(EventEffectType.Exp)}
                    className="px-2 py-1 text-xs rounded border border-emerald-500 text-emerald-200 hover:bg-emerald-500/10"
                  >
                    + EXP
                  </button>
                  <button
                    type="button"
                    onClick={() => addFailureEffect(EventEffectType.DynamicCash)}
                    className="px-2 py-1 text-xs rounded border border-purple-500 text-purple-200 hover:bg-purple-500/10"
                  >
                    + Dynamic Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => addFailureEffect(EventEffectType.Metric)}
                    className="px-2 py-1 text-xs rounded border border-indigo-500 text-indigo-200 hover:bg-indigo-500/10"
                  >
                    + Metric Effect
                  </button>
                </div>
                {delayedConsequence.failureEffects.map((ef, idx) => (
                  <EventEffectEditor
                    key={idx}
                    effect={ef}
                    index={idx}
                    eventTitle={eventTitle}
                    metricOptions={metricOptions}
                    effectTypeOptions={effectTypeOptions}
                    onUpdate={updateFailureEffects}
                    onRemove={removeFailureEffect}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Failure Description */}
          {delayedConsequence.failureEffects && (
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Failure Description (optional)</label>
              <textarea
                rows={2}
                value={delayedConsequence.failureDescription ?? ''}
                onChange={(e) => onUpdate({ ...delayedConsequence, failureDescription: e.target.value })}
                className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}