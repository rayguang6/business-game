import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFlags, upsertFlag, deleteFlag } from '@/lib/server/actions/adminActions';
import type { GameFlag } from '@/lib/data/flagRepository';
import type { Operation } from './types';

interface FlagForm {
  id: string;
  name: string;
  description: string;
}

// Query key factory for flags
const flagsQueryKey = (industryId: string) => ['flags', industryId] as const;

export function useFlags(industryId: string, flagId?: string) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<FlagForm>({ id: '', name: '', description: '' });

  // Fetch flags using React Query
  const {
    data: flags = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: flagsQueryKey(industryId),
    queryFn: async () => {
      if (!industryId) return [];
      const result = await fetchFlags(industryId);
      return result || [];
    },
    enabled: !!industryId,
  });

  // Save flag mutation with optimistic update
  const saveMutation = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description: string }) => {
      if (!industryId) throw new Error('Industry ID is required');
      const result = await upsertFlag(industryId, { id, name, description });
      if (!result.success) {
        throw new Error(result.message ?? 'Failed to save flag.');
      }
      return { id, name, description };
    },
    onMutate: async (newFlag) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: flagsQueryKey(industryId) });

      // Snapshot previous value
      const previousFlags = queryClient.getQueryData<GameFlag[]>(flagsQueryKey(industryId));

      // Optimistically update cache
      queryClient.setQueryData<GameFlag[]>(flagsQueryKey(industryId), (old = []) => {
        const exists = old.some((f) => f.id === newFlag.id);
        if (exists) {
          return old.map((f) => (f.id === newFlag.id ? { ...f, ...newFlag } : f));
        }
        return [...old, { id: newFlag.id, industry_id: industryId, name: newFlag.name, description: newFlag.description }];
      });

      return { previousFlags };
    },
    onError: (err, newFlag, context) => {
      // Rollback on error
      if (context?.previousFlags) {
        queryClient.setQueryData(flagsQueryKey(industryId), context.previousFlags);
      }
      setStatus(err instanceof Error ? err.message : 'Failed to save flag.');
    },
    onSuccess: (savedFlag) => {
      setStatus('Flag saved.');
      setIsCreating(false);
      setSelectedId(savedFlag.id);
      // Select the saved flag
      const flag = flags.find((f) => f.id === savedFlag.id) || flags[0];
      if (flag) {
        selectFlag(flag, false);
      }
    },
    onSettled: () => {
      // Refetch to ensure we have latest data (but cache will serve immediately)
      queryClient.invalidateQueries({ queryKey: flagsQueryKey(industryId) });
    },
  });

  // Delete flag mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteFlag(id);
      if (!result.success) {
        throw new Error(result.message ?? 'Failed to delete flag.');
      }
      return id;
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: flagsQueryKey(industryId) });
      const previousFlags = queryClient.getQueryData<GameFlag[]>(flagsQueryKey(industryId));

      // Optimistically remove from cache
      queryClient.setQueryData<GameFlag[]>(flagsQueryKey(industryId), (old = []) =>
        old.filter((f) => f.id !== deletedId)
      );

      return { previousFlags };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousFlags) {
        queryClient.setQueryData(flagsQueryKey(industryId), context.previousFlags);
      }
      setStatus(err instanceof Error ? err.message : 'Failed to delete flag.');
    },
    onSuccess: () => {
      setStatus('Flag deleted.');
      // Select first flag if available, otherwise clear selection
      const remaining = queryClient.getQueryData<GameFlag[]>(flagsQueryKey(industryId)) || [];
      if (remaining.length > 0) {
        selectFlag(remaining[0], false);
      } else {
        setSelectedId('');
        setForm({ id: '', name: '', description: '' });
        setIsCreating(false);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: flagsQueryKey(industryId) });
    },
  });

  const selectFlag = useCallback((flag: GameFlag, resetMsg = true) => {
    setSelectedId(flag.id);
    setIsCreating(false);
    setForm({ id: flag.id, name: flag.name, description: flag.description });
    if (resetMsg) setStatus(null);
  }, []);

  // Select flag when flagId changes or flags are loaded
  useEffect(() => {
    if (flagId && flags.length > 0) {
      const flag = flags.find((f) => f.id === flagId);
      if (flag) {
        setSelectedId(flag.id);
        setIsCreating(false);
        setForm({ id: flag.id, name: flag.name, description: flag.description });
        setStatus(null);
      }
    }
  }, [flagId, flags]);

  const createFlag = useCallback(() => {
    if (!industryId) {
      setStatus('Save the industry first.');
      return;
    }
    setIsCreating(true);
    setSelectedId('');
    setForm({ id: '', name: '', description: '' });
    setStatus(null);
  }, [industryId]);

  const saveFlag = useCallback(async () => {
    if (!industryId) {
      setStatus('Save the industry first.');
      return;
    }
    const id = form.id.trim();
    const name = form.name.trim();
    const description = form.description.trim();
    if (!id || !name) {
      setStatus('Flag id and name are required.');
      return;
    }
    saveMutation.mutate({ id, name, description });
  }, [industryId, form, saveMutation]);

  const deleteFlagHandler = useCallback(async () => {
    if (isCreating || !selectedId) return;
    const flag = flags.find((f) => f.id === selectedId);
    if (!window.confirm(`Delete flag "${flag?.name || selectedId}"?`)) return;
    deleteMutation.mutate(selectedId);
  }, [selectedId, isCreating, flags, deleteMutation]);

  const reset = useCallback(() => {
    if (selectedId && !isCreating) {
      const existing = flags.find((f) => f.id === selectedId);
      if (existing) selectFlag(existing);
    } else {
      setIsCreating(false);
      setSelectedId('');
      setForm({ id: '', name: '', description: '' });
    }
    setStatus(null);
  }, [selectedId, isCreating, flags, selectFlag]);

  const updateForm = useCallback((updates: Partial<FlagForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  // Determine operation state
  const operation: Operation = isLoading ? 'loading' : saveMutation.isPending ? 'saving' : deleteMutation.isPending ? 'deleting' : 'idle';

  return {
    flags,
    loading: isLoading,
    status: status || (error instanceof Error ? error.message : null),
    selectedId,
    isCreating,
    saving: saveMutation.isPending,
    deleting: deleteMutation.isPending,
    operation,
    form,
    load: () => queryClient.invalidateQueries({ queryKey: flagsQueryKey(industryId) }),
    selectFlag,
    createFlag,
    saveFlag,
    deleteFlag: deleteFlagHandler,
    reset,
    updateForm,
  };
}
