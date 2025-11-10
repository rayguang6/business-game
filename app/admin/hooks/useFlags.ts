import { useState, useCallback } from 'react';
import { fetchFlagsForIndustry, upsertFlagForIndustry, deleteFlagById } from '@/lib/data/flagRepository';
import type { GameFlag } from '@/lib/data/flagRepository';
import type { Operation } from './types';

interface FlagForm {
  id: string;
  name: string;
  description: string;
}

export function useFlags(industryId: string) {
  const [flags, setFlags] = useState<GameFlag[]>([]);
  const [operation, setOperation] = useState<Operation>('idle');
  const [status, setStatus] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<FlagForm>({ id: '', name: '', description: '' });

  const load = useCallback(async () => {
    if (!industryId) return;
    setOperation('loading');
    setStatus(null);
    const result = await fetchFlagsForIndustry(industryId);
    setOperation('idle');
    if (!result) {
      setFlags([]);
      return;
    }
    setFlags(result);
    if (result.length > 0) {
      selectFlag(result[0], false);
    }
  }, [industryId]);

  const selectFlag = useCallback((flag: GameFlag, resetMsg = true) => {
    setSelectedId(flag.id);
    setIsCreating(false);
    setForm({ id: flag.id, name: flag.name, description: flag.description });
    if (resetMsg) setStatus(null);
  }, []);

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
    setOperation('saving');
    const result = await upsertFlagForIndustry(industryId, { id, name, description });
    setOperation('idle');
    if (!result.success) {
      setStatus(result.message ?? 'Failed to save flag.');
      return;
    }
    // Reload to get fresh data
    const result2 = await fetchFlagsForIndustry(industryId);
    if (result2) {
      setFlags(result2);
      const saved = result2.find(f => f.id === id) || result2[0];
      if (saved) selectFlag(saved, false);
    }
    setStatus('Flag saved.');
    setIsCreating(false);
    setSelectedId(id);
  }, [industryId, form, selectFlag]);

  const deleteFlag = useCallback(async () => {
    if (isCreating || !selectedId) return;
    const flag = flags.find(f => f.id === selectedId);
    if (!window.confirm(`Delete flag "${flag?.name || selectedId}"?`)) return;
    setOperation('deleting');
    const result = await deleteFlagById(selectedId);
    setOperation('idle');
    if (!result.success) {
      setStatus(result.message ?? 'Failed to delete flag.');
      return;
    }
    // Reload to get fresh data
    const result2 = await fetchFlagsForIndustry(industryId);
    if (result2) {
      setFlags(result2);
      if (result2.length > 0) {
        selectFlag(result2[0], false);
      } else {
        setSelectedId('');
        setForm({ id: '', name: '', description: '' });
        setIsCreating(false);
      }
    }
    setStatus('Flag deleted.');
  }, [industryId, selectedId, isCreating, flags, selectFlag]);

  const reset = useCallback(() => {
    if (selectedId && !isCreating) {
      const existing = flags.find(f => f.id === selectedId);
      if (existing) selectFlag(existing);
    } else {
      setIsCreating(false);
      setSelectedId('');
      setForm({ id: '', name: '', description: '' });
    }
    setStatus(null);
  }, [selectedId, isCreating, flags, selectFlag]);

  const updateForm = useCallback((updates: Partial<FlagForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    flags,
    loading: operation === 'loading',
    status,
    selectedId,
    isCreating,
    saving: operation === 'saving',
    deleting: operation === 'deleting',
    operation,
    form,
    load,
    selectFlag,
    createFlag,
    saveFlag,
    deleteFlag,
    reset,
    updateForm,
  };
}

