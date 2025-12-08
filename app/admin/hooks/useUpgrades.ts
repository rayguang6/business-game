import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUpgrades, upsertUpgrade, deleteUpgrade, fetchCategories } from '@/lib/server/actions/adminActions';
import type { UpgradeDefinition, Category } from '@/lib/game/types';
import type { Requirement } from '@/lib/game/types';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import type { Operation } from './types';
import { useToastFunctions } from '../components/ui/ToastContext';

interface UpgradeForm {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: string;
  timeCost?: string;
  maxLevel: string;
  categoryId?: string;
  setsFlag?: string;
  requirements: Requirement[];
  order: string;
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

// Query key factory for categories
const categoriesQueryKey = (industryId: string) => ['categories', industryId] as const;

export function useUpgrades(industryId: string, upgradeId?: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToastFunctions();
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
    categoryId: '',
    requirements: [],
    order: '',
  });
  const [levelsForm, setLevelsForm] = useState<LevelForm[]>([]);

  // Fetch upgrades using React Query
  const {
    data: upgrades = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: upgradesQueryKey(industryId),
    queryFn: async () => {
      if (!industryId) return [];
      const result = await fetchUpgrades(industryId);
      if (!result) return [];
      return result.slice().sort((a, b) => {
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

      return { previousUpgrades };
    },
    onError: (err, newUpgrade, context) => {
      if (context?.previousUpgrades) {
        queryClient.setQueryData(upgradesQueryKey(industryId), context.previousUpgrades);
      }
      const errorMsg = err instanceof Error ? err.message : 'Failed to save upgrade.';
      console.error('[Admin] Save failed:', errorMsg);
      error(errorMsg);
    },
    onSuccess: (savedUpgrade) => {
      setIsCreating(false);
      setSelectedId(savedUpgrade.id);
      selectUpgrade(savedUpgrade, false);
      success(`Upgrade saved successfully with ${savedUpgrade.levels?.length || 0} level(s).`);
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
      error(err instanceof Error ? err.message : 'Failed to delete upgrade.');
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
        order: '',
      });
      setLevelsForm([]);
      success('Upgrade deleted.');
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
      categoryId: upgrade.categoryId || '',
      setsFlag: upgrade.setsFlag,
      requirements: upgrade.requirements || [],
      order: String(upgrade.order ?? 0),
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
          categoryId: upgrade.categoryId || '',
          setsFlag: upgrade.setsFlag,
          requirements: upgrade.requirements || [],
          order: String(upgrade.order ?? 0),
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
        
      }
    }
  }, [upgradeId, upgrades]);

  const createUpgrade = useCallback(() => {
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
      icon: '⚙️',
      cost: '0',
      timeCost: '',
      maxLevel: '1',
      categoryId: '',
      requirements: [],
      order: '0',
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
    
  }, [industryId]);

  const saveUpgrade = useCallback(async () => {
    if (!industryId) {
      error('Save the industry first.');
      return;
    }
    const id = form.id.trim();
    const name = form.name.trim();
    const description = form.description.trim();
    const icon = form.icon.trim() || '⚙️';
    const setsFlag = form.setsFlag?.trim() || undefined;
    const requirements = form.requirements;

    if (!id || !name) {
      error('Upgrade id and name are required.');
      return;
    }

    if (!levelsForm || levelsForm.length === 0) {
      error('At least one level is required.');
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
    } catch (err) {
      error(err instanceof Error ? err.message : 'Invalid level data.');
      return;
    }

    const maxLevel = levels.length;

    const order = form.order.trim() ? Number(form.order.trim()) : undefined;
    const categoryId = form.categoryId?.trim() || undefined;

    const payload: UpgradeDefinition = {
      id,
      name,
      description,
      icon,
      maxLevel,
      categoryId,
      setsFlag,
      requirements,
      levels,
      order,
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
        categoryId: '',
        requirements: [],
        order: '',
      });
      setLevelsForm([]);
    }
    
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
        error('At least one level is required.');
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
    categories,
    loading: isLoading || categoriesLoading,
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
