'use client';

import React from 'react';
import { Lead, LeadStatus } from '@/lib/features/leads';
import { Character2D } from './Character2D';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import { IndustryId } from '@/lib/game/types';
import { useGameStore } from '@/lib/store/gameStore';
import { Character2DProps } from './Character2D';

interface SpriteLeadProps {
  lead: Lead;
  scaleFactor: number;
}

export function SpriteLead({ lead, scaleFactor }: SpriteLeadProps) {
  const selectedIndustry = useGameStore((state) => state.selectedIndustry);
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;

  // Use actual position for rendering (not rounded to grid)
  const renderX = lead.x;
  const renderY = lead.y;
  
  // Determine animation state based on lead status
  const getAnimationState = (): { isWalking: boolean; isCelebrating: boolean; direction: Character2DProps['direction'] } => {
    const facingDirection: Character2DProps['direction'] = lead.facingDirection ?? 'down';

    switch (lead.status) {
      case LeadStatus.Spawning:
        return { isWalking: false, isCelebrating: false, direction: facingDirection };

      case LeadStatus.Walking:
      case LeadStatus.Leaving:
        return { isWalking: true, isCelebrating: false, direction: facingDirection };

      case LeadStatus.Idle:
        return { isWalking: false, isCelebrating: false, direction: facingDirection };

      default:
        return { isWalking: false, isCelebrating: false, direction: facingDirection };
    }
  };

  const { isWalking, isCelebrating, direction } = getAnimationState();

  // Use a different sprite to distinguish leads from customers
  // For now, use customer sprite but we can add lead-specific sprites later
  const leadIdNumber = parseInt(lead.id, 36); // Convert base-36 string to number
  const leadSpriteId = (leadIdNumber % 10) + 1; // This will give a number from 1 to 10
  const spriteSheetPath = `/images/customer/customer${leadSpriteId}.png`;

  // Round for UI positioning
  const gridX = Math.floor(lead.x);
  const gridY = Math.floor(lead.y);

  // Calculate blink effect (rapid blinking when disappearing)
  const isBlinking = lead.fadeTicks !== undefined && lead.fadeTicks > 0;
  const blinkOpacity = isBlinking
    ? (Math.floor(lead.fadeTicks! / 6) % 2 === 0 ? 0.3 : 1.0) // Blink every 6 ticks (0.2 seconds)
    : 1;

  return (
    <div
      className="relative"
      style={{
        opacity: blinkOpacity,
        transition: 'none' // No transition for blinking effect
      }}
    >
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

      {/* Dialogue UI - positioned above the sprite */}
      {lead.dialogue && lead.dialogueTicks !== undefined && lead.dialogueTicks > 0 && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${gridX * 32 + 16}px`, // Center horizontally on sprite
            top: `${gridY * 32 - 20}px`, // Position closer above sprite
            transform: 'translateX(-50%)', // Center the dialogue box
            zIndex: 11, // Above everything
            opacity: blinkOpacity, // Blink dialogue too
          }}
        >
          {/* Smaller, cleaner speech bubble */}
          <div
            className="bg-white rounded-lg shadow-md border border-gray-300 px-1.5 py-0.5 max-w-[90px]"
            style={{
              fontSize: '9px',
              lineHeight: '11px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: '#2d3748',
              fontWeight: '400',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            {lead.dialogue}
          </div>
          {/* Smaller speech bubble tail/pointer */}
          <div
            className="absolute left-1/2 top-full -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid #ffffff',
              filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))',
            }}
          />
        </div>
      )}
    </div>
  );
}

