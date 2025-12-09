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
  getLeadDialoguesForIndustry,
  getBusinessStats,
} from '@/lib/game/config';
import { IndustryId, GridPosition } from '@/lib/game/types';
import { effectManager, GameMetric } from '@/lib/game/effectManager';

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

/**
 * Movement speed (tiles per tick) - slower than customers for more natural browsing
 */
const getMovementSpeed = () => {
  const globalConfig = getGlobalMovementConfig();
  return globalConfig ? Math.max(0.01, globalConfig.customerTilesPerTick * 0.6) : 0.04;
};

/**
 * Creates a new lead at the entry position
 */
export function spawnLead(
  industryId: IndustryId = DEFAULT_INDUSTRY_ID,
): Lead {
  const layout = getLayoutConfig(industryId);
  if (!layout) {
    throw new Error(`Layout config not loaded for industry "${industryId}". Please configure layout in the admin panel.`);
  }
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
 * Movement is smoother and more natural, avoiding zigzag patterns.
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

  // Calculate movement direction more naturally
  let newX = lead.x;
  let newY = lead.y;
  let facingDirection = lead.facingDirection;

  // Use a more balanced approach to avoid zigzagging
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // If we're very close to target in one dimension, prioritize the other
  if (absDx <= movementSpeed * 2 && absDy > movementSpeed) {
    // Close horizontally, move vertically
    const step = Math.sign(dy) * Math.min(movementSpeed, absDy);
    newY = lead.y + step;
    facingDirection = step > 0 ? 'down' : 'up';
  } else if (absDy <= movementSpeed * 2 && absDx > movementSpeed) {
    // Close vertically, move horizontally
    const step = Math.sign(dx) * Math.min(movementSpeed, absDx);
    newX = lead.x + step;
    facingDirection = step > 0 ? 'right' : 'left';
  } else {
    // Both dimensions need movement - choose based on which is larger but with some randomness to avoid predictable patterns
    const shouldPrioritizeHorizontal = absDx >= absDy ? Math.random() > 0.3 : Math.random() > 0.7;

    if (shouldPrioritizeHorizontal && absDx > 0) {
      const step = Math.sign(dx) * Math.min(movementSpeed, absDx);
      newX = lead.x + step;
      facingDirection = step > 0 ? 'right' : 'left';
    } else if (absDy > 0) {
      const step = Math.sign(dy) * Math.min(movementSpeed, absDy);
      newY = lead.y + step;
      facingDirection = step > 0 ? 'down' : 'up';
    }
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
 * Get random dialogue text for a specific industry
 */
function getRandomDialogue(industryId: IndustryId = DEFAULT_INDUSTRY_ID): string {
  const dialogues = getLeadDialoguesForIndustry(industryId);
  return dialogues[Math.floor(Math.random() * dialogues.length)];
}

/**
 * Updates a lead's state for one tick
 */
export function tickLead(lead: Lead, industryId: IndustryId = DEFAULT_INDUSTRY_ID): Lead {
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
            const randomDialogue = getRandomDialogue(industryId);
            const dialogueDuration = 180 + Math.random() * 180; // 6-12 seconds (much longer)

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

/**
 * Shared utility for generating leads from any source (marketing, events, etc.)
 * 
 * This is the single source of truth for lead generation logic.
 * Handles staggered animation, conversion progress tracking, and automatic customer conversion.
 * 
 * @param count - Number of leads to generate
 * @param options - Store methods and state accessors needed for lead generation
 */
export interface GenerateLeadsOptions {
  spawnLead: () => Lead;
  updateLeads: (leads: Lead[]) => void;
  spawnCustomer?: () => import('@/lib/features/customers').Customer;
  addCustomers?: (customers: import('@/lib/features/customers').Customer[]) => void;
  getState: () => {
    leads: Lead[];
    leadProgress: number;
    conversionRate: number;
    selectedIndustry?: { id: string } | null;
  };
  updateLeadProgress: (progress: number) => void;
}

const DEFAULT_SPAWN_DELAY_MS = 150; // 150ms delay between each lead generation

export function generateLeads(
  count: number,
  options: GenerateLeadsOptions,
  spawnDelayMs: number = DEFAULT_SPAWN_DELAY_MS,
): void {
  const actualCount = Math.max(0, Math.floor(count));

  if (actualCount === 0) {
    return;
  }

  const { spawnLead, updateLeads, spawnCustomer, addCustomers, getState, updateLeadProgress } = options;

  // Stagger lead generation with a slight delay for better visual effect
  for (let i = 0; i < actualCount; i++) {
    setTimeout(() => {
      const currentState = getState();
      if (!spawnLead || !updateLeads) return;

      const lead = spawnLead();
      if (lead) {
        // Add the new lead to existing leads
        const currentLeads = currentState.leads || [];
        updateLeads([...currentLeads, lead]);

        // Calculate conversion rate with effects applied (same as mechanics.ts)
        // This ensures we use the actual calculated value, not just the base state value
        const industryId = (currentState.selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
        const baseStats = getBusinessStats(industryId);
        // Use calculated conversion rate with effects, or fall back to state value if baseStats not available
        // Note: If baseStats.conversionRate is 0, it will use 0 (no fallback to 10)
        const baseConversionRate = baseStats?.conversionRate ?? currentState.conversionRate ?? 0;
        const conversionRate = effectManager.calculate(GameMetric.ConversionRate, baseConversionRate);
        
        const currentProgress = currentState.leadProgress || 0;
        const newProgress = currentProgress + conversionRate;

        // If progress reaches 100% or more, convert immediately
        if (newProgress >= 100 && spawnCustomer && addCustomers) {
          // Calculate how many customers to spawn
          const customersToSpawn = Math.floor(newProgress / 100);

          // Spawn customers immediately
          for (let c = 0; c < customersToSpawn; c++) {
            const customer = spawnCustomer();
            if (customer) {
              addCustomers([customer]);

              // Note: Revenue and EXP are awarded when customer completes service and leaves happy (handled in mechanics.ts)
              // Do NOT record revenue here - it will be recorded when the service is completed
            }
          }

          // Reset progress (keep remainder for next conversion)
          const remainderProgress = newProgress % 100;
          updateLeadProgress(remainderProgress);
        } else {
          // Progress hasn't reached 100% yet, just update it
          updateLeadProgress(newProgress);
        }
      }
    }, i * spawnDelayMs);
  }
}

