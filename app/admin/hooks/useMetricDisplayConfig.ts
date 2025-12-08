import { useState, useCallback, useEffect } from 'react';
import type { IndustryId } from '@/lib/game/types';
import { GameMetric } from '@/lib/game/effectManager';
import { getAllMetrics } from '@/lib/game/metrics/registry';
import {
  fetchMetricDisplayConfigs,
  fetchIndustrySpecificMetricDisplayConfigsAction,
  upsertMetricDisplayConfigAction,
  deleteMetricDisplayConfigAction,
} from '@/lib/server/actions/adminActions';
import type { MetricDisplayConfig } from '@/lib/data/metricDisplayConfigRepository';
import { useToastFunctions } from '../components/ui/ToastContext';

interface UseMetricDisplayConfigOptions {
  industryId: IndustryId | 'global'; // 'global' = global defaults, industryId = industry-specific
  referenceIndustryId?: IndustryId; // For global page: show this industry's values for reference
}

interface UseMetricDisplayConfigReturn {
  // Data
  configs: Record<GameMetric, MetricDisplayConfig | null>;
  globalConfigs: Record<GameMetric, MetricDisplayConfig | null>;
  referenceConfigs: Record<GameMetric, MetricDisplayConfig | null>; // Industry configs for reference (global page only)
  
  // Status
  loading: boolean;
  saving: boolean;
  
  // Actions
  updateConfig: (metricId: GameMetric, updates: Partial<Omit<MetricDisplayConfig, 'id' | 'metricId' | 'industryId' | 'createdAt' | 'updatedAt'>>) => void;
  saveConfig: (metricId: GameMetric) => Promise<void>;
  saveAll: () => Promise<void>;
  deleteConfig: (metricId: GameMetric) => Promise<void>;
  hasChanges: () => boolean;
}

export function useMetricDisplayConfig({
  industryId,
  referenceIndustryId,
}: UseMetricDisplayConfigOptions): UseMetricDisplayConfigReturn {
  const [configs, setConfigs] = useState<Record<GameMetric, MetricDisplayConfig | null>>({} as Record<GameMetric, MetricDisplayConfig | null>);
  const [globalConfigs, setGlobalConfigs] = useState<Record<GameMetric, MetricDisplayConfig | null>>({} as Record<GameMetric, MetricDisplayConfig | null>);
  const [referenceConfigs, setReferenceConfigs] = useState<Record<GameMetric, MetricDisplayConfig | null>>({} as Record<GameMetric, MetricDisplayConfig | null>);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToastFunctions();

  // Load configs on mount and when industryId or referenceIndustryId changes
  useEffect(() => {
    loadConfigs();
  }, [industryId, referenceIndustryId]);

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    

    try {
      // Always load global configs for reference
      const global = await fetchMetricDisplayConfigs('global');
      setGlobalConfigs(global);

      // Load industry-specific configs (if industryId is not 'global')
      if (industryId !== 'global') {
        // Fetch only industry-specific configs (not merged with global)
        const industry = await fetchIndustrySpecificMetricDisplayConfigsAction(industryId);
        setConfigs(industry);
        setReferenceConfigs({} as Record<GameMetric, MetricDisplayConfig | null>);
      } else {
        // If industryId is 'global', we're editing global configs
        setConfigs(global);
        
        // Load reference industry configs if provided (for display/reference only)
        if (referenceIndustryId) {
          const reference = await fetchIndustrySpecificMetricDisplayConfigsAction(referenceIndustryId);
          setReferenceConfigs(reference);
        } else {
          setReferenceConfigs({} as Record<GameMetric, MetricDisplayConfig | null>);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load metric display configs';
      error(message);
      console.error('[useMetricDisplayConfig] Failed to load configs:', error);
    } finally {
      setLoading(false);
    }
  }, [industryId, referenceIndustryId]);

  const updateConfig = useCallback((metricId: GameMetric, updates: Partial<Omit<MetricDisplayConfig, 'id' | 'metricId' | 'industryId' | 'createdAt' | 'updatedAt'>>) => {
    setConfigs((prev) => {
      const current = prev[metricId];
      const isGlobalPage = industryId === 'global';
      
      if (!current) {
        // Create new config
        const allMetrics = getAllMetrics();
        const codeDef = allMetrics.find(m => m.id === metricId);
        if (!codeDef) return prev;

        // For industry pages, use global config as default if available
        const globalConfig = globalConfigs[metricId];
        type ConfigField = keyof Omit<MetricDisplayConfig, 'id' | 'metricId' | 'industryId' | 'createdAt' | 'updatedAt'>;
        const getDefault = <T,>(field: ConfigField, codeDefault: T): T => {
          if (updates[field] !== undefined) {
            return updates[field] as T;
          }
          if (!isGlobalPage && globalConfig && globalConfig[field] !== undefined && globalConfig[field] !== null) {
            return globalConfig[field] as T;
          }
          return codeDefault;
        };

        const newConfig: MetricDisplayConfig = {
          id: `${isGlobalPage ? 'global' : industryId}_${metricId}`,
          industryId: isGlobalPage ? 'global' : industryId, // Always enforce 'global' when on global page
          metricId,
          displayLabel: getDefault('displayLabel', codeDef.displayLabel),
          description: getDefault('description', codeDef.description ?? null),
          unit: getDefault('unit', codeDef.display.unit ?? null),
          iconPath: getDefault('iconPath', null),
          showOnHUD: getDefault('showOnHUD', codeDef.display.showOnHUD),
          showInDetails: getDefault('showInDetails', codeDef.display.showInDetails),
          priority: getDefault('priority', codeDef.display.priority ?? null),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return { ...prev, [metricId]: newConfig };
      }

      // Update existing config - ensure industryId is correct
      return {
        ...prev,
        [metricId]: {
          ...current,
          ...updates,
          industryId: isGlobalPage ? 'global' : current.industryId, // Enforce 'global' when on global page
          updatedAt: new Date(),
        },
      };
    });
  }, [industryId, globalConfigs]);

  const saveConfig = useCallback(async (metricId: GameMetric) => {
    const config = configs[metricId];
    if (!config) {
      error(`No config found for metric ${metricId}`);
      return;
    }

    setSaving(true);
    

    const isGlobalPage = industryId === 'global';

    try {
      const result = await upsertMetricDisplayConfigAction({
        industryId: isGlobalPage ? 'global' : config.industryId, // Enforce 'global' when on global page
        metricId: config.metricId,
        displayLabel: config.displayLabel,
        description: config.description,
        unit: config.unit,
        iconPath: config.iconPath,
        showOnHUD: config.showOnHUD,
        showInDetails: config.showInDetails,
        priority: config.priority,
      });

      if (result.success) {
        success(`Saved ${config.displayLabel} configuration`);
        // Reload to get fresh data
        await loadConfigs();
      } else {
        error(result.message || 'Failed to save config');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save config';
      error(message);
      console.error('[useMetricDisplayConfig] Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  }, [configs, industryId, loadConfigs]);

  const deleteConfig = useCallback(async (metricId: GameMetric) => {
    if (industryId === 'global') {
      error('Cannot delete global configs');
      return;
    }

    setSaving(true);
    

    try {
      const result = await deleteMetricDisplayConfigAction(industryId, metricId);
      if (result.success) {
        success('Deleted industry-specific config (will use global default)');
        await loadConfigs();
      } else {
        error(result.message || 'Failed to delete config');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete config';
      error(message);
      console.error('[useMetricDisplayConfig] Failed to delete config:', error);
    } finally {
      setSaving(false);
    }
  }, [industryId, loadConfigs]);

  const hasChanges = useCallback((): boolean => {
    const allMetrics = getAllMetrics();
    const isGlobalPage = industryId === 'global';
    
    return allMetrics.some(metric => {
      const config = configs[metric.id];
      const globalConfig = globalConfigs[metric.id];
      const codeDef = metric;
      
      if (isGlobalPage) {
        if (!config) return false;
        return (
          config.displayLabel !== codeDef.displayLabel ||
          config.description !== (codeDef.description ?? null) ||
          config.unit !== codeDef.display.unit ||
          config.showOnHUD !== codeDef.display.showOnHUD ||
          config.showInDetails !== codeDef.display.showInDetails ||
          config.priority !== (codeDef.display.priority ?? null) ||
          config.iconPath !== null
        );
      } else {
        if (!config) return false; // No industry override
        const globalValue = globalConfig || {
          displayLabel: codeDef.displayLabel,
          description: codeDef.description ?? null,
          unit: codeDef.display.unit ?? null,
          showOnHUD: codeDef.display.showOnHUD,
          showInDetails: codeDef.display.showInDetails,
          priority: codeDef.display.priority ?? null,
          iconPath: null,
        };
        return (
          config.displayLabel !== globalValue.displayLabel ||
          config.description !== globalValue.description ||
          config.unit !== globalValue.unit ||
          config.showOnHUD !== globalValue.showOnHUD ||
          config.showInDetails !== globalValue.showInDetails ||
          config.priority !== globalValue.priority ||
          config.iconPath !== globalValue.iconPath
        );
      }
    });
  }, [configs, globalConfigs, industryId]);

  const saveAll = useCallback(async () => {
    const allMetrics = getAllMetrics();
    const isGlobalPage = industryId === 'global';
    const changedMetrics = allMetrics.filter(metric => {
      const config = configs[metric.id];
      if (!config) return false;
      
      const globalConfig = globalConfigs[metric.id];
      const codeDef = metric;
      
      if (isGlobalPage) {
        return (
          config.displayLabel !== codeDef.displayLabel ||
          config.description !== (codeDef.description ?? null) ||
          config.unit !== codeDef.display.unit ||
          config.showOnHUD !== codeDef.display.showOnHUD ||
          config.showInDetails !== codeDef.display.showInDetails ||
          config.priority !== (codeDef.display.priority ?? null) ||
          config.iconPath !== null
        );
      } else {
        const globalValue = globalConfig || {
          displayLabel: codeDef.displayLabel,
          description: codeDef.description ?? null,
          unit: codeDef.display.unit ?? null,
          showOnHUD: codeDef.display.showOnHUD,
          showInDetails: codeDef.display.showInDetails,
          priority: codeDef.display.priority ?? null,
          iconPath: null,
        };
        return (
          config.displayLabel !== globalValue.displayLabel ||
          config.description !== globalValue.description ||
          config.unit !== globalValue.unit ||
          config.showOnHUD !== globalValue.showOnHUD ||
          config.showInDetails !== globalValue.showInDetails ||
          config.priority !== globalValue.priority ||
          config.iconPath !== globalValue.iconPath
        );
      }
    });

    if (changedMetrics.length === 0) {
      success('No changes to save');
      return;
    }

    setSaving(true);
    

    try {
      const results = await Promise.allSettled(
        changedMetrics.map(metric => {
          const config = configs[metric.id];
          if (!config) return Promise.resolve({ success: false });
          // Enforce industryId = 'global' when on global page
          return upsertMetricDisplayConfigAction({
            industryId: isGlobalPage ? 'global' : config.industryId,
            metricId: config.metricId,
            displayLabel: config.displayLabel,
            description: config.description,
            unit: config.unit,
            iconPath: config.iconPath,
            showOnHUD: config.showOnHUD,
            showInDetails: config.showInDetails,
            priority: config.priority,
          });
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;

      if (failed === 0) {
        success(`Saved ${successful} metric configuration${successful !== 1 ? 's' : ''}`);
        await loadConfigs();
      } else {
        error(`Saved ${successful} of ${results.length} configurations. ${failed} failed.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save configurations';
      error(message);
      console.error('[useMetricDisplayConfig] Failed to save all configs:', error);
    } finally {
      setSaving(false);
    }
  }, [configs, globalConfigs, industryId, loadConfigs]);

  return {
    configs,
    globalConfigs,
    referenceConfigs,
    loading,
    saving,
    updateConfig,
  saveConfig,
  saveAll,
  deleteConfig,
  hasChanges,
  };
}
