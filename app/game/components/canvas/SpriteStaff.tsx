'use client';

import React, { useState, useEffect } from 'react';
import { Staff } from '@/lib/features/staff';
import { MainCharacter, isMainCharacter } from '@/lib/features/mainCharacter';
import { GridPosition } from '@/lib/game/types';
import { Character2D, Character2DProps } from './Character2D';
import { ActionBubble } from './ActionBubble';
import { useGameStore } from '@/lib/store/gameStore';

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
 * - Simple idle animations: occasional direction changes with brief walk animations
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
  // Continuous idle animation - always animating
  walkDuration: 800, // Walk for 0.8 seconds
  celebrateDuration: 1200, // Celebrate for 1.2 seconds
  
  // Walk directions (can walk left/right, but when stopped face down)
  walkDirections: ['down', 'left', 'right'] as const,
  
  // Chance to celebrate vs walk
  celebrateChance: 0.25, // 25% chance to celebrate, 75% to walk
} as const;

export function SpriteStaff({ staff, position, scaleFactor }: SpriteStaffProps) {
  const TILE_SIZE = 32;
  const [isWalking, setIsWalking] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [direction, setDirection] = useState<'down' | 'left' | 'up' | 'right'>('down');

  // Action notifications for main character only
  const notifications = useGameStore((state) =>
    isMainCharacter(staff) ? state.notifications : []
  );
  const clearExpiredNotifications = useGameStore((state) => state.clearExpiredNotifications);

  // Clear expired notifications periodically
  useEffect(() => {
    if (isMainCharacter(staff)) {
      const interval = setInterval(() => {
        clearExpiredNotifications();
      }, 100); // Check every 100ms

      return () => clearInterval(interval);
    }
  }, [staff, clearExpiredNotifications]);

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
  const getAnimationState = (): { isWalking: boolean; direction: Character2DProps['direction'] } => {
    const staffStatus = staff.status || 'idle';
    const facingDirection: Character2DProps['direction'] = staff.facingDirection || 'down';
    
    // If staff has a status that indicates movement, use that
    switch (staffStatus) {
      case 'walking_to_room':
      case 'walking_to_idle':
        return { isWalking: true, direction: facingDirection };
      
      case 'serving':
        return { isWalking: false, direction: facingDirection };
      
      case 'idle':
      default:
        // For idle staff, we'll use simple random animations (handled by useEffect below)
        return { isWalking: false, direction: facingDirection };
    }
  };

  // Get base animation state from status
  const baseAnimationState = getAnimationState();
  const isIdle = (staff.status || 'idle') === 'idle';
  
  // ============================================================================
  // CONTINUOUS IDLE ANIMATIONS (only when staff is idle)
  // ============================================================================
  // Continuous animation - always walking or celebrating to avoid static appearance
  // Staff can walk down, left, right, or celebrate
  // When stopped (between animations), always face down (not left/right)
  React.useEffect(() => {
    // Only run animations when staff is idle
    if (!isIdle) {
      setIsWalking(false);
      setIsCelebrating(false);
      return;
    }
    
    let animationTimeoutId: NodeJS.Timeout | null = null;
    let isCancelled = false;
    
    const startNextAnimation = () => {
      // Clear any existing timeout
      if (animationTimeoutId) {
        clearTimeout(animationTimeoutId);
        animationTimeoutId = null;
      }
      
      // Don't animate if cancelled
      if (isCancelled) {
        return;
      }
      
      // Check if still idle
      if ((staff.status || 'idle') !== 'idle') {
        return;
      }
      
      // Decide: celebrate or walk
      const shouldCelebrate = Math.random() < STAFF_ANIMATION_CONFIG.celebrateChance;
      
      if (shouldCelebrate) {
        // Celebrate animation
        setIsCelebrating(true);
        setIsWalking(false);
        // Keep current direction for celebrate (or set to down if needed)
        setDirection('down');
        
        // After celebrate duration, start next animation immediately
        animationTimeoutId = setTimeout(() => {
          if (!isCancelled) {
            setIsCelebrating(false);
            startNextAnimation(); // Immediately start next animation
          }
        }, STAFF_ANIMATION_CONFIG.celebrateDuration);
      } else {
        // Walk animation - choose a random walk direction
        const walkDir = STAFF_ANIMATION_CONFIG.walkDirections[
          Math.floor(Math.random() * STAFF_ANIMATION_CONFIG.walkDirections.length)
        ];
        setDirection(walkDir);
        setIsWalking(true);
        setIsCelebrating(false);
        
        // After walk duration, face down and immediately start next animation
        animationTimeoutId = setTimeout(() => {
          if (!isCancelled) {
            setIsWalking(false);
            setDirection('down'); // Face down when stopped
            // Immediately start next animation (no delay)
            startNextAnimation();
          }
        }, STAFF_ANIMATION_CONFIG.walkDuration);
      }
    };
    
    // Start the continuous animation cycle immediately
    startNextAnimation();
    
    // Cleanup function
    return () => {
      isCancelled = true;
      if (animationTimeoutId) {
        clearTimeout(animationTimeoutId);
      }
    };
  }, [staff.id, staff.status, isIdle]);
  
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
          ACTION BUBBLES FOR MAIN CHARACTER
          ====================================================================
          Show action notifications as bubbles above the main character's head
          */}
      {isMainChar && notifications.map((notification, index) => (
        <ActionBubble
          key={notification.id}
          notification={notification}
          index={index}
          scaleFactor={scaleFactor}
          characterX={renderX}
          characterY={renderY}
        />
      ))}

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
