'use client';

import React, { useEffect, useState } from 'react';

export interface FeedbackItem {
  id: string;
  value: number;
  label?: string;
  color: 'green' | 'red' | 'yellow' | 'blue';
}

interface MetricFeedbackProps {
  feedback: FeedbackItem[];
  onComplete: (id: string) => void;
}

export function MetricFeedback({ feedback, onComplete }: MetricFeedbackProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {feedback.map((item) => (
        <FeedbackAnimation
          key={item.id}
          item={item}
          onComplete={() => onComplete(item.id)}
        />
      ))}
    </div>
  );
}

interface FeedbackAnimationProps {
  item: FeedbackItem;
  onComplete: () => void;
}

function FeedbackAnimation({ item, onComplete }: FeedbackAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Wait for fade out
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const colorClasses = {
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
  };

  const sign = item.value >= 0 ? '+' : '';
  const displayValue = item.label 
    ? `${sign}${Math.abs(item.value)} ${item.label}`
    : `${sign}${item.value}`;

  return (
    <div
      className={`
        absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
        text-sm md:text-sm font-bold
        ${colorClasses[item.color]}
        transition-all duration-1500 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
      `}
      style={{
        textShadow: '0 0 4px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.5)',
        animation: 'float-up 1.5s ease-out forwards',
      }}
    >
      {displayValue}
    </div>
  );
}

