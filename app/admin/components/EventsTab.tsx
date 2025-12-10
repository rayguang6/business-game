'use client';

import { useState, useEffect } from 'react';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import type { GameFlag } from '@/lib/data/flagRepository';
import type { GameEvent, GameEventChoice, GameEventConsequence, GameEventEffect, DelayedConsequence } from '@/lib/types/gameEvents';
import { EventEffectType } from '@/lib/types/gameEvents';
import type { Requirement, UpgradeDefinition } from '@/lib/game/types';
import type { StaffRoleConfig } from '@/lib/game/staffConfig';
import { RequirementsSelector } from './RequirementsSelector';
import { NumberInput } from './NumberInput';
import { makeUniqueId, slugify } from './utils';
import { useToastFunctions } from './ui/ToastContext';

interface EventsTabProps {
  industryId: string;
  events: GameEvent[];
  eventsLoading: boolean;
  selectedEventId: string;
  isCreatingEvent: boolean;
  eventForm: {
    id: string;
    title: string;
    category: 'opportunity' | 'risk';
    summary?: string;
    requirements?: Requirement[];
  };
  eventChoices: GameEventChoice[];
  eventSaving: boolean;
  eventDeleting: boolean;
  flags: GameFlag[];
  flagsLoading: boolean;
  upgrades?: UpgradeDefinition[];
  staffRoles?: StaffRoleConfig[];
  marketingCampaigns?: import('@/lib/store/slices/marketingSlice').MarketingCampaign[];
  metricOptions: Array<{ value: GameMetric; label: string }>;
  effectTypeOptions: Array<{ value: EffectType; label: string; hint: string }>;
  onSelectEvent: (event: GameEvent) => void;
  onCreateEvent: () => void;
  onSaveEvent: () => Promise<void>;
  onDeleteEvent: () => Promise<void>;
  onReset: () => void;
  onUpdateEventForm: (updates: Partial<EventsTabProps['eventForm']>) => void;
  onUpdateEventChoices: (choices: GameEventChoice[]) => void;
  onPersistEventWithChoices: (choices: GameEventChoice[], message?: string) => Promise<void>;
}

export function EventsTab({
  industryId,
  events,
  eventsLoading,
  selectedEventId,
  isCreatingEvent,
  eventForm,
  eventChoices,
  eventSaving,
  eventDeleting,
  flags,
  flagsLoading,
  upgrades = [],
  staffRoles = [],
  marketingCampaigns = [],
  metricOptions,
  effectTypeOptions,
  onSelectEvent,
  onCreateEvent,
  onSaveEvent,
  onDeleteEvent,
  onReset,
  onUpdateEventForm,
  onUpdateEventChoices,
  onPersistEventWithChoices,
}: EventsTabProps) {
  const { success, error } = useToastFunctions();
  const [showLabelTooltip, setShowLabelTooltip] = useState<string | null>(null);

  // Choice/consequence state (managed internally)
  const [selectedChoiceId, setSelectedChoiceId] = useState<string>('');
  const [isCreatingChoice, setIsCreatingChoice] = useState<boolean>(false);
  const [choiceForm, setChoiceForm] = useState<{
    id: string;
    label: string;
    description: string;
    cost: string;
    timeCost: string;
    setsFlag?: string;
    requirements: any[];
  }>({ id: '', label: '', description: '', cost: '', timeCost: '', requirements: [] });

  const [selectedConsequenceId, setSelectedConsequenceId] = useState<string>('');
  const [isCreatingConsequence, setIsCreatingConsequence] = useState<boolean>(false);
  const [consequenceForm, setConsequenceForm] = useState<{
    id: string;
    label: string;
    description: string;
    weight: string;
    effects: Array<
      | { type: EventEffectType.Cash; amount: string; label?: string }
      | { type: EventEffectType.DynamicCash; expression: string; label?: string }
      | { type: EventEffectType.Exp; amount: string }
      | { type: EventEffectType.Metric; metric: GameMetric; effectType: EffectType; value: string; durationMonths: string; priority?: string }
    >;
    delayedConsequence?: {
      id: string;
      delaySeconds: string;
      successRequirements: Requirement[];
      successEffects: Array<
        | { type: EventEffectType.Cash; amount: string; label?: string }
        | { type: EventEffectType.DynamicCash; expression: string; label?: string }
        | { type: EventEffectType.Exp; amount: string }
        | { type: EventEffectType.Metric; metric: GameMetric; effectType: EffectType; value: string; durationMonths: string; priority?: string }
      >;
      failureEffects?: Array<
        | { type: EventEffectType.Cash; amount: string; label?: string }
        | { type: EventEffectType.DynamicCash; expression: string; label?: string }
        | { type: EventEffectType.Exp; amount: string }
        | { type: EventEffectType.Metric; metric: GameMetric; effectType: EffectType; value: string; durationMonths: string; priority?: string }
      >;
      label?: string;
      successDescription?: string;
      failureDescription?: string;
    };
  }>({ id: '', label: '', description: '', weight: '1', effects: [] });

  // Reset choice/consequence state when event changes
  useEffect(() => {
    setSelectedChoiceId('');
    setIsCreatingChoice(false);
    setChoiceForm({ id: '', label: '', description: '', cost: '', timeCost: '', requirements: [] });
    setSelectedConsequenceId('');
    setIsCreatingConsequence(false);
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [], delayedConsequence: undefined });
  }, [selectedEventId, isCreatingEvent]);
  
  // Helper to convert delayed consequence effects
  const convertDelayedEffects = (effects: GameEventEffect[]): Array<
    | { type: EventEffectType.Cash; amount: string; label?: string }
    | { type: EventEffectType.DynamicCash; expression: string; label?: string }
    | { type: EventEffectType.Exp; amount: string }
    | { type: EventEffectType.Metric; metric: GameMetric; effectType: EffectType; value: string; durationMonths: string; priority?: string }
  > => {
    return effects.map((ef: any) => {
      if (ef.type === EventEffectType.Cash) {
        return { type: EventEffectType.Cash, amount: String(ef.amount || 0), label: ef.label };
      } else if (ef.type === EventEffectType.DynamicCash) {
        return { type: EventEffectType.DynamicCash, expression: String(ef.expression || ''), label: ef.label };
      } else if (ef.type === EventEffectType.Exp) {
        return { type: EventEffectType.Exp, amount: String(ef.amount || 0) };
      } else if (ef.type === EventEffectType.Metric) {
        return {
          type: EventEffectType.Metric,
          metric: ef.metric,
          effectType: ef.effectType,
          value: String(ef.value || 0),
          durationMonths: String(ef.durationMonths ?? ''),
          priority: ef.priority !== undefined ? String(ef.priority) : undefined,
        };
      }
      return ef;
    });
  };

  // Choice handlers
  const selectChoice = (choice: GameEventChoice) => {
    setIsCreatingChoice(false);
    setSelectedChoiceId(choice.id);
    setChoiceForm({
      id: choice.id,
      label: choice.label,
      description: choice.description ?? '',
      cost: choice.cost !== undefined ? String(choice.cost) : '',
      timeCost: choice.timeCost !== undefined ? String(choice.timeCost) : '',
      setsFlag: choice.setsFlag,
      requirements: (choice as any).requirements || [],
    });
    setSelectedConsequenceId('');
    setIsCreatingConsequence(false);
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [] });
  };

  const handleCreateChoice = () => {
    if (!selectedEventId && !isCreatingEvent) {
      error('Create or select an event first.');
      return;
    }
    setIsCreatingChoice(true);
    setSelectedChoiceId('');
    setChoiceForm({ id: '', label: '', description: '', cost: '', timeCost: '', setsFlag: '', requirements: [] });
    setSelectedConsequenceId('');
    setIsCreatingConsequence(false);
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [] });
  };

  const handleSaveChoice = () => {
    const id = choiceForm.id.trim();
    const label = choiceForm.label.trim();
    const description = choiceForm.description.trim();
    const cost = choiceForm.cost.trim() === '' ? undefined : Number(choiceForm.cost);
    const timeCost = choiceForm.timeCost.trim() === '' ? undefined : Number(choiceForm.timeCost);
    const setsFlag = choiceForm.setsFlag?.trim() || undefined;
    if (!id || !label) {
      error('Choice id and label are required.');
      return;
    }
    if (cost !== undefined && (!Number.isFinite(cost) || cost < 0)) {
      error('Choice cost must be a non-negative number.');
      return;
    }
    if (timeCost !== undefined && (!Number.isFinite(timeCost) || timeCost < 0)) {
      error('Choice time cost must be a non-negative number.');
      return;
    }

    const exists = eventChoices.some((c) => c.id === id);
    const nextItem: any = {
      id,
      label,
      description: description || undefined,
      cost,
      timeCost,
      setsFlag,
      consequences: exists ? eventChoices.find((c) => c.id === id)!.consequences : [],
      requirements: choiceForm.requirements || [],
    };
    const next = (exists ? eventChoices.map((c) => (c.id === id ? nextItem : c)) : [...eventChoices, nextItem])
      .sort((a, b) => a.label.localeCompare(b.label));
    onUpdateEventChoices(next);
    setIsCreatingChoice(false);
    setSelectedChoiceId(id);
    onPersistEventWithChoices(next, 'Choice saved.');
  };

  const handleDeleteChoice = () => {
    if (isCreatingChoice || !selectedChoiceId) return;
    const next = eventChoices.filter((c) => c.id !== selectedChoiceId);
    onUpdateEventChoices(next);
    setSelectedChoiceId('');
    setChoiceForm({ id: '', label: '', description: '', cost: '', timeCost: '', setsFlag: '', requirements: [] });
    setSelectedConsequenceId('');
    setIsCreatingConsequence(false);
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [] });
    onPersistEventWithChoices(next, 'Choice deleted.');
  };

  const handleResetChoice = () => {
    if (selectedChoiceId && !isCreatingChoice) {
      const existing = eventChoices.find((c) => c.id === selectedChoiceId);
      if (existing) selectChoice(existing);
    } else {
      setIsCreatingChoice(false);
      setSelectedChoiceId('');
      setChoiceForm({ id: '', label: '', description: '', cost: '', timeCost: '', setsFlag: '', requirements: [] });
    }
  };

  // Consequence handlers
  const selectConsequence = (consequence: GameEventConsequence) => {
    if (!consequence) return;
    setIsCreatingConsequence(false);
    setSelectedConsequenceId(consequence.id);
    const delayed = consequence.delayedConsequence;
    setConsequenceForm({
      id: consequence.id || '',
      label: consequence.label ?? '',
      description: consequence.description ?? '',
      weight: String(consequence.weight || 1),
      effects: (consequence.effects || []).map((ef: any) => {
        if (ef.type === EventEffectType.Cash) {
          return { type: EventEffectType.Cash, amount: String(ef.amount || 0), label: ef.label };
        } else if (ef.type === EventEffectType.DynamicCash) {
          return { type: EventEffectType.DynamicCash, expression: String(ef.expression || ''), label: ef.label };
        } else if (ef.type === EventEffectType.Exp) {
          return { type: EventEffectType.Exp, amount: String(ef.amount || 0) };
        } else if (ef.type === EventEffectType.Metric) {
          return {
            type: EventEffectType.Metric,
            metric: ef.metric,
            effectType: ef.effectType,
            value: String(ef.value || 0),
            durationMonths: String(ef.durationMonths ?? ''),
            priority: ef.priority !== undefined ? String(ef.priority) : undefined,
          };
        }
        return ef;
      }),
      delayedConsequence: delayed ? {
        id: delayed.id,
        delaySeconds: String(delayed.delaySeconds),
        successRequirements: delayed.successRequirements || [],
        successEffects: convertDelayedEffects(delayed.successEffects),
        failureEffects: delayed.failureEffects ? convertDelayedEffects(delayed.failureEffects) : undefined,
        label: delayed.label,
        successDescription: delayed.successDescription,
        failureDescription: delayed.failureDescription,
      } : undefined,
    });
  };

  const handleCreateConsequence = () => {
    if (!selectedChoiceId && !isCreatingChoice) {
      error('Create or select a choice first.');
      return;
    }
    setIsCreatingConsequence(true);
    setSelectedConsequenceId('');
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [], delayedConsequence: undefined });
  };

  const handleSaveConsequence = () => {
    if (!selectedChoiceId && !isCreatingChoice) {
      error('Create or select a choice first.');
      return;
    }
    const id = consequenceForm.id.trim();
    const label = consequenceForm.label.trim();
    const description = consequenceForm.description.trim();
    const weightNum = Number(consequenceForm.weight);
    if (!id || !Number.isInteger(weightNum) || weightNum <= 0) {
      error('Consequence id and positive integer weight are required.');
      return;
    }

    const normalizedEffects = consequenceForm.effects.map((ef: any) => {
      if (ef.type === EventEffectType.Cash) {
        return {
          type: EventEffectType.Cash as const,
          amount: Number(ef.amount) || 0,
          ...(ef.label ? { label: ef.label } : {}),
        };
      } else if (ef.type === EventEffectType.DynamicCash) {
        return {
          type: EventEffectType.DynamicCash as const,
          expression: String(ef.expression || ''),
          ...(ef.label ? { label: ef.label } : {}),
        };
      } else if (ef.type === EventEffectType.Exp) {
        return {
          type: EventEffectType.Exp as const,
          amount: Number(ef.amount) || 0,
        };
      } else if (ef.type === EventEffectType.Metric) {
        return {
          type: EventEffectType.Metric as const,
          metric: ef.metric,
          effectType: ef.effectType,
          value: Number(ef.value) || 0,
          durationMonths: ef.durationMonths === '' ? null : Number(ef.durationMonths) || null,
          ...(ef.priority !== undefined ? { priority: Number(ef.priority) } : {}),
        };
      }
      return ef;
    });

    // Normalize delayed consequence if present
    let normalizedDelayedConsequence: DelayedConsequence | undefined = undefined;
    if (consequenceForm.delayedConsequence) {
      const delayed = consequenceForm.delayedConsequence;
      const delaySeconds = Number(delayed.delaySeconds);
      if (!delayed.id || delaySeconds <= 0) {
        error('Delayed consequence requires id and positive delaySeconds.');
        return;
      }
      
      const normalizedSuccessEffects = delayed.successEffects.map((ef: any) => {
        if (ef.type === EventEffectType.Cash) {
          return {
            type: EventEffectType.Cash as const,
            amount: Number(ef.amount) || 0,
            ...(ef.label ? { label: ef.label } : {}),
          };
        } else if (ef.type === EventEffectType.DynamicCash) {
          return {
            type: EventEffectType.DynamicCash as const,
            expression: String(ef.expression || ''),
            ...(ef.label ? { label: ef.label } : {}),
          };
        } else if (ef.type === EventEffectType.Exp) {
          return {
            type: EventEffectType.Exp as const,
            amount: Number(ef.amount) || 0,
          };
        } else if (ef.type === EventEffectType.Metric) {
          return {
            type: EventEffectType.Metric as const,
            metric: ef.metric,
            effectType: ef.effectType,
            value: Number(ef.value) || 0,
            durationMonths: ef.durationMonths === '' ? null : Number(ef.durationMonths) || null,
            ...(ef.priority !== undefined ? { priority: Number(ef.priority) } : {}),
          };
        }
        return ef;
      });

      const normalizedFailureEffects = delayed.failureEffects?.map((ef: any) => {
        if (ef.type === EventEffectType.Cash) {
          return {
            type: EventEffectType.Cash as const,
            amount: Number(ef.amount) || 0,
            ...(ef.label ? { label: ef.label } : {}),
          };
        } else if (ef.type === EventEffectType.DynamicCash) {
          return {
            type: EventEffectType.DynamicCash as const,
            expression: String(ef.expression || ''),
            ...(ef.label ? { label: ef.label } : {}),
          };
        } else if (ef.type === EventEffectType.Exp) {
          return {
            type: EventEffectType.Exp as const,
            amount: Number(ef.amount) || 0,
          };
        } else if (ef.type === EventEffectType.Metric) {
          return {
            type: EventEffectType.Metric as const,
            metric: ef.metric,
            effectType: ef.effectType,
            value: Number(ef.value) || 0,
            durationMonths: ef.durationMonths === '' ? null : Number(ef.durationMonths) || null,
            ...(ef.priority !== undefined ? { priority: Number(ef.priority) } : {}),
          };
        }
        return ef;
      });

      normalizedDelayedConsequence = {
        id: delayed.id,
        delaySeconds,
        successRequirements: delayed.successRequirements && delayed.successRequirements.length > 0 ? delayed.successRequirements : undefined,
        successEffects: normalizedSuccessEffects,
        failureEffects: normalizedFailureEffects && normalizedFailureEffects.length > 0 ? normalizedFailureEffects : undefined,
        label: delayed.label || undefined,
        successDescription: delayed.successDescription || undefined,
        failureDescription: delayed.failureDescription || undefined,
      };
    }

    const idx = eventChoices.findIndex((c) => c.id === selectedChoiceId);
    if (idx === -1) {
      error('Choice not found.');
      return;
    }
    const currentChoice = eventChoices[idx];
    const exists = (currentChoice.consequences || []).some((cs: any) => cs.id === id);
    const nextConsequence: any = { 
      id, 
      label, 
      description: description || undefined, 
      weight: weightNum, 
      effects: normalizedEffects,
      delayedConsequence: normalizedDelayedConsequence,
    };
    const nextConsequences = exists
      ? (currentChoice.consequences || []).map((cs: any) => (cs.id === id ? nextConsequence : cs))
      : [...(currentChoice.consequences || []), nextConsequence];
    const nextChoice = { ...currentChoice, consequences: nextConsequences };
    const next = [...eventChoices];
    next[idx] = nextChoice;
    onUpdateEventChoices(next);
    setIsCreatingConsequence(false);
    setSelectedConsequenceId(id);
    onPersistEventWithChoices(next, 'Consequence saved.');
  };

  const handleDeleteConsequence = () => {
    if (isCreatingConsequence || !selectedConsequenceId || !selectedChoiceId) return;
    const idx = eventChoices.findIndex((c) => c.id === selectedChoiceId);
    if (idx === -1) {
      error('Choice not found.');
      return;
    }
    const currentChoice = eventChoices[idx];
    const nextConsequences = (currentChoice.consequences || []).filter((cs: any) => cs.id !== selectedConsequenceId);
    const nextChoice = { ...currentChoice, consequences: nextConsequences };
    const next = [...eventChoices];
    next[idx] = nextChoice;
    onUpdateEventChoices(next);
    setSelectedConsequenceId('');
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [], delayedConsequence: undefined });
    onPersistEventWithChoices(next, 'Consequence deleted.');
  };

  const handleResetConsequence = () => {
    if (selectedConsequenceId && !isCreatingConsequence) {
      const current = eventChoices.find((c) => c.id === selectedChoiceId);
      const existing = current?.consequences.find((cs: any) => cs.id === selectedConsequenceId);
      if (existing) selectConsequence(existing);
    } else {
      setIsCreatingConsequence(false);
      setSelectedConsequenceId('');
      setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [], delayedConsequence: undefined });
    }
  };


  const isValidGameMetric = (value: any): value is GameMetric => {
    return typeof value === 'string' && Object.values(GameMetric).includes(value as GameMetric);
  };

  const isValidEffectType = (value: any): value is EffectType => {
    return typeof value === 'string' && Object.values(EffectType).includes(value as EffectType);
  };





  const currentChoice = eventChoices.find((c) => c.id === selectedChoiceId);
  const currentConsequences = currentChoice?.consequences ?? [];

  return (
    <>
      <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-2xl font-semibold">Events</h2>
          <p className="text-sm text-slate-400 mt-1">Create events with title, summary, and category. Choices and consequences coming next.</p>
        </div>
        <div className="p-6 space-y-6">
          {!industryId ? (
            <div className="text-sm text-slate-400">Select or create an industry first.</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={onCreateEvent}
                    className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-500 text-slate-200 hover:bg-slate-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!industryId}
                  >
                    + New Event
                  </button>
                </div>
              </div>

              {eventsLoading ? (
                <div className="text-sm text-slate-400">Loading events…</div>
              ) : events.length === 0 && !isCreatingEvent ? (
                <div className="text-sm text-slate-400">No events configured yet.</div>
              ) : (
                <div className="space-y-4">
                  {/* Group events by category */}
                  {['opportunity', 'risk'].map((category) => {
                    const categoryEvents = events.filter((ev) => ev.category === category);
                    if (categoryEvents.length === 0) return null;
                    
                    const isOpportunity = category === 'opportunity';
                    const categoryLabel = isOpportunity ? 'Opportunities' : 'Risks';
                    
                    return (
                      <div key={category} className="space-y-2">
                        <h3 className={`text-sm font-semibold flex items-center gap-2 ${
                          isOpportunity ? 'text-green-300' : 'text-red-300'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            isOpportunity ? 'bg-green-500' : 'bg-red-500'
                          }`}></span>
                          {categoryLabel} ({categoryEvents.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {categoryEvents.map((ev) => {
                            const isSelected = selectedEventId === ev.id && !isCreatingEvent;
                            return (
                              <button
                                key={ev.id}
                                onClick={() => onSelectEvent(ev)}
                                className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                                  isOpportunity
                                    ? isSelected
                                      ? 'border-green-400 bg-green-500/20 text-green-200'
                                      : 'border-green-700 bg-green-900/30 hover:bg-green-800/40 text-green-200'
                                    : isSelected
                                      ? 'border-red-400 bg-red-500/20 text-red-200'
                                      : 'border-red-700 bg-red-900/30 hover:bg-red-800/40 text-red-200'
                                }`}
                              >
                                {ev.title}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {(selectedEventId || isCreatingEvent) && (
                    <div>
                      <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-1">Event ID</label>
                          <input
                            value={eventForm.id}
                            onChange={(e) => onUpdateEventForm({ id: e.target.value })}
                            onBlur={() => {
                              if (!eventForm.id.trim()) {
                                const baseId = eventForm.title.trim() || 'event';
                                const nextId = makeUniqueId(slugify(baseId), new Set(events.map((ev) => ev.id)));
                                onUpdateEventForm({ id: nextId });
                              }
                            }}
                            disabled={!isCreatingEvent && !!selectedEventId}
                            className={`w-full rounded-lg border px-3 py-2 text-slate-200 ${
                              isCreatingEvent || !selectedEventId ? 'bg-slate-900 border-slate-600' : 'bg-slate-800 border-slate-700 cursor-not-allowed'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-1">Category</label>
                          <select
                            value={eventForm.category}
                            onChange={(e) => onUpdateEventForm({ category: e.target.value as 'opportunity' | 'risk' })}
                            className={`w-full rounded-lg bg-slate-800 border px-3 py-2 text-slate-200 ${
                              eventForm.category === 'opportunity' 
                                ? 'border-green-600 focus:border-green-500' 
                                : 'border-red-600 focus:border-red-500'
                            }`}
                          >
                            <option value="opportunity">🟢 Opportunity</option>
                            <option value="risk">🔴 Risk</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-slate-300 mb-1">Title</label>
                          <input
                            value={eventForm.title}
                            onChange={(e) => {
                              onUpdateEventForm({ title: e.target.value });
                            }}
                            onBlur={() => {
                              if (!eventForm.id && eventForm.title.trim()) {
                                const nextId = makeUniqueId(slugify(eventForm.title.trim()), new Set(events.map((ev) => ev.id)));
                                onUpdateEventForm({ id: nextId });
                              }
                            }}
                            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-slate-300 mb-1">Summary (optional)</label>
                          <textarea
                            rows={3}
                            value={eventForm.summary || ''}
                            onChange={(e) => onUpdateEventForm({ summary: e.target.value })}
                            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Event Requirements</label>
                          <p className="text-xs text-slate-400 mb-2">Requirements that must be met for this event to be eligible for selection. If empty, event is always eligible.</p>
                          <RequirementsSelector
                            flags={flags}
                            upgrades={upgrades || []}
                            staffRoles={staffRoles || []}
                            marketingCampaigns={marketingCampaigns || []}
                            flagsLoading={flagsLoading}
                            requirements={eventForm.requirements || []}
                            onRequirementsChange={(requirements) => onUpdateEventForm({ requirements })}
                          />
                        </div>
                        <div className="md:col-span-2 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={onSaveEvent}
                            disabled={eventSaving || eventDeleting}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                              eventSaving 
                                ? (eventForm.category === 'opportunity' ? 'bg-green-900 text-green-200 cursor-wait' : 'bg-red-900 text-red-200 cursor-wait')
                                : (eventForm.category === 'opportunity' ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white')
                            }`}
                          >
                            {eventSaving ? 'Saving…' : 'Save Event'}
                          </button>
                          <button
                            type="button"
                            onClick={onReset}
                            disabled={eventSaving || eventDeleting}
                            className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                          >
                            {isCreatingEvent ? 'Cancel' : 'Reset'}
                          </button>
                          {!isCreatingEvent && selectedEventId && (
                            <button
                              type="button"
                              onClick={onDeleteEvent}
                              disabled={eventDeleting || eventSaving}
                              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                eventDeleting ? 'bg-rose-900 text-rose-200 cursor-wait' : 'bg-rose-600 hover:bg-rose-500 text-white'
                              }`}
                            >
                              {eventDeleting ? 'Deleting…' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </form>

                      <div className="pt-4 mt-4 border-t border-slate-800">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className={`text-lg font-semibold ${
                            eventForm.category === 'opportunity' ? 'text-green-300' : 'text-red-300'
                          }`}>Choices</h3>
                          <button
                            type="button"
                            onClick={handleCreateChoice}
                            className={`px-3 py-2 text-sm font-medium rounded-lg border hover:bg-opacity-10 ${
                              eventForm.category === 'opportunity'
                                ? 'border-green-500 text-green-200 hover:bg-green-500'
                                : 'border-red-500 text-red-200 hover:bg-red-500'
                            }`}
                          >
                            + Add Choice
                          </button>
                        </div>
                        {eventChoices.length === 0 && !isCreatingChoice ? (
                          <div className="text-sm text-slate-400">No choices added yet.</div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                              {eventChoices.map((ch) => (
                                <button
                                  key={ch.id}
                                  type="button"
                                  onClick={() => selectChoice(ch)}
                                  className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                                    selectedChoiceId === ch.id && !isCreatingChoice
                                      ? 'border-fuchsia-400 bg-fuchsia-500/10 text-fuchsia-200'
                                      : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                                  }`}
                                >
                                  {ch.label}
                                </button>
                              ))}
                            </div>

                            {(selectedChoiceId || isCreatingChoice) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                <div>
                                  <label className="block text-sm font-semibold text-slate-300 mb-1">Choice ID</label>
                                  <input
                                    value={choiceForm.id}
                                    onChange={(e) => setChoiceForm((p) => ({ ...p, id: e.target.value }))}
                                    onBlur={() => {
                                      if (!choiceForm.id.trim()) {
                                        const baseId = choiceForm.label.trim() || 'choice';
                                        const nextId = makeUniqueId(slugify(baseId), new Set(eventChoices.map((c) => c.id)));
                                        setChoiceForm((p) => ({ ...p, id: nextId }));
                                      }
                                    }}
                                    disabled={!isCreatingChoice && !!selectedChoiceId}
                                    className={`w-full rounded-lg border px-3 py-2 text-slate-200 ${
                                      isCreatingChoice || !selectedChoiceId ? 'bg-slate-900 border-slate-600' : 'bg-slate-800 border-slate-700 cursor-not-allowed'
                                    }`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-slate-300 mb-1">Label</label>
                                  <input
                                    value={choiceForm.label}
                                    onChange={(e) => {
                                      setChoiceForm((p) => ({ ...p, label: e.target.value }));
                                    }}
                                    onBlur={() => {
                                      if (!choiceForm.id && choiceForm.label.trim()) {
                                        const nextId = makeUniqueId(slugify(choiceForm.label.trim()), new Set(eventChoices.map((c) => c.id)));
                                        setChoiceForm((p) => ({ ...p, id: nextId }));
                                      }
                                    }}
                                    className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-semibold text-slate-300 mb-1">Description (optional)</label>
                                  <textarea
                                    rows={2}
                                    value={choiceForm.description}
                                    onChange={(e) => setChoiceForm((p) => ({ ...p, description: e.target.value }))}
                                    className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-slate-300 mb-1">Cost (Cash, Optional)</label>
                                  <NumberInput
                                    
                                    min="0"
                                    value={choiceForm.cost}
                                    onChange={(e) => setChoiceForm((p) => ({ ...p, cost: e.target.value }))}
                                    className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                                  />
                                  <p className="text-xs text-gray-400 mt-1">Upfront cash cost (can be combined with time cost)</p>
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-slate-300 mb-1">Time Cost (Hours, Optional)</label>
                                  <NumberInput
                                    
                                    min="0"
                                    value={choiceForm.timeCost}
                                    onChange={(e) => setChoiceForm((p) => ({ ...p, timeCost: e.target.value }))}
                                    className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                                  />
                                  <p className="text-xs text-gray-400 mt-1">Upfront time cost (can be combined with cash cost)</p>
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-slate-300 mb-1">Sets Flag (optional)</label>
                                  <select
                                    value={choiceForm.setsFlag || ''}
                                    onChange={(e) => setChoiceForm((p) => ({ ...p, setsFlag: e.target.value }))}
                                    disabled={flagsLoading}
                                    className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200 disabled:opacity-50"
                                  >
                                    <option value="">
                                      {flagsLoading ? 'Loading flags...' : 'None'}
                                    </option>
                                    {!flagsLoading && flags.map((flag) => (
                                      <option key={flag.id} value={flag.id}>
                                        {flag.name}
                                      </option>
                                    ))}
                                  </select>
                                  <p className="text-xs text-gray-400 mt-1">Flag to set when this choice is selected</p>
                                </div>
                                <div className="md:col-span-2 flex flex-wrap gap-3">
                                  <button
                                    type="button"
                                    onClick={handleSaveChoice}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold transition bg-fuchsia-600 hover:bg-fuchsia-500 text-white"
                                  >
                                    Save Choice
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleResetChoice}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                                  >
                                    {isCreatingChoice ? 'Cancel' : 'Reset'}
                                  </button>
                                  {!isCreatingChoice && selectedChoiceId && (
                                    <button
                                      type="button"
                                      onClick={handleDeleteChoice}
                                      className="px-4 py-2 rounded-lg text-sm font-semibold transition bg-rose-600 hover:bg-rose-500 text-white"
                                    >
                                      Delete Choice
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                            {(selectedChoiceId || isCreatingChoice) && (
                              <div className="mt-6">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-md font-semibold">Consequences</h4>
                                  <button
                                    type="button"
                                    onClick={handleCreateConsequence}
                                    className="px-3 py-2 text-sm font-medium rounded-lg border border-amber-500 text-amber-200 hover:bg-amber-500/10"
                                  >
                                    + Add Consequence
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {currentConsequences.map((cs) => (
                                    <button
                                      key={cs.id}
                                      type="button"
                                      onClick={() => selectConsequence(cs)}
                                      className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                                        selectedConsequenceId === cs.id && !isCreatingConsequence
                                          ? 'border-amber-400 bg-amber-500/10 text-amber-200'
                                          : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                                      }`}
                                    >
                                      {cs.label || cs.id}
                                    </button>
                                  ))}
                                </div>

                                {(selectedConsequenceId || isCreatingConsequence) && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-900/60 rounded-lg border border-slate-700">
                                    <div>
                                      <label className="block text-sm font-semibold text-slate-300 mb-1">Consequence ID</label>
                                      <input
                                        value={consequenceForm.id}
                                        onChange={(e) => setConsequenceForm((p) => ({ ...p, id: e.target.value }))}
                                        onBlur={() => {
                                          if (!consequenceForm.id.trim()) {
                                            const existingIds = new Set(currentConsequences.map((cs) => cs.id));
                                            const baseId = consequenceForm.label.trim() || 'consequence';
                                            const nextId = makeUniqueId(slugify(baseId), existingIds);
                                            setConsequenceForm((p) => ({ ...p, id: nextId }));
                                          }
                                        }}
                                        disabled={!isCreatingConsequence && !!selectedConsequenceId}
                                        className={`w-full rounded-lg border px-3 py-2 text-slate-200 ${
                                          isCreatingConsequence || !selectedConsequenceId ? 'bg-slate-900 border-slate-600' : 'bg-slate-800 border-slate-700 cursor-not-allowed'
                                        }`}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-semibold text-slate-300 mb-1">Weight</label>
                                      <NumberInput
                                        
                                        min="1"
                                        value={consequenceForm.weight}
                                        onChange={(e) => setConsequenceForm((p) => ({ ...p, weight: e.target.value }))}
                                        className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-semibold text-slate-300 mb-1">Label (optional)</label>
                                      <input
                                        value={consequenceForm.label}
                                        onChange={(e) => {
                                          setConsequenceForm((p) => ({ ...p, label: e.target.value }));
                                        }}
                                        onBlur={() => {
                                          if (!consequenceForm.id && consequenceForm.label.trim()) {
                                            const existingIds = new Set(currentConsequences.map((cs) => cs.id));
                                            const nextId = makeUniqueId(slugify(consequenceForm.label.trim()), existingIds);
                                            setConsequenceForm((p) => ({ ...p, id: nextId }));
                                          }
                                        }}
                                        className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-sm font-semibold text-slate-300 mb-1">Description (optional)</label>
                                      <textarea
                                        rows={2}
                                        value={consequenceForm.description}
                                        onChange={(e) => setConsequenceForm((p) => ({ ...p, description: e.target.value }))}
                                        className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                                      />
                                    </div>

                                    {/* Effects editor */}
                                    <div className="md:col-span-2">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-semibold text-slate-300">Effects</span>
                                        <div className="flex gap-2 flex-wrap">
                                          <button
                                            type="button"
                                            onClick={() => setConsequenceForm((p) => ({ ...p, effects: [...p.effects, { type: EventEffectType.Cash, amount: '0', label: '' }] }))}
                                            className="px-2 py-1 text-xs rounded border border-emerald-500 text-emerald-200 hover:bg-emerald-500/10"
                                          >
                                            + Cash
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setConsequenceForm((p) => ({ ...p, effects: [...p.effects, { type: EventEffectType.Exp, amount: '0' }] }))}
                                            className="px-2 py-1 text-xs rounded border border-emerald-500 text-emerald-200 hover:bg-emerald-500/10"
                                          >
                                            + Skill Level
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setConsequenceForm((p) => ({ ...p, effects: [...p.effects, { type: EventEffectType.DynamicCash, expression: 'expenses*1', label: '' }] }))}
                                            className="px-2 py-1 text-xs rounded border border-purple-500 text-purple-200 hover:bg-purple-500/10"
                                          >
                                            + Dynamic Cash
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setConsequenceForm((p) => ({ ...p, effects: [...p.effects, { type: EventEffectType.Metric, metric: metricOptions[0].value, effectType: effectTypeOptions[0].value, value: '0', durationMonths: '' }] }))}
                                            className="px-2 py-1 text-xs rounded border border-indigo-500 text-indigo-200 hover:bg-indigo-500/10"
                                          >
                                            + Metric Effect
                                          </button>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        {consequenceForm.effects.map((ef, idx) => (
                                          <div key={idx} className={`grid gap-2 items-end ${ef.type === EventEffectType.Metric ? 'grid-cols-1 sm:grid-cols-6' : ef.type === EventEffectType.DynamicCash ? 'grid-cols-1 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
                                            <div>
                                              <label className="block text-xs text-slate-400 mb-1">Type</label>
                                              <select
                                                value={ef.type}
                                                onChange={(e) => {
                                                  const newEffect = e.target.value === EventEffectType.Cash ? { type: EventEffectType.Cash as const, amount: '0', label: '' } :
                                                    e.target.value === EventEffectType.Exp ? { type: EventEffectType.Exp as const, amount: '0' } :
                                                    e.target.value === EventEffectType.DynamicCash ? { type: EventEffectType.DynamicCash as const, expression: 'expenses*1', label: '' } :
                                                    { type: EventEffectType.Metric as const, metric: metricOptions[0].value, effectType: effectTypeOptions[0].value, value: '0', durationMonths: '', priority: '' };
                                                  const newEffects = [...consequenceForm.effects];
                                                  newEffects[idx] = newEffect;
                                                  setConsequenceForm((p) => ({ ...p, effects: newEffects }));
                                                }}
                                                className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                              >
                                                <option value={EventEffectType.Cash}>Cash</option>
                                                <option value={EventEffectType.Exp}>EXP</option>
                                                <option value={EventEffectType.DynamicCash}>Dynamic Cash</option>
                                                <option value={EventEffectType.Metric}>Metric Effect</option>
                                              </select>
                                            </div>

                                            {ef.type === EventEffectType.Cash || ef.type === EventEffectType.Exp ? (
                                              <>
                                                <div>
                                                  <label className="block text-xs text-slate-400 mb-1">Amount</label>
                                                  <NumberInput
                                                    
                                                    value={ef.amount}
                                                    onChange={(e) => {
                                                      const newEffects = [...consequenceForm.effects];
                                                      (newEffects[idx] as any).amount = e.target.value;
                                                      setConsequenceForm((p) => ({ ...p, effects: newEffects }));
                                                    }}
                                                    className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                  />
                                                </div>
                                                {ef.type === EventEffectType.Cash && (
                                                  <div className="relative">
                                                    <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                                                      Label (optional)
                                                      <button
                                                        type="button"
                                                        onClick={() => setShowLabelTooltip(showLabelTooltip === `cash-${idx}` ? null : `cash-${idx}`)}
                                                        className="text-slate-500 hover:text-slate-300 cursor-pointer text-xs"
                                                        aria-label="Help"
                                                      >
                                                        ?
                                                      </button>
                                                      {showLabelTooltip === `cash-${idx}` && (
                                                        <div className="absolute left-0 top-6 z-50 w-64 p-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg text-xs text-slate-300">
                                                          <p className="mb-1">Used in PnL display. Takes priority over choice/consequence names.</p>
                                                          <p>If empty, shows: &quot;{eventForm.title} - [choice label]&quot;</p>
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
                                                      value={ef.label ?? ''}
                                                      onChange={(e) => {
                                                        const newEffects = [...consequenceForm.effects];
                                                        (newEffects[idx] as any).label = e.target.value;
                                                        setConsequenceForm((p) => ({ ...p, effects: newEffects }));
                                                      }}
                                                      className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                    />
                                                  </div>
                                                )}
                                              </>
                                            ) : ef.type === EventEffectType.DynamicCash ? (
                                              <>
                                                <div>
                                                  <label className="block text-xs text-slate-400 mb-1">Expression</label>
                                                  <input
                                                    value={ef.expression}
                                                    onChange={(e) => {
                                                      const newEffects = [...consequenceForm.effects];
                                                      (newEffects[idx] as any).expression = e.target.value;
                                                      setConsequenceForm((p) => ({ ...p, effects: newEffects }));
                                                    }}
                                                    placeholder="expenses*3"
                                                    className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                  />
                                                </div>
                                                <div className="relative">
                                                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                                                    Label (optional)
                                                    <button
                                                      type="button"
                                                      onClick={() => setShowLabelTooltip(showLabelTooltip === `dynamic-${idx}` ? null : `dynamic-${idx}`)}
                                                      className="text-slate-500 hover:text-slate-300 cursor-pointer text-xs"
                                                      aria-label="Help"
                                                    >
                                                      ?
                                                    </button>
                                                    {showLabelTooltip === `dynamic-${idx}` && (
                                                      <div className="absolute left-0 top-6 z-50 w-64 p-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg text-xs text-slate-300">
                                                        <p className="mb-1">Used in PnL display. Takes priority over choice/consequence names.</p>
                                                        <p>If empty, shows: &quot;{eventForm.title} - [choice label]&quot;</p>
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
                                                    value={ef.label ?? ''}
                                                    onChange={(e) => {
                                                      const newEffects = [...consequenceForm.effects];
                                                      (newEffects[idx] as any).label = e.target.value;
                                                      setConsequenceForm((p) => ({ ...p, effects: newEffects }));
                                                    }}
                                                    className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                  />
                                                </div>
                                              </>
                                            ) : ef.type === EventEffectType.Metric ? (
                                              <>
                                                <div>
                                                  <label className="block text-xs text-slate-400 mb-1">Metric</label>
                                                  <select
                                                    value={ef.metric}
                                                    onChange={(e) => {
                                                      const newEffects = [...consequenceForm.effects];
                                                      (newEffects[idx] as any).metric = e.target.value;
                                                      setConsequenceForm((p) => ({ ...p, effects: newEffects }));
                                                    }}
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
                                                    value={ef.effectType}
                                                    onChange={(e) => {
                                                      const newEffects = [...consequenceForm.effects];
                                                      (newEffects[idx] as any).effectType = e.target.value;
                                                      setConsequenceForm((p) => ({ ...p, effects: newEffects }));
                                                    }}
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
                                                    
                                                    value={ef.value}
                                                    onChange={(e) => {
                                                      const newEffects = [...consequenceForm.effects];
                                                      (newEffects[idx] as any).value = e.target.value;
                                                      setConsequenceForm((p) => ({ ...p, effects: newEffects }));
                                                    }}
                                                    className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                  />
                                                </div>
                                                <div>
                                                  <label className="block text-xs text-slate-400 mb-1">Duration (s)</label>
                                                  <NumberInput
                                                    
                                                    min="0"
                                                    step="1"
                                                    placeholder="Empty = permanent"
                                                    value={ef.durationMonths}
                                                    onChange={(e) => {
                                                      const newEffects = [...consequenceForm.effects];
                                                      (newEffects[idx] as any).durationMonths = e.target.value;
                                                      setConsequenceForm((p) => ({ ...p, effects: newEffects }));
                                                    }}
                                                    className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                  />
                                                </div>
                                              </>
                                            ) : null}

                                            <div className="flex items-center gap-2">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const newEffects = consequenceForm.effects.filter((_, i) => i !== idx);
                                                  setConsequenceForm((p) => ({ ...p, effects: newEffects }));
                                                }}
                                                className="text-xs text-rose-300 hover:text-rose-200 px-2 py-1 rounded"
                                              >
                                                Remove
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Delayed Consequence Editor */}
                                    <div className="md:col-span-2 border-t border-slate-700 pt-4 mt-4">
                                      <div className="flex items-center justify-between mb-3">
                                        <div>
                                          <span className="text-sm font-semibold text-slate-300">⏰ Delayed Consequence (Optional)</span>
                                          <div className="text-xs text-slate-400 mt-1">
                                            Add a follow-up event that triggers after a delay with conditional success/failure outcomes
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (consequenceForm.delayedConsequence) {
                                              setConsequenceForm((p) => ({ ...p, delayedConsequence: undefined }));
                                            } else {
                                              const delayedId = consequenceForm.id ? `${consequenceForm.id}_delayed` : '';
                                              setConsequenceForm((p) => ({
                                                ...p,
                                                delayedConsequence: {
                                                  id: delayedId,
                                                  delaySeconds: '30',
                                                  successRequirements: [],
                                                  successEffects: [],
                                                  failureEffects: undefined,
                                                  label: '',
                                                  successDescription: '',
                                                  failureDescription: '',
                                                },
                                              }));
                                            }
                                          }}
                                          className={`px-3 py-1 text-xs rounded border ${
                                            consequenceForm.delayedConsequence
                                              ? 'border-red-500 text-red-200 hover:bg-red-500/10'
                                              : 'border-blue-500 text-blue-200 hover:bg-blue-500/10'
                                          }`}
                                        >
                                          {consequenceForm.delayedConsequence ? 'Remove Delayed' : '+ Add Delayed'}
                                        </button>
                                      </div>

                                      {consequenceForm.delayedConsequence && (
                                        <div className="space-y-4 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                              <label className="block text-sm font-semibold text-slate-300 mb-1">Delayed ID</label>
                                              <input
                                                value={consequenceForm.delayedConsequence.id}
                                                onChange={(e) => {
                                                  setConsequenceForm((p) => ({
                                                    ...p,
                                                    delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, id: e.target.value } : undefined,
                                                  }));
                                                }}
                                                onBlur={() => {
                                                  if (!consequenceForm.delayedConsequence?.id.trim()) {
                                                    const existingIds = new Set(currentConsequences.map((cs) => cs.id));
                                                    const baseId = consequenceForm.delayedConsequence?.label?.trim() || consequenceForm.label.trim() || 'delayed';
                                                    const nextId = makeUniqueId(slugify(baseId), existingIds);
                                                    setConsequenceForm((p) => ({
                                                      ...p,
                                                      delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, id: nextId } : undefined,
                                                    }));
                                                  }
                                                }}
                                                className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-sm font-semibold text-slate-300 mb-1">Delay (seconds)</label>
                                              <NumberInput
                                                
                                                min="1"
                                                value={consequenceForm.delayedConsequence.delaySeconds}
                                                onChange={(e) => {
                                                  setConsequenceForm((p) => ({
                                                    ...p,
                                                    delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, delaySeconds: e.target.value } : undefined,
                                                  }));
                                                }}
                                                className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                                              />
                                            </div>
                                            <div className="relative">
                                              <label className="flex items-center gap-1 text-sm font-semibold text-slate-300 mb-1">
                                                Title <span className="text-slate-400">(shown to player)</span>
                                                <button
                                                  type="button"
                                                  onClick={() => setShowLabelTooltip(showLabelTooltip === 'delayed-title' ? null : 'delayed-title')}
                                                  className="text-slate-500 hover:text-slate-300 cursor-pointer text-xs"
                                                  aria-label="Help"
                                                >
                                                  ?
                                                </button>
                                                {showLabelTooltip === 'delayed-title' && (
                                                  <div className="absolute left-0 top-6 z-50 w-64 p-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg text-xs text-slate-300">
                                                    <p>What the player will see as the popup title when the delayed consequence triggers.</p>
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
                                                type="text"
                                                value={consequenceForm.delayedConsequence.label || ''}
                                                onChange={(e) => {
                                                  setConsequenceForm((p) => ({
                                                    ...p,
                                                    delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, label: e.target.value } : undefined,
                                                  }));
                                                }}
                                                placeholder="e.g., 'Partnership Opportunity', 'Market Response'"
                                                className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                                              />
                                            </div>
                                            <div className="relative">
                                              <label className="flex items-center gap-1 text-sm font-semibold text-slate-300 mb-1">
                                                Success Description (optional) <span className="text-slate-400">(shown on success)</span>
                                                <button
                                                  type="button"
                                                  onClick={() => setShowLabelTooltip(showLabelTooltip === 'delayed-success-desc' ? null : 'delayed-success-desc')}
                                                  className="text-slate-500 hover:text-slate-300 cursor-pointer text-xs"
                                                  aria-label="Help"
                                                >
                                                  ?
                                                </button>
                                                {showLabelTooltip === 'delayed-success-desc' && (
                                                  <div className="absolute left-0 top-6 z-50 w-64 p-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg text-xs text-slate-300">
                                                    <p>Message shown when requirements are met (or always if no requirements are set).</p>
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
                                              <textarea
                                                rows={2}
                                                value={consequenceForm.delayedConsequence.successDescription || ''}
                                                onChange={(e) => {
                                                  setConsequenceForm((p) => ({
                                                    ...p,
                                                    delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, successDescription: e.target.value } : undefined,
                                                  }));
                                                }}
                                                placeholder="e.g., 'Your investment has paid off - the partnership is successful!'"
                                                className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                                              />
                                            </div>
                                            <div className="relative">
                                              <label className="flex items-center gap-1 text-sm font-semibold text-slate-300 mb-1">
                                                Failure Description (optional) <span className="text-slate-400">(shown on failure)</span>
                                                <button
                                                  type="button"
                                                  onClick={() => setShowLabelTooltip(showLabelTooltip === 'delayed-failure-desc' ? null : 'delayed-failure-desc')}
                                                  className="text-slate-500 hover:text-slate-300 cursor-pointer text-xs"
                                                  aria-label="Help"
                                                >
                                                  ?
                                                </button>
                                                {showLabelTooltip === 'delayed-failure-desc' && (
                                                  <div className="absolute left-0 top-6 z-50 w-64 p-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg text-xs text-slate-300">
                                                    <p>Message shown when requirements are not met. Optional - if not provided, failure effects will still apply but no message will be shown.</p>
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
                                              <textarea
                                                rows={2}
                                                value={consequenceForm.delayedConsequence.failureDescription || ''}
                                                onChange={(e) => {
                                                  setConsequenceForm((p) => ({
                                                    ...p,
                                                    delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, failureDescription: e.target.value } : undefined,
                                                  }));
                                                }}
                                                placeholder="e.g., 'Unfortunately, the partnership fell through due to market conditions.'"
                                                className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                                              />
                                            </div>
                                          </div>

                                          {/* Success Requirements */}
                                          <div className="relative">
                                            <label className="flex items-center gap-1 text-sm font-semibold text-slate-300 mb-2">
                                              Success Requirements
                                              <span className="text-slate-400 ml-1">(optional - if empty, always succeeds)</span>
                                              <button
                                                type="button"
                                                onClick={() => setShowLabelTooltip(showLabelTooltip === 'delayed-requirements' ? null : 'delayed-requirements')}
                                                className="text-slate-500 hover:text-slate-300 cursor-pointer text-xs"
                                                aria-label="Help"
                                              >
                                                ?
                                              </button>
                                              {showLabelTooltip === 'delayed-requirements' && (
                                                <div className="absolute left-0 top-6 z-50 w-64 p-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg text-xs text-slate-300">
                                                  <p className="mb-1">Choose flags/conditions that must be met for success.</p>
                                                  <p>If none selected, the delayed consequence will always succeed and show the success description.</p>
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
                                            <RequirementsSelector
                                              flags={flags}
                                              upgrades={upgrades}
                                              staffRoles={staffRoles}
                                              marketingCampaigns={marketingCampaigns || []}
                                              flagsLoading={flagsLoading}
                                              requirements={consequenceForm.delayedConsequence.successRequirements}
                                              onRequirementsChange={(reqs) => {
                                                setConsequenceForm((p) => ({
                                                  ...p,
                                                  delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, successRequirements: reqs } : undefined,
                                                }));
                                              }}
                                            />
                                          </div>

                                          {/* Success Effects */}
                                          <div className="relative">
                                            <div className="flex items-center justify-between mb-2">
                                              <div>
                                                <div className="flex items-center gap-1">
                                                  <span className="text-sm font-semibold text-slate-300">Success Effects</span>
                                                  <button
                                                    type="button"
                                                    onClick={() => setShowLabelTooltip(showLabelTooltip === 'delayed-success-effects' ? null : 'delayed-success-effects')}
                                                    className="text-slate-500 hover:text-slate-300 cursor-pointer text-xs"
                                                    aria-label="Help"
                                                  >
                                                    ?
                                                  </button>
                                                  {showLabelTooltip === 'delayed-success-effects' && (
                                                    <div className="absolute left-0 top-6 z-50 w-64 p-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg text-xs text-slate-300">
                                                      <p>Applied when requirements are met (or always if no requirements are set).</p>
                                                      <p className="mt-1">These effects will be applied when the delayed consequence succeeds.</p>
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
                                              <div className="flex gap-2 flex-wrap">
                                                <button
                                                  type="button"
                                                  onClick={() => setConsequenceForm((p) => ({
                                                    ...p,
                                                    delayedConsequence: p.delayedConsequence ? {
                                                      ...p.delayedConsequence,
                                                      successEffects: [...p.delayedConsequence.successEffects, { type: EventEffectType.Cash, amount: '0', label: '' }],
                                                    } : undefined,
                                                  }))}
                                                  className="px-2 py-1 text-xs rounded border border-emerald-500 text-emerald-200 hover:bg-emerald-500/10"
                                                >
                                                  + Cash
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => setConsequenceForm((p) => ({
                                                    ...p,
                                                    delayedConsequence: p.delayedConsequence ? {
                                                      ...p.delayedConsequence,
                                                      successEffects: [...p.delayedConsequence.successEffects, { type: EventEffectType.Exp, amount: '0' }],
                                                    } : undefined,
                                                  }))}
                                                  className="px-2 py-1 text-xs rounded border border-emerald-500 text-emerald-200 hover:bg-emerald-500/10"
                                                >
                                                  + Skill Level
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => setConsequenceForm((p) => ({
                                                    ...p,
                                                    delayedConsequence: p.delayedConsequence ? {
                                                      ...p.delayedConsequence,
                                                      successEffects: [...p.delayedConsequence.successEffects, { type: EventEffectType.DynamicCash, expression: 'expenses*1', label: '' }],
                                                    } : undefined,
                                                  }))}
                                                  className="px-2 py-1 text-xs rounded border border-purple-500 text-purple-200 hover:bg-purple-500/10"
                                                >
                                                  + Dynamic Cash
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => setConsequenceForm((p) => ({
                                                    ...p,
                                                    delayedConsequence: p.delayedConsequence ? {
                                                      ...p.delayedConsequence,
                                                      successEffects: [...p.delayedConsequence.successEffects, { type: EventEffectType.Metric, metric: metricOptions[0].value, effectType: effectTypeOptions[0].value, value: '0', durationMonths: '' }],
                                                    } : undefined,
                                                  }))}
                                                  className="px-2 py-1 text-xs rounded border border-indigo-500 text-indigo-200 hover:bg-indigo-500/10"
                                                >
                                                  + Metric Effect
                                                </button>
                                              </div>
                                            </div>
                                            <div className="space-y-2">
                                              {consequenceForm.delayedConsequence.successEffects.map((ef, idx) => (
                                                <div key={idx} className={`grid gap-2 items-end ${ef.type === EventEffectType.Metric ? 'grid-cols-1 sm:grid-cols-6' : ef.type === EventEffectType.DynamicCash ? 'grid-cols-1 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
                                                  {/* Same effect editing UI as regular effects - reuse the pattern */}
                                                  <div>
                                                    <label className="block text-xs text-slate-400 mb-1">Type</label>
                                                    <select
                                                      value={ef.type}
                                                      onChange={(e) => {
                                                        const newEffect = e.target.value === EventEffectType.Cash ? { type: EventEffectType.Cash as const, amount: '0', label: '' } :
                                                          e.target.value === EventEffectType.Exp ? { type: EventEffectType.Exp as const, amount: '0' } :
                                                          e.target.value === EventEffectType.DynamicCash ? { type: EventEffectType.DynamicCash as const, expression: 'expenses*1', label: '' } :
                                                          { type: EventEffectType.Metric as const, metric: metricOptions[0].value, effectType: effectTypeOptions[0].value, value: '0', durationMonths: '', priority: '' };
                                                        const newEffects = [...consequenceForm.delayedConsequence!.successEffects];
                                                        newEffects[idx] = newEffect;
                                                        setConsequenceForm((p) => ({
                                                          ...p,
                                                          delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, successEffects: newEffects } : undefined,
                                                        }));
                                                      }}
                                                      className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                    >
                                                      <option value={EventEffectType.Cash}>Cash</option>
                                                      <option value={EventEffectType.Exp}>EXP</option>
                                                      <option value={EventEffectType.DynamicCash}>Dynamic Cash</option>
                                                      <option value={EventEffectType.Metric}>Metric Effect</option>
                                                    </select>
                                                  </div>
                                                  {/* Effect fields - same as regular effects editor */}
                                                  {ef.type === EventEffectType.Cash || ef.type === EventEffectType.Exp ? (
                                                    <>
                                                      <div>
                                                        <label className="block text-xs text-slate-400 mb-1">Amount</label>
                                                        <NumberInput
                                                          
                                                          value={ef.amount}
                                                          onChange={(e) => {
                                                            const newEffects = [...consequenceForm.delayedConsequence!.successEffects];
                                                            (newEffects[idx] as any).amount = e.target.value;
                                                            setConsequenceForm((p) => ({
                                                              ...p,
                                                              delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, successEffects: newEffects } : undefined,
                                                            }));
                                                          }}
                                                          className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                        />
                                                      </div>
                                                      {ef.type === EventEffectType.Cash && (
                                                        <div>
                                                          <label className="block text-xs text-slate-400 mb-1">
                                                            Label (optional)
                                                            <span className="ml-1 text-slate-500 cursor-help" title="Used in PnL display. Takes priority over choice/consequence names. If empty, shows: '[Event Title] - [choice label]'">ℹ️</span>
                                                          </label>
                                                          <input
                                                            placeholder="e.g. Partnership Bonus, Client Payment"
                                                            value={ef.label ?? ''}
                                                            onChange={(e) => {
                                                              const newEffects = [...consequenceForm.delayedConsequence!.successEffects];
                                                              (newEffects[idx] as any).label = e.target.value;
                                                              setConsequenceForm((p) => ({
                                                                ...p,
                                                                delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, successEffects: newEffects } : undefined,
                                                              }));
                                                            }}
                                                            className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                          />
                                                        </div>
                                                      )}
                                                    </>
                                                  ) : ef.type === EventEffectType.DynamicCash ? (
                                                    <>
                                                      <div>
                                                        <label className="block text-xs text-slate-400 mb-1">Expression</label>
                                                        <input
                                                          value={ef.expression}
                                                          onChange={(e) => {
                                                            const newEffects = [...consequenceForm.delayedConsequence!.successEffects];
                                                            (newEffects[idx] as any).expression = e.target.value;
                                                            setConsequenceForm((p) => ({
                                                              ...p,
                                                              delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, successEffects: newEffects } : undefined,
                                                            }));
                                                          }}
                                                          placeholder="expenses*3"
                                                          className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                        />
                                                      </div>
                                                      <div className="relative">
                                                        <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                                                          Label (optional)
                                                          <button
                                                            type="button"
                                                            onClick={() => setShowLabelTooltip(showLabelTooltip === `delayed-success-dynamic-${idx}` ? null : `delayed-success-dynamic-${idx}`)}
                                                            className="text-slate-500 hover:text-slate-300 cursor-pointer text-xs"
                                                            aria-label="Help"
                                                          >
                                                            ?
                                                          </button>
                                                          {showLabelTooltip === `delayed-success-dynamic-${idx}` && (
                                                            <div className="absolute left-0 top-6 z-50 w-64 p-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg text-xs text-slate-300">
                                                              <p className="mb-1">Used in PnL display. Takes priority over choice/consequence names.</p>
                                                              <p>If empty, shows: &quot;{eventForm.title} - [choice label]&quot;</p>
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
                                                          value={ef.label ?? ''}
                                                          onChange={(e) => {
                                                            const newEffects = [...consequenceForm.delayedConsequence!.successEffects];
                                                            (newEffects[idx] as any).label = e.target.value;
                                                            setConsequenceForm((p) => ({
                                                              ...p,
                                                              delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, successEffects: newEffects } : undefined,
                                                            }));
                                                          }}
                                                          className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                        />
                                                      </div>
                                                    </>
                                                  ) : ef.type === EventEffectType.Metric ? (
                                                    <>
                                                      <div>
                                                        <label className="block text-xs text-slate-400 mb-1">Metric</label>
                                                        <select
                                                          value={ef.metric}
                                                          onChange={(e) => {
                                                            const newEffects = [...consequenceForm.delayedConsequence!.successEffects];
                                                            (newEffects[idx] as any).metric = e.target.value;
                                                            setConsequenceForm((p) => ({
                                                              ...p,
                                                              delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, successEffects: newEffects } : undefined,
                                                            }));
                                                          }}
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
                                                          value={ef.effectType}
                                                          onChange={(e) => {
                                                            const newEffects = [...consequenceForm.delayedConsequence!.successEffects];
                                                            (newEffects[idx] as any).effectType = e.target.value;
                                                            setConsequenceForm((p) => ({
                                                              ...p,
                                                              delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, successEffects: newEffects } : undefined,
                                                            }));
                                                          }}
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
                                                          
                                                          value={ef.value}
                                                          onChange={(e) => {
                                                            const newEffects = [...consequenceForm.delayedConsequence!.successEffects];
                                                            (newEffects[idx] as any).value = e.target.value;
                                                            setConsequenceForm((p) => ({
                                                              ...p,
                                                              delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, successEffects: newEffects } : undefined,
                                                            }));
                                                          }}
                                                          className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                        />
                                                      </div>
                                                      <div>
                                                        <label className="block text-xs text-slate-400 mb-1">Duration (s)</label>
                                                        <NumberInput
                                                          
                                                          min="0"
                                                          step="1"
                                                          placeholder="Empty = permanent"
                                                          value={ef.durationMonths}
                                                          onChange={(e) => {
                                                            const newEffects = [...consequenceForm.delayedConsequence!.successEffects];
                                                            (newEffects[idx] as any).durationMonths = e.target.value;
                                                            setConsequenceForm((p) => ({
                                                              ...p,
                                                              delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, successEffects: newEffects } : undefined,
                                                            }));
                                                          }}
                                                          className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                        />
                                                      </div>
                                                    </>
                                                  ) : null}
                                                  <div className="flex items-center gap-2">
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const newEffects = consequenceForm.delayedConsequence!.successEffects.filter((_, i) => i !== idx);
                                                        setConsequenceForm((p) => ({
                                                          ...p,
                                                          delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, successEffects: newEffects } : undefined,
                                                        }));
                                                      }}
                                                      className="text-xs text-rose-300 hover:text-rose-200 px-2 py-1 rounded"
                                                    >
                                                      Remove
                                                    </button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
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
                                                  if (consequenceForm.delayedConsequence?.failureEffects) {
                                                    setConsequenceForm((p) => ({
                                                      ...p,
                                                      delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, failureEffects: undefined } : undefined,
                                                    }));
                                                  } else {
                                                    setConsequenceForm((p) => ({
                                                      ...p,
                                                      delayedConsequence: p.delayedConsequence ? {
                                                        ...p.delayedConsequence,
                                                        failureEffects: [],
                                                      } : undefined,
                                                    }));
                                                  }
                                                }}
                                                className={`px-2 py-1 text-xs rounded border ${
                                                  consequenceForm.delayedConsequence?.failureEffects
                                                    ? 'border-red-500 text-red-200 hover:bg-red-500/10'
                                                    : 'border-blue-500 text-blue-200 hover:bg-blue-500/10'
                                                }`}
                                              >
                                                {consequenceForm.delayedConsequence?.failureEffects ? 'Remove Failure' : '+ Add Failure'}
                                              </button>
                                            </div>
                                            {consequenceForm.delayedConsequence?.failureEffects && (
                                              <div className="space-y-2">
                                                {/* Add effect buttons and editor similar to success effects */}
                                                <div className="flex gap-2 flex-wrap mb-2">
                                                  <button
                                                    type="button"
                                                    onClick={() => setConsequenceForm((p) => ({
                                                      ...p,
                                                      delayedConsequence: p.delayedConsequence ? {
                                                        ...p.delayedConsequence,
                                                        failureEffects: [...(p.delayedConsequence.failureEffects || []), { type: EventEffectType.Cash, amount: '0', label: '' }],
                                                      } : undefined,
                                                    }))}
                                                    className="px-2 py-1 text-xs rounded border border-emerald-500 text-emerald-200 hover:bg-emerald-500/10"
                                                  >
                                                    + Cash
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => setConsequenceForm((p) => ({
                                                      ...p,
                                                      delayedConsequence: p.delayedConsequence ? {
                                                        ...p.delayedConsequence,
                                                        failureEffects: [...(p.delayedConsequence.failureEffects || []), { type: EventEffectType.Exp, amount: '0' }],
                                                      } : undefined,
                                                    }))}
                                                    className="px-2 py-1 text-xs rounded border border-emerald-500 text-emerald-200 hover:bg-emerald-500/10"
                                                  >
                                                    + Skill Level
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => setConsequenceForm((p) => ({
                                                      ...p,
                                                      delayedConsequence: p.delayedConsequence ? {
                                                        ...p.delayedConsequence,
                                                        failureEffects: [...(p.delayedConsequence.failureEffects || []), { type: EventEffectType.DynamicCash, expression: 'expenses*1', label: '' }],
                                                      } : undefined,
                                                    }))}
                                                    className="px-2 py-1 text-xs rounded border border-purple-500 text-purple-200 hover:bg-purple-500/10"
                                                  >
                                                    + Dynamic Cash
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => setConsequenceForm((p) => ({
                                                      ...p,
                                                      delayedConsequence: p.delayedConsequence ? {
                                                        ...p.delayedConsequence,
                                                        failureEffects: [...(p.delayedConsequence.failureEffects || []), { type: EventEffectType.Metric, metric: metricOptions[0].value, effectType: effectTypeOptions[0].value, value: '0', durationMonths: '' }],
                                                      } : undefined,
                                                    }))}
                                                    className="px-2 py-1 text-xs rounded border border-indigo-500 text-indigo-200 hover:bg-indigo-500/10"
                                                  >
                                                    + Metric Effect
                                                  </button>
                                                </div>
                                                {/* Failure effects list - similar structure to success effects */}
                                                {consequenceForm.delayedConsequence.failureEffects.map((ef, idx) => (
                                                  <div key={idx} className={`grid gap-2 items-end ${ef.type === EventEffectType.Metric ? 'grid-cols-1 sm:grid-cols-6' : ef.type === EventEffectType.DynamicCash ? 'grid-cols-1 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
                                                    {/* Same effect editing UI as success effects - can be refactored but keeping it simple for now */}
                                                    <div>
                                                      <label className="block text-xs text-slate-400 mb-1">Type</label>
                                                      <select
                                                        value={ef.type}
                                                        onChange={(e) => {
                                                          const newEffect = e.target.value === EventEffectType.Cash ? { type: EventEffectType.Cash as const, amount: '0', label: '' } :
                                                            e.target.value === EventEffectType.Exp ? { type: EventEffectType.Exp as const, amount: '0' } :
                                                            e.target.value === EventEffectType.DynamicCash ? { type: EventEffectType.DynamicCash as const, expression: 'expenses*1', label: '' } :
                                                            { type: EventEffectType.Metric as const, metric: metricOptions[0].value, effectType: effectTypeOptions[0].value, value: '0', durationMonths: '', priority: '' };
                                                          const newEffects = [...consequenceForm.delayedConsequence!.failureEffects!];
                                                          newEffects[idx] = newEffect;
                                                          setConsequenceForm((p) => ({
                                                            ...p,
                                                            delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, failureEffects: newEffects } : undefined,
                                                          }));
                                                        }}
                                                        className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                      >
                                                        <option value={EventEffectType.Cash}>Cash</option>
                                                        <option value={EventEffectType.Exp}>EXP</option>
                                                        <option value={EventEffectType.DynamicCash}>Dynamic Cash</option>
                                                        <option value={EventEffectType.Metric}>Metric Effect</option>
                                                      </select>
                                                    </div>
                                                    {/* Effect fields - same pattern as success effects */}
                                                    {ef.type === EventEffectType.Cash || ef.type === EventEffectType.Exp ? (
                                                      <>
                                                        <div>
                                                          <label className="block text-xs text-slate-400 mb-1">Amount</label>
                                                          <NumberInput
                                                            
                                                            value={ef.amount}
                                                            onChange={(e) => {
                                                              const newEffects = [...consequenceForm.delayedConsequence!.failureEffects!];
                                                              (newEffects[idx] as any).amount = e.target.value;
                                                              setConsequenceForm((p) => ({
                                                                ...p,
                                                                delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, failureEffects: newEffects } : undefined,
                                                              }));
                                                            }}
                                                            className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                          />
                                                        </div>
                                                        {ef.type === EventEffectType.Cash && (
                                                          <div>
                                                            <label className="block text-xs text-slate-400 mb-1">
                                                              Label (optional)
                                                              <span className="ml-1 text-slate-500 cursor-help" title="Used in PnL display. Takes priority over choice/consequence names. If empty, shows: '[Event Title] - [choice label]'">ℹ️</span>
                                                            </label>
                                                            <input
                                                              placeholder="e.g. Partnership Bonus, Client Payment"
                                                              value={ef.label ?? ''}
                                                              onChange={(e) => {
                                                                const newEffects = [...consequenceForm.delayedConsequence!.failureEffects!];
                                                                (newEffects[idx] as any).label = e.target.value;
                                                                setConsequenceForm((p) => ({
                                                                  ...p,
                                                                  delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, failureEffects: newEffects } : undefined,
                                                                }));
                                                              }}
                                                              className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                            />
                                                          </div>
                                                        )}
                                                      </>
                                                    ) : ef.type === EventEffectType.DynamicCash ? (
                                                      <>
                                                        <div>
                                                          <label className="block text-xs text-slate-400 mb-1">Expression</label>
                                                          <input
                                                            value={ef.expression}
                                                            onChange={(e) => {
                                                              const newEffects = [...consequenceForm.delayedConsequence!.failureEffects!];
                                                              (newEffects[idx] as any).expression = e.target.value;
                                                              setConsequenceForm((p) => ({
                                                                ...p,
                                                                delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, failureEffects: newEffects } : undefined,
                                                              }));
                                                            }}
                                                            placeholder="expenses*3"
                                                            className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                          />
                                                        </div>
                                                        <div className="relative">
                                                          <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                                                            Label (optional)
                                                            <button
                                                              type="button"
                                                              onClick={() => setShowLabelTooltip(showLabelTooltip === `delayed-failure-dynamic-${idx}` ? null : `delayed-failure-dynamic-${idx}`)}
                                                              className="text-slate-500 hover:text-slate-300 cursor-pointer text-xs"
                                                              aria-label="Help"
                                                            >
                                                              ?
                                                            </button>
                                                            {showLabelTooltip === `delayed-failure-dynamic-${idx}` && (
                                                              <div className="absolute left-0 top-6 z-50 w-64 p-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg text-xs text-slate-300">
                                                                <p className="mb-1">Used in PnL display. Takes priority over choice/consequence names.</p>
                                                                <p>If empty, shows: &quot;{eventForm.title} - [choice label]&quot;</p>
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
                                                            value={ef.label ?? ''}
                                                            onChange={(e) => {
                                                              const newEffects = [...consequenceForm.delayedConsequence!.failureEffects!];
                                                              (newEffects[idx] as any).label = e.target.value;
                                                              setConsequenceForm((p) => ({
                                                                ...p,
                                                                delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, failureEffects: newEffects } : undefined,
                                                              }));
                                                            }}
                                                            className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                          />
                                                        </div>
                                                      </>
                                                    ) : ef.type === EventEffectType.Metric ? (
                                                      <>
                                                        <div>
                                                          <label className="block text-xs text-slate-400 mb-1">Metric</label>
                                                          <select
                                                            value={ef.metric}
                                                            onChange={(e) => {
                                                              const newEffects = [...consequenceForm.delayedConsequence!.failureEffects!];
                                                              (newEffects[idx] as any).metric = e.target.value;
                                                              setConsequenceForm((p) => ({
                                                                ...p,
                                                                delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, failureEffects: newEffects } : undefined,
                                                              }));
                                                            }}
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
                                                            value={ef.effectType}
                                                            onChange={(e) => {
                                                              const newEffects = [...consequenceForm.delayedConsequence!.failureEffects!];
                                                              (newEffects[idx] as any).effectType = e.target.value;
                                                              setConsequenceForm((p) => ({
                                                                ...p,
                                                                delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, failureEffects: newEffects } : undefined,
                                                              }));
                                                            }}
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
                                                            
                                                            value={ef.value}
                                                            onChange={(e) => {
                                                              const newEffects = [...consequenceForm.delayedConsequence!.failureEffects!];
                                                              (newEffects[idx] as any).value = e.target.value;
                                                              setConsequenceForm((p) => ({
                                                                ...p,
                                                                delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, failureEffects: newEffects } : undefined,
                                                              }));
                                                            }}
                                                            className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                          />
                                                        </div>
                                                        <div>
                                                          <label className="block text-xs text-slate-400 mb-1">Duration (s)</label>
                                                          <NumberInput
                                                            
                                                            min="0"
                                                            step="1"
                                                            placeholder="Empty = permanent"
                                                            value={ef.durationMonths}
                                                            onChange={(e) => {
                                                              const newEffects = [...consequenceForm.delayedConsequence!.failureEffects!];
                                                              (newEffects[idx] as any).durationMonths = e.target.value;
                                                              setConsequenceForm((p) => ({
                                                                ...p,
                                                                delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, failureEffects: newEffects } : undefined,
                                                              }));
                                                            }}
                                                            className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                          />
                                                        </div>
                                                      </>
                                                    ) : null}
                                                    <div className="flex items-center gap-2">
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          const newEffects = consequenceForm.delayedConsequence!.failureEffects!.filter((_, i) => i !== idx);
                                                          setConsequenceForm((p) => ({
                                                            ...p,
                                                            delayedConsequence: p.delayedConsequence ? { ...p.delayedConsequence, failureEffects: newEffects.length > 0 ? newEffects : undefined } : undefined,
                                                          }));
                                                        }}
                                                        className="text-xs text-rose-300 hover:text-rose-200 px-2 py-1 rounded"
                                                      >
                                                        Remove
                                                      </button>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div className="md:col-span-2 flex flex-wrap gap-3">
                                      <button type="button" onClick={handleSaveConsequence} className="px-4 py-2 rounded-lg text-sm font-semibold transition bg-amber-600 hover:bg-amber-500 text-white">
                                        Save Consequence
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleResetConsequence}
                                        className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                                      >
                                        {isCreatingConsequence ? 'Cancel' : 'Reset'}
                                      </button>
                                      {!isCreatingConsequence && selectedConsequenceId && (
                                        <button type="button" onClick={handleDeleteConsequence} className="px-4 py-2 rounded-lg text-sm font-semibold transition bg-rose-600 hover:bg-rose-500 text-white">
                                          Delete Consequence
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

    </>
  );
}

