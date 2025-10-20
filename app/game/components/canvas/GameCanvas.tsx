'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { CustomerStatus } from '@/lib/features/customers';
import { WaitingArea } from './WaitingArea';
import { TreatmentRoom } from './TreatmentRoom';
import { Character2D } from './Character2D';
import { SpriteCustomer } from './SpriteCustomer';
import { GridOverlay } from './GridOverlay';
import { getUpgradeEffects } from '@/lib/features/upgrades';
import { DEFAULT_INDUSTRY_ID, getBusinessStats } from '@/lib/game/config';
import { combineEffects } from '@/lib/game/effects';
import { IndustryId } from '@/lib/game/types';

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
    upgrades,
    marketingEffects,
    activeCampaign,
    campaignEndsAt,
    gameTime,
  } = useGameStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(350);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [showModifiers, setShowModifiers] = useState(false);

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
  const baseUpgradeEffects = useMemo(() => getUpgradeEffects(upgrades, industryId), [upgrades, industryId]);
  const effectBundles = useMemo(() => (marketingEffects.length > 0 ? [{ effects: marketingEffects }] : []), [marketingEffects]);
  const combinedEffects = useMemo(
    () => combineEffects({ base: baseUpgradeEffects, bundles: effectBundles }, industryId),
    [baseUpgradeEffects, effectBundles, industryId],
  );
  const businessStats = useMemo(() => getBusinessStats(industryId), [industryId]);

  if (!selectedIndustry) return null;
  const treatmentRoomsLabel = 'Treatment Rooms';
  const treatmentRooms = Math.max(1, Math.round(combinedEffects.treatmentRooms));
  const mapBackground = selectedIndustry.mapImage ?? '/images/maps/dental-map.png';

  const spawnIntervalSeconds = combinedEffects.spawnIntervalSeconds;
  const customersPerMinute = spawnIntervalSeconds > 0 ? 60 / spawnIntervalSeconds : null;
  const serviceSpeedMultiplier = combinedEffects.serviceSpeedMultiplier;
  const baseReputationGain = businessStats.reputationGainPerHappyCustomer;
  const reputationPerHappy = baseReputationGain * combinedEffects.reputationMultiplier;
  const weeklyExpenses = combinedEffects.weeklyExpenses;
  const campaignSecondsRemaining = activeCampaign && campaignEndsAt != null ? Math.max(0, campaignEndsAt - gameTime) : null;

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
              <span className="text-gray-300">Spawn interval:</span>{' '}
              <span className="font-semibold">{spawnIntervalSeconds.toFixed(2)}s</span>
              {customersPerMinute ? (
                <span className="text-gray-300"> ({customersPerMinute.toFixed(1)}/min)</span>
              ) : null}
            </div>
            <div>
              <span className="text-gray-300">Service speed:</span>{' '}
              <span className="font-semibold">×{serviceSpeedMultiplier.toFixed(2)}</span>
              <span className="text-gray-400"> (lower is faster)</span>
            </div>
            <div>
              <span className="text-gray-300">Reputation / happy:</span>{' '}
              <span className="font-semibold">
                {baseReputationGain.toFixed(1)} → {reputationPerHappy.toFixed(1)}
              </span>
            </div>
            <div>
              <span className="text-gray-300">Treatment rooms:</span>{' '}
              <span className="font-semibold">{treatmentRooms}</span>
            </div>
            <div>
              <span className="text-gray-300">Weekly expenses:</span>{' '}
              <span className="font-semibold">${weeklyExpenses.toFixed(0)}</span>
            </div>
            <div>
              <span className="text-gray-300">Campaign:</span>{' '}
              {activeCampaign ? (
                <span className="text-emerald-300 font-semibold">
                  {activeCampaign.name}
                  {campaignSecondsRemaining != null ? ` (${formatDuration(campaignSecondsRemaining)})` : ''}
                </span>
              ) : (
                <span className="text-gray-400">none</span>
              )}
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
        )}
      </div>
    </div>
  );
}
