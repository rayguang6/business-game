'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchMetricDisplayConfigs } from '@/lib/server/actions/adminActions';
import { getMergedMetricDefinition, getAllMetrics } from '@/lib/game/metrics/registry';
import type { GameMetric } from '@/lib/game/effectManager';
import type { IndustryId } from '@/lib/game/types';
import type { MetricDefinition } from '@/lib/game/metrics/registry';
import type { MetricDisplayConfig } from '@/lib/data/metricDisplayConfigRepository';

/**
 * Hook to fetch and cache metric display configs for the current industry
 * Returns merged metric definitions (code + database overrides)
 */
export function useMetricDisplayConfigs(industryId: IndustryId) {
  const [configs, setConfigs] = useState<Record<GameMetric, MetricDisplayConfig | null>>({} as Record<GameMetric, MetricDisplayConfig | null>);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadConfigs() {
      setLoading(true);
      setError(null);

      try {
        const fetchedConfigs = await fetchMetricDisplayConfigs(industryId);
        if (!cancelled) {
          setConfigs(fetchedConfigs);
        }
      } catch (err) {
        if (!cancelled) {
          const error = err instanceof Error ? err : new Error('Failed to load metric display configs');
          setError(error);
          console.error('[useMetricDisplayConfigs] Failed to load configs:', error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadConfigs();

    return () => {
      cancelled = true;
    };
  }, [industryId]);

  /**
   * Get merged metric definition (code + database override)
   */
  const getMergedDefinition = useCallback((metric: GameMetric): MetricDefinition => {
    const dbConfig = configs[metric];
    return getMergedMetricDefinition(metric, dbConfig);
  }, [configs]);

  /**
   * Get display label for a metric (from DB if available, otherwise registry)
   */
  const getDisplayLabel = useCallback((metric: GameMetric): string => {
    return getMergedDefinition(metric).displayLabel;
  }, [getMergedDefinition]);

  /**
   * Get all metrics that should be shown on HUD (respecting DB configs)
   */
  const getMetricsForHUD = useCallback((): MetricDefinition[] => {
    const allMetrics = getAllMetrics();
    return allMetrics
      .map(metric => getMergedDefinition(metric.id))
      .filter(metric => metric.display.showOnHUD)
      .sort((a, b) => (a.display.priority ?? 999) - (b.display.priority ?? 999));
  }, [getMergedDefinition]);

  /**
   * Get all metrics that should be shown in details panel (respecting DB configs)
   */
  const getMetricsForDetails = useCallback((): MetricDefinition[] => {
    const allMetrics = getAllMetrics();
    return allMetrics
      .map(metric => getMergedDefinition(metric.id))
      .filter(metric => metric.display.showInDetails)
      .sort((a, b) => (a.display.priority ?? 999) - (b.display.priority ?? 999));
  }, [getMergedDefinition]);

  return {
    configs,
    loading,
    error,
    getMergedDefinition,
    getDisplayLabel,
    getMetricsForHUD,
    getMetricsForDetails,
  };
}
