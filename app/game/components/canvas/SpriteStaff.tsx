'use client';

import React, { useState } from 'react';
import { Staff } from '@/lib/features/staff';
import { MainCharacter, isMainCharacter } from '@/lib/features/mainCharacter';
import { GridPosition } from '@/lib/game/types';
import { Character2D } from './Character2D';

interface SpriteStaffProps {
  staff: Staff | MainCharacter;
  position: GridPosition;
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
 * - Staff have random idle animations (walking, celebrating)
 * - Staff appear at fixed positions defined in layout config (staffPositions)
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
 * FUTURE ENHANCEMENTS (TODO):
 * ============================================================================
 *
 * 1. STAFF MOVEMENT/ANIMATION:
 *    - Add staff movement states (idle, walking to station, working, etc.)
 *    - Track staff position dynamically (like customers)
 *    - Add pathfinding for staff to walk to service rooms
 *    - Implement work animations at service stations
 *
 * 2. STAFF STATES:
 *    - Add StaffStatus enum (similar to CustomerStatus)
 *    - States: Idle, Walking, Working, OnBreak, etc.
 *    - Different animations based on state
 *
 * 3. VISUAL FEEDBACK:
 *    - Show staff name/role on hover
 *    - Indicate which staff member is working on which customer
 *    - Show staff efficiency/productivity indicators
 *
 * ============================================================================
 * INTEGRATION NOTES:
 * ============================================================================
 * - Staff data comes from: useGameStore().hiredStaff
 * - Positions come from: layout config via useConfigStore/getLayoutConfig
 * - Sprite paths configured in Supabase admin (staff_roles.sprite_image)
 * - Default sprite: /images/staff/staff1.png
 *
 * ============================================================================
 */

// ============================================================================
// STAFF ANIMATION CONFIG
// ============================================================================
// Simple config for staff animations - easy to tweak
const STAFF_ANIMATION_CONFIG = {
  // Celebrate animation happens randomly every X to Y seconds
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
  
  // Convert grid position to pixel coordinates
  // Grid coordinates (0-9) are multiplied by TILE_SIZE (32px) to get pixel positions
  const pixelX = position.x * TILE_SIZE;
  const pixelY = position.y * TILE_SIZE;

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
  // STAFF ANIMATION STATE MANAGEMENT
  // ============================================================================
  // Random animations: celebrate occasionally, sometimes walk in place
  // Each staff member has independent timing based on their ID for variety
  React.useEffect(() => {
    
    // Use staff ID to create unique seed for consistent but varied timing
    const staffSeed = parseInt(staff.id, 36) || 0;
    const randomOffset = (staffSeed % 5000); // Offset 0-5 seconds per staff
    
    // Celebrate animation - happens randomly
    const scheduleCelebrate = () => {
      const delay = STAFF_ANIMATION_CONFIG.celebrateIntervalMin + 
                    (Math.random() * (STAFF_ANIMATION_CONFIG.celebrateIntervalMax - STAFF_ANIMATION_CONFIG.celebrateIntervalMin)) +
                    randomOffset;
      
      const timer = setTimeout(() => {
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
      }, delay);
      
      return timer;
    };
    
    // Idle walk animation - happens randomly when not celebrating
    const scheduleIdleWalk = () => {
      if (isCelebrating) {
        // Don't walk while celebrating
        return setTimeout(scheduleIdleWalk, 1000);
      }
      
      if (Math.random() < STAFF_ANIMATION_CONFIG.idleWalkChance) {
        const delay = STAFF_ANIMATION_CONFIG.idleWalkIntervalMin + 
                      (Math.random() * (STAFF_ANIMATION_CONFIG.idleWalkIntervalMax - STAFF_ANIMATION_CONFIG.idleWalkIntervalMin));
        
        const timer = setTimeout(() => {
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
  }, [staff.id, isCelebrating]);

  // Check if this is the main character
  const isMainChar = isMainCharacter(staff);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${pixelX}px`,
        top: `${pixelY}px`,
        width: `${TILE_SIZE}px`,
        height: `${TILE_SIZE}px`,
        zIndex: 8, // Above beds (5) but below customers (10)
      }}
      title={`${staff.name} - ${staff.role}`}
    >
      {/* ====================================================================
          MAIN CHARACTER USERNAME DISPLAY
          ====================================================================
          Show username above main character sprite to identify it
          */}
      {isMainChar && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top: '-15px',
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
          and default fallback. No emoji fallback - all staff are sprites now!
          */}
      <Character2D
        x={0} // Staff stay in place (at their assigned position)
        y={0} // Staff stay in place
        spriteSheet={spriteSheetPath}
        direction={direction}
        scaleFactor={scaleFactor}
        isWalking={isWalking}
        isCelebrating={isCelebrating}
      />
    </div>
  );
}
