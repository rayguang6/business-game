'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { CustomerStatus } from '@/lib/features/customers';
import { WaitingArea } from './WaitingArea';
import { TreatmentRoom } from './TreatmentRoom';
import { Character2D } from './Character2D';
import { SpriteCustomer } from './SpriteCustomer';
import { SpriteStaff } from './SpriteStaff';
import { GridOverlay } from './GridOverlay';
import { DEFAULT_INDUSTRY_ID, getBusinessStats, getLayoutConfig, getCapacityImageForIndustry } from '@/lib/game/config';
import { IndustryId } from '@/lib/game/types';
import { effectManager, GameMetric } from '@/lib/game/effectManager';
import { useConfigStore } from '@/lib/store/configStore';

// Canvas scaling configuration
const CANVAS_CONFIG = {
  // Reference size (what we design for) - 10x10 tiles at 32px each
  REFERENCE_SIZE: 320, // 10 tiles × 32px = 320px
  // Responsive breakpoints
  BREAKPOINTS: {
    mobile: 320,  // 1x scale
    tablet: 384,  // 1.2x scale
    desktop: 480  // 1.5x scale
  }
};

const formatDuration = (seconds: number): string => {
  const clamped = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

export function GameCanvas() {
  const {
    selectedIndustry,
    customers,
    gameTime,
    hiredStaff,
  } = useGameStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(350);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [showModifiers, setShowModifiers] = useState(true);

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

  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  const businessStats = useMemo(() => getBusinessStats(industryId), [industryId]);
  const layoutOverride = useConfigStore((state) => state.industryConfigs[industryId]?.layout);
  const layout = useMemo(() => layoutOverride ?? getLayoutConfig(industryId), [layoutOverride, industryId]);
  
  const computeMetrics = useCallback(() => ({
    spawnIntervalSeconds: effectManager.calculate(
      GameMetric.SpawnIntervalSeconds,
      businessStats.customerSpawnIntervalSeconds,
    ),
    serviceSpeedMultiplier: effectManager.calculate(GameMetric.ServiceSpeedMultiplier, 1.0),
    serviceRooms: effectManager.calculate(GameMetric.ServiceRooms, businessStats.treatmentRooms),
    reputationMultiplier: effectManager.calculate(GameMetric.ReputationMultiplier, 1.0),
    serviceRevenueMultiplier: effectManager.calculate(
      GameMetric.ServiceRevenueMultiplier,
      businessStats.serviceRevenueMultiplier ?? 1,
    ),
    serviceRevenueFlatBonus: effectManager.calculate(GameMetric.ServiceRevenueFlatBonus, 0),
    serviceRevenueScale: businessStats.serviceRevenueScale ?? 1,
  }), [businessStats]);

  const [metrics, setMetrics] = useState(() => computeMetrics());

  useEffect(() => {
    setMetrics(computeMetrics());
    const unsubscribe = effectManager.subscribe(() => {
      setMetrics(computeMetrics());
    });
    return () => unsubscribe();
  }, [computeMetrics]);

  if (!selectedIndustry) return null;
  const serviceRoomsLabel = 'Service Rooms';
  const serviceRooms = Math.max(1, Math.round(metrics.serviceRooms));
  const mapBackground = selectedIndustry.mapImage ?? '/images/maps/dental-map.png';

  // Get service room positions for rendering beds (from database or fallback)
  const serviceRoomPositions = layout.serviceRoomPositions;
  const staffPositions = layout.staffPositions;
  const TILE_SIZE = 32;

  const spawnIntervalSeconds = metrics.spawnIntervalSeconds;
  const customersPerMinute = spawnIntervalSeconds > 0 ? 60 / spawnIntervalSeconds : null;
  const serviceSpeedMultiplier = metrics.serviceSpeedMultiplier;
  const serviceRevenueMultiplier = metrics.serviceRevenueMultiplier;
  const serviceRevenueBonus = metrics.serviceRevenueFlatBonus;
  const serviceRevenueScale = metrics.serviceRevenueScale ?? 1;
  // No need for campaign timing in canvas - effects are handled by effectManager

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
      <div className="absolute bottom-3 right-3 z-40 space-y-2">
        <button
          type="button"
          onClick={() => setShowModifiers((prev) => !prev)}
          className="px-3 py-1 text-xs sm:text-sm font-semibold rounded-md bg-black/75 text-white hover:bg-black/80 transition-colors"
        >
          {showModifiers ? 'Hide Stats' : 'Show Stats'}
        </button>
        {showModifiers && (
          <div className="bg-black/75 text-white text-xs sm:text-[13px] px-3 py-2 rounded-lg shadow-lg space-y-1 max-w-[240px]">
            <div className="font-semibold text-sm">Live Modifiers</div>
            <div>
              <span className="text-gray-300">Customer spawn interval:</span>{' '}
              <span className="font-semibold">
                {spawnIntervalSeconds.toFixed(2)}s
                {customersPerMinute != null ? ` (${customersPerMinute.toFixed(1)}/min)` : ''}
              </span>
            </div>
            <div>
              <span className="text-gray-300">Service speed:</span>{' '}
              <span className="font-semibold">×{serviceSpeedMultiplier.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-300">{serviceRoomsLabel}:</span>{' '}
              <span className="font-semibold">{serviceRooms}</span>
            </div>
            <div>
              <span className="text-gray-300">Service price bonus:</span>{' '}
              <span className="font-semibold">
                {serviceRevenueBonus >= 0 ? '+' : '-'}${Math.abs(serviceRevenueBonus).toFixed(0)}
              </span>
            </div>
            <div>
              <span className="text-gray-300">Service price multiplier:</span>{' '}
              <span className="font-semibold">×{serviceRevenueMultiplier.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-300">Payout scale:</span>{' '}
              <span className="font-semibold">×{serviceRevenueScale.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

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
        {/* Grid Overlay - For testing tile positioning */}
        <GridOverlay scaleFactor={scaleFactor} showGrid={true} />

        {/* 2D Animation Layer */}
        <div 
          className="absolute inset-0"
          style={{
            // This will be where 2D sprites are positioned
            // All coordinates will be relative to this container
            transform: `scale(${scaleFactor})`,
            transformOrigin: 'top left'
          }}
        >
          {/* Render staff at staff positions (one per staff member) */}
          {hiredStaff.slice(0, staffPositions.length).map((staff, index) => {
            const position = staffPositions[index];
            if (!position) return null;
            
            return (
              <SpriteStaff
                key={staff.id}
                staff={staff}
                position={position}
                scaleFactor={scaleFactor}
              />
            );
          })}

          {/* Render beds at service room positions (only for active rooms) */}
          {serviceRoomPositions.slice(0, serviceRooms).map((position, index) => {
            // Bed dimensions: full width of grid, height overflows upward
            const bedHeight = TILE_SIZE * 1.5; // 1.5x tile height for upward overflow
            const bedBottom = (position.y + 1) * TILE_SIZE; // Align bottom with grid cell bottom
            const bedTop = bedBottom - bedHeight; // Top extends upward
            
            // Use capacity image from config (industry-specific or global)
            const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
            const bedImagePath = getCapacityImageForIndustry(industryId);
            
            return (
              <div
                key={`bed-${index}`}
                className="absolute pointer-events-none"
                style={{
                  left: `${position.x * TILE_SIZE}px`,
                  top: `${bedTop}px`,
                  width: `${TILE_SIZE}px`,
                  height: `${bedHeight}px`,
                  backgroundImage: `url(${bedImagePath})`,
                  backgroundSize: '100% auto', // Fill full width, maintain aspect ratio
                  backgroundPosition: 'bottom center', // Align to bottom so overflow goes up
                  backgroundRepeat: 'no-repeat',
                  imageRendering: 'pixelated',
                  zIndex: 5 // Below customers (zIndex 10)
                }}
              />
            );
          })}

          {/* Render all customers as sprites */}
          {customers.map((customer) => (
            <SpriteCustomer
              key={customer.id}
              customer={customer}
              scaleFactor={scaleFactor}
            />
          ))}
        </div>

        {/* OLD UI - BACKUP (Hidden for now, keeping for reference) */}
        {false && (
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
                  {serviceRoomsLabel}
                </h4>
                <div 
                  className="text-gray-500"
                  style={{ fontSize: `${12 * scaleFactor}px` }}
                >
                  {customers.filter((c) => c.status === CustomerStatus.InService).length}/{serviceRooms} in service
                </div>
              </div>
              <div className="space-y-2">
                {Array.from({ length: serviceRooms }, (_, index) => (
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
        )}
      </div>
    </div>
  );
}
