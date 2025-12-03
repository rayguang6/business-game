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

interface LevelForm {
  level: number;
  name: string;
  description?: string;
  icon?: string;
  cost: string;
  timeCost?: string;
  effects: EffectForm[];
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
  const [levelsForm, setLevelsForm] = useState<LevelForm[]>([]);

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
      cost: String(upgrade.levels?.[0]?.cost ?? 0),
      timeCost: upgrade.levels?.[0]?.timeCost !== undefined ? String(upgrade.levels[0].timeCost) : '',
      maxLevel: String(upgrade.maxLevel),
      setsFlag: upgrade.setsFlag,
      requirements: upgrade.requirements || [],
    });
    
    // Always populate levelsForm from upgrade.levels
    if (upgrade.levels && upgrade.levels.length > 0) {
      setLevelsForm(upgrade.levels.map((level) => ({
        level: level.level,
        name: level.name,
        description: level.description,
        icon: level.icon,
        cost: String(level.cost),
        timeCost: level.timeCost !== undefined ? String(level.timeCost) : '',
        effects: level.effects.map((e) => ({
          metric: e.metric,
          type: e.type,
          value: String(e.value),
        })),
      })));
    } else {
      // Fallback: create a single level if none exist
      setLevelsForm([{
        level: 1,
        name: upgrade.name,
        description: upgrade.description,
        icon: upgrade.icon,
        cost: '0',
        timeCost: '',
        effects: [],
      }]);
    }
    
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
    // Start with one level
    setLevelsForm([{
      level: 1,
      name: '',
      description: '',
      icon: '⚙️',
      cost: '0',
      timeCost: '',
      effects: [],
    }]);
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
    const setsFlag = form.setsFlag?.trim() || undefined;
    const requirements = form.requirements;
    
    if (!id || !name) {
      setStatus('Upgrade id and name are required.');
      return;
    }

    if (!levelsForm || levelsForm.length === 0) {
      setStatus('At least one level is required.');
      return;
    }
    
    // Validate and convert levelsForm to UpgradeLevelConfig[]
    let levels: import('@/lib/game/types').UpgradeLevelConfig[];
    try {
      levels = levelsForm.map((levelForm, index) => {
        const levelNumber = levelForm.level || (index + 1);
        const cost = Number(levelForm.cost);
        const timeCost = levelForm.timeCost?.trim() ? Number(levelForm.timeCost) : undefined;
        
        if (!Number.isFinite(cost) || cost < 0) {
          throw new Error(`Level ${levelNumber}: Cost must be >= 0.`);
        }
        if (timeCost !== undefined && (!Number.isFinite(timeCost) || timeCost < 0)) {
          throw new Error(`Level ${levelNumber}: Time cost must be >= 0 if specified.`);
        }
        if (!levelForm.name.trim()) {
          throw new Error(`Level ${levelNumber}: Name is required.`);
        }
        
        // Validate and convert effects for this level
        const effects = levelForm.effects
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
        
        return {
          level: levelNumber,
          name: levelForm.name.trim(),
          description: levelForm.description?.trim() || undefined,
          icon: levelForm.icon?.trim() || undefined,
          cost,
          timeCost,
          effects,
        };
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Invalid level data.');
      return;
    }

    const maxLevel = levels.length;

    setOperation('saving');
    const result = await upsertUpgradeForIndustry(industryId, {
      id,
      name,
      description,
      icon,
      maxLevel,
      setsFlag,
      requirements,
      levels,
    });
    setOperation('idle');
    if (!result.success) {
      const errorMsg = result.message ?? 'Failed to save upgrade.';
      console.error('[Admin] Save failed:', errorMsg);
      setStatus(errorMsg);
      return;
    }
    
    
    // Reload upgrades from database to ensure we have the latest data
    const reloaded = await fetchUpgradesForIndustry(industryId);
    if (reloaded) {
      setUpgrades(reloaded.sort((a, b) => a.name.localeCompare(b.name)));
      const savedUpgrade = reloaded.find((u) => u.id === id);
      if (savedUpgrade) {
        selectUpgrade(savedUpgrade, false);
        setStatus(`Upgrade saved successfully with ${levels.length} level(s).`);
      } else {
        setStatus('Upgrade saved.');
      }
    } else {
      setStatus('Upgrade saved, but failed to reload. Please refresh.');
    }
    
    setIsCreating(false);
    setSelectedId(id);
  }, [industryId, form, levelsForm, selectUpgrade]);

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
    setLevelsForm([]);
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
      setLevelsForm([]);
    }
    setStatus(null);
  }, [selectedId, isCreating, upgrades, selectUpgrade]);

  const updateForm = useCallback((updates: Partial<UpgradeForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  }, []);

  const addLevel = useCallback(() => {
    const nextLevel = levelsForm.length + 1;
    setLevelsForm((prev) => [
      ...prev,
      {
        level: nextLevel,
        name: '',
        description: '',
        icon: form.icon || '⚙️',
        cost: '0',
        timeCost: '',
        effects: [],
      },
    ]);
    // Update maxLevel in form
    setForm((prev) => ({
      ...prev,
      maxLevel: String(nextLevel),
    }));
  }, [levelsForm.length, form.icon]);

  const removeLevel = useCallback((index: number) => {
    if (levelsForm.length <= 1) {
      setStatus('At least one level is required.');
      return;
    }
    setLevelsForm((prev) => {
      const newLevels = prev.filter((_, i) => i !== index);
      // Re-number levels to be sequential
      return newLevels.map((level, i) => ({
        ...level,
        level: i + 1,
      }));
    });
    // Update maxLevel in form
    setForm((prev) => ({
      ...prev,
      maxLevel: String(levelsForm.length - 1),
    }));
  }, [levelsForm.length]);

  const updateLevel = useCallback((index: number, updates: Partial<LevelForm>) => {
    setLevelsForm((prev) => {
      const newLevels = [...prev];
      newLevels[index] = { ...newLevels[index], ...updates };
      return newLevels;
    });
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
    levelsForm,
    load,
    selectUpgrade,
    createUpgrade,
    saveUpgrade,
    deleteUpgrade,
    reset,
    updateForm,
    addLevel,
    removeLevel,
    updateLevel,
  };
}

