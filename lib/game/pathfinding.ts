import { getMapConfigForIndustry, type MapConfig } from './config';
import type { GridPosition, IndustryId } from './types';


interface FindPathOptions {
  mapConfig?: MapConfig;
  additionalWalls?: GridPosition[];
  allowGoalOccupied?: boolean;
  industryId?: IndustryId; // Add industryId to options
}

const DIRECTIONS: GridPosition[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

const serialize = (position: GridPosition): string => `${position.x},${position.y}`;

const isWithinBounds = (position: GridPosition, config: MapConfig): boolean => {
  return (
    position.x >= 0 &&
    position.x < config.width &&
    position.y >= 0 &&
    position.y < config.height
  );
};

const createWallSet = (config: MapConfig, additionalWalls: GridPosition[]): Set<string> => {
  const serializedWalls = [
    ...config.walls.map(serialize),
    ...additionalWalls.map(serialize),
  ];

  return new Set(serializedWalls);
};

/**
 * Simple breadth-first search pathfinding on the tile grid.
 * Returns an ordered list of waypoints (excluding the starting tile, including the goal).
 */
export function findPath(
  start: GridPosition,
  goal: GridPosition,
  options: FindPathOptions = {}
): GridPosition[] {
  if (start.x === goal.x && start.y === goal.y) {
    return [];
  }

  const config = options.mapConfig ?? getMapConfigForIndustry(options.industryId);
  const allowGoalOccupied = options.allowGoalOccupied ?? true;
  const additionalWalls = options.additionalWalls ?? [];
  const walls = createWallSet(config, additionalWalls);
  const startKey = serialize(start);
  const goalKey = serialize(goal);

  const queue: GridPosition[] = [start];
  const cameFrom = new Map<string, string | null>([[startKey, null]]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentKey = serialize(current);

    if (currentKey === goalKey) {
      break;
    }

    for (const direction of DIRECTIONS) {
      const next: GridPosition = {
        x: current.x + direction.x,
        y: current.y + direction.y,
      };

      const nextKey = serialize(next);

      if (!isWithinBounds(next, config)) {
        continue;
      }

      if (walls.has(nextKey) && !(allowGoalOccupied && nextKey === goalKey)) {
        continue;
      }

      if (cameFrom.has(nextKey)) {
        continue;
      }

      queue.push(next);
      cameFrom.set(nextKey, currentKey);
    }
  }

  if (!cameFrom.has(goalKey)) {
    return [];
  }

  // Reconstruct path from goal to start
  const path: GridPosition[] = [];
  let currentKey: string | null = goalKey;

  while (currentKey && currentKey !== startKey) {
    const [x, y] = currentKey.split(',').map(Number);
    path.push({ x, y });
    currentKey = cameFrom.get(currentKey) ?? null;
  }

  return path.reverse();
}
