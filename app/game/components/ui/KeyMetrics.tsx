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
import { getLevel, getLevelProgress } from '@/lib/store/types';
import { getExpPerLevel } from '@/lib/game/config';
import { useMetricDisplayConfigs } from '@/hooks/useMetricDisplayConfigs';
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
  const [feedbackByMetric, setFeedbackByMetric] = useState<Record<string, FeedbackItem[]>>({
    cash: [],
    time: [],
    exp: [],
  });

  useEffect(() => {
    // Only add feedback if there are actual changes
    if (Object.keys(changes).length === 0) return;

    setFeedbackByMetric((prev) => {
      const newFeedback: Record<string, FeedbackItem[]> = {
        cash: [...prev.cash],
        time: [...prev.time],
        exp: [...prev.exp],
      };

      // Add cash change feedback
      if (changes.cash !== undefined && changes.cash !== 0) {
        newFeedback.cash.push({
          id: `cash-${Date.now()}`,
          value: changes.cash,
          color: changes.cash > 0 ? 'green' : 'red',
        });
      }

      // Add time change feedback
      if (changes.time !== undefined && changes.time !== 0) {
        newFeedback.time.push({
          id: `time-${Date.now()}`,
          value: changes.time,
          color: changes.time > 0 ? 'blue' : 'red', // Blue when gained, red when spent
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
      [metricKey]: prev[metricKey].filter((item) => item.id !== id),
    }));
  };

  // Check if config is ready before accessing business metrics
  const businessMetrics = getBusinessMetrics(industryId);
  const isConfigReady = configStatus === 'ready' && businessMetrics && !configsLoading;
  
  // Show time metric if startingTime is configured or if time > 0
  let startingTime = 0;
  let expPerLevel = 200; // Default fallback
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
        // Filter MyTime metric based on game state
        if (def.id === GameMetric.MyTime) return showTime;
        return true;
      })
      .map(def => {
        const merged = getMergedDefinition(def.id);
        let value = '';
        let icon = '💎';
        let image: string | null = null;
        let color = 'text-green-400';
        let key = def.id;
        let feedback: FeedbackItem[] = [];

        // Get unit and iconPath from merged configuration (DB override or code default)
        const unit = merged.display.unit || '';
        const iconPath = merged.iconPath;

        // Map metric ID to display data
        switch (def.id) {
          case GameMetric.Cash:
            value = `${metrics.cash.toLocaleString()}${unit}`;
            icon = '💎';
            image = iconPath || '/images/icons/finance.png'; // Use DB iconPath with fallback
            color = 'text-green-400';
            feedback = feedbackByMetric.cash;
            break;
          case GameMetric.Exp:
            value = `Level ${getLevel(metrics.exp, expPerLevel)} (${getLevelProgress(metrics.exp, expPerLevel)}/${expPerLevel}${unit})`;
            icon = '💎';
            image = iconPath || '/images/icons/marketing.png'; // Use DB iconPath with fallback
            color = 'text-yellow-400';
            feedback = feedbackByMetric.exp;
            break;
          case GameMetric.MyTime: {
            // Calculate max capacities
            const maxMyTime = startingTime; // MyTime capacity is startingTime
            const maxLeveragedTime = effectManager.calculate(GameMetric.LeveragedTime, 0); // LeveragedTime capacity from effects
            const totalTime = metrics.myTime + metrics.leveragedTime;
            const maxTotalTime = maxMyTime + maxLeveragedTime;
            
            // Display format: myTime/maxMyTime + leveragedTime/maxLeveragedTime = total/maxTotal
            if (metrics.leveragedTime > 0) {
              value = `${metrics.myTime}/${maxMyTime}+${metrics.leveragedTime}/${maxLeveragedTime}=${totalTime}/${maxTotalTime}${unit}`;
            } else {
              value = `${metrics.myTime}/${maxMyTime}${unit}`;
            }
            icon = '⏱️';
            image = iconPath || '/images/icons/upgrades.png'; // Use DB iconPath with fallback
            color = 'text-cyan-400';
            feedback = feedbackByMetric.time;
            break;
          }
          case GameMetric.ConversionRate:
            value = `${conversionRate?.toFixed(1) ?? 0}${unit}`;
            icon = '📊';
            image = iconPath || null; // Use DB iconPath (no fallback for conversion rate)
            color = 'text-blue-400';
            feedback = [];
            break;
          case GameMetric.LeadsPerMonth: {
            // Calculate leadsPerMonth with effects applied
            const baseStats = getBusinessStats(industryId);
            const baseLeadsPerMonth = baseStats?.leadsPerMonth ?? 20;
            const calculatedLeadsPerMonth = Math.max(0, Math.round(effectManager.calculate(GameMetric.LeadsPerMonth, baseLeadsPerMonth)));
            value = `${calculatedLeadsPerMonth}${unit}`;
            icon = '👥';
            image = iconPath || '/images/icons/marketing.png';
            color = 'text-cyan-400';
            feedback = [];
            break;
          }
          default:
            // For other metrics, try to get value from metrics object
            const metricValue = (metrics as unknown as Record<string, number>)[def.id] ?? 0;
            value = `${metricValue}${unit}`;
            icon = '📊';
            image = iconPath || null; // Use DB iconPath (no fallback for other metrics)
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
      <div className="grid grid-cols-2 gap-y-0.5 sm:gap-y-0.5 md:gap-y-1 gap-x-1 sm:gap-x-1.5 md:gap-x-3">
        <div className="flex items-center bg-black/65 py-0.5 sm:py-0.5 md:py-1 px-0.5 sm:px-0.5 md:px-1.5 rounded relative w-full min-w-0">
          <div className="flex flex-col min-w-0 flex-1 pl-0.5 sm:pl-1 md:pl-2">
            <span className="text-caption font-semibold text-green-400 truncate">Cash</span>
            <span className="text-white text-label font-bold truncate">{metrics.cash.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-y-0.5 sm:gap-y-0.5 md:gap-y-1 gap-x-1 sm:gap-x-1.5 md:gap-x-3">
      {metricsData.map((metric, index) => (
        <div 
          key={index} 
          className="flex items-center bg-black/65 py-0.5 sm:py-0.5 md:py-1 px-0.5 sm:px-0.5 md:px-1.5 rounded relative w-full min-w-0"
        >
          {/* Icon positioned outside from the left */}
          <div className="absolute -left-1 sm:-left-1.5 md:-left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 rounded-full flex items-center justify-center z-10 overflow-hidden">
            {metric.image ? (
              <Image 
                src={metric.image} 
                alt={metric.label}
                width={20}
                height={20}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="text-white text-micro sm:text-ultra-sm md:text-sm">{metric.icon}</span>
            )}
          </div>

          <div className="flex flex-col min-w-0 flex-1 pl-0.5 sm:pl-1 md:pl-2">
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


