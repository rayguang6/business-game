import { useState, useCallback } from 'react';
import { fetchUpgradesForIndustry, upsertUpgradeForIndustry, deleteUpgradeById } from '@/lib/data/upgradeRepository';
import type { UpgradeDefinition } from '@/lib/game/types';
import type { Requirement } from '@/lib/game/types';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import type { Operation } from './types';

interface UpgradeForm {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: string;
  timeCost?: string; // Optional time cost
  maxLevel: string;
  setsFlag?: string;
  requirements: Requirement[];
}

interface EffectForm {
  metric: GameMetric;
  type: EffectType;
  value: string;
}

export function useUpgrades(industryId: string) {
  const [upgrades, setUpgrades] = useState<UpgradeDefinition[]>([]);
  const [operation, setOperation] = useState<Operation>('idle');
  const [status, setStatus] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<UpgradeForm>({
    id: '',
    name: '',
    description: '',
    icon: '⚙️',
    cost: '0',
    timeCost: '',
    maxLevel: '1',
    requirements: [],
  });
  const [effectsForm, setEffectsForm] = useState<EffectForm[]>([]);

  const load = useCallback(async () => {
    if (!industryId) return;
    setOperation('loading');
    setStatus(null);
    const result = await fetchUpgradesForIndustry(industryId);
    setOperation('idle');
    if (!result) {
      setUpgrades([]);
      return;
    }
    const sorted = result.slice().sort((a, b) => a.name.localeCompare(b.name));
    setUpgrades(sorted);
    if (sorted.length > 0) {
      selectUpgrade(sorted[0], false);
    }
  }, [industryId]);

  const selectUpgrade = useCallback((upgrade: UpgradeDefinition, resetMsg = true) => {
    setSelectedId(upgrade.id);
    setIsCreating(false);
    setForm({
      id: upgrade.id,
      name: upgrade.name,
      description: upgrade.description,
      icon: upgrade.icon,
      cost: String(upgrade.cost),
      timeCost: upgrade.timeCost !== undefined ? String(upgrade.timeCost) : '',
      maxLevel: String(upgrade.maxLevel),
      setsFlag: upgrade.setsFlag,
      requirements: upgrade.requirements || [],
    });
    setEffectsForm(upgrade.effects.map((e) => ({
      metric: e.metric,
      type: e.type,
      value: String(e.value),
    })));
    if (resetMsg) setStatus(null);
  }, []);

  const createUpgrade = useCallback(() => {
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
      icon: '⚙️',
      cost: '0',
      timeCost: '',
      maxLevel: '1',
      requirements: [],
    });
    setEffectsForm([]);
    setStatus(null);
  }, [industryId]);

  const saveUpgrade = useCallback(async () => {
    if (!industryId) {
      setStatus('Save the industry first.');
      return;
    }
    const id = form.id.trim();
    const name = form.name.trim();
    const description = form.description.trim();
    const icon = form.icon.trim() || '⚙️';
    const cost = Number(form.cost);
    const timeCost = form.timeCost?.trim() ? Number(form.timeCost) : undefined;
    const maxLevel = Number(form.maxLevel);
    if (!id || !name) {
      setStatus('Upgrade id and name are required.');
      return;
    }
    if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(maxLevel) || maxLevel < 1) {
      setStatus('Cost must be >= 0 and Max Level >= 1.');
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
    }));
    setOperation('saving');
    const result = await upsertUpgradeForIndustry(industryId, {
      id,
      name,
      description,
      icon,
      cost,
      timeCost,
      maxLevel,
      effects,
      setsFlag,
      requirements,
    });
    setOperation('idle');
    if (!result.success) {
      setStatus(result.message ?? 'Failed to save upgrade.');
      return;
    }
    setUpgrades((prev) => {
      const exists = prev.some((u) => u.id === id);
      const nextItem: UpgradeDefinition = { id, name, description, icon, cost, timeCost, maxLevel, effects, setsFlag, requirements };
      const next = exists ? prev.map((u) => (u.id === id ? nextItem : u)) : [...prev, nextItem];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    setStatus('Upgrade saved.');
    setIsCreating(false);
    setSelectedId(id);
  }, [industryId, form, effectsForm]);

  const deleteUpgrade = useCallback(async () => {
    if (isCreating || !selectedId) return;
    const upgrade = upgrades.find(u => u.id === selectedId);
    if (!window.confirm(`Delete upgrade "${upgrade?.name || selectedId}"?`)) return;
    setOperation('deleting');
    const result = await deleteUpgradeById(selectedId);
    setOperation('idle');
    if (!result.success) {
      setStatus(result.message ?? 'Failed to delete upgrade.');
      return;
    }
    setUpgrades((prev) => prev.filter((u) => u.id !== selectedId));
    setSelectedId('');
    setForm({
      id: '',
      name: '',
      description: '',
      icon: '⚙️',
      cost: '0',
      maxLevel: '1',
      requirements: [],
    });
    setEffectsForm([]);
    setStatus('Upgrade deleted.');
  }, [selectedId, isCreating, upgrades]);

  const reset = useCallback(() => {
    if (selectedId && !isCreating) {
      const existing = upgrades.find(u => u.id === selectedId);
      if (existing) selectUpgrade(existing);
    } else {
      setIsCreating(false);
      setSelectedId('');
      setForm({
        id: '',
        name: '',
        description: '',
        icon: '⚙️',
        cost: '0',
        maxLevel: '1',
        requirements: [],
      });
      setEffectsForm([]);
    }
    setStatus(null);
  }, [selectedId, isCreating, upgrades, selectUpgrade]);

  const updateForm = useCallback((updates: Partial<UpgradeForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  }, []);

  const updateEffects = useCallback((effects: EffectForm[]) => {
    setEffectsForm(effects);
  }, []);

  return {
    upgrades,
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
    selectUpgrade,
    createUpgrade,
    saveUpgrade,
    deleteUpgrade,
    reset,
    updateForm,
    updateEffects,
  };
}

