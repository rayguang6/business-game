'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { CustomerStatus } from '@/lib/features/customers';
import { WaitingArea } from './WaitingArea';
import { TreatmentRoom } from './TreatmentRoom';
import { getUpgradeEffects } from '@/lib/features/upgrades';

// Canvas scaling configuration
const CANVAS_CONFIG = {
  // Reference size (what we design for)
  REFERENCE_SIZE: 500,
  // Responsive breakpoints
  BREAKPOINTS: {
    mobile: 350,
    tablet: 400, 
    desktop: 500
  }
};

export function GameCanvas() {
  const { selectedIndustry, customers, upgrades } = useGameStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(350);
  const [scaleFactor, setScaleFactor] = useState(1);

  if (!selectedIndustry) return null;

  const upgradeEffects = getUpgradeEffects(upgrades);
  const treatmentRoomsLabel = 'Treatment Rooms';
  const treatmentRooms = upgradeEffects.treatmentRooms;
  const mapBackground = selectedIndustry.mapImage ?? '/images/maps/dental-map.png';

  // Calculate responsive canvas size
  useEffect(() => {
    const updateCanvasSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Determine canvas size based on screen size
      let size = CANVAS_CONFIG.BREAKPOINTS.mobile;
      if (width >= 1024) size = CANVAS_CONFIG.BREAKPOINTS.desktop;
      else if (width >= 768) size = CANVAS_CONFIG.BREAKPOINTS.tablet;
      
      setCanvasSize(size);
      setScaleFactor(size / CANVAS_CONFIG.REFERENCE_SIZE);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Canvas coordinate system (for future 2D animations)
  const canvasCoordinates = {
    width: CANVAS_CONFIG.REFERENCE_SIZE,
    height: CANVAS_CONFIG.REFERENCE_SIZE,
    scale: scaleFactor,
    // Convert screen coordinates to canvas coordinates
    screenToCanvas: (x: number, y: number) => ({
      x: x / scaleFactor,
      y: y / scaleFactor
    }),
    // Convert canvas coordinates to screen coordinates  
    canvasToScreen: (x: number, y: number) => ({
      x: x * scaleFactor,
      y: y * scaleFactor
    })
  };

  return (
    <div className="h-full w-full bg-[#8ed0fb] relative overflow-hidden flex items-center justify-center">
      {/* Canvas Container - Responsive with max constraints */}
      <div 
        ref={canvasRef}
        className="relative"
        style={{
          // Responsive sizing with max constraints
          width: `${canvasSize}px`,
          height: `${canvasSize}px`,
          aspectRatio: '1/1',
          backgroundImage: `url(${mapBackground})`,
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      >
        {/* Future 2D Animation Layer */}
        <div 
          className="absolute inset-0"
          style={{
            // This will be where 2D sprites are positioned
            // All coordinates will be relative to this container
            transform: `scale(${scaleFactor})`,
            transformOrigin: 'top left'
          }}
        >
          {/* Future: 2D Character Sprites will go here */}
          {/* Example: <Sprite x={100} y={200} spriteSheet="customer-walk.png" /> */}
        </div>

        {/* HUD Overlay - Scales with canvas */}
        <div 
          className="absolute inset-0 flex items-center justify-between pointer-events-none"
          style={{
            padding: `${16 * scaleFactor}px`,
            paddingTop: `${80 * scaleFactor}px`
          }}
        >
          {/* Left HUD Panel - Waiting Area */}
          <div 
            className="pointer-events-auto"
            style={{
              width: `${256 * scaleFactor}px`
            }}
          >
            <WaitingArea 
              customers={customers} 
              scaleFactor={scaleFactor}
            />
          </div>

          {/* Right HUD Panel - Treatment Rooms */}
          <div 
            className="pointer-events-auto"
            style={{
              width: `${256 * scaleFactor}px`
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 
                className="font-semibold text-gray-700"
                style={{ fontSize: `${12 * scaleFactor}px` }}
              >
                {treatmentRoomsLabel}
              </h4>
              <div 
                className="text-gray-500"
                style={{ fontSize: `${12 * scaleFactor}px` }}
              >
                {customers.filter((c) => c.status === CustomerStatus.InService).length}/{treatmentRooms} in service
              </div>
            </div>
            <div className="space-y-2">
              {Array.from({ length: treatmentRooms }, (_, index) => (
                <TreatmentRoom 
                  key={index + 1} 
                  roomId={index + 1} 
                  customers={customers}
                  scaleFactor={scaleFactor}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


