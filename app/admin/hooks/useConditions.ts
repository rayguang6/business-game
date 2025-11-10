import { useState, useCallback } from 'react';
import { fetchConditionsForIndustry, upsertConditionForIndustry, deleteConditionById } from '@/lib/data/conditionRepository';
import type { GameCondition, ConditionOperator } from '@/lib/types/conditions';
import { ConditionMetric } from '@/lib/types/conditions';
import type { Operation } from './types';

interface ConditionForm {
  id: string;
  name: string;
  description: string;
  metric: ConditionMetric;
  operator: ConditionOperator;
  value: string;
}

export function useConditions(industryId: string) {
  const [conditions, setConditions] = useState<GameCondition[]>([]);
  const [operation, setOperation] = useState<Operation>('idle');
  const [status, setStatus] = useState<string | null>(null);
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

  const load = useCallback(async () => {
    if (!industryId) return;
    setOperation('loading');
    setStatus(null);
    const result = await fetchConditionsForIndustry(industryId);
    setOperation('idle');
    if (!result) {
      setConditions([]);
      return;
    }
    setConditions(result);
    if (result.length > 0) {
      selectCondition(result[0], false);
    }
  }, [industryId]);

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
    if (resetMsg) setStatus(null);
  }, []);

  const createCondition = useCallback(() => {
    if (!industryId) {
      setStatus('Save the industry first.');
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
    setStatus(null);
  }, [industryId]);

  const saveCondition = useCallback(async () => {
    if (!industryId) {
      setStatus('Save the industry first.');
      return;
    }
    const id = form.id.trim();
    const name = form.name.trim();
    const description = form.description.trim();
    const value = Number(form.value);
    if (!id || !name) {
      setStatus('Condition id and name are required.');
      return;
    }
    if (!Number.isFinite(value)) {
      setStatus('Value must be a valid number.');
      return;
    }
    setOperation('saving');
    const payload: GameCondition = {
      id,
      name,
      description,
      metric: form.metric,
      operator: form.operator,
      value,
    };
    const result = await upsertConditionForIndustry(industryId, payload);
    setOperation('idle');
    if (!result.success) {
      setStatus(result.message ?? 'Failed to save condition.');
      return;
    }
    // Reload to get fresh data
    const result2 = await fetchConditionsForIndustry(industryId);
    if (result2) {
      setConditions(result2);
      const saved = result2.find(c => c.id === id) || result2[0];
      if (saved) selectCondition(saved, false);
    }
    setStatus('Condition saved.');
    setIsCreating(false);
    setSelectedId(id);
  }, [industryId, form, selectCondition]);

  const deleteCondition = useCallback(async () => {
    if (isCreating || !selectedId) return;
    const condition = conditions.find(c => c.id === selectedId);
    if (!window.confirm(`Delete condition "${condition?.name || selectedId}"?`)) return;
    setOperation('deleting');
    const result = await deleteConditionById(selectedId);
    setOperation('idle');
    if (!result.success) {
      setStatus(result.message ?? 'Failed to delete condition.');
      return;
    }
    // Reload to get fresh data
    const result2 = await fetchConditionsForIndustry(industryId);
    if (result2) {
      setConditions(result2);
      if (result2.length > 0) {
        selectCondition(result2[0], false);
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
    }
    setStatus('Condition deleted.');
  }, [industryId, selectedId, isCreating, conditions, selectCondition]);

  const reset = useCallback(() => {
    if (selectedId && !isCreating) {
      const existing = conditions.find(c => c.id === selectedId);
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
    setStatus(null);
  }, [selectedId, isCreating, conditions, selectCondition]);

  const updateForm = useCallback((updates: Partial<ConditionForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    conditions,
    loading: operation === 'loading',
    status,
    selectedId,
    isCreating,
    saving: operation === 'saving',
    deleting: operation === 'deleting',
    operation,
    form,
    load,
    selectCondition,
    createCondition,
    saveCondition,
    deleteCondition,
    reset,
    updateForm,
  };
}

