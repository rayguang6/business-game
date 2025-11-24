'use client';

import React, { useState, useEffect } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useMetricChanges } from '@/hooks/useMetricChanges';
import { MetricFeedback, FeedbackItem } from './MetricFeedback';
import { useGameStore } from '@/lib/store/gameStore';
import { DEFAULT_INDUSTRY_ID, getStartingTime } from '@/lib/game/config';
import { effectManager, GameMetric } from '@/lib/game/effectManager';
import type { IndustryId } from '@/lib/game/types';
import { getLevel, getLevelProgress, EXP_PER_LEVEL } from '@/lib/store/types';
import Image from 'next/image';

export function KeyMetrics() {
  const { metrics } = useFinanceData();
  const changes = useMetricChanges();
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  // Show time metric if startingTime is configured or if time > 0
  const startingTime = getStartingTime(industryId);
  const showTime = startingTime > 0 || metrics.time > 0;
  
  const [feedbackByMetric, setFeedbackByMetric] = useState<Record<string, FeedbackItem[]>>({
    cash: [],
    time: [],
    exp: [],
    freedomScore: [],
  });

  useEffect(() => {
    // Only add feedback if there are actual changes
    if (Object.keys(changes).length === 0) return;

    setFeedbackByMetric((prev) => {
      const newFeedback: Record<string, FeedbackItem[]> = {
        cash: [...prev.cash],
        time: [...prev.time],
        exp: [...prev.exp],
        freedomScore: [...prev.freedomScore],
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

      // Add freedom score change feedback (previously founderWorkingHours)
      if (changes.freedomScore !== undefined && changes.freedomScore !== 0) {
        newFeedback.freedomScore.push({
          id: `freedomScore-${Date.now()}`,
          value: changes.freedomScore,
          color: changes.freedomScore < 0 ? 'green' : 'red', // Green when reduced, red when increased
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

  const metricsData = [
    {
      key: 'cash',
      icon: '💎',
      image: '/images/icons/finance.png',
      value: metrics.cash.toLocaleString(),
      label: 'Cash',
      color: 'text-green-400',
      feedback: feedbackByMetric.cash,
    },
    {
      key: 'exp',
      icon: '💎',
      image: '/images/icons/marketing.png',
      value: `Level ${getLevel(metrics.exp)} (${getLevelProgress(metrics.exp)}/${EXP_PER_LEVEL} EXP)`,
      label: selectedIndustry?.id === 'freelance' ? 'Skill Level' : 'Level',
      color: 'text-yellow-400',
      feedback: feedbackByMetric.exp,
    },
    // Conditionally show time if configured
    ...(showTime ? [{
      key: 'time',
      icon: '⏱️',
      image: '/images/icons/upgrades.png',
      value: `${metrics.time}/${getStartingTime(industryId) + effectManager.calculate(GameMetric.MonthlyTimeCapacity, 0)}h`,
      label: 'Time Budget',
      color: 'text-cyan-400',
      feedback: feedbackByMetric.time,
    }] : []),
    {
      key: 'freedomScore',
      icon: '⏰',
      image: '/images/icons/upgrades.png',
      value: `${metrics.freedomScore}`,
      label: 'Freedom Score',
      color: 'text-purple-400',
      feedback: feedbackByMetric.freedomScore,
    }
  ];

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


