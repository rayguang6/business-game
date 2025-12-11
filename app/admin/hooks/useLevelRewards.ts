import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLevelRewards, upsertLevelReward, deleteLevelReward } from '@/lib/server/actions/adminActions';
import type { LevelReward } from '@/lib/data/levelRewardsRepository';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import type { Operation } from './types';
import { useToastFunctions } from '../components/ui/ToastContext';

interface LevelRewardForm {
  id: string;
  level: string;
  title: string;
  narrative: string;
  effects: Array<{ metric: GameMetric; type: EffectType; value: string }>;
  unlocksFlags: string[];
}

// Query key factory for level rewards
const levelRewardsQueryKey = (industryId: string) => ['levelRewards', industryId] as const;

export function useLevelRewards(industryId: string, levelRewardId?: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToastFunctions();
  const [selectedId, setSelectedId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<LevelRewardForm>({
    id: '',
    level: '',
    title: '',
    narrative: '',
    effects: [],
    unlocksFlags: [],
  });

  // Fetch level rewards using React Query
  const {
    data: levelRewards = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: levelRewardsQueryKey(industryId),
    queryFn: async () => {
      if (!industryId) return [];
      const result = await fetchLevelRewards(industryId);
      if (!result) return [];
      return result.sort((a, b) => a.level - b.level);
    },
    enabled: !!industryId,
  });

  // Save level reward mutation with optimistic update
  const saveMutation = useMutation({
    mutationFn: async (payload: LevelReward) => {
      if (!industryId) throw new Error('Industry ID is required');
      const result = await upsertLevelReward(industryId as any, payload);
      if (!result.success) {
        throw new Error(result.message ?? 'Failed to save level reward.');
      }
      return payload;
    },
    onMutate: async (newReward) => {
      await queryClient.cancelQueries({ queryKey: levelRewardsQueryKey(industryId) });
      const previousRewards = queryClient.getQueryData<LevelReward[]>(levelRewardsQueryKey(industryId));

      queryClient.setQueryData<LevelReward[]>(levelRewardsQueryKey(industryId), (old = []) => {
        const exists = old.some((r) => r.id === newReward.id);
        const next = exists ? old.map((r) => (r.id === newReward.id ? newReward : r)) : [...old, newReward];
        return next.sort((a, b) => a.level - b.level);
      });

      return { previousRewards };
    },
    onError: (err, newReward, context) => {
      if (context?.previousRewards) {
        queryClient.setQueryData(levelRewardsQueryKey(industryId), context.previousRewards);
      }
      const errorMsg = err instanceof Error ? err.message : 'Failed to save level reward.';
      console.error('[Admin] Save failed:', errorMsg);
      error(errorMsg);
    },
    onSuccess: (savedReward) => {
      setIsCreating(false);
      setSelectedId(savedReward.id);
      selectLevelReward(savedReward, false);
      success(`Level ${savedReward.level} reward saved successfully.`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: levelRewardsQueryKey(industryId) });
    },
  });

  // Delete level reward mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteLevelReward(id);
      if (!result.success) {
        throw new Error(result.message ?? 'Failed to delete level reward.');
      }
      return id;
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: levelRewardsQueryKey(industryId) });
      const previousRewards = queryClient.getQueryData<LevelReward[]>(levelRewardsQueryKey(industryId));

      queryClient.setQueryData<LevelReward[]>(levelRewardsQueryKey(industryId), (old = []) =>
        old.filter((r) => r.id !== deletedId)
      );

      return { previousRewards };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousRewards) {
        queryClient.setQueryData(levelRewardsQueryKey(industryId), context.previousRewards);
      }
      error(err instanceof Error ? err.message : 'Failed to delete level reward.');
    },
    onSuccess: () => {
      setSelectedId('');
      setForm({
        id: '',
        level: '',
        title: '',
        narrative: '',
        effects: [],
        unlocksFlags: [],
      });
      success('Level reward deleted.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: levelRewardsQueryKey(industryId) });
    },
  });

  const selectLevelReward = useCallback((reward: LevelReward, resetMsg = true) => {
    setSelectedId(reward.id);
    setIsCreating(false);

    setForm({
      id: reward.id,
      level: String(reward.level),
      title: reward.title,
      narrative: reward.narrative || '',
      effects: reward.effects.map((e) => ({
        metric: e.metric,
        type: e.type,
        value: String(e.value),
      })),
      unlocksFlags: reward.unlocksFlags || [],
    });
  }, []);

  // Select level reward when levelRewardId changes or rewards are loaded
  useEffect(() => {
    if (levelRewardId && levelRewards.length > 0) {
      const reward = levelRewards.find((r) => r.id === levelRewardId);
      if (reward) {
        selectLevelReward(reward);
      }
    }
  }, [levelRewardId, levelRewards, selectLevelReward]);

  const createLevelReward = useCallback(() => {
    if (!industryId) {
      error('Save the industry first.');
      return;
    }
    setIsCreating(true);
    setSelectedId('');
    setForm({
      id: '',
      level: '',
      title: '',
      narrative: '',
      effects: [],
      unlocksFlags: [],
    });
  }, [industryId, error]);

  const saveLevelReward = useCallback(async () => {
    if (!industryId) {
      error('Save the industry first.');
      return;
    }
    const id = form.id.trim();
    const levelStr = form.level.trim();
    const title = form.title.trim();
    const narrative = form.narrative.trim();

    if (!levelStr || !title) {
      error('Level and title are required.');
      return;
    }

    const level = Number(levelStr);
    if (!Number.isFinite(level) || level < 0) {
      error('Level must be >= 0.');
      return;
    }

    // Validate and convert effects
    const effects = form.effects
      .filter((ef) => {
        const trimmedValue = ef.value.trim();
        if (trimmedValue === '') {
          return false;
        }
        const numValue = Number(trimmedValue);
        return Number.isFinite(numValue);
      })
      .map((ef) => {
        const numValue = Number(ef.value.trim());
        return {
          metric: ef.metric,
          type: ef.type,
          value: Number.isFinite(numValue) ? numValue : 0,
        };
      });

    // Generate ID if not provided
    const finalId = id || `level-${level}-${industryId}`;

    const payload: LevelReward = {
      id: finalId,
      industryId: industryId as any,
      level,
      title,
      narrative: narrative || undefined,
      effects,
      unlocksFlags: form.unlocksFlags.filter((f) => f.trim().length > 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveMutation.mutate(payload);
  }, [industryId, form, saveMutation, error]);

  const deleteLevelRewardHandler = useCallback(async () => {
    if (isCreating || !selectedId) return;
    const reward = levelRewards.find((r) => r.id === selectedId);
    if (!window.confirm(`Delete level ${reward?.level} reward "${reward?.title || selectedId}"?`)) return;
    deleteMutation.mutate(selectedId);
  }, [selectedId, isCreating, levelRewards, deleteMutation]);

  const reset = useCallback(() => {
    if (selectedId && !isCreating) {
      const existing = levelRewards.find((r) => r.id === selectedId);
      if (existing) selectLevelReward(existing);
    } else {
      setIsCreating(false);
      setSelectedId('');
      setForm({
        id: '',
        level: '',
        title: '',
        narrative: '',
        effects: [],
        unlocksFlags: [],
      });
    }
  }, [selectedId, isCreating, levelRewards, selectLevelReward]);

  const updateForm = useCallback((updates: Partial<LevelRewardForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const addEffect = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      effects: [
        ...prev.effects,
        {
          metric: GameMetric.ServiceRevenueFlatBonus,
          type: EffectType.Add,
          value: '',
        },
      ],
    }));
  }, []);

  const removeEffect = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      effects: prev.effects.filter((_, i) => i !== index),
    }));
  }, []);

  const updateEffect = useCallback((index: number, updates: Partial<LevelRewardForm['effects'][0]>) => {
    setForm((prev) => {
      const newEffects = [...prev.effects];
      newEffects[index] = { ...newEffects[index], ...updates };
      return { ...prev, effects: newEffects };
    });
  }, []);

  const addFlag = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      unlocksFlags: [...prev.unlocksFlags, ''],
    }));
  }, []);

  const removeFlag = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      unlocksFlags: prev.unlocksFlags.filter((_, i) => i !== index),
    }));
  }, []);

  const updateFlag = useCallback((index: number, value: string) => {
    setForm((prev) => {
      const newFlags = [...prev.unlocksFlags];
      newFlags[index] = value;
      return { ...prev, unlocksFlags: newFlags };
    });
  }, []);

  const operation: Operation = isLoading ? 'loading' : saveMutation.isPending ? 'saving' : deleteMutation.isPending ? 'deleting' : 'idle';

  return {
    levelRewards,
    loading: isLoading,
    selectedId,
    isCreating,
    saving: saveMutation.isPending,
    deleting: deleteMutation.isPending,
    operation,
    form,
    load: () => queryClient.invalidateQueries({ queryKey: levelRewardsQueryKey(industryId) }),
    selectLevelReward,
    createLevelReward,
    saveLevelReward,
    deleteLevelReward: deleteLevelRewardHandler,
    reset,
    updateForm,
    addEffect,
    removeEffect,
    updateEffect,
    addFlag,
    removeFlag,
    updateFlag,
  };
}
