'use client';

import React, { useState } from 'react';
import { Staff } from '@/lib/features/staff';
import { MainCharacter, isMainCharacter } from '@/lib/features/mainCharacter';
import { GridPosition } from '@/lib/game/types';
import { Character2D, Character2DProps } from './Character2D';

interface SpriteStaffProps {
  staff: Staff | MainCharacter;
  position: GridPosition; // Fallback position for staff without dynamic positions
  scaleFactor: number;
}

/**
 * Sprite component for rendering staff members on the canvas
 *
 * ============================================================================
 * CURRENT IMPLEMENTATION STATUS:
 * ============================================================================
 * - Staff are displayed as animated sprites (16-frame sprite sheets)
 * - Sprite selection: database spriteImage → default staff1.png fallback
 * - Staff use dynamic positions (staff.x, staff.y) when available
 * - Staff animations based on status: idle, walking_to_room, serving, walking_to_idle
 * - Random idle animations only when staff.status is 'idle'
 *
 * ============================================================================
 * SPRITE SYSTEM:
 * ============================================================================
 * - Database-driven: Staff roles can specify custom spriteImage paths
 * - Default fallback: /images/staff/staff1.png (guaranteed to exist)
 * - Animation format: 16 frames horizontally (same as customer sprites)
 *   * Frames 0-2:   down (idle/walking)
 *   * Frames 3-5:   left
 *   * Frames 6-8:   up
 *   * Frames 9-11:  right
 *   * Frames 12-15: celebrating
 *
 * ============================================================================
 * INTEGRATION NOTES:
 * ============================================================================
 * - Staff data comes from: useGameStore().hiredStaff
 * - Dynamic positions: staff.x, staff.y (when staff is moving/assigned)
 * - Fallback positions: layout config staffPositions (for idle staff)
 * - Sprite paths configured in Supabase admin (staff_roles.sprite_image)
 * - Default sprite: /images/staff/staff1.png
 *
 * ============================================================================
 */

// ============================================================================
// STAFF ANIMATION CONFIG (for idle animations only)
// ============================================================================
const STAFF_ANIMATION_CONFIG = {
  // Celebrate animation happens randomly every X to Y seconds (only when idle)
  celebrateIntervalMin: 5000, // 5 seconds
  celebrateIntervalMax: 15000, // 15 seconds
  celebrateDuration: 2000, // Celebrate for 2 seconds
  
  // Idle walking happens randomly (staff fidgets in place)
  idleWalkChance: 0.3, // 30% chance when not celebrating
  idleWalkIntervalMin: 3000, // 3 seconds
  idleWalkIntervalMax: 8000, // 8 seconds
  idleWalkDuration: 1500, // Walk in place for 1.5 seconds
  
  // Directions staff can face
  directions: ['down', 'left', 'right', 'up'] as const,
} as const;

export function SpriteStaff({ staff, position, scaleFactor }: SpriteStaffProps) {
  const TILE_SIZE = 32;
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [direction, setDirection] = useState<'down' | 'left' | 'up' | 'right'>('down');
  
  // Use dynamic position if available, otherwise use fallback position
  const hasDynamicPosition = staff.x !== undefined && staff.y !== undefined;
  const renderX = hasDynamicPosition ? (staff.x ?? 0) : position.x;
  const renderY = hasDynamicPosition ? (staff.y ?? 0) : position.y;

  // ============================================================================
  // SPRITE SELECTION LOGIC
  // ============================================================================
  // Priority order:
  // 1. staff.spriteImage from database (custom sprite)
  // 2. Default staff sprite: /images/staff/staff1.png (fallback)
  //

  let spriteSheetPath: string;

  if (staff.spriteImage && staff.spriteImage.trim()) {
    // Use sprite image from database (staff role config) - PRIMARY METHOD
    spriteSheetPath = staff.spriteImage;
  } else {
    // Safety fallback: Default staff sprite
    spriteSheetPath = '/images/staff/staff1.png';
  }

  // ============================================================================
  // ANIMATION STATE BASED ON STAFF STATUS
  // ============================================================================
  // Determine animation state from staff status and facing direction
  const getAnimationState = (): { isWalking: boolean; isCelebrating: boolean; direction: Character2DProps['direction'] } => {
    const staffStatus = staff.status || 'idle';
    const facingDirection: Character2DProps['direction'] = staff.facingDirection || 'down';
    
    // If staff has a status that indicates movement, use that
    switch (staffStatus) {
      case 'walking_to_room':
      case 'walking_to_idle':
        return { isWalking: true, isCelebrating: false, direction: facingDirection };
      
      case 'serving':
        return { isWalking: false, isCelebrating: false, direction: facingDirection };
      
      case 'idle':
      default:
        // For idle staff, we'll use random animations (handled by useEffect below)
        return { isWalking: false, isCelebrating: false, direction: facingDirection };
    }
  };

  // Get base animation state from status
  const baseAnimationState = getAnimationState();
  const isIdle = (staff.status || 'idle') === 'idle';
  
  // ============================================================================
  // RANDOM IDLE ANIMATIONS (only when staff is idle)
  // ============================================================================
  // Random animations: celebrate occasionally, sometimes walk in place
  // Only active when staff.status === 'idle'
  React.useEffect(() => {
    // Only run random animations when staff is idle
    if (!isIdle) {
      setIsCelebrating(false);
      setIsWalking(false);
      return;
    }
    
    // Use staff ID to create unique seed for consistent but varied timing
    const staffSeed = parseInt(staff.id, 36) || 0;
    const randomOffset = (staffSeed % 5000); // Offset 0-5 seconds per staff
    
    // Celebrate animation - happens randomly
    const scheduleCelebrate = () => {
      const delay = STAFF_ANIMATION_CONFIG.celebrateIntervalMin + 
                    (Math.random() * (STAFF_ANIMATION_CONFIG.celebrateIntervalMax - STAFF_ANIMATION_CONFIG.celebrateIntervalMin)) +
                    randomOffset;
      
      const timer = setTimeout(() => {
        // Only celebrate if still idle
        if ((staff.status || 'idle') === 'idle') {
          setIsCelebrating(true);
          
          // Change direction when celebrating (facing different way)
          const randomDir = STAFF_ANIMATION_CONFIG.directions[
            Math.floor(Math.random() * STAFF_ANIMATION_CONFIG.directions.length)
          ];
          setDirection(randomDir);
          
          // Stop celebrating after duration
          setTimeout(() => {
            setIsCelebrating(false);
            scheduleCelebrate(); // Schedule next celebration
          }, STAFF_ANIMATION_CONFIG.celebrateDuration);
        }
      }, delay);
      
      return timer;
    };
    
    // Idle walk animation - happens randomly when not celebrating
    const scheduleIdleWalk = () => {
      // Check if still idle
      if ((staff.status || 'idle') !== 'idle') {
        return;
      }
      
      if (isCelebrating) {
        // Don't walk while celebrating
        return setTimeout(scheduleIdleWalk, 1000);
      }
      
      if (Math.random() < STAFF_ANIMATION_CONFIG.idleWalkChance) {
        const delay = STAFF_ANIMATION_CONFIG.idleWalkIntervalMin + 
                      (Math.random() * (STAFF_ANIMATION_CONFIG.idleWalkIntervalMax - STAFF_ANIMATION_CONFIG.idleWalkIntervalMin));
        
        const timer = setTimeout(() => {
          // Only walk if still idle
          if ((staff.status || 'idle') === 'idle') {
            setIsWalking(true);
            
            // Random direction for idle walk
            const randomDir = STAFF_ANIMATION_CONFIG.directions[
              Math.floor(Math.random() * STAFF_ANIMATION_CONFIG.directions.length)
            ];
            setDirection(randomDir);
            
            // Stop walking after duration
            setTimeout(() => {
              setIsWalking(false);
              setDirection('down'); // Return to default direction
              scheduleIdleWalk(); // Schedule next idle walk
            }, STAFF_ANIMATION_CONFIG.idleWalkDuration);
          }
        }, delay);
        
        return timer;
      } else {
        // No walk this time, try again soon
        return setTimeout(scheduleIdleWalk, 2000);
      }
    };
    
    // Start both animation cycles
    const celebrateTimer = scheduleCelebrate();
    const walkTimer = setTimeout(scheduleIdleWalk, 2000 + randomOffset);
    
    return () => {
      clearTimeout(celebrateTimer);
      clearTimeout(walkTimer);
    };
  }, [staff.id, staff.status, isCelebrating, isIdle]);
  
  // Update direction when staff.facingDirection changes (for non-idle states)
  React.useEffect(() => {
    if (!isIdle && staff.facingDirection) {
      setDirection(staff.facingDirection);
    }
  }, [staff.facingDirection, isIdle]);
  
  // Determine final animation state
  const finalIsWalking = isIdle ? isWalking : baseAnimationState.isWalking;
  const finalIsCelebrating = isIdle ? isCelebrating : false;
  const finalDirection = isIdle ? direction : baseAnimationState.direction;

  // Check if this is the main character
  const isMainChar = isMainCharacter(staff);

  return (
    <div className="relative">
      {/* ====================================================================
          MAIN CHARACTER USERNAME DISPLAY
          ====================================================================
          Show username above main character sprite to identify it
          */}
      {isMainChar && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${renderX * TILE_SIZE + TILE_SIZE / 2}px`,
            top: `${renderY * TILE_SIZE - 15}px`,
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            zIndex: 12, // Above everything
          }}
        >
          <div
            className="text-black-500 rounded px-2 py-0.5 text-xs font-semibold"
            style={{
              fontSize: '6px',
              lineHeight: '12px',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            }}
          >
            {staff.name}
          </div>
        </div>
      )}

      {/* ====================================================================
          STAFF SPRITE RENDERING
          ====================================================================
          Uses Character2D component for animated sprites with database-driven sprites
          and default fallback. Staff positions are dynamic when moving/serving.
          Character2D handles its own positioning (like SpriteCustomer), so we don't
          wrap it in a positioned container.
          */}
      <Character2D
        x={renderX}
        y={renderY}
        spriteSheet={spriteSheetPath}
        direction={finalDirection}
        scaleFactor={scaleFactor}
        isWalking={finalIsWalking}
        isCelebrating={finalIsCelebrating}
      />
    </div>
  );
}
