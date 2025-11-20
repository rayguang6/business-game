/**
 * Leads Feature
 * Handles all lead-related types, config, and mechanics
 * Leads are visible NPCs that walk around and convert to customers
 */

import {
  DEFAULT_INDUSTRY_ID,
  getLayoutConfig,
  getGlobalMovementConfig,
  secondsToTicks,
} from '@/lib/game/config';
import { IndustryId, GridPosition } from '@/lib/game/types';

// Types
export enum LeadStatus {
  Spawning = 'spawning',       // at door (brief animation)
  Walking = 'walking',         // walking around outside business
  Idle = 'idle',              // stopped/idle state
  Leaving = 'leaving',        // walking away (expired)
}

export interface Lead {
  id: string;
  x: number;
  y: number;
  facingDirection?: 'down' | 'left' | 'up' | 'right';
  targetX?: number; // Target position for walking
  targetY?: number;
  path?: GridPosition[]; // Current path waypoints (excluding current tile)
  status: LeadStatus;
  lifetime: number; // ticks remaining before leaving
  maxLifetime: number; // maximum lifetime ticks for this lead
  idleTicks?: number; // ticks spent in idle state
  dialogue?: string; // Current dialogue text
  dialogueTicks?: number; // Ticks remaining for dialogue display
  fadeTicks?: number; // Ticks for fadeout effect when leaving
}

// Lead dialogue options
export const LEAD_DIALOGUES = [
  "It's too expensive",
  "I need to think about it",
  "I found a better one",
  "Maybe next time",
  "Not sure if I can afford it",
  "Let me check my budget",
  "Interesting, but...",
  "I'll come back later"
];

/**
 * Movement speed (tiles per tick) - slower than customers for more natural browsing
 */
const getMovementSpeed = () => Math.max(0.01, getGlobalMovementConfig().customerTilesPerTick * 0.6);

/**
 * Creates a new lead at the entry position
 */
export function spawnLead(
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): Lead {
  const layout = getLayoutConfig(industryId);
  const spawnPosition = layout.entryPosition;

  // Default lifetime: 5 seconds
  const lifetimeSeconds = 5;
  const lifetime = secondsToTicks(lifetimeSeconds, industryId);

  return {
    id: Math.random().toString(36).substr(2, 9),
    x: spawnPosition.x,
    y: spawnPosition.y,
    facingDirection: 'down',
    status: LeadStatus.Spawning,
    lifetime,
    maxLifetime: lifetime,
  };
}

/**
 * Moves lead towards target position following an optional path.
 * Movement is restricted to horizontal/vertical steps (same as customers).
 */
function moveTowardsTarget(lead: Lead): Lead {
  const movementSpeed = getMovementSpeed();
  if (lead.targetX === undefined || lead.targetY === undefined) {
    return lead;
  }

  const [nextWaypoint, ...remainingPath] =
    lead.path && lead.path.length > 0
      ? lead.path
      : [{ x: lead.targetX, y: lead.targetY }];

  const dx = nextWaypoint.x - lead.x;
  const dy = nextWaypoint.y - lead.y;

  // Close enough to waypoint - snap to position and advance path
  if (Math.abs(dx) <= movementSpeed && Math.abs(dy) <= movementSpeed) {
    const hasMoreWaypoints = remainingPath.length > 0;
    const reachedFinalWaypoint =
      !hasMoreWaypoints &&
      nextWaypoint.x === lead.targetX &&
      nextWaypoint.y === lead.targetY;

    return {
      ...lead,
      x: nextWaypoint.x,
      y: nextWaypoint.y,
      facingDirection: lead.facingDirection,
      path: hasMoreWaypoints ? remainingPath : undefined,
      targetX: reachedFinalWaypoint ? undefined : lead.targetX,
      targetY: reachedFinalWaypoint ? undefined : lead.targetY,
    };
  }

  // Move horizontally or vertically only (not diagonal) - same as customers
  let newX = lead.x;
  let newY = lead.y;
  let facingDirection = lead.facingDirection;

  const prioritizeHorizontal = Math.abs(dx) >= Math.abs(dy);

  if (prioritizeHorizontal && Math.abs(dx) > 0) {
    const step = Math.sign(dx) * Math.min(movementSpeed, Math.abs(dx));
    newX = lead.x + step;
    facingDirection = step > 0 ? 'right' : 'left';
  } else if (Math.abs(dy) > 0) {
    const step = Math.sign(dy) * Math.min(movementSpeed, Math.abs(dy));
    newY = lead.y + step;
    facingDirection = step > 0 ? 'down' : 'up';
  }

  return {
    ...lead,
    x: newX,
    y: newY,
    facingDirection,
    path: lead.path,
  };
}

/**
 * Check if lead has reached target
 */
function hasReachedTarget(lead: Lead): boolean {
  return lead.targetX === undefined && lead.targetY === undefined;
}

/**
 * Get a random position for lead movement - more natural browsing behavior
 */
function getRandomLeadPosition(): { x: number; y: number } {
  // Random position in the 2-row area (columns 0-9, rows 8-9)
  const x = Math.floor(Math.random() * 10); // 0-9
  const y = 8 + Math.floor(Math.random() * 2); // 8 or 9
  return { x, y };
}

/**
 * Get random dialogue text
 */
function getRandomDialogue(): string {
  return LEAD_DIALOGUES[Math.floor(Math.random() * LEAD_DIALOGUES.length)];
}

/**
 * Updates a lead's state for one tick
 */
export function tickLead(lead: Lead): Lead {
  switch (lead.status) {
    case LeadStatus.Spawning:
      // After brief spawn animation, move to walking
      return {
        ...lead,
        status: LeadStatus.Walking,
      };

    case LeadStatus.Walking:
      // Move towards target if we have one
      if (lead.targetX !== undefined && lead.targetY !== undefined) {
        const moved = moveTowardsTarget(lead);

        // If reached target, decide randomly: continue walking or go idle with dialogue
        if (hasReachedTarget(moved)) {
          const shouldGoIdle = Math.random() < 0.4; // 40% chance to stop and talk (increased)

          if (shouldGoIdle) {
            // Set random dialogue when stopping
            const randomDialogue = getRandomDialogue();
            const dialogueDuration = 120 + Math.random() * 120; // 4-8 seconds (longer)

          return {
            ...moved,
            status: LeadStatus.Idle,
            idleTicks: 0,
            dialogue: randomDialogue,
            dialogueTicks: dialogueDuration,
          };
          } else {
            // Continue walking immediately to new destination (60% chance) or stop (40% chance)
            if (Math.random() < 0.6) {
              const newRandomPos = getRandomLeadPosition();
              return {
                ...moved,
                targetX: newRandomPos.x,
                targetY: newRandomPos.y,
                lifetime: Math.max(0, lead.lifetime - 1),
                status: lead.lifetime <= 1 ? LeadStatus.Leaving : LeadStatus.Walking,
              };
            } else {
              // Just stand and think for a bit
              return {
                ...moved,
                status: LeadStatus.Idle,
                idleTicks: 0,
                lifetime: Math.max(0, lead.lifetime - 1),
              };
            }
          }
        }

        return moved;
      }

      // No target - pick a random destination
      const randomPos = getRandomLeadPosition();
      return {
        ...lead,
        targetX: randomPos.x,
        targetY: randomPos.y,
        lifetime: Math.max(0, lead.lifetime - 1),
        status: lead.lifetime <= 1 ? LeadStatus.Leaving : LeadStatus.Walking,
      };

    case LeadStatus.Idle:
      // Stay idle for a few ticks, then resume walking or leave
      const idleTicks = (lead.idleTicks ?? 0) + 1;
      const idleDuration = 90 + Math.random() * 90; // 3-6 seconds random duration (longer)

      // Update dialogue ticks
      let dialogueTicks = lead.dialogueTicks;
      if (dialogueTicks !== undefined) {
        dialogueTicks = dialogueTicks - 1;
        if (dialogueTicks <= 0) {
          dialogueTicks = undefined; // Hide dialogue
        }
      }

      if (idleTicks >= idleDuration) {
        // Resume walking or leave if lifetime expired
        return {
          ...lead,
          idleTicks: undefined,
          dialogue: undefined, // Clear dialogue when moving
          dialogueTicks: undefined,
          status: lead.lifetime <= 1 ? LeadStatus.Leaving : LeadStatus.Walking,
        };
      }

      return {
        ...lead,
        idleTicks,
        dialogueTicks,
        lifetime: Math.max(0, lead.lifetime - 1),
        status: lead.lifetime <= 1 ? LeadStatus.Leaving : LeadStatus.Idle,
      };

    case LeadStatus.Leaving:
      // Start fadeout effect when lifetime gets low
      const fadeDuration = 60; // 2 seconds at 30 ticks/sec
      let fadeTicks = lead.fadeTicks;

      if (lead.lifetime <= fadeDuration && fadeTicks === undefined) {
        // Start fadeout
        fadeTicks = fadeDuration;
      }

      if (fadeTicks !== undefined) {
        fadeTicks = Math.max(0, fadeTicks - 1);
      }

      return {
        ...lead,
        lifetime: Math.max(0, lead.lifetime - 1),
        dialogue: undefined,
        dialogueTicks: undefined,
        fadeTicks,
      };

    default:
      return lead;
  }
}

