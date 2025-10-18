'use client';

import React, { useState, useEffect } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useMetricChanges } from '@/hooks/useMetricChanges';
import { MetricFeedback, FeedbackItem } from './MetricFeedback';
import Image from 'next/image';

export function KeyMetrics() {
  const { metrics, weeklyRevenue, weeklyExpenses } = useFinanceData();
  const changes = useMetricChanges();
  const [feedbackByMetric, setFeedbackByMetric] = useState<Record<string, FeedbackItem[]>>({
    cash: [],
    revenue: [],
    reputation: [],
    expenses: [],
  });

  useEffect(() => {
    // Only add feedback if there are actual changes
    if (Object.keys(changes).length === 0) return;

    setFeedbackByMetric((prev) => {
      const newFeedback: Record<string, FeedbackItem[]> = {
        cash: [...prev.cash],
        revenue: [...prev.revenue],
        reputation: [...prev.reputation],
        expenses: [...prev.expenses],
      };

      // Add cash change feedback
      if (changes.cash !== undefined && changes.cash !== 0) {
        newFeedback.cash.push({
          id: `cash-${Date.now()}`,
          value: changes.cash,
          color: changes.cash > 0 ? 'green' : 'red',
        });
      }

      // Add revenue change feedback
      if (changes.revenue !== undefined && changes.revenue !== 0) {
        newFeedback.revenue.push({
          id: `revenue-${Date.now()}`,
          value: changes.revenue,
          color: 'blue',
        });
      }

      // Add reputation change feedback
      if (changes.reputation !== undefined && changes.reputation !== 0) {
        newFeedback.reputation.push({
          id: `reputation-${Date.now()}`,
          value: changes.reputation,
          color: changes.reputation > 0 ? 'yellow' : 'red',
        });
      }

      // Add expense change feedback
      if (changes.expenses !== undefined && changes.expenses !== 0) {
        newFeedback.expenses.push({
          id: `expenses-${Date.now()}`,
          value: changes.expenses,
          color: 'red',
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
      key: 'revenue',
      icon: '💎',
      image: '/images/icons/home.png',
      value: weeklyRevenue.toLocaleString(),
      label: 'Revenue',
      color: 'text-blue-400',
      feedback: feedbackByMetric.revenue,
    },
    {
      key: 'reputation',
      icon: '💎',
      image: '/images/icons/marketing.png',
      value: metrics.reputation.toLocaleString(),
      label: 'Reputation',
      color: 'text-yellow-400',
      feedback: feedbackByMetric.reputation,
    },
    {
      key: 'expenses',
      icon: '💎',
      image: '/images/icons/staff.png',
      value: weeklyExpenses.toLocaleString(),
      label: 'Weekly Expenses',
      color: 'text-red-400',
      feedback: feedbackByMetric.expenses,
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-y-1 md:gap-y-2 gap-x-2 md:gap-x-4">
      {metricsData.map((metric, index) => (
        <div key={index} className="flex items-center bg-black/65 py-0.5 md:py-0.5 px-0.5 md:px-1 rounded relative w-full">
          {/* Icon positioned outside from the left */}
          <div className="absolute -left-2 md:-left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-6 md:h-6 rounded-full flex items-center justify-center z-10 overflow-hidden">
            {metric.image ? (
              <Image 
                src={metric.image} 
                alt={metric.label}
                width={24} // Assuming a default size that scales, or adjust based on actual design
                height={24} // Assuming a default size that scales, or adjust based on actual design
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-xs md:text-sm transform rotate-5">{metric.icon}</span>
            )}
          </div>

          <div className="flex flex-col min-w-0 flex-1 pl-1.5 md:pl-2">
            <span className={`text-stroke text-stroke-thin text-[8px] md:text-[10px] font-bold ${metric.color} truncate`}>
              {metric.label}
            </span>
            <span className="text-stroke text-stroke-thin text-white text-[9px] md:text-[11px] font-bold truncate">
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


