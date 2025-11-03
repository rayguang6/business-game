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
 * - Positions come from: getStaffPositions(industryId) in positioning.ts
 * - Staff positions are configured in: lib/game/industryConfigs.ts (DEFAULT_LAYOUT.staffPositions)
 * - Staff emoji is stored in: Staff.emoji (from database staff_roles table)
 * 
 * ============================================================================
 */
const USE_SPRITE_SHEETS = false; // TODO: Set to true when sprite images are ready

export function SpriteStaff({ staff, position, scaleFactor }: SpriteStaffProps) {
  const TILE_SIZE = 32;
  const [spriteError, setSpriteError] = useState(false);
  
  // Convert grid position to pixel coordinates
  // Grid coordinates (0-9) are multiplied by TILE_SIZE (32px) to get pixel positions
  const pixelX = position.x * TILE_SIZE;
  const pixelY = position.y * TILE_SIZE;

  // ============================================================================
  // SPRITE SELECTION LOGIC
  // ============================================================================
  // Current: Uses staff ID to pick a random sprite (1-10) for variety
  // 
  // ALTERNATIVE OPTIONS (for future):
  // 1. Role-based: `/images/staff/${staff.roleId}.png` (e.g., 'doctor.png', 'nurse.png')
  // 2. Direct mapping: Create a map of roleId -> sprite file
  // 3. Staff-specific: Use staff.id directly if you have custom sprites per staff
  // 
  const staffIdNumber = parseInt(staff.id, 36) || 0;
  const staffSpriteId = (staffIdNumber % 10) + 1; // Number from 1 to 10
  const spriteSheetPath = `/images/staff/staff${staffSpriteId}.png`;

  // Determine rendering mode: sprite sheets vs emoji fallback
  const useSprite = USE_SPRITE_SHEETS && !spriteError;

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
          x={0} // TODO: Make dynamic when staff can move (like customers)
          y={0} // TODO: Make dynamic when staff can move
          spriteSheet={spriteSheetPath}
          direction="down" // TODO: Update based on staff movement direction
          scaleFactor={scaleFactor}
          isWalking={false} // TODO: Set to true when staff are moving
          isCelebrating={false} // TODO: Could use for "working" or "happy" states
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

