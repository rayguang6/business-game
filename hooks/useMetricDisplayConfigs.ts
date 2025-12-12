'use client';

import { useCallback } from 'react';
import { getMergedMetricDefinition, getAllMetrics } from '@/lib/game/metrics/registry';
import { useConfigStore } from '@/lib/store/configStore';
import type { GameMetric } from '@/lib/game/effectManager';
import type { IndustryId } from '@/lib/game/types';
import type { MetricDefinition } from '@/lib/game/metrics/registry';
import type { MetricDisplayConfig } from '@/lib/data/metricDisplayConfigRepository';

/**
 * Hook to fetch and cache metric display configs for the current industry
 * Returns merged metric definitions (code + database overrides)
 * Uses React Query for caching and sharing data across components
 */
export function useMetricDisplayConfigs(industryId: IndustryId) {
  // Get metric display configs from pre-loaded config store
  const configs = useConfigStore((state) => {
    const industryConfig = state.industryConfigs[industryId];
    return (industryConfig?.metricDisplayConfigs as Record<GameMetric, MetricDisplayConfig | null>) || {};
  });

  const loading = false;
  const error = null;

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
