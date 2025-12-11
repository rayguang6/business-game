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
import { makeUniqueId, slugify, generateUniqueId } from './utils';
import { useToastFunctions } from './ui/ToastContext';
import { EventCategory, EventCategoryType, AUTO_RESOLVE_CATEGORIES } from '@/lib/game/constants/eventCategories';

// Import the new extracted components
import { EventList } from './events/EventList';
import { ChoiceList } from './events/ChoiceList';
import { ConsequenceList } from './events/ConsequenceList';
import { ChoiceEditor, ChoiceFormData } from './events/ChoiceEditor';
import { ConsequenceEditor, ConsequenceFormData } from './events/ConsequenceEditor';

interface EventsTabProps {
  industryId: string;
  events: GameEvent[];
  eventsLoading: boolean;
  selectedEventId: string;
  isCreatingEvent: boolean;
  eventForm: {
    id: string;
    title: string;
    category: EventCategoryType;
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

  // Choice/consequence state (managed internally)
  const [selectedChoiceId, setSelectedChoiceId] = useState<string>('');
  const [isCreatingChoice, setIsCreatingChoice] = useState<boolean>(false);
  const [choiceForm, setChoiceForm] = useState<ChoiceFormData>({
    id: '',
    label: '',
    description: '',
    cost: '',
    timeCost: '',
    requirements: []
  });

  const [selectedConsequenceId, setSelectedConsequenceId] = useState<string>('');
  const [isCreatingConsequence, setIsCreatingConsequence] = useState<boolean>(false);
  const [consequenceForm, setConsequenceForm] = useState<ConsequenceFormData>({
    id: '',
    label: '',
    description: '',
    weight: '1',
    effects: []
  });

  // Reset choice/consequence state when event changes
  useEffect(() => {
    setSelectedChoiceId('');
    setIsCreatingChoice(false);
    setChoiceForm({ id: '', label: '', description: '', cost: '', timeCost: '', requirements: [] });
    setSelectedConsequenceId('');
    setIsCreatingConsequence(false);
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [] });
  }, [selectedEventId, isCreatingEvent]);

  // Auto-select first choice for GoodBad events
  useEffect(() => {
    if (eventForm.category === EventCategory.GoodBad && eventChoices.length === 1 && !selectedChoiceId && !isCreatingChoice) {
      setSelectedChoiceId(eventChoices[0].id);
    }
  }, [eventForm.category, eventChoices, selectedChoiceId, isCreatingChoice]);

  // Auto-create default choice when switching to GoodBad category
  useEffect(() => {
    if (eventForm.category === EventCategory.GoodBad && eventChoices.length === 0 && (selectedEventId || isCreatingEvent)) {
      const defaultChoice: GameEventChoice = {
        id: 'default-choice',
        label: 'Auto-resolve',
        description: 'This choice will be automatically selected for Good/Bad events',
        consequences: []
      };
      onUpdateEventChoices([defaultChoice]);
    } else if (eventForm.category === EventCategory.Opportunity && eventChoices.length === 1 && eventChoices[0].id === 'default-choice') {
      // Remove auto-created choice when switching back to Opportunity
      onUpdateEventChoices([]);
    }
  }, [eventForm.category, eventChoices.length, selectedEventId, isCreatingEvent, onUpdateEventChoices]);

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
    let id = choiceForm.id.trim();
    const label = choiceForm.label.trim();
    const description = choiceForm.description.trim();
    const cost = choiceForm.cost.trim() === '' ? undefined : Number(choiceForm.cost);
    const timeCost = choiceForm.timeCost.trim() === '' ? undefined : Number(choiceForm.timeCost);
    const setsFlag = choiceForm.setsFlag?.trim() || undefined;

    if (!label) {
      error('Choice label is required.');
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

    // Auto-generate ID if not provided
    if (!id) {
      const existingIds = new Set(eventChoices.map(c => c.id));
      id = generateUniqueId('choice', existingIds, label);
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

    // Ensure the consequence has an ID, generate one if missing
    let consequenceId = consequence.id?.trim();
    if (!consequenceId) {
      const choiceIndex = eventChoices.findIndex((c) => c.id === selectedChoiceId);
      if (choiceIndex !== -1) {
        const existingIds = new Set(eventChoices[choiceIndex].consequences.map(cs => cs.id));
        consequenceId = generateUniqueId('consequence', existingIds, consequence.label);

        // Update the consequence with the new ID
        const updatedChoices = [...eventChoices];
        const consequenceIndex = updatedChoices[choiceIndex].consequences.findIndex(cs => cs === consequence);
        if (consequenceIndex !== -1) {
          updatedChoices[choiceIndex].consequences[consequenceIndex] = { ...consequence, id: consequenceId };
          onUpdateEventChoices(updatedChoices);
        }
      }
    }

    setSelectedConsequenceId(consequenceId);
    const delayed = consequence.delayedConsequence;
    setConsequenceForm({
      id: consequenceId,
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
    let id = consequenceForm.id.trim();
    const label = consequenceForm.label.trim();
    const description = consequenceForm.description.trim();
    const weight = Number(consequenceForm.weight);

    if (!label) {
      error('Consequence label is required.');
      return;
    }
    if (!Number.isFinite(weight) || weight < 1) {
      error('Consequence weight must be a positive integer.');
      return;
    }

    const choiceIndex = eventChoices.findIndex((c) => c.id === selectedChoiceId);
    if (choiceIndex === -1) return;

    // Auto-generate ID if not provided
    if (!id) {
      const existingIds = new Set(eventChoices[choiceIndex].consequences.map(cs => cs.id));
      id = generateUniqueId('consequence', existingIds, label);
    }

    const exists = eventChoices[choiceIndex].consequences.some((cs) => cs.id === id);
    const nextConsequence: any = {
      id,
      label: label || undefined,
      description: description || undefined,
      weight,
      effects: consequenceForm.effects.map((ef: any) => {
        if (ef.type === EventEffectType.Cash) {
          return { type: EventEffectType.Cash, amount: Number(ef.amount || 0), label: ef.label || undefined };
        } else if (ef.type === EventEffectType.DynamicCash) {
          return { type: EventEffectType.DynamicCash, expression: ef.expression || '', label: ef.label || undefined };
        } else if (ef.type === EventEffectType.Exp) {
          return { type: EventEffectType.Exp, amount: Number(ef.amount || 0) };
        } else if (ef.type === EventEffectType.Metric) {
          return {
            type: EventEffectType.Metric,
            metric: ef.metric,
            effectType: ef.effectType,
            value: Number(ef.value || 0),
            durationMonths: ef.durationMonths ? Number(ef.durationMonths) : null,
            priority: ef.priority ? Number(ef.priority) : undefined,
          };
        }
        return ef;
      }),
      delayedConsequence: consequenceForm.delayedConsequence ? {
        id: consequenceForm.delayedConsequence.id || generateUniqueId('delayed-consequence', new Set(), consequenceForm.delayedConsequence.label),
        delaySeconds: Number(consequenceForm.delayedConsequence.delaySeconds),
        successRequirements: consequenceForm.delayedConsequence.successRequirements,
        successEffects: consequenceForm.delayedConsequence.successEffects.map((ef: any) => {
          if (ef.type === EventEffectType.Cash) {
            return { type: EventEffectType.Cash, amount: Number(ef.amount || 0), label: ef.label || undefined };
          } else if (ef.type === EventEffectType.DynamicCash) {
            return { type: EventEffectType.DynamicCash, expression: ef.expression || '', label: ef.label || undefined };
          } else if (ef.type === EventEffectType.Exp) {
            return { type: EventEffectType.Exp, amount: Number(ef.amount || 0) };
          } else if (ef.type === EventEffectType.Metric) {
            return {
              type: EventEffectType.Metric,
              metric: ef.metric,
              effectType: ef.effectType,
              value: Number(ef.value || 0),
              durationMonths: ef.durationMonths ? Number(ef.durationMonths) : null,
              priority: ef.priority ? Number(ef.priority) : undefined,
            };
          }
          return ef;
        }),
        failureEffects: consequenceForm.delayedConsequence.failureEffects?.map((ef: any) => {
          if (ef.type === EventEffectType.Cash) {
            return { type: EventEffectType.Cash, amount: Number(ef.amount || 0), label: ef.label || undefined };
          } else if (ef.type === EventEffectType.DynamicCash) {
            return { type: EventEffectType.DynamicCash, expression: ef.expression || '', label: ef.label || undefined };
          } else if (ef.type === EventEffectType.Exp) {
            return { type: EventEffectType.Exp, amount: Number(ef.amount || 0) };
          } else if (ef.type === EventEffectType.Metric) {
            return {
              type: EventEffectType.Metric,
              metric: ef.metric,
              effectType: ef.effectType,
              value: Number(ef.value || 0),
              durationMonths: ef.durationMonths ? Number(ef.durationMonths) : null,
              priority: ef.priority ? Number(ef.priority) : undefined,
            };
          }
          return ef;
        }),
        label: consequenceForm.delayedConsequence.label,
        successDescription: consequenceForm.delayedConsequence.successDescription,
        failureDescription: consequenceForm.delayedConsequence.failureDescription,
      } : undefined,
    };

    const nextChoices = [...eventChoices];
    if (exists) {
      nextChoices[choiceIndex].consequences = nextChoices[choiceIndex].consequences.map((cs) =>
        cs.id === id ? nextConsequence : cs
      );
    } else {
      nextChoices[choiceIndex].consequences = [...nextChoices[choiceIndex].consequences, nextConsequence];
    }

    onUpdateEventChoices(nextChoices);
    setIsCreatingConsequence(false);
    setSelectedConsequenceId(id);
    onPersistEventWithChoices(nextChoices, 'Consequence saved.');
  };

  const handleDeleteConsequence = () => {
    if (isCreatingConsequence || !selectedConsequenceId || !selectedChoiceId) return;
    const choiceIndex = eventChoices.findIndex((c) => c.id === selectedChoiceId);
    if (choiceIndex === -1) return;

    const nextChoices = [...eventChoices];
    nextChoices[choiceIndex].consequences = nextChoices[choiceIndex].consequences.filter((cs) => cs.id !== selectedConsequenceId);
    onUpdateEventChoices(nextChoices);
    setSelectedConsequenceId('');
    setIsCreatingConsequence(false);
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [] });
    onPersistEventWithChoices(nextChoices, 'Consequence deleted.');
  };

  const handleResetConsequence = () => {
    if (selectedConsequenceId && !isCreatingConsequence) {
      const choice = eventChoices.find((c) => c.id === selectedChoiceId);
      const existing = choice?.consequences.find((cs) => cs.id === selectedConsequenceId);
      if (existing) selectConsequence(existing);
    } else {
      setIsCreatingConsequence(false);
      setSelectedConsequenceId('');
      setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [] });
    }
  };

  // Get current consequences for the selected choice
  const currentConsequences = selectedChoiceId ? eventChoices.find((c) => c.id === selectedChoiceId)?.consequences || [] : [];

  return (
    <div className="space-y-6">
      {/* Events Section */}
      <EventList
        events={events}
        eventsLoading={eventsLoading}
        selectedEventId={selectedEventId}
        isCreatingEvent={isCreatingEvent}
        onSelectEvent={onSelectEvent}
        onCreateEvent={onCreateEvent}
      />

      {/* Event Form */}
      {(selectedEventId || isCreatingEvent) && (
        <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Event ID</label>
              <input
                value={eventForm.id}
                onChange={(e) => onUpdateEventForm({ id: e.target.value })}
                onBlur={() => {
                  if (!eventForm.id.trim()) {
                    const existingIds = new Set(events.map((e) => e.id));
                    const baseId = eventForm.title.trim() || 'event';
                    const nextId = makeUniqueId(slugify(baseId), existingIds);
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
              <label className="block text-sm font-semibold text-slate-300 mb-1">Title</label>
              <input
                value={eventForm.title}
                onChange={(e) => onUpdateEventForm({ title: e.target.value })}
                className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={eventForm.category}
                onChange={(e) => onUpdateEventForm({ category: e.target.value as EventCategoryType })}
                className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
              >
                <option value={EventCategory.Opportunity}>Opportunity</option>
                <option value={EventCategory.GoodBad}>Good/Bad</option>
              </select>
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
                requirements={eventForm.requirements || []}
                onRequirementsChange={(requirements) => onUpdateEventForm({ requirements })}
                flags={flags}
                upgrades={upgrades}
                staffRoles={staffRoles}
                marketingCampaigns={marketingCampaigns}
                flagsLoading={flagsLoading}
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onSaveEvent}
                disabled={eventSaving}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
              >
                {eventSaving ? 'Saving...' : 'Save Event'}
              </button>
              <button
                type="button"
                onClick={onReset}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
              >
                {isCreatingEvent ? 'Cancel' : 'Reset'}
              </button>
              {!isCreatingEvent && selectedEventId && (
                <button
                  type="button"
                  onClick={onDeleteEvent}
                  disabled={eventDeleting}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50"
                >
                  {eventDeleting ? 'Deleting...' : 'Delete Event'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Choices Section - Only for Opportunity events */}
      {(selectedEventId || isCreatingEvent) && eventForm.category === EventCategory.Opportunity && (
        <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-slate-200">Choices</h4>
            <button
              type="button"
              onClick={handleCreateChoice}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-fuchsia-500 text-fuchsia-200 hover:bg-fuchsia-500/10"
            >
              + Add Choice
            </button>
          </div>

          <ChoiceList
            choices={eventChoices}
            selectedChoiceId={selectedChoiceId}
            isCreatingChoice={isCreatingChoice}
            onSelectChoice={selectChoice}
            onCreateChoice={handleCreateChoice}
          />

          {/* Choice Editor */}
          {(selectedChoiceId || isCreatingChoice) && (
            <div className="mt-4">
              <ChoiceEditor
                choiceForm={choiceForm}
                isCreatingChoice={isCreatingChoice}
                flags={flags}
                flagsLoading={flagsLoading}
                upgrades={upgrades}
                staffRoles={staffRoles}
                marketingCampaigns={marketingCampaigns}
                onUpdate={(updates) => setChoiceForm(prev => ({ ...prev, ...updates }))}
                onSave={handleSaveChoice}
                onReset={handleResetChoice}
                onDelete={handleDeleteChoice}
              />
            </div>
          )}

          {/* Consequences Section for Opportunity events */}
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

              <ConsequenceList
                consequences={currentConsequences}
                selectedConsequenceId={selectedConsequenceId}
                isCreatingConsequence={isCreatingConsequence}
                onSelectConsequence={selectConsequence}
                onCreateConsequence={handleCreateConsequence}
              />

              {/* Consequence Editor */}
              {(selectedConsequenceId || isCreatingConsequence) && (
                <div className="mt-4">
                  <ConsequenceEditor
                    consequenceForm={consequenceForm}
                    isCreatingConsequence={isCreatingConsequence}
                    eventTitle={eventForm.title}
                    metricOptions={metricOptions}
                    effectTypeOptions={effectTypeOptions}
                    flags={flags}
                    flagsLoading={flagsLoading}
                    upgrades={upgrades}
                    staffRoles={staffRoles}
                    marketingCampaigns={marketingCampaigns}
                    onUpdate={(updates) => setConsequenceForm(prev => ({ ...prev, ...updates }))}
                    onSave={handleSaveConsequence}
                    onReset={handleResetConsequence}
                    onDelete={handleDeleteConsequence}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Consequences Section - For GoodBad events (direct access) */}
      {(selectedEventId || isCreatingEvent) && eventForm.category === EventCategory.GoodBad && (
        <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-slate-200">Consequences</h4>
            <div className="text-xs text-slate-400">
              Good/Bad events auto-resolve with one consequence
            </div>
          </div>

          <ConsequenceList
            consequences={currentConsequences}
            selectedConsequenceId={selectedConsequenceId}
            isCreatingConsequence={isCreatingConsequence}
            onSelectConsequence={selectConsequence}
            onCreateConsequence={handleCreateConsequence}
          />

          {/* Consequence Editor */}
          {(selectedConsequenceId || isCreatingConsequence) && (
            <div className="mt-4">
              <ConsequenceEditor
                consequenceForm={consequenceForm}
                isCreatingConsequence={isCreatingConsequence}
                eventTitle={eventForm.title}
                metricOptions={metricOptions}
                effectTypeOptions={effectTypeOptions}
                flags={flags}
                flagsLoading={flagsLoading}
                upgrades={upgrades}
                staffRoles={staffRoles}
                marketingCampaigns={marketingCampaigns}
                onUpdate={(updates) => setConsequenceForm(prev => ({ ...prev, ...updates }))}
                onSave={handleSaveConsequence}
                onReset={handleResetConsequence}
                onDelete={handleDeleteConsequence}
              />
            </div>
          )}

          {/* Add Consequence Button */}
          {currentConsequences.length === 0 && !isCreatingConsequence && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleCreateConsequence}
                className="px-4 py-3 text-sm font-medium rounded-lg border border-amber-500 text-amber-200 hover:bg-amber-500/10"
              >
                + Add Consequence
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}