import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchEvents, upsertEvent, deleteEvent } from '@/lib/server/actions/adminActions';
import type { GameEvent, GameEventChoice } from '@/lib/types/gameEvents';
import type { Operation } from './types';
import type { Requirement } from '@/lib/game/types';
import { useToastFunctions } from '../components/ui/ToastContext';
import { generateUniqueId } from '../components/utils';
import { EventCategory, EventCategoryType } from '@/lib/game/constants/eventCategories';

interface EventForm {
  id: string;
  title: string;
  category: EventCategoryType;
  summary?: string;
  requirements?: Requirement[];
  order?: number;
}

// Query key factory for events
const eventsQueryKey = (industryId: string) => ['events', industryId] as const;

export function useEvents(industryId: string, eventId?: string) {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error } = useToastFunctions();
  const [selectedId, setSelectedId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<EventForm>({
    id: '',
    title: '',
    category: EventCategory.Opportunity,
    summary: '',
  });
  const [choices, setChoices] = useState<GameEventChoice[]>([]);

  // Fetch events using React Query
  const {
    data: events = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: eventsQueryKey(industryId),
    queryFn: async () => {
      if (!industryId) return [];
      const result = await fetchEvents(industryId);
      if (!result) return [];
      return result.slice().sort((a, b) => {
        // Sort by order first (null orders last), then by title
        const aOrder = a.order ?? Infinity;
        const bOrder = b.order ?? Infinity;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return a.title.localeCompare(b.title);
      });
    },
    enabled: !!industryId,
  });

  // Save event mutation with optimistic update
  const saveMutation = useMutation({
    mutationFn: async (payload: GameEvent) => {
      if (!industryId) throw new Error('Industry ID is required');
      const result = await upsertEvent(industryId as any, payload);
      if (!result.success) {
        throw new Error(result.message ?? 'Failed to save event.');
      }
      return payload;
    },
    onMutate: async (newEvent) => {
      await queryClient.cancelQueries({ queryKey: eventsQueryKey(industryId) });
      const previousEvents = queryClient.getQueryData<GameEvent[]>(eventsQueryKey(industryId));

      queryClient.setQueryData<GameEvent[]>(eventsQueryKey(industryId), (old = []) => {
        const exists = old.some((e) => e.id === newEvent.id);
        const next = exists ? old.map((e) => (e.id === newEvent.id ? newEvent : e)) : [...old, newEvent];
        return next.sort((a, b) => {
          // Sort by order first (null orders last), then by title
          const aOrder = a.order ?? Infinity;
          const bOrder = b.order ?? Infinity;
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          return a.title.localeCompare(b.title);
        });
      });

      return { previousEvents };
    },
    onError: (err, newEvent, context) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(eventsQueryKey(industryId), context.previousEvents);
      }
      error(err instanceof Error ? err.message : 'Failed to save event.');
    },
    onSuccess: (savedEvent) => {
      setIsCreating(false);
      setSelectedId(savedEvent.id);
      // Update form with the saved event ID in case it was auto-generated
      setForm(prev => ({ ...prev, id: savedEvent.id }));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: eventsQueryKey(industryId) });
    },
  });

  // Delete event mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteEvent(id);
      if (!result.success) {
        throw new Error(result.message ?? 'Failed to delete event.');
      }
      return id;
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: eventsQueryKey(industryId) });
      const previousEvents = queryClient.getQueryData<GameEvent[]>(eventsQueryKey(industryId));

      queryClient.setQueryData<GameEvent[]>(eventsQueryKey(industryId), (old = []) =>
        old.filter((e) => e.id !== deletedId)
      );

      return { previousEvents };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(eventsQueryKey(industryId), context.previousEvents);
      }
      error(err instanceof Error ? err.message : 'Failed to delete event.');
    },
    onSuccess: () => {
      setSelectedId('');
      setForm({
        id: '',
        title: '',
        category: EventCategory.Opportunity,
        summary: '',
        requirements: [],
      });
      setChoices([]);
      toastSuccess('Event deleted.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: eventsQueryKey(industryId) });
    },
  });

  const selectEvent = useCallback((event: GameEvent, resetMsg = true) => {
    setSelectedId(event.id);
    setIsCreating(false);
    setForm({
      id: event.id,
      title: event.title,
      category: event.category,
      summary: event.summary,
      requirements: event.requirements || [],
      order: event.order,
    });
    setChoices(event.choices || []);
  }, []);

  // Select event when eventId changes or events are loaded
  useEffect(() => {
    if (eventId && events.length > 0) {
      const event = events.find((e) => e.id === eventId);
      if (event) {
        setSelectedId(event.id);
        setIsCreating(false);
        setForm({
          id: event.id,
          title: event.title,
          category: event.category,
          summary: event.summary,
          requirements: event.requirements || [],
          order: event.order,
        });
        setChoices(event.choices || []);
        
      }
    }
  }, [eventId, events]);

  const createEvent = useCallback(() => {
    if (!industryId) {
      error('Save the industry first.');
      return;
    }
    setIsCreating(true);
    setSelectedId('');
    setForm({
      id: '',
      title: '',
      category: EventCategory.Opportunity,
      summary: '',
      requirements: [],
    });
    setChoices([]);
    
  }, [industryId, error]);

  const persistEventWithChoices = useCallback(
    async (nextChoices: GameEventChoice[], successMessage: string = 'Event saved.') => {
      if (!industryId) {
        error('Saved locally. Save Event to persist.');
        return;
      }

      const title = form.title.trim();
      const summary = form.summary?.trim() || '';
      const category = form.category;

      // Check which required fields are missing and provide specific error message
      const missingFields: string[] = [];
      if (!title) missingFields.push('Title');

      if (missingFields.length > 0) {
        error(`Saved locally. Missing required fields: ${missingFields.join(', ')}. Fill them to persist.`);
        return;
      }

      // Auto-generate ID if not provided
      let id = form.id.trim();
      if (!id) {
        const existingIds = new Set(events.map(e => e.id));
        id = generateUniqueId('event', existingIds, title);
      }
      const payload: GameEvent = {
        id,
        title,
        category,
        summary,
        choices: nextChoices,
        requirements: form.requirements && form.requirements.length > 0 ? form.requirements : undefined,
      } as GameEvent;
      saveMutation.mutate(payload, {
        onSuccess: () => {
          toastSuccess(successMessage);
        },
      });
    },
    [industryId, form, saveMutation, toastSuccess]
  );

  const saveEvent = useCallback(async () => {
    const title = form.title.trim();
    const summary = form.summary?.trim() || '';
    const category = form.category;

    // Check which required fields are missing and provide specific error message
    const missingFields: string[] = [];
    if (!title) missingFields.push('Title');

    // Validate GoodBad events have consequences
    if (category === EventCategory.GoodBad) {
      const hasValidChoice = choices.length === 1 && choices[0].consequences && choices[0].consequences.length > 0;
      if (!hasValidChoice) {
        error('Good/Bad events must have exactly one choice with at least one consequence. Add consequences to the auto-created choice.');
        return;
      }
    }

    if (missingFields.length > 0) {
      error(`Saved locally. Missing required fields: ${missingFields.join(', ')}. Fill them to persist.`);
      return;
    }

    // Auto-generate ID if not provided
    let id = form.id.trim();
    if (!id) {
      const existingIds = new Set(events.map(e => e.id));
      id = generateUniqueId('event', existingIds, title);
    }

    const payload: GameEvent = {
      id,
      title,
      category,
      summary,
      choices,
      requirements: form.requirements && form.requirements.length > 0 ? form.requirements : undefined,
    } as GameEvent;

    saveMutation.mutate(payload, {
      onSuccess: () => {
        toastSuccess('Event saved.');
      },
    });
  }, [choices, form, saveMutation, events, toastSuccess, error]);

  const deleteEventHandler = useCallback(async () => {
    if (isCreating || !selectedId) return;
    const event = events.find((e) => e.id === selectedId);
    if (!window.confirm(`Delete event "${event?.title || selectedId}"?`)) return;
    deleteMutation.mutate(selectedId);
  }, [selectedId, isCreating, events, deleteMutation]);

  const reset = useCallback(() => {
    if (selectedId && !isCreating) {
      const existing = events.find((e) => e.id === selectedId);
      if (existing) selectEvent(existing);
    } else {
      setIsCreating(false);
      setSelectedId('');
      setForm({
        id: '',
        title: '',
        category: EventCategory.Opportunity,
        summary: '',
      });
      setChoices([]);
    }
    
  }, [selectedId, isCreating, events, selectEvent]);

  const updateForm = useCallback((updates: Partial<EventForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateChoices = useCallback((newChoices: GameEventChoice[]) => {
    setChoices(newChoices);
  }, []);

  const updateStatus = useCallback((newStatus: string | null) => {
    if (newStatus) {
      error(newStatus);
    }
  }, [error]);

  const operation: Operation = isLoading ? 'loading' : saveMutation.isPending ? 'saving' : deleteMutation.isPending ? 'deleting' : 'idle';

  return {
    events,
    loading: isLoading,
    selectedId,
    isCreating,
    saving: saveMutation.isPending,
    deleting: deleteMutation.isPending,
    operation,
    form,
    choices,
    load: () => queryClient.invalidateQueries({ queryKey: eventsQueryKey(industryId) }),
    selectEvent,
    createEvent,
    saveEvent,
    deleteEvent: deleteEventHandler,
    reset,
    updateForm,
    updateChoices,
    updateStatus,
    persistEventWithChoices,
  };
}
