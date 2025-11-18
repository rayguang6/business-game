import { useState, useCallback } from 'react';
import { fetchMarketingCampaignsForIndustry, upsertMarketingCampaignForIndustry, deleteMarketingCampaignById } from '@/lib/data/marketingRepository';
import type { MarketingCampaign } from '@/lib/store/slices/marketingSlice';
import type { Requirement } from '@/lib/game/types';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import type { Operation } from './types';

interface CampaignForm {
  id: string;
  name: string;
  description: string;
  cost: string;
  timeCost?: string; // Optional time cost
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

export function useMarketing(industryId: string) {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [operation, setOperation] = useState<Operation>('idle');
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

  const load = useCallback(async () => {
    if (!industryId) return;
    setOperation('loading');
    setStatus(null);
    const result = await fetchMarketingCampaignsForIndustry(industryId);
    setOperation('idle');
    if (!result) {
      setCampaigns([]);
      return;
    }
    setCampaigns(result);
    if (result.length > 0) {
      selectCampaign(result[0], false);
    }
  }, [industryId]);

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
    setEffectsForm(campaign.effects.map((e) => ({
      metric: e.metric,
      type: e.type,
      value: String(e.value),
      durationSeconds: String(e.durationSeconds ?? ''),
    })));
    if (resetMsg) setStatus(null);
  }, []);

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
    setOperation('saving');
    const result = await upsertMarketingCampaignForIndustry(industryId, {
      id,
      name,
      description,
      cost,
      timeCost,
      cooldownSeconds,
      effects,
      setsFlag,
      requirements,
    });
    setOperation('idle');
    if (!result.success) {
      setStatus(result.message ?? 'Failed to save campaign.');
      return;
    }
    setCampaigns((prev) => {
      const exists = prev.some((c) => c.id === id);
      const nextItem: MarketingCampaign = { id, name, description, cost, timeCost, cooldownSeconds, effects, setsFlag, requirements };
      const next = exists ? prev.map((c) => (c.id === id ? nextItem : c)) : [...prev, nextItem];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    setStatus('Campaign saved.');
    setIsCreating(false);
    setSelectedId(id);
  }, [industryId, form, effectsForm]);

  const deleteCampaign = useCallback(async () => {
    if (isCreating || !selectedId) return;
    const campaign = campaigns.find(c => c.id === selectedId);
    if (!window.confirm(`Delete campaign "${campaign?.name || selectedId}"?`)) return;
    setOperation('deleting');
    const result = await deleteMarketingCampaignById(selectedId, industryId);
    setOperation('idle');
    if (!result.success) {
      setStatus(result.message ?? 'Failed to delete campaign.');
      return;
    }
    setCampaigns((prev) => prev.filter((c) => c.id !== selectedId));
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
  }, [industryId, selectedId, isCreating, campaigns]);

  const reset = useCallback(() => {
    if (selectedId && !isCreating) {
      const existing = campaigns.find(c => c.id === selectedId);
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
    setForm(prev => ({ ...prev, ...updates }));
  }, []);

  const updateEffects = useCallback((effects: CampaignEffectForm[]) => {
    setEffectsForm(effects);
  }, []);

  return {
    campaigns,
    loading: operation === 'loading',
    status,
    selectedId,
    isCreating,
    saving: operation === 'saving',
    deleting: operation === 'deleting',
    operation,
    form,
    effectsForm,
    load,
    selectCampaign,
    createCampaign,
    saveCampaign,
    deleteCampaign,
    reset,
    updateForm,
    updateEffects,
  };
}

