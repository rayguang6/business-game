'use client';

import { useCallback } from 'react';
import { getMergedMetricDefinition, getAllMetrics } from '@/lib/game/metrics/registry';
import { useConfigStore, selectMetricDisplayConfigsForIndustry } from '@/lib/store/configStore';
import type { GameMetric } from '@/lib/game/effectManager';
import type { IndustryId } from '@/lib/game/types';
import type { MetricDefinition } from '@/lib/game/metrics/registry';
import type { MetricDisplayConfig } from '@/lib/data/metricDisplayConfigRepository';

/**
 * Hook to fetch and cache metric display configs for the current industry
 * Returns merged metric definitions (code + database overrides)
 * Uses Zustand for caching and sharing data across components
 */
export function useMetricDisplayConfigs(industryId: IndustryId) {
  const configs = useConfigStore(selectMetricDisplayConfigsForIndustry(industryId));

  const getMergedDefinition = useCallback(
    (metric: GameMetric): MetricDefinition => {
      const dbConfig = configs?.[metric] ?? null;
      return getMergedMetricDefinition(metric, dbConfig);
    },
    [configs]
  );

  const getDisplayLabel = useCallback(
    (metric: GameMetric): string =>
      getMergedDefinition(metric).displayLabel,
    [getMergedDefinition]
  );

  const getMetricsForHUD = useCallback((): MetricDefinition[] => {
    return getAllMetrics()
      .map((metric) => getMergedDefinition(metric.id))
      .filter((metric) => metric.display.showOnHUD)
      .sort((a, b) => (a.display.priority ?? 999) - (b.display.priority ?? 999));
  }, [getMergedDefinition]);

  const getMetricsForDetails = useCallback((): MetricDefinition[] => {
    return getAllMetrics()
      .map((metric) => getMergedDefinition(metric.id))
      .filter((metric) => metric.display.showInDetails)
      .sort((a, b) => (a.display.priority ?? 999) - (b.display.priority ?? 999));
  }, [getMergedDefinition]);

  return {
    configs,
    loading: false,
    error: null,
    getMergedDefinition,
    getDisplayLabel,
    getMetricsForHUD,
    getMetricsForDetails,
  };
}
