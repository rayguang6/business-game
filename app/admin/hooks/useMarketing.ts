import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMarketingCampaigns, upsertMarketingCampaign, deleteMarketingCampaign, fetchCategories } from '@/lib/server/actions/adminActions';
import type { MarketingCampaign } from '@/lib/store/slices/marketingSlice';
import type { Requirement, Category } from '@/lib/game/types';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import type { Operation } from './types';

interface CampaignForm {
  id: string;
  name: string;
  description: string;
  type: 'leveled' | 'unlimited';
  cost: string; // For unlimited campaigns
  timeCost?: string; // For unlimited campaigns
  maxLevel?: string; // For leveled campaigns
  cooldownSeconds: string;
  categoryId?: string;
  setsFlag?: string;
  requirements: Requirement[];
  order: string;
}

interface CampaignEffectForm {
  metric: GameMetric;
  type: EffectType;
  value: string;
  durationSeconds: string;
}

interface CampaignLevelForm {
  level: number;
  name: string;
  description?: string;
  icon?: string;
  cost: string;
  timeCost?: string;
  effects: CampaignEffectForm[];
}

// Query key factory for marketing campaigns
const marketingQueryKey = (industryId: string) => ['marketing', industryId] as const;

// Query key factory for categories
const categoriesQueryKey = (industryId: string) => ['categories', industryId] as const;

export function useMarketing(industryId: string, campaignId?: string) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<CampaignForm>({
    id: '',
    name: '',
    description: '',
    type: 'unlimited',
    cost: '0',
    timeCost: '',
    maxLevel: '1',
    cooldownSeconds: '15',
    categoryId: '',
    requirements: [],
    order: '',
  });
  const [effectsForm, setEffectsForm] = useState<CampaignEffectForm[]>([]);
  const [levelsForm, setLevelsForm] = useState<CampaignLevelForm[]>([]);

  // Fetch campaigns using React Query
  const {
    data: campaigns = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: marketingQueryKey(industryId),
    queryFn: async () => {
      if (!industryId) return [];
      const result = await fetchMarketingCampaigns(industryId);
      if (!result) return [];
      return result.sort((a, b) => {
        // Null/undefined orders go to the end
        const aOrderNull = a.order == null;
        const bOrderNull = b.order == null;
        if (aOrderNull && bOrderNull) return a.name.localeCompare(b.name);
        if (aOrderNull) return 1;
        if (bOrderNull) return -1;
        if (a.order! !== b.order!) return a.order! - b.order!;
        return a.name.localeCompare(b.name);
      });
    },
    enabled: !!industryId,
  });

  // Fetch categories using React Query
  const {
    data: categories = [],
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: categoriesQueryKey(industryId),
    queryFn: async () => {
      if (!industryId) return [];
      const result = await fetchCategories(industryId);
      if (!result) return [];
      return result.slice().sort((a, b) => {
        if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
        return a.name.localeCompare(b.name);
      });
    },
    enabled: !!industryId,
  });

  // Save campaign mutation with optimistic update
  const saveMutation = useMutation({
    mutationFn: async (payload: MarketingCampaign) => {
      console.log('[Marketing] Mutation started with payload:', payload);
      if (!industryId) {
        console.error('[Marketing] No industry ID');
        throw new Error('Industry ID is required');
      }
      console.log('[Marketing] Calling upsertMarketingCampaign with industryId:', industryId);
      const result = await upsertMarketingCampaign(industryId, payload);
      console.log('[Marketing] Upsert result:', result);
      if (!result.success) {
        console.error('[Marketing] Upsert failed:', result.message);
        throw new Error(result.message ?? 'Failed to save campaign.');
      }
      console.log('[Marketing] Mutation succeeded');
      return payload;
    },
    onMutate: async (newCampaign) => {
      await queryClient.cancelQueries({ queryKey: marketingQueryKey(industryId) });
      const previousCampaigns = queryClient.getQueryData<MarketingCampaign[]>(marketingQueryKey(industryId));

      queryClient.setQueryData<MarketingCampaign[]>(marketingQueryKey(industryId), (old = []) => {
        const exists = old.some((c) => c.id === newCampaign.id);
        const next = exists ? old.map((c) => (c.id === newCampaign.id ? newCampaign : c)) : [...old, newCampaign];
        return next.sort((a, b) => {
          // Null/undefined orders go to the end
          const aOrderNull = a.order == null;
          const bOrderNull = b.order == null;
          if (aOrderNull && bOrderNull) return a.name.localeCompare(b.name);
          if (aOrderNull) return 1;
          if (bOrderNull) return -1;
          if (a.order! !== b.order!) return a.order! - b.order!;
          return a.name.localeCompare(b.name);
        });
      });

      return { previousCampaigns };
    },
    onError: (err, newCampaign, context) => {
      console.error('[Marketing] Mutation error:', err);
      if (context?.previousCampaigns) {
        queryClient.setQueryData(marketingQueryKey(industryId), context.previousCampaigns);
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to save campaign.';
      console.error('[Marketing] Setting error status:', errorMessage);
      setStatus(errorMessage);
    },
    onSuccess: (savedCampaign) => {
      setStatus('Campaign saved.');
      setIsCreating(false);
      setSelectedId(savedCampaign.id);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: marketingQueryKey(industryId) });
    },
  });

  // Delete campaign mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!industryId) throw new Error('Industry ID is required');
      const result = await deleteMarketingCampaign(id, industryId as any);
      if (!result.success) {
        throw new Error(result.message ?? 'Failed to delete campaign.');
      }
      return id;
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: marketingQueryKey(industryId) });
      const previousCampaigns = queryClient.getQueryData<MarketingCampaign[]>(marketingQueryKey(industryId));

      queryClient.setQueryData<MarketingCampaign[]>(marketingQueryKey(industryId), (old = []) =>
        old.filter((c) => c.id !== deletedId)
      );

      return { previousCampaigns };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousCampaigns) {
        queryClient.setQueryData(marketingQueryKey(industryId), context.previousCampaigns);
      }
      setStatus(err instanceof Error ? err.message : 'Failed to delete campaign.');
    },
    onSuccess: () => {
      setSelectedId('');
      setForm({
        id: '',
        name: '',
        description: '',
        type: 'unlimited',
        cost: '0',
        cooldownSeconds: '15',
        requirements: [],
        order: '0',
      });
      setEffectsForm([]);
      setStatus('Campaign deleted.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: marketingQueryKey(industryId) });
    },
  });

  const selectCampaign = useCallback((campaign: MarketingCampaign, resetMsg = true) => {
    setSelectedId(campaign.id);
    setIsCreating(false);
    setForm({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      type: campaign.type || 'unlimited',
      cost: campaign.type === 'unlimited' ? String(campaign.cost ?? 0) : '0',
      timeCost: campaign.type === 'unlimited' && campaign.timeCost !== undefined ? String(campaign.timeCost) : '',
      maxLevel: campaign.type === 'leveled' ? String(campaign.maxLevel ?? 1) : '1',
      cooldownSeconds: String(campaign.cooldownSeconds),
      categoryId: campaign.categoryId || '',
      setsFlag: campaign.setsFlag,
      requirements: campaign.requirements || [],
      order: String(campaign.order ?? 0),
    });
    if (campaign.type === 'leveled' && campaign.levels) {
      setLevelsForm(
        campaign.levels.map((level) => ({
          level: level.level,
          name: level.name,
          description: level.description,
          icon: level.icon,
          cost: String(level.cost),
          timeCost: level.timeCost !== undefined ? String(level.timeCost) : '',
          effects: (level.effects || []).map((e) => ({
            metric: e.metric,
            type: e.type,
            value: String(e.value),
            durationSeconds: String(e.durationSeconds ?? ''),
          })),
        }))
      );
      setEffectsForm([]);
    } else {
      setEffectsForm(
        (campaign.effects || []).map((e) => ({
          metric: e.metric,
          type: e.type,
          value: String(e.value),
          durationSeconds: String(e.durationSeconds ?? ''),
        }))
      );
      setLevelsForm([]);
    }
    if (resetMsg) setStatus(null);
  }, []);

  // Select campaign when campaignId changes or campaigns are loaded
  useEffect(() => {
    if (campaignId && campaigns.length > 0) {
      const campaign = campaigns.find((c) => c.id === campaignId);
      if (campaign) {
        selectCampaign(campaign, false);
      }
    }
  }, [campaignId, campaigns, selectCampaign]);

  const createCampaign = useCallback(() => {
    setIsCreating(true);
    setSelectedId('');
    setForm({
      id: '',
      name: '',
      description: '',
      type: 'unlimited',
      cost: '0',
      timeCost: '',
      maxLevel: '1',
      cooldownSeconds: '15',
      categoryId: '',
      requirements: [],
      order: '',
    });
    setEffectsForm([]);
    setLevelsForm([]);
    setStatus(null);
  }, []);

  const saveCampaign = useCallback(async () => {
    if (!industryId) {
      setStatus('Save the industry first.');
      return;
    }
    const id = form.id.trim();
    const name = form.name.trim();
    const description = form.description.trim();
    const campaignType = form.type || 'unlimited';
    const cooldownSeconds = Number(form.cooldownSeconds);
    
    console.log('[Marketing] Saving campaign:', { id, name, campaignType, effectsForm: effectsForm?.length, levelsForm: levelsForm?.length });
    
    if (!id || !name) {
      setStatus('Campaign id and name are required.');
      return;
    }
    if (!Number.isFinite(cooldownSeconds) || cooldownSeconds < 0) {
      setStatus('Cooldown must be >= 0 seconds (recommended: 10-30 seconds).');
      return;
    }

    const setsFlag = form.setsFlag?.trim() || undefined;
    const requirements = form.requirements;
    const order = form.order.trim() ? Number(form.order.trim()) : undefined;
    const categoryId = form.categoryId?.trim() || undefined;

    let payload: MarketingCampaign;

    if (campaignType === 'leveled') {
      // Validate leveled campaign
      const maxLevel = Number(form.maxLevel);
      if (!Number.isFinite(maxLevel) || maxLevel < 1) {
        setStatus('Max level must be >= 1 for leveled campaigns.');
        return;
      }
      if (levelsForm.length === 0) {
        setStatus('Leveled campaigns must have at least one level.');
        return;
      }
      if (levelsForm.length !== maxLevel) {
        setStatus(`Number of levels (${levelsForm.length}) must match max level (${maxLevel}).`);
        return;
      }

      // Validate all levels
      for (const level of levelsForm) {
        const levelCost = Number(level.cost);
        const levelTimeCost = level.timeCost?.trim() ? Number(level.timeCost) : undefined;
        if (!Number.isFinite(levelCost) || levelCost < 0) {
          setStatus(`Level ${level.level} cost must be >= 0.`);
          return;
        }
        if (levelTimeCost !== undefined && (!Number.isFinite(levelTimeCost) || levelTimeCost < 0)) {
          setStatus(`Level ${level.level} time cost must be >= 0 if specified.`);
          return;
        }
      }

      payload = {
        id,
        name,
        description,
        type: 'leveled',
        maxLevel,
        cooldownSeconds,
        categoryId,
        setsFlag,
        requirements,
        order,
        levels: levelsForm.map((level) => ({
          level: level.level,
          name: level.name,
          description: level.description,
          icon: level.icon,
          cost: Number(level.cost),
          timeCost: level.timeCost?.trim() ? Number(level.timeCost) : undefined,
          effects: (level.effects || []).map((ef) => ({
            metric: ef.metric,
            type: ef.type,
            value: Number(ef.value) || 0,
            durationSeconds: ef.durationSeconds === '' ? null : Number(ef.durationSeconds) || null,
          })),
        })),
      };
    } else {
      // Validate unlimited campaign
      const costValue = form.cost?.trim() || '0';
      const cost = Number(costValue);
      const timeCostValue = form.timeCost?.trim();
      const timeCost = timeCostValue ? Number(timeCostValue) : undefined;
      
      if (!Number.isFinite(cost) || cost < 0) {
        setStatus('Cost must be >= 0 for unlimited campaigns.');
        return;
      }
      if (timeCost !== undefined && (!Number.isFinite(timeCost) || timeCost < 0)) {
        setStatus('Time cost must be >= 0 if specified.');
        return;
      }

      payload = {
        id,
        name,
        description,
        type: 'unlimited',
        cost: cost || 0,
        timeCost,
        cooldownSeconds: cooldownSeconds || 0,
        effects: (effectsForm || []).map((ef) => ({
          metric: ef.metric,
          type: ef.type,
          value: Number(ef.value) || 0,
          durationSeconds: ef.durationSeconds === '' ? null : Number(ef.durationSeconds) || null,
        })),
        categoryId,
        setsFlag,
        requirements: requirements || [],
        order: order ?? 0,
      };
    }

    console.log('[Marketing] Payload to save:', JSON.stringify(payload, null, 2));
    saveMutation.mutate(payload);
  }, [industryId, form, effectsForm, levelsForm, saveMutation]);

  const deleteCampaignHandler = useCallback(async () => {
    if (isCreating || !selectedId) return;
    const campaign = campaigns.find((c) => c.id === selectedId);
    if (!window.confirm(`Delete campaign "${campaign?.name || selectedId}"?`)) return;
    deleteMutation.mutate(selectedId);
  }, [selectedId, isCreating, campaigns, deleteMutation]);

  const reset = useCallback(() => {
    if (selectedId && !isCreating) {
      const existing = campaigns.find((c) => c.id === selectedId);
      if (existing) selectCampaign(existing);
    } else {
      setIsCreating(false);
      setSelectedId('');
      setForm({
        id: '',
        name: '',
        description: '',
        type: 'unlimited',
        cost: '0',
        cooldownSeconds: '15',
        categoryId: '',
        requirements: [],
        order: '',
      });
      setEffectsForm([]);
    }
    setStatus(null);
  }, [selectedId, isCreating, campaigns, selectCampaign]);

  const updateForm = useCallback((updates: Partial<CampaignForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateEffects = useCallback((effects: CampaignEffectForm[]) => {
    setEffectsForm(effects);
  }, []);

  const addLevel = useCallback(() => {
    const nextLevel = levelsForm.length + 1;
    setLevelsForm((prev) => [
      ...prev,
      {
        level: nextLevel,
        name: `Level ${nextLevel}`,
        description: '',
        icon: '',
        cost: '0',
        timeCost: '',
        effects: [],
      },
    ]);
    // Update maxLevel to match number of levels
    setForm((prev) => ({ ...prev, maxLevel: String(nextLevel) }));
  }, [levelsForm.length]);

  const removeLevel = useCallback((index: number) => {
    setLevelsForm((prev) => {
      const newLevels = prev.filter((_, i) => i !== index);
      // Renumber levels
      return newLevels.map((level, i) => ({ ...level, level: i + 1 }));
    });
    // Update maxLevel
    setForm((prev) => ({ ...prev, maxLevel: String(Math.max(1, levelsForm.length - 1)) }));
  }, [levelsForm.length]);

  const updateLevel = useCallback((index: number, updates: Partial<CampaignLevelForm>) => {
    setLevelsForm((prev) => {
      const newLevels = [...prev];
      newLevels[index] = { ...newLevels[index], ...updates };
      return newLevels;
    });
  }, []);

  const operation: Operation = isLoading ? 'loading' : saveMutation.isPending ? 'saving' : deleteMutation.isPending ? 'deleting' : 'idle';

  return {
    campaigns,
    categories,
    loading: isLoading || categoriesLoading,
    status: status || (error instanceof Error ? error.message : null),
    selectedId,
    isCreating,
    saving: saveMutation.isPending,
    deleting: deleteMutation.isPending,
    operation,
    form,
    effectsForm,
    levelsForm,
    load: () => queryClient.invalidateQueries({ queryKey: marketingQueryKey(industryId) }),
    selectCampaign,
    createCampaign,
    saveCampaign,
    deleteCampaign: deleteCampaignHandler,
    reset,
    updateForm,
    updateEffects,
    addLevel,
    removeLevel,
    updateLevel,
  };
}
