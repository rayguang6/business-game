import { useState, useCallback } from 'react';
import { fetchEventsForIndustry, upsertEventForIndustry, deleteEventById } from '@/lib/data/eventRepository';
import type { GameEvent, GameEventChoice } from '@/lib/types/gameEvents';
import type { Operation } from './types';

import type { Requirement } from '@/lib/game/types';

interface EventForm {
  id: string;
  title: string;
  category: 'opportunity' | 'risk';
  summary: string;
  requirements?: Requirement[];
}

export function useEvents(industryId: string) {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [operation, setOperation] = useState<Operation>('idle');
  const [status, setStatus] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<EventForm>({
    id: '',
    title: '',
    category: 'opportunity',
    summary: '',
  });
  const [choices, setChoices] = useState<GameEventChoice[]>([]);

  const load = useCallback(async () => {
    if (!industryId) return;
    setOperation('loading');
    setStatus(null);
    const result = await fetchEventsForIndustry(industryId);
    setOperation('idle');
    if (!result) {
      setEvents([]);
      return;
    }
    const sorted = result.slice().sort((a, b) => a.title.localeCompare(b.title));
    setEvents(sorted);
    if (sorted.length > 0) {
      selectEvent(sorted[0], false);
    }
  }, [industryId]);

  const selectEvent = useCallback((event: GameEvent, resetMsg = true) => {
    setSelectedId(event.id);
    setIsCreating(false);
    setForm({
      id: event.id,
      title: event.title,
      category: event.category,
      summary: event.summary,
      requirements: event.requirements || [],
    });
    setChoices(event.choices || []);
    if (resetMsg) setStatus(null);
  }, []);

  const createEvent = useCallback(() => {
    if (!industryId) {
      setStatus('Save the industry first.');
      return;
    }
    setIsCreating(true);
    setSelectedId('');
    setForm({
      id: '',
      title: '',
      category: 'opportunity',
      summary: '',
      requirements: [],
    });
    setChoices([]);
    setStatus(null);
  }, [industryId]);

  const persistEventWithChoices = useCallback(async (nextChoices: GameEventChoice[], successMessage: string = 'Event saved.') => {
    if (!industryId || !form.id) {
      setStatus('Saved locally. Save Event to persist.');
      return;
    }
    const id = form.id.trim();
    const title = form.title.trim();
    const summary = form.summary.trim();
    const category = form.category;
    
    // Check which required fields are missing and provide specific error message
    const missingFields: string[] = [];
    if (!id) missingFields.push('ID');
    if (!title) missingFields.push('Title');
    if (!summary) missingFields.push('Summary');
    
    if (missingFields.length > 0) {
      setStatus(`Saved locally. Missing required fields: ${missingFields.join(', ')}. Fill them to persist.`);
      return;
    }
    const payload: GameEvent = { 
      id, 
      title, 
      category, 
      summary, 
      choices: nextChoices,
      requirements: form.requirements && form.requirements.length > 0 ? form.requirements : undefined,
    } as GameEvent;
    setOperation('saving');
    const result = await upsertEventForIndustry(industryId, payload);
    setOperation('idle');
    if (!result.success) {
      setStatus(result.message ?? 'Failed to save event.');
      return;
    }
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === id);
      const next = exists ? prev.map((e) => (e.id === id ? payload : e)) : [...prev, payload];
      return next.sort((a, b) => a.title.localeCompare(b.title));
    });
    setStatus(successMessage);
  }, [industryId, form]);

  const saveEvent = useCallback(async () => {
    await persistEventWithChoices(choices, 'Event saved.');
    setIsCreating(false);
    setSelectedId(form.id.trim());
  }, [choices, form, persistEventWithChoices]);

  const deleteEvent = useCallback(async () => {
    if (isCreating || !selectedId) return;
    const event = events.find(e => e.id === selectedId);
    if (!window.confirm(`Delete event "${event?.title || selectedId}"?`)) return;
    setOperation('deleting');
    const result = await deleteEventById(selectedId);
    setOperation('idle');
    if (!result.success) {
      setStatus(result.message ?? 'Failed to delete event.');
      return;
    }
    setEvents((prev) => prev.filter((e) => e.id !== selectedId));
    setSelectedId('');
    setForm({
      id: '',
      title: '',
      category: 'opportunity',
      summary: '',
      requirements: [],
    });
    setChoices([]);
    setStatus('Event deleted.');
  }, [selectedId, isCreating, events]);

  const reset = useCallback(() => {
    if (selectedId && !isCreating) {
      const existing = events.find(e => e.id === selectedId);
      if (existing) selectEvent(existing);
    } else {
      setIsCreating(false);
      setSelectedId('');
      setForm({
        id: '',
        title: '',
        category: 'opportunity',
        summary: '',
      });
      setChoices([]);
    }
    setStatus(null);
  }, [selectedId, isCreating, events, selectEvent]);

  const updateForm = useCallback((updates: Partial<EventForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  }, []);

  const updateChoices = useCallback((newChoices: GameEventChoice[]) => {
    setChoices(newChoices);
  }, []);

  const updateStatus = useCallback((newStatus: string | null) => {
    setStatus(newStatus);
  }, []);

  const jsonImport = useCallback(async (eventsToImport: GameEvent[]) => {
    let successCount = 0;
    for (const event of eventsToImport) {
      const result = await upsertEventForIndustry(industryId, event);
      if (result.success) {
        successCount++;
        setEvents((prev) => {
          const exists = prev.some((e) => e.id === event.id);
          const next = exists ? prev.map((e) => (e.id === event.id ? event : e)) : [...prev, event];
          return next.sort((a, b) => a.title.localeCompare(b.title));
        });
      }
    }
    if (successCount > 0) {
      setStatus(`Successfully imported ${successCount} event(s).`);
    }
  }, [industryId]);

  const jsonExport = useCallback(() => {
    const exportData = JSON.stringify(events, null, 2);
    navigator.clipboard.writeText(exportData).then(() => {
      setStatus('Events JSON copied to clipboard!');
    }).catch(() => {
      setStatus('Events JSON shown below. Copy manually.');
    });
  }, [events]);

  return {
    events,
    loading: operation === 'loading',
    status,
    selectedId,
    isCreating,
    saving: operation === 'saving',
    deleting: operation === 'deleting',
    operation,
    form,
    choices,
    load,
    selectEvent,
    createEvent,
    saveEvent,
    deleteEvent,
    reset,
    updateForm,
    updateChoices,
    updateStatus,
    persistEventWithChoices,
    jsonImport,
    jsonExport,
  };
}

