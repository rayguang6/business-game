'use client';

import React, { useState, useEffect } from 'react';
import { getMovementConfigForIndustry } from '@/lib/game/config';
import { useGameStore } from '@/lib/store/gameStore';
import { IndustryId } from '@/lib/game/types';

// 32x32px tile system configuration
const TILE_SIZE = 32;
const CANVAS_SIZE = 320; // 10x10 tiles = 320px (32px × 10)
const GRID_SIZE = 10; // 10x10 grid

export interface Character2DProps {
  x: number; // Position (can be float for smooth movement)
  y: number; // Position (can be float for smooth movement)
  spriteSheet: string;
  frame?: number; // Which frame from the spritesheet (0-15)
  direction?: 'down' | 'left' | 'up' | 'right';
  scaleFactor: number;
  isWalking?: boolean;
  isCelebrating?: boolean;
}

export function Character2D({ 
  x, 
  y, 
  spriteSheet, 
  frame = 0,
  direction = 'down',
  scaleFactor,
  isWalking = false,
  isCelebrating = false
}: Character2DProps) {
  const [currentFrame, setCurrentFrame] = useState(frame);
  const selectedIndustryId = useGameStore((state) => state.selectedIndustry?.id as IndustryId | undefined);
  const movementConfig = getMovementConfigForIndustry(selectedIndustryId);
  const {
    customerTilesPerTick,
    animationReferenceTilesPerTick,
    walkFrameDurationMs,
    minWalkFrameDurationMs,
    maxWalkFrameDurationMs,
    celebrationFrameDurationMs,
  } = movementConfig || {
    customerTilesPerTick: 0.25,
    animationReferenceTilesPerTick: 0.25,
    walkFrameDurationMs: 200,
    minWalkFrameDurationMs: 80,
    maxWalkFrameDurationMs: 320,
    celebrationFrameDurationMs: 200,
  };

  const animationSpeedRatio = animationReferenceTilesPerTick > 0
    ? customerTilesPerTick / animationReferenceTilesPerTick
    : 1;

  const rawWalkDuration = animationSpeedRatio > 0
    ? walkFrameDurationMs / animationSpeedRatio
    : walkFrameDurationMs;

  const walkAnimationInterval = Math.min(
    maxWalkFrameDurationMs,
    Math.max(
      minWalkFrameDurationMs,
      Math.round(Number.isFinite(rawWalkDuration) ? rawWalkDuration : walkFrameDurationMs),
    ),
  );

  // Calculate position in pixels (32x32 grid system, supports floating point)
  const pixelX = x * TILE_SIZE;
  const pixelY = y * TILE_SIZE;

  // Calculate sprite size (32x32 - NOT scaled here, we scale the container)
  const spriteSize = TILE_SIZE;

  // Calculate sprite sheet position based on direction and frame
  // Spritesheet layout: 0-2=down, 3-5=left, 6-8=up, 9-11=right, 12-15=celebrating
  const getSpritePosition = (localFrame: number) => {
    if (isCelebrating) {
      // Celebrating animation (frames 12-15)
      return 12 + (localFrame % 4);
    }
    
    const directionOffset = {
      'down': 0,   // Frames 0-2
      'left': 3,   // Frames 3-5
      'up': 6,     // Frames 6-8
      'right': 9   // Frames 9-11
    };
    
    const baseFrame = directionOffset[direction];
    return baseFrame + (localFrame % 3); // Cycle through 3 frames per direction
  };

  const spriteFrame = getSpritePosition(currentFrame);

  // Auto-animation for walking or celebrating
  useEffect(() => {
    if (isCelebrating) {
      const interval = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % 4); // Cycle through 4 frames for celebration
      }, celebrationFrameDurationMs);
      return () => clearInterval(interval);
    }

    if (!isWalking) {
      setCurrentFrame(1); // Middle frame (idle stance)
      return;
    }

    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % 3); // Cycle through 0, 1, 2
    }, walkAnimationInterval);

    return () => clearInterval(interval);
  }, [isWalking, isCelebrating, walkAnimationInterval, celebrationFrameDurationMs]);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${pixelX}px`,
        top: `${pixelY}px`,
        width: `${spriteSize}px`,
        height: `${spriteSize}px`,
        backgroundImage: `url(${spriteSheet})`,
        backgroundSize: `${spriteSize * 16}px ${spriteSize}px`, // 16 frames horizontally (0-15)
        backgroundPosition: `-${spriteFrame * spriteSize}px 0px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated', // Keep pixel art crisp
        zIndex: 10
      }}
    />
  );
}

// Helper function to convert grid coordinates to canvas coordinates
export const gridToCanvas = (gridX: number, gridY: number) => ({
  x: gridX * TILE_SIZE,
  y: gridY * TILE_SIZE
});

// Helper function to convert canvas coordinates to grid coordinates  
export const canvasToGrid = (canvasX: number, canvasY: number) => ({
  x: Math.floor(canvasX / TILE_SIZE),
  y: Math.floor(canvasY / TILE_SIZE)
});

// Grid system constants
export const GRID_CONFIG = {
  TILE_SIZE: 32,
  CANVAS_SIZE: 320, // 10x10 tiles
  GRID_WIDTH: 10,
  GRID_HEIGHT: 10,
  TOTAL_TILES: 100 // 10x10 = 100 tiles
};
