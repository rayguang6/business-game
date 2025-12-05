import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUpgrades, upsertUpgrade, deleteUpgrade } from '@/lib/server/actions/adminActions';
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
  timeCost?: string;
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

// Query key factory for upgrades
const upgradesQueryKey = (industryId: string) => ['upgrades', industryId] as const;

export function useUpgrades(industryId: string, upgradeId?: string) {
  const queryClient = useQueryClient();
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

  // Fetch upgrades using React Query
  const {
    data: upgrades = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: upgradesQueryKey(industryId),
    queryFn: async () => {
      if (!industryId) return [];
      const result = await fetchUpgrades(industryId);
      if (!result) return [];
      return result.slice().sort((a, b) => a.name.localeCompare(b.name));
    },
    enabled: !!industryId,
  });

  // Save upgrade mutation with optimistic update
  const saveMutation = useMutation({
    mutationFn: async (payload: UpgradeDefinition) => {
      if (!industryId) throw new Error('Industry ID is required');
      const result = await upsertUpgrade(industryId as any, payload);
      if (!result.success) {
        throw new Error(result.message ?? 'Failed to save upgrade.');
      }
      return payload;
    },
    onMutate: async (newUpgrade) => {
      await queryClient.cancelQueries({ queryKey: upgradesQueryKey(industryId) });
      const previousUpgrades = queryClient.getQueryData<UpgradeDefinition[]>(upgradesQueryKey(industryId));

      queryClient.setQueryData<UpgradeDefinition[]>(upgradesQueryKey(industryId), (old = []) => {
        const exists = old.some((u) => u.id === newUpgrade.id);
        const next = exists ? old.map((u) => (u.id === newUpgrade.id ? newUpgrade : u)) : [...old, newUpgrade];
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });

      return { previousUpgrades };
    },
    onError: (err, newUpgrade, context) => {
      if (context?.previousUpgrades) {
        queryClient.setQueryData(upgradesQueryKey(industryId), context.previousUpgrades);
      }
      const errorMsg = err instanceof Error ? err.message : 'Failed to save upgrade.';
      console.error('[Admin] Save failed:', errorMsg);
      setStatus(errorMsg);
    },
    onSuccess: (savedUpgrade) => {
      setIsCreating(false);
      setSelectedId(savedUpgrade.id);
      selectUpgrade(savedUpgrade, false);
      setStatus(`Upgrade saved successfully with ${savedUpgrade.levels?.length || 0} level(s).`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: upgradesQueryKey(industryId) });
    },
  });

  // Delete upgrade mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteUpgrade(id);
      if (!result.success) {
        throw new Error(result.message ?? 'Failed to delete upgrade.');
      }
      return id;
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: upgradesQueryKey(industryId) });
      const previousUpgrades = queryClient.getQueryData<UpgradeDefinition[]>(upgradesQueryKey(industryId));

      queryClient.setQueryData<UpgradeDefinition[]>(upgradesQueryKey(industryId), (old = []) =>
        old.filter((u) => u.id !== deletedId)
      );

      return { previousUpgrades };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousUpgrades) {
        queryClient.setQueryData(upgradesQueryKey(industryId), context.previousUpgrades);
      }
      setStatus(err instanceof Error ? err.message : 'Failed to delete upgrade.');
    },
    onSuccess: () => {
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
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: upgradesQueryKey(industryId) });
    },
  });

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
      setLevelsForm(
        upgrade.levels.map((level) => ({
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
        }))
      );
    } else {
      // Fallback: create a single level if none exist
      setLevelsForm([
        {
          level: 1,
          name: upgrade.name,
          description: upgrade.description,
          icon: upgrade.icon,
          cost: '0',
          timeCost: '',
          effects: [],
        },
      ]);
    }

    if (resetMsg) setStatus(null);
  }, []);

  // Select upgrade when upgradeId changes or upgrades are loaded
  useEffect(() => {
    if (upgradeId && upgrades.length > 0) {
      const upgrade = upgrades.find((u) => u.id === upgradeId);
      if (upgrade) {
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

        if (upgrade.levels && upgrade.levels.length > 0) {
          setLevelsForm(
            upgrade.levels.map((level) => ({
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
            }))
          );
        } else {
          setLevelsForm([
            {
              level: 1,
              name: upgrade.name,
              description: upgrade.description,
              icon: upgrade.icon,
              cost: '0',
              timeCost: '',
              effects: [],
            },
          ]);
        }
        setStatus(null);
      }
    }
  }, [upgradeId, upgrades]);

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
    setLevelsForm([
      {
        level: 1,
        name: '',
        description: '',
        icon: '⚙️',
        cost: '0',
        timeCost: '',
        effects: [],
      },
    ]);
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
        const levelNumber = levelForm.level || index + 1;
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

    const payload: UpgradeDefinition = {
      id,
      name,
      description,
      icon,
      maxLevel,
      setsFlag,
      requirements,
      levels,
    };

    saveMutation.mutate(payload);
  }, [industryId, form, levelsForm, saveMutation]);

  const deleteUpgradeHandler = useCallback(async () => {
    if (isCreating || !selectedId) return;
    const upgrade = upgrades.find((u) => u.id === selectedId);
    if (!window.confirm(`Delete upgrade "${upgrade?.name || selectedId}"?`)) return;
    deleteMutation.mutate(selectedId);
  }, [selectedId, isCreating, upgrades, deleteMutation]);

  const reset = useCallback(() => {
    if (selectedId && !isCreating) {
      const existing = upgrades.find((u) => u.id === selectedId);
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
    setForm((prev) => ({ ...prev, ...updates }));
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

  const removeLevel = useCallback(
    (index: number) => {
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
    },
    [levelsForm.length]
  );

  const updateLevel = useCallback((index: number, updates: Partial<LevelForm>) => {
    setLevelsForm((prev) => {
      const newLevels = [...prev];
      newLevels[index] = { ...newLevels[index], ...updates };
      return newLevels;
    });
  }, []);

  const operation: Operation = isLoading ? 'loading' : saveMutation.isPending ? 'saving' : deleteMutation.isPending ? 'deleting' : 'idle';

  return {
    upgrades,
    loading: isLoading,
    status: status || (error instanceof Error ? error.message : null),
    selectedId,
    isCreating,
    saving: saveMutation.isPending,
    deleting: deleteMutation.isPending,
    operation,
    form,
    levelsForm,
    load: () => queryClient.invalidateQueries({ queryKey: upgradesQueryKey(industryId) }),
    selectUpgrade,
    createUpgrade,
    saveUpgrade,
    deleteUpgrade: deleteUpgradeHandler,
    reset,
    updateForm,
    addLevel,
    removeLevel,
    updateLevel,
  };
}
