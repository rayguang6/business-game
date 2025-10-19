'use client';

import React from 'react';
import { Customer, CustomerStatus } from '@/lib/features/customers';
import { Character2D } from './Character2D';
import {
  DEFAULT_INDUSTRY_ID,
  getTicksPerSecondForIndustry,
  ticksToSeconds,
} from '@/lib/game/config';
import { IndustryId } from '@/lib/game/types';
import { useGameStore } from '@/lib/store/gameStore';
import { Character2DProps } from './Character2D';

interface SpriteCustomerProps {
  customer: Customer;
  scaleFactor: number;
}

export function SpriteCustomer({ customer, scaleFactor }: SpriteCustomerProps) {
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  const ticksPerSecond = getTicksPerSecondForIndustry(industryId);

  // Use actual position for rendering (not rounded to grid)
  const renderX = customer.x;
  const renderY = customer.y;
  
  // Round for UI positioning
  const gridX = Math.floor(customer.x);
  const gridY = Math.floor(customer.y);
  
  // Determine animation state based on customer status
  const getAnimationState = (): { isWalking: boolean; isCelebrating: boolean; direction: Character2DProps['direction'] } => {
    const facingDirection: Character2DProps['direction'] = customer.facingDirection ?? 'down';

    switch (customer.status) {
      case CustomerStatus.Spawning:
        return { isWalking: false, isCelebrating: false, direction: facingDirection };

      case CustomerStatus.WalkingToChair:
      case CustomerStatus.WalkingToRoom:
        return { isWalking: true, isCelebrating: false, direction: facingDirection };

      case CustomerStatus.LeavingAngry:
        return { isWalking: true, isCelebrating: false, direction: facingDirection };

      case CustomerStatus.WalkingOutHappy:
        return { isWalking: false, isCelebrating: true, direction: facingDirection };

      case CustomerStatus.Waiting:
        return { isWalking: false, isCelebrating: false, direction: 'right' };
      case CustomerStatus.InService:
        return { isWalking: false, isCelebrating: false, direction: 'down' };
      default:
        return { isWalking: false, isCelebrating: false, direction: facingDirection };
    }
  };

  const { isWalking, isCelebrating, direction } = getAnimationState();

  const customerIdNumber = parseInt(customer.id, 36); // Convert base-36 string to number
  const customerSpriteId = (customerIdNumber % 10) + 1; // This will give a number from 1 to 10
  const spriteSheetPath = `/images/customer/customer${customerSpriteId}.png`;

  // Get emoji based on status
  const getEmoji = () => {
    switch (customer.status) {
      case CustomerStatus.Waiting:
        return customer.patienceLeft < customer.maxPatience * 0.3 ? '😠' : '😊';
      case CustomerStatus.InService:
        return '😌';
      case CustomerStatus.WalkingOutHappy:
        return '😄';
      case CustomerStatus.LeavingAngry:
        return '😡';
      default:
        return '😊';
    }
  };

  // Calculate progress percentage
  const getProgress = () => {
    if (customer.status === CustomerStatus.Waiting) {
      return (customer.patienceLeft / customer.maxPatience) * 100;
    }
    if (customer.status === CustomerStatus.InService) {
      const totalServiceTicks = customer.service.duration * ticksPerSecond;
      if (totalServiceTicks <= 0) {
        return 0;
      }
      const elapsedTicks = totalServiceTicks - customer.serviceTimeLeft;
      return Math.max(0, Math.min(100, (elapsedTicks / totalServiceTicks) * 100));
    }
    return 0;
  };

  // Get time display
  const getTimeDisplay = () => {
    if (customer.status === CustomerStatus.Waiting) {
      return `${ticksToSeconds(customer.patienceLeft, industryId)}s`;
    }
    if (customer.status === CustomerStatus.InService) {
      return `${ticksToSeconds(customer.serviceTimeLeft, industryId)}s`;
    }
    return '';
  };

  const progress = getProgress();
  const emoji = getEmoji();
  const timeDisplay = getTimeDisplay();

  // Get progress bar color based on status
  const getProgressColor = () => {
    if (customer.status === CustomerStatus.Waiting) {
      if (progress > 60) return '#10b981'; // green
      if (progress > 30) return '#f59e0b'; // orange
      return '#ef4444'; // red
    }
    return '#3b82f6'; // blue for service
  };

  return (
    <div className="relative">
      {/* Character Sprite */}
      <Character2D
        x={renderX}
        y={renderY}
        spriteSheet={spriteSheetPath}
        direction={direction}
        scaleFactor={scaleFactor}
        isWalking={isWalking}
        isCelebrating={isCelebrating}
      />

      {/* Info UI - positioned above the sprite */}
      {customer.status === CustomerStatus.Waiting && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${gridX * 32}px`,
            top: `${gridY * 32 - 24}px`,
            width: '32px',
            transform: 'translateX(0)',
          }}
        >
          {/* Emoji */}
          <div
            className="text-center mb-0.5"
            style={{
              fontSize: '12px',
              lineHeight: '12px',
            }}
          >
            {emoji}
          </div>

          {/* Progress Bar */}
          <div
            className="bg-gray-700 rounded-full overflow-hidden mb-0.5"
            style={{
              height: '3px',
              width: '100%',
            }}
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                backgroundColor: getProgressColor(),
              }}
            />
          </div>

          {/* Time Display */}
          <div
            className="text-center text-white font-bold"
            style={{
              fontSize: '8px',
              lineHeight: '8px',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            }}
          >
            {timeDisplay}
          </div>
        </div>
      )}

      {/* Service Details UI - for customers in service */}
      {customer.status === CustomerStatus.InService && (
        <div
          className="absolute pointer-events-none bg-black/80 text-white rounded px-1 py-0.5"
          style={{
            left: `${gridX * 32}px`,
            top: `${gridY * 32 - 40}px`,
            minWidth: '60px',
            transform: 'translateX(-14px)', // Center above sprite
            fontSize: '7px',
            lineHeight: '9px',
          }}
        >
          {/* Service Name */}
          <div className="font-bold text-yellow-300 truncate">
            {customer.service.name}
          </div>
          
          {/* Price */}
          <div className="text-green-400">
            ${customer.service.price}
          </div>
          
          {/* Progress Bar */}
          <div
            className="bg-gray-700 rounded-full overflow-hidden my-0.5"
            style={{
              height: '3px',
              width: '100%',
            }}
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                backgroundColor: getProgressColor(),
              }}
            />
          </div>
          
          {/* Time & Emoji */}
          <div className="flex justify-between items-center">
            <span className="text-white">{timeDisplay}</span>
            <span style={{ fontSize: '10px' }}>{emoji}</span>
          </div>
        </div>
      )}
    </div>
  );
}
