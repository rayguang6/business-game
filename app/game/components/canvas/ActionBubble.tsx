'use client';

import React, { useEffect, useState } from 'react';
import { ActionNotification } from '@/lib/store/slices/actionNotificationsSlice';

// 32x32px tile system configuration
const TILE_SIZE = 32;

interface ActionBubbleProps {
  notification: ActionNotification;
  index: number; // For stacking multiple bubbles
  scaleFactor: number;
  characterX: number; // Character's X position in grid coordinates
  characterY: number; // Character's Y position in grid coordinates
}

export function ActionBubble({ notification, index, scaleFactor, characterX, characterY }: ActionBubbleProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [age, setAge] = useState(0);

  useEffect(() => {
    const startTime = Date.now();

    const timer = setInterval(() => {
      const currentAge = Date.now() - startTime;
      setAge(currentAge);

      // Hide the bubble after duration (opacity will go to 0)
      if (currentAge >= notification.duration) {
        setIsVisible(false);
        clearInterval(timer);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [notification.duration]);

  // Keep full opacity until hidden
  const opacity = isVisible ? 1 : 0;

  // Position above character's head with tighter vertical stacking (allowing some overlap)
  const absoluteLeft = characterX * TILE_SIZE + TILE_SIZE / 2;
  const absoluteTop = characterY * TILE_SIZE - 40 - (index * 16 * scaleFactor); // Higher base position, 16px gap

  const getIcon = () => {
    return ''; // Remove emoji icons
  };

  const getColorClass = () => {
    switch (notification.type) {
      case 'upgrade':
        return 'bg-blue-500/60 text-white border-blue-500'; // More visible blue background, white text, blue border
      case 'marketing':
        return 'bg-green-500/60 text-white border-green-500'; // More visible green background, white text, green border
      default:
        return 'bg-gray-500/60 text-white border-gray-500'; // More visible gray background, white text, gray border
    }
  };

  return (
    <div
      className={`
        absolute pointer-events-none
        transition-all duration-300 ease-out
        ${getColorClass()}
      `}
      style={{
        zIndex: 100 + index, // Higher index = newer bubble = higher z-index
        opacity,
        transform: `translateX(-50%) scale(${Math.min(scaleFactor * 0.6, 0.6)})`, // Small scale
        left: `${absoluteLeft}px`,
        top: `${absoluteTop}px`,
        transformOrigin: 'center bottom',
      }}
    >
      <div className="flex items-start px-2 py-1.5 rounded-md border max-w-56">
        <span className="text-body font-medium leading-tight break-words" style={{
          textShadow: '0 0 3px rgba(0, 0, 0, 1), 0 1px 2px rgba(0, 0, 0, 0.9), 0 -1px 2px rgba(0, 0, 0, 0.9)'
        }}>
          {notification.title}
        </span>
      </div>
    </div>
  );
}