'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { CustomerStatus } from '@/lib/features/customers';
import { WaitingArea } from './WaitingArea';
import { TreatmentRoom } from './TreatmentRoom';
import { Character2D } from './Character2D';
import { SpriteCustomer } from './SpriteCustomer';
import { GridOverlay } from './GridOverlay';
import { DEFAULT_INDUSTRY_ID, getBusinessStats } from '@/lib/game/config';
import { IndustryId } from '@/lib/game/types';
import { effectManager, GameMetric } from '@/lib/game/effectManager';

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
