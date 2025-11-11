'use client';

import React, { useState, useEffect } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useMetricChanges } from '@/hooks/useMetricChanges';
import { MetricFeedback, FeedbackItem } from './MetricFeedback';
import Image from 'next/image';

export function KeyMetrics() {
  const { metrics, monthlyRevenue, monthlyExpenses } = useFinanceData();
  const changes = useMetricChanges();
  const [feedbackByMetric, setFeedbackByMetric] = useState<Record<string, FeedbackItem[]>>({
    cash: [],
    revenue: [],
    reputation: [],
    expenses: [],
    founderWorkingHours: [],
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
        founderWorkingHours: [...prev.founderWorkingHours],
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

      // Add founder hours required change feedback
      if (changes.founderWorkingHours !== undefined && changes.founderWorkingHours !== 0) {
        newFeedback.founderWorkingHours.push({
          id: `founderWorkingHours-${Date.now()}`,
          value: changes.founderWorkingHours,
          color: changes.founderWorkingHours < 0 ? 'green' : 'red', // Green when reduced, red when increased
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
      value: monthlyRevenue.toLocaleString(),
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
      value: monthlyExpenses.toLocaleString(),
      label: 'Monthly Expenses',
      color: 'text-red-400',
      feedback: feedbackByMetric.expenses,
    },
    {
      key: 'founderWorkingHours',
      icon: '⏰',
      image: '/images/icons/upgrades.png',
      value: `${metrics.founderWorkingHours}h`,
      label: 'Founder Workload',
      color: 'text-purple-400',
      feedback: feedbackByMetric.founderWorkingHours,
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-y-1 md:gap-y-1 gap-x-3 md:gap-x-3">
      {metricsData.map((metric, index) => (
        <div 
          key={index} 
          className="flex items-center bg-black/65 py-1 px-1 md:px-1.5 rounded relative w-full min-w-0"
        >
          {/* Icon positioned outside from the left */}
          <div className="absolute -left-2 md:-left-2 top-1/2 transform -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center z-10 overflow-hidden">
            {metric.image ? (
              <Image 
                src={metric.image} 
                alt={metric.label}
                width={20}
                height={20}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="text-white text-xs md:text-sm">{metric.icon}</span>
            )}
          </div>

          <div className="flex flex-col min-w-0 flex-1 pl-1.5 md:pl-2">
            <span 
              className={`text-[10px] md:text-xs font-semibold ${metric.color} truncate leading-tight`}
              style={{
                textShadow: '0 0 2px rgba(0, 0, 0, 0.95), 0 1px 1px rgba(0, 0, 0, 0.8), 0 -1px 1px rgba(0, 0, 0, 0.8)'
              }}
            >
              {metric.label}
            </span>
            <span 
              className="text-white text-[11px] md:text-sm font-bold truncate leading-tight"
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


