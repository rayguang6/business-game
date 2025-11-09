'use client';

import React, { useState } from 'react';
import { Staff } from '@/lib/features/staff';
import { GridPosition } from '@/lib/game/types';
import { Character2D } from './Character2D';

interface SpriteStaffProps {
  staff: Staff;
  position: GridPosition;
  scaleFactor: number;
}

/**
 * Sprite component for rendering staff members on the canvas
 * 
 * ============================================================================
 * CURRENT IMPLEMENTATION STATUS:
 * ============================================================================
 * - Currently displays staff as emoji (reads from staff.emoji in database)
 * - Staff appear at fixed positions defined in layout config (staffPositions)
 * - Staff are static (no movement/animation)
 * 
 * ============================================================================
 * HOW TO SWITCH TO SPRITE SHEETS:
 * ============================================================================
 * 
 * STEP 1: Prepare sprite images
 *   - Create sprite sheets in /public/images/staff/
 *   - Filenames: staff1.png, staff2.png, ... staff10.png
 *   - Format: Same as customer sprites (see /public/images/customer/customer1.png)
 *     * 16 frames horizontally arranged
 *     * Each frame: 32x32 pixels
 *     * Frame layout:
 *       - Frames 0-2:   down (idle/walking)
 *       - Frames 3-5:   left
 *       - Frames 6-8:   up
 *       - Frames 9-11:  right
 *       - Frames 12-15: celebrating (optional)
 * 
 * STEP 2: Enable sprite sheets
 *   - Change line below: USE_SPRITE_SHEETS = true
 * 
 * STEP 3: Test
 *   - Staff should now render as animated sprites
 *   - If sprite fails to load, will fall back to emoji
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
 * 2. SPRITE SELECTION STRATEGY:
 *    - Option A: Use staff.roleId to pick role-specific sprites
 *      Example: `/images/staff/${staff.roleId}.png` (doctor.png, nurse.png)
 *    - Option B: Map roles to specific sprites
 *      Create a mapping: { 'doctor': 'staff1.png', 'nurse': 'staff2.png' }
 *    - Option C: Keep current ID-based selection (random variety)
 * 
 * 3. STAFF POSITIONS:
 *    - Currently: Fixed positions from layout.staffPositions
 *    - Future: Dynamic positions based on work assignments
 *    - Staff could stand at service rooms, walk between stations, etc.
 * 
 * 4. STAFF STATES:
 *    - Add StaffStatus enum (similar to CustomerStatus)
 *    - States: Idle, Walking, Working, OnBreak, etc.
 *    - Different animations based on state
 * 
 * 5. VISUAL FEEDBACK:
 *    - Show staff name/role on hover
 *    - Indicate which staff member is working on which customer
 *    - Show staff efficiency/productivity indicators
 * 
 * ============================================================================
 * INTEGRATION NOTES:
 * ============================================================================
 * - Staff data comes from: useGameStore().hiredStaff
 * - Positions come from: layout config via useConfigStore/getLayoutConfig
 * - Staff positions are configured in Supabase (fallback to defaults in config.ts)
 * - Staff emoji is stored in: Staff.emoji (from database staff_roles table)
 * 
 * ============================================================================
 */
const USE_SPRITE_SHEETS = true; // Enabled: Using sprite sheets for staff rendering

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
  const [spriteError, setSpriteError] = useState(false);
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
  // 1. staff.spriteImage from database (role-specific sprite)
  // 2. Calculated from staff ID (variety based on staff)
  // 3. Default fallback to staff1.png
  // 
  // ALTERNATIVE OPTIONS (for future):
  // 1. Role-based: `/images/staff/${staff.roleId}.png` (e.g., 'doctor.png', 'nurse.png')
  // 2. Direct mapping: Create a map of roleId -> sprite file
  // 3. Staff-specific: Use staff.id directly if you have custom sprites per staff
  // 
  let spriteSheetPath: string;
  
  if (staff.spriteImage && staff.spriteImage.trim()) {
    // Use sprite image from database (staff role config)
    spriteSheetPath = staff.spriteImage;
  } else {
    // Fallback: Use staff ID to pick a random sprite (1-10) for variety
    const staffIdNumber = parseInt(staff.id, 36) || 0;
    const staffSpriteId = (staffIdNumber % 10) + 1; // Number from 1 to 10
    spriteSheetPath = `/images/staff/staff${staffSpriteId}.png`;
    
    // For now, use staff1.png for all staff (since we only have staff1.png)
    // TODO: Remove this when you have more staff sprites
    spriteSheetPath = `/images/staff/staff1.png`;
  }

  // Determine rendering mode: sprite sheets vs emoji fallback
  const useSprite = USE_SPRITE_SHEETS && !spriteError;
  
  // ============================================================================
  // STAFF ANIMATION STATE MANAGEMENT
  // ============================================================================
  // Random animations: celebrate occasionally, sometimes walk in place
  // Each staff member has independent timing based on their ID for variety
  React.useEffect(() => {
    if (!useSprite) return;
    
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
  }, [useSprite, staff.id, isCelebrating]);
  
  // Debug: Log when sprite should be used (remove this later)
  React.useEffect(() => {
    if (USE_SPRITE_SHEETS && false) { // Disabled debug logging
      console.log(`[SpriteStaff] Rendering sprite for ${staff.name}:`, {
        spriteSheetPath,
        useSprite,
        spriteError,
        isCelebrating,
        isWalking,
        direction
      });
    }
  }, [staff.name, spriteSheetPath, useSprite, spriteError, isCelebrating, isWalking, direction]);

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
      {useSprite ? (
        // ====================================================================
        // SPRITE SHEET RENDERING MODE
        // ====================================================================
        // Uses Character2D component (same as customers) for animated sprites
        // 
        // TODO: When implementing staff movement:
        // - Add direction prop based on staff movement state
        // - Add isWalking prop when staff are moving between positions
        // - Add isCelebrating or isWorking for different animation states
        // - Track staff position dynamically (not just fixed position prop)
        //
        <Character2D
          x={0} // Staff stay in place (at their assigned position)
          y={0} // Staff stay in place
          spriteSheet={spriteSheetPath}
          direction={direction}
          scaleFactor={scaleFactor}
          isWalking={isWalking}
          isCelebrating={isCelebrating}
        />
      ) : (
        // ====================================================================
        // EMOJI FALLBACK MODE (CURRENT DEFAULT)
        // ====================================================================
        // Displays staff.emoji which is stored in the database (staff_roles table)
        // This is a simple visual representation until sprite sheets are ready
        //
        <div
          className="flex items-center justify-center w-full h-full"
          style={{
            fontSize: `${TILE_SIZE * 0.8}px`, // Slightly smaller than tile for padding
            lineHeight: 1,
            imageRendering: 'pixelated', // Keep emoji crisp (though may not work on all browsers)
          }}
        >
          {staff.emoji}
        </div>
      )}
    </div>
  );
}
