'use client';

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMetricDisplayConfigs } from '@/lib/server/actions/adminActions';
import { getMergedMetricDefinition, getAllMetrics } from '@/lib/game/metrics/registry';
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
  const {
    data: configs = {} as Record<GameMetric, MetricDisplayConfig | null>,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ['metricDisplayConfigs', industryId],
    queryFn: () => fetchMetricDisplayConfigs(industryId),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const error = queryError instanceof Error ? queryError : queryError ? new Error('Failed to load metric display configs') : null;

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
