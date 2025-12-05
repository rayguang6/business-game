import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMarketingCampaigns, upsertMarketingCampaign, deleteMarketingCampaign } from '@/lib/server/actions/adminActions';
import type { MarketingCampaign } from '@/lib/store/slices/marketingSlice';
import type { Requirement } from '@/lib/game/types';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import type { Operation } from './types';

interface CampaignForm {
  id: string;
  name: string;
  description: string;
  cost: string;
  timeCost?: string;
  cooldownSeconds: string;
  setsFlag?: string;
  requirements: Requirement[];
}

interface CampaignEffectForm {
  metric: GameMetric;
  type: EffectType;
  value: string;
  durationSeconds: string;
}

// Query key factory for marketing campaigns
const marketingQueryKey = (industryId: string) => ['marketing', industryId] as const;

export function useMarketing(industryId: string, campaignId?: string) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<CampaignForm>({
    id: '',
    name: '',
    description: '',
    cost: '0',
    timeCost: '',
    cooldownSeconds: '15',
    requirements: [],
  });
  const [effectsForm, setEffectsForm] = useState<CampaignEffectForm[]>([]);

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
      return result.sort((a, b) => a.name.localeCompare(b.name));
    },
    enabled: !!industryId,
  });

  // Save campaign mutation with optimistic update
  const saveMutation = useMutation({
    mutationFn: async (payload: MarketingCampaign) => {
      if (!industryId) throw new Error('Industry ID is required');
      const result = await upsertMarketingCampaign(industryId, payload);
      if (!result.success) {
        throw new Error(result.message ?? 'Failed to save campaign.');
      }
      return payload;
    },
    onMutate: async (newCampaign) => {
      await queryClient.cancelQueries({ queryKey: marketingQueryKey(industryId) });
      const previousCampaigns = queryClient.getQueryData<MarketingCampaign[]>(marketingQueryKey(industryId));

      queryClient.setQueryData<MarketingCampaign[]>(marketingQueryKey(industryId), (old = []) => {
        const exists = old.some((c) => c.id === newCampaign.id);
        const next = exists ? old.map((c) => (c.id === newCampaign.id ? newCampaign : c)) : [...old, newCampaign];
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });

      return { previousCampaigns };
    },
    onError: (err, newCampaign, context) => {
      if (context?.previousCampaigns) {
        queryClient.setQueryData(marketingQueryKey(industryId), context.previousCampaigns);
      }
      setStatus(err instanceof Error ? err.message : 'Failed to save campaign.');
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
        cost: '0',
        cooldownSeconds: '15',
        requirements: [],
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
      cost: String(campaign.cost),
      timeCost: campaign.timeCost !== undefined ? String(campaign.timeCost) : '',
      cooldownSeconds: String(campaign.cooldownSeconds),
      setsFlag: campaign.setsFlag,
      requirements: campaign.requirements || [],
    });
    setEffectsForm(
      campaign.effects.map((e) => ({
        metric: e.metric,
        type: e.type,
        value: String(e.value),
        durationSeconds: String(e.durationSeconds ?? ''),
      }))
    );
    if (resetMsg) setStatus(null);
  }, []);

  // Select campaign when campaignId changes or campaigns are loaded
  useEffect(() => {
    if (campaignId && campaigns.length > 0) {
      const campaign = campaigns.find((c) => c.id === campaignId);
      if (campaign) {
        setSelectedId(campaign.id);
        setIsCreating(false);
        setForm({
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          cost: String(campaign.cost),
          timeCost: campaign.timeCost !== undefined ? String(campaign.timeCost) : '',
          cooldownSeconds: String(campaign.cooldownSeconds),
          setsFlag: campaign.setsFlag,
          requirements: campaign.requirements || [],
        });
        setEffectsForm(
          campaign.effects.map((e) => ({
            metric: e.metric,
            type: e.type,
            value: String(e.value),
            durationSeconds: String(e.durationSeconds ?? ''),
          }))
        );
        setStatus(null);
      }
    }
  }, [campaignId, campaigns]);

  const createCampaign = useCallback(() => {
    setIsCreating(true);
    setSelectedId('');
    setForm({
      id: '',
      name: '',
      description: '',
      cost: '0',
      timeCost: '',
      cooldownSeconds: '15',
      requirements: [],
    });
    setEffectsForm([]);
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
    const cost = Number(form.cost);
    const timeCost = form.timeCost?.trim() ? Number(form.timeCost) : undefined;
    const cooldownSeconds = Number(form.cooldownSeconds);
    if (!id || !name) {
      setStatus('Campaign id and name are required.');
      return;
    }
    if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(cooldownSeconds) || cooldownSeconds < 0) {
      setStatus('Cost must be >= 0 and Cooldown >= 0 seconds (recommended: 10-30 seconds).');
      return;
    }
    if (timeCost !== undefined && (!Number.isFinite(timeCost) || timeCost < 0)) {
      setStatus('Time cost must be >= 0 if specified.');
      return;
    }
    const setsFlag = form.setsFlag?.trim() || undefined;
    const requirements = form.requirements;
    const effects = effectsForm.map((ef) => ({
      metric: ef.metric,
      type: ef.type,
      value: Number(ef.value) || 0,
      durationSeconds: ef.durationSeconds === '' ? null : Number(ef.durationSeconds) || null,
    }));
    const payload: MarketingCampaign = {
      id,
      name,
      description,
      cost,
      timeCost,
      cooldownSeconds,
      effects,
      setsFlag,
      requirements,
    };
    saveMutation.mutate(payload);
  }, [industryId, form, effectsForm, saveMutation]);

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
        cost: '0',
        cooldownSeconds: '15',
        requirements: [],
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

  const operation: Operation = isLoading ? 'loading' : saveMutation.isPending ? 'saving' : deleteMutation.isPending ? 'deleting' : 'idle';

  return {
    campaigns,
    loading: isLoading,
    status: status || (error instanceof Error ? error.message : null),
    selectedId,
    isCreating,
    saving: saveMutation.isPending,
    deleting: deleteMutation.isPending,
    operation,
    form,
    effectsForm,
    load: () => queryClient.invalidateQueries({ queryKey: marketingQueryKey(industryId) }),
    selectCampaign,
    createCampaign,
    saveCampaign,
    deleteCampaign: deleteCampaignHandler,
    reset,
    updateForm,
    updateEffects,
  };
}
