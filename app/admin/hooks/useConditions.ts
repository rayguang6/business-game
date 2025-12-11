import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchConditions, upsertCondition, deleteCondition } from '@/lib/server/actions/adminActions';
import type { GameCondition, ConditionOperator } from '@/lib/types/conditions';
import { ConditionMetric } from '@/lib/types/conditions';
import type { Operation } from './types';
import { useToastFunctions } from '../components/ui/ToastContext';

interface ConditionForm {
  id: string;
  name: string;
  description: string;
  metric: ConditionMetric;
  operator: ConditionOperator;
  value: string;
}

// Query key factory for conditions
const conditionsQueryKey = (industryId: string) => ['conditions', industryId] as const;

export function useConditions(industryId: string, conditionId?: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToastFunctions();
  const [selectedId, setSelectedId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<ConditionForm>({
    id: '',
    name: '',
    description: '',
    metric: ConditionMetric.Cash,
    operator: 'greater',
    value: '0',
  });

  // Fetch conditions using React Query
  const {
    data: conditions = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: conditionsQueryKey(industryId),
    queryFn: async () => {
      if (!industryId) return [];
      const result = await fetchConditions(industryId);
      if (!result) {
        console.warn(`[Conditions] No conditions found for industry "${industryId}"`);
        return [];
      }
      return result;
    },
    enabled: !!industryId,
    retry: (failureCount, error) => {
      // Don't retry if it's a configuration issue
      if (error instanceof Error && error.message.includes('Supabase client not configured')) {
        return false;
      }
      // Retry once for other errors
      return failureCount < 1;
    },
  });

  // Save condition mutation with optimistic update
  const saveMutation = useMutation({
    mutationFn: async (payload: GameCondition) => {
      if (!industryId) throw new Error('Industry ID is required');
      const result = await upsertCondition(industryId, payload);
      if (!result.success) {
        throw new Error(result.message ?? 'Failed to save condition.');
      }
      return payload;
    },
    onMutate: async (newCondition) => {
      await queryClient.cancelQueries({ queryKey: conditionsQueryKey(industryId) });
      const previousConditions = queryClient.getQueryData<GameCondition[]>(conditionsQueryKey(industryId));

      queryClient.setQueryData<GameCondition[]>(conditionsQueryKey(industryId), (old = []) => {
        const exists = old.some((c) => c.id === newCondition.id);
        if (exists) {
          return old.map((c) => (c.id === newCondition.id ? newCondition : c));
        }
        return [...old, newCondition];
      });

      return { previousConditions };
    },
    onError: (err, newCondition, context) => {
      if (context?.previousConditions) {
        queryClient.setQueryData(conditionsQueryKey(industryId), context.previousConditions);
      }
      error(err instanceof Error ? err.message : 'Failed to save condition.');
    },
    onSuccess: (savedCondition) => {
      success('Condition saved.');
      setIsCreating(false);
      setSelectedId(savedCondition.id);
      const condition = conditions.find((c) => c.id === savedCondition.id) || conditions[0];
      if (condition) {
        selectCondition(condition, false);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: conditionsQueryKey(industryId) });
    },
  });

  // Delete condition mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteCondition(id);
      if (!result.success) {
        throw new Error(result.message ?? 'Failed to delete condition.');
      }
      return id;
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: conditionsQueryKey(industryId) });
      const previousConditions = queryClient.getQueryData<GameCondition[]>(conditionsQueryKey(industryId));

      queryClient.setQueryData<GameCondition[]>(conditionsQueryKey(industryId), (old = []) =>
        old.filter((c) => c.id !== deletedId)
      );

      return { previousConditions };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousConditions) {
        queryClient.setQueryData(conditionsQueryKey(industryId), context.previousConditions);
      }
      error(err instanceof Error ? err.message : 'Failed to delete condition.');
    },
    onSuccess: () => {
      success('Condition deleted.');
      const remaining = queryClient.getQueryData<GameCondition[]>(conditionsQueryKey(industryId)) || [];
      if (remaining.length > 0) {
        selectCondition(remaining[0], false);
      } else {
        setSelectedId('');
        setForm({
          id: '',
          name: '',
          description: '',
          metric: ConditionMetric.Cash,
          operator: 'greater',
          value: '0',
        });
        setIsCreating(false);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: conditionsQueryKey(industryId) });
    },
  });

  const selectCondition = useCallback((condition: GameCondition, resetMsg = true) => {
    setSelectedId(condition.id);
    setIsCreating(false);
    setForm({
      id: condition.id,
      name: condition.name,
      description: condition.description,
      metric: condition.metric,
      operator: condition.operator,
      value: String(condition.value),
    });
  }, []);

  // Select condition when conditionId changes or conditions are loaded
  useEffect(() => {
    if (conditionId && conditions.length > 0) {
      const condition = conditions.find((c) => c.id === conditionId);
      if (condition) {
        setSelectedId(condition.id);
        setIsCreating(false);
        setForm({
          id: condition.id,
          name: condition.name,
          description: condition.description,
          metric: condition.metric,
          operator: condition.operator,
          value: String(condition.value),
        });
        
      }
    }
  }, [conditionId, conditions]);

  const createCondition = useCallback(() => {
    if (!industryId) {
      error('Save the industry first.');
      return;
    }
    setIsCreating(true);
    setSelectedId('');
    setForm({
      id: '',
      name: '',
      description: '',
      metric: ConditionMetric.Cash,
      operator: 'greater',
      value: '0',
    });
    
  }, [industryId, error]);

  const saveCondition = useCallback(async () => {
    if (!industryId) {
      error('Save the industry first.');
      return;
    }
    const id = form.id.trim();
    const name = form.name.trim();
    const description = form.description.trim();
    const value = Number(form.value);
    if (!id || !name) {
      error('Condition id and name are required.');
      return;
    }
    if (!Number.isFinite(value)) {
      error('Value must be a valid number.');
      return;
    }
    const payload: GameCondition = {
      id,
      name,
      description,
      metric: form.metric,
      operator: form.operator,
      value,
    };
    saveMutation.mutate(payload);
  }, [industryId, form, saveMutation, error]);

  const deleteConditionHandler = useCallback(async () => {
    if (isCreating || !selectedId) return;
    const condition = conditions.find((c) => c.id === selectedId);
    if (!window.confirm(`Delete condition "${condition?.name || selectedId}"?`)) return;
    deleteMutation.mutate(selectedId);
  }, [selectedId, isCreating, conditions, deleteMutation]);

  const reset = useCallback(() => {
    if (selectedId && !isCreating) {
      const existing = conditions.find((c) => c.id === selectedId);
      if (existing) selectCondition(existing);
    } else {
      setIsCreating(false);
      setSelectedId('');
      setForm({
        id: '',
        name: '',
        description: '',
        metric: ConditionMetric.Cash,
        operator: 'greater',
        value: '0',
      });
    }
    
  }, [selectedId, isCreating, conditions, selectCondition]);

  const updateForm = useCallback((updates: Partial<ConditionForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const operation: Operation = isLoading ? 'loading' : saveMutation.isPending ? 'saving' : deleteMutation.isPending ? 'deleting' : 'idle';

  return {
    conditions,
    loading: isLoading,
    error: queryError,
    selectedId,
    isCreating,
    saving: saveMutation.isPending,
    deleting: deleteMutation.isPending,
    operation,
    form,
    load: () => queryClient.invalidateQueries({ queryKey: conditionsQueryKey(industryId) }),
    selectCondition,
    createCondition,
    saveCondition,
    deleteCondition: deleteConditionHandler,
    reset,
    updateForm,
  };
}
