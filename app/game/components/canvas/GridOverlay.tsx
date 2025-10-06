'use client';

import React from 'react';

interface GridOverlayProps {
  scaleFactor: number;
  showGrid?: boolean;
}

export function GridOverlay({ scaleFactor, showGrid = false }: GridOverlayProps) {
  if (!showGrid) return null;

  const TILE_SIZE = 32;
  const CANVAS_SIZE = 320; // 10x10 tiles
  const GRID_WIDTH = 10;
  const GRID_HEIGHT = 10;

  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'top left'
      }}
    >
      {/* Grid lines */}
      {Array.from({ length: GRID_WIDTH + 1 }, (_, i) => (
        <div
          key={`v-${i}`}
          className="absolute bg-red-500 opacity-20"
          style={{
            left: `${i * TILE_SIZE}px`,
            top: 0,
            width: '1px',
            height: `${CANVAS_SIZE}px`
          }}
        />
      ))}
      {Array.from({ length: GRID_HEIGHT + 1 }, (_, i) => (
        <div
          key={`h-${i}`}
          className="absolute bg-red-500/10"
          style={{
            left: 0,
            top: `${i * TILE_SIZE}px`,
            width: `${CANVAS_SIZE}px`,
            height: '1px'
          }}
        />
      ))}
      
      {/* Grid coordinates */}
      {Array.from({ length: GRID_WIDTH }, (_, x) => 
        Array.from({ length: GRID_HEIGHT }, (_, y) => (
          <div
            key={`coord-${x}-${y}`}
            className="absolute text-xs text-red-600/10 font-mono"
            style={{
              left: `${x * TILE_SIZE + 2}px`,
              top: `${y * TILE_SIZE + 2}px`,
              fontSize: `${8 * scaleFactor}px`
            }}
          >
            {x},{y}
          </div>
        ))
      )}
    </div>
  );
}
