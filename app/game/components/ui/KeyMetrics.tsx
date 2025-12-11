'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useMetricChanges } from '@/hooks/useMetricChanges';
import { MetricFeedback, FeedbackItem } from './MetricFeedback';
import { useGameStore } from '@/lib/store/gameStore';
import { useConfigStore } from '@/lib/store/configStore';
import { DEFAULT_INDUSTRY_ID, getStartingTime, getBusinessMetrics, getBusinessStats } from '@/lib/game/config';
import { effectManager, GameMetric } from '@/lib/game/effectManager';
import type { IndustryId } from '@/lib/game/types';
import { getLevel, getLevelProgress, getExpRequiredForCurrentLevel } from '@/lib/store/types';
import { getExpPerLevel } from '@/lib/game/config';
import { useMetricDisplayConfigs } from '@/hooks/useMetricDisplayConfigs';
import { getMetricIcon, getAllMetrics } from '@/lib/game/metrics/registry';
import Image from 'next/image';

export function KeyMetrics() {
  const { metrics } = useFinanceData();
  const changes = useMetricChanges();
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const configStatus = useConfigStore((state) => state.configStatus);
  const conversionRate = useGameStore((state) => state.conversionRate);
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  const { getMetricsForHUD, getMergedDefinition, loading: configsLoading } = useMetricDisplayConfigs(industryId);
  
  // All hooks must be called before any conditional returns
  const [feedbackByMetric, setFeedbackByMetric] = useState<Record<string, FeedbackItem[]>>(() => {
    // Initialize feedback for all HUD metrics dynamically
    const allHudMetrics = getAllMetrics().filter(metric => metric.display.showOnHUD);
    const initialFeedback: Record<string, FeedbackItem[]> = {};

    allHudMetrics.forEach(metric => {
      initialFeedback[metric.id] = [];
    });

    return initialFeedback;
  });

  // Force re-render when effect manager changes (effects update)
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const unsubscribe = effectManager.subscribe(() => forceUpdate(prev => prev + 1));
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Only add feedback if there are actual changes
    if (Object.keys(changes).length === 0) return;

    setFeedbackByMetric((prev) => {
      // Create new feedback object with existing feedback preserved
      const newFeedback: Record<string, FeedbackItem[]> = {};
      Object.keys(prev).forEach(key => {
        newFeedback[key] = [...prev[key]];
      });

      // Add cash change feedback
      if (changes.cash !== undefined && changes.cash !== 0) {
        newFeedback.cash.push({
          id: `cash-${Date.now()}`,
          value: changes.cash,
          color: changes.cash > 0 ? 'green' : 'red',
        });
      }

      // Add myTime change feedback
      if (changes.myTime !== undefined && changes.myTime !== 0) {
        newFeedback.myTime.push({
          id: `myTime-${Date.now()}`,
          value: changes.myTime,
          color: changes.myTime > 0 ? 'blue' : 'red', // Blue when gained, red when spent
        });
      }

      // Add leveragedTime change feedback
      if (changes.leveragedTime !== undefined && changes.leveragedTime !== 0) {
        newFeedback.leveragedTime.push({
          id: `leveragedTime-${Date.now()}`,
          value: changes.leveragedTime,
          color: changes.leveragedTime > 0 ? 'blue' : 'red', // Blue when gained, red when spent
        });
      }

      // Add exp change feedback (previously skill level)
      if (changes.exp !== undefined && changes.exp !== 0) {
        newFeedback.exp.push({
          id: `exp-${Date.now()}`,
          value: changes.exp,
          color: changes.exp > 0 ? 'yellow' : 'red',
        });
      }

      return newFeedback;
    });
  }, [changes]);

  const handleFeedbackComplete = (metricKey: string, id: string) => {
    setFeedbackByMetric((prev) => ({
      ...prev,
      [metricKey]: (prev[metricKey] || []).filter((item) => item.id !== id),
    }));
  };

  // Check if config is ready before accessing business metrics
  const businessMetrics = getBusinessMetrics(industryId);
  const isConfigReady = configStatus === 'ready' && businessMetrics && !configsLoading;
  
  // Show time metric if startingTime is configured or if time > 0
  let startingTime = 0;
  let expPerLevel: number | number[] = 200; // Default fallback
  if (isConfigReady) {
    try {
      startingTime = getStartingTime(industryId);
      expPerLevel = getExpPerLevel(industryId);
    } catch (error) {
      // If config access fails, use defaults
      console.warn('[KeyMetrics] Error accessing config, using defaults', error);
    }
  }
  const showTime = startingTime > 0 || (metrics.myTime + metrics.leveragedTime) > 0;

  // Get metrics that should be shown on HUD (from registry + DB configs)
  const hudMetrics = useMemo(() => {
    if (!isConfigReady) return [];
    return getMetricsForHUD();
  }, [isConfigReady, getMetricsForHUD]);

  // Map metric definitions to display data
  const metricsData = useMemo(() => {
    if (!isConfigReady) return [];

    return hudMetrics
      .filter(def => {
        // Filter MyTime and LeveragedTime metrics based on game state
        if (def.id === GameMetric.MyTime) return showTime;
        if (def.id === GameMetric.LeveragedTime) return showTime; // Always show when time is enabled
        return true;
      })
      .map(def => {
        const merged = getMergedDefinition(def.id);
        let value = '';
        let icon = '💵';
        let image: string | null = null;
        let color = 'text-green-400';
        let key = def.id;
        let feedback: FeedbackItem[] = [];

        // Get unit and iconPath from merged configuration (DB override or code default)
        const unit = merged.display.unit || '';
        const iconPath = merged.iconPath ?? null;

        // Map metric ID to display data
        switch (def.id) {
          case GameMetric.Cash:
            value = `${metrics.cash.toLocaleString()}${unit}`;
            icon = getMetricIcon(def.id);
            image = iconPath; // Use merged iconPath (DB → registry fallback)
            color = 'text-green-400';
            feedback = feedbackByMetric.cash;
            break;
          case GameMetric.Exp: {
            const currentLevel = getLevel(metrics.exp, expPerLevel);
            const currentLevelProgress = getLevelProgress(metrics.exp, expPerLevel);
            const expRequiredForCurrentLevel = getExpRequiredForCurrentLevel(metrics.exp, expPerLevel);
            value = `Level ${currentLevel} (${currentLevelProgress}/${expRequiredForCurrentLevel}${unit})`;
            icon = getMetricIcon(def.id);
            image = iconPath; // Use merged iconPath (DB → registry fallback)
            color = 'text-yellow-400';
            feedback = feedbackByMetric.exp;
            break;
          }
          case GameMetric.MyTime: {
            // Use capacity from metrics (never changes for myTime, equals startingTime)
            const maxMyTime = metrics.myTimeCapacity;
            // Display format: just show myTime/myTimeCapacity (never show formulas)
            value = `${metrics.myTime}/${maxMyTime}${unit}`;
            icon = getMetricIcon(def.id);
            image = iconPath; // Use merged iconPath (DB → registry fallback)
            color = 'text-cyan-400';
            feedback = feedbackByMetric.myTime || [];
            break;
          }
          case GameMetric.LeveragedTime: {
            // Use capacity from metrics
            const maxLeveragedTime = metrics.leveragedTimeCapacity;
            // Display format: leveragedTime/leveragedTimeCapacity (e.g., "0/0", "10/10 h")
            value = `${metrics.leveragedTime}/${maxLeveragedTime}${unit}`;
            icon = getMetricIcon(def.id);
            image = iconPath; // Use merged iconPath (DB → registry fallback)
            color = 'text-cyan-400';
            feedback = feedbackByMetric.leveragedTime || [];
            break;
          }
          case GameMetric.ConversionRate:
            value = `${conversionRate?.toFixed(1) ?? 0}${unit}`;
            icon = getMetricIcon(def.id);
            image = iconPath; // Use merged iconPath (DB → registry fallback)
            color = 'text-blue-400';
            feedback = [];
            break;
          case GameMetric.LeadsPerMonth: {
            // Calculate leadsPerMonth with effects applied
            const baseStats = getBusinessStats(industryId);
            const baseLeadsPerMonth = baseStats?.leadsPerMonth ?? 20;
            const calculatedLeadsPerMonth = Math.max(0, Math.round(effectManager.calculate(GameMetric.LeadsPerMonth, baseLeadsPerMonth)));
            value = `${calculatedLeadsPerMonth}${unit}`;
            icon = getMetricIcon(def.id);
            image = iconPath; // Use merged iconPath (DB → registry fallback)
            color = 'text-cyan-400';
            feedback = [];
            break;
          }
          case GameMetric.CustomerPatienceSeconds: {
            // Calculate customerPatienceSeconds with effects applied
            const baseStats = getBusinessStats(industryId);
            const baseCustomerPatience = baseStats?.customerPatienceSeconds ?? 10;
            const calculatedCustomerPatience = Math.max(1, Math.round(effectManager.calculate(GameMetric.CustomerPatienceSeconds, baseCustomerPatience)));
            value = `${calculatedCustomerPatience}${unit}`;
            icon = getMetricIcon(def.id);
            image = iconPath; // Use merged iconPath (DB → registry fallback)
            color = 'text-orange-400';
            feedback = [];
            break;
          }
          default:
            // For other metrics, try to get value from metrics object
            const metricValue = (metrics as unknown as Record<string, number>)[def.id] ?? 0;
            value = `${metricValue}${unit}`;
            icon = getMetricIcon(def.id);
            image = iconPath; // Use merged iconPath (DB → registry fallback)
            color = 'text-gray-400';
            feedback = [];
        }

        return {
          key,
          icon,
          image,
          value,
          label: merged.displayLabel, // Use merged label (DB override if available)
          color,
          feedback,
        };
      });
  }, [isConfigReady, hudMetrics, getMergedDefinition, metrics, expPerLevel, startingTime, showTime, feedbackByMetric, conversionRate]);

  // If config not ready, return minimal UI
  if (!isConfigReady) {
    return (
      <div className="grid grid-cols-1 gap-1 sm:gap-1.5 md:gap-2">
        <div className="flex items-center bg-black/65 py-0.5 sm:py-0.5 md:py-1 px-0.5 sm:px-0.5 md:px-1.5 rounded relative w-full min-w-0">
          {/* Icon positioned outside from the left with overflow design */}
          <div className="absolute -left-1 sm:-left-1.5 md:-left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 flex items-center justify-center z-10 overflow-hidden">
            <span className="text-white text-micro sm:text-ultra-sm md:text-sm">💵</span>
          </div>

          <div className="flex flex-col min-w-0 flex-1 pl-1 sm:pl-2 md:pl-3">
            <span className="text-caption font-semibold text-green-400 truncate">Cash</span>
            <span className="text-white text-label font-bold truncate">{metrics.cash.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-1 sm:gap-1.5 md:gap-2">
      {metricsData.map((metric, index) => (
        <div 
          key={index} 
          className="flex items-center bg-black/65 py-0.5 sm:py-0.5 md:py-1 px-0.5 sm:px-0.5 md:px-1.5 rounded relative w-full min-w-0"
        >
          {/* Icon positioned outside from the left with overflow design */}
          <div className="absolute -left-1 sm:-left-1.5 md:-left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 flex items-center justify-center z-10 overflow-hidden">
            {/* IMAGE-FIRST MODE: Use database images as single source of truth with icon fallback */}
            {metric.image ? (
              <Image
                src={metric.image}
                alt={metric.label}
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-white text-sm sm:text-base md:text-lg">{metric.icon}</span>
            )}
          </div>

          <div className="flex flex-col min-w-0 flex-1 pl-2 sm:pl-3 md:pl-4">
            <span
              className={`text-caption font-semibold ${metric.color} truncate`}
              style={{
                textShadow: '0 0 2px rgba(0, 0, 0, 0.95), 0 1px 1px rgba(0, 0, 0, 0.8), 0 -1px 1px rgba(0, 0, 0, 0.8)'
              }}
            >
              {metric.label}
            </span>
            <span 
              className="text-white text-label font-bold truncate"
              style={{
                textShadow: '0 0 3px rgba(0, 0, 0, 1), 0 1px 2px rgba(0, 0, 0, 0.9), 0 -1px 2px rgba(0, 0, 0, 0.9)'
              }}
            >
              {metric.value}
            </span>
          </div>

          {/* Feedback animations */}
          <MetricFeedback
            feedback={metric.feedback}
            onComplete={(id) => handleFeedbackComplete(metric.key, id)}
          />
        </div>
      ))}
    </div>
  );
}


