'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { CustomerStatus } from '@/lib/features/customers';
import { WaitingArea } from './WaitingArea';
import { TreatmentRoom } from './TreatmentRoom';
import { Character2D } from './Character2D';
import { SpriteCustomer } from './SpriteCustomer';
import { SpriteLead } from './SpriteLead';
import { SpriteStaff } from './SpriteStaff';
import { GridOverlay } from './GridOverlay';
import { DEFAULT_INDUSTRY_ID, getBusinessStats, getLayoutConfig, getCapacityImageForIndustry, getSimulationConfig } from '@/lib/game/config';
import { IndustryId } from '@/lib/game/types';
import { effectManager, GameMetric } from '@/lib/game/effectManager';
import { useConfigStore } from '@/lib/store/configStore';
import { getMonthlyBaseExpenses } from '@/lib/features/economy';

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
    leads,
    leadProgress,
    conversionRate,
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
  // Get businessStats fresh each time (same as mechanics.ts does)
  const businessStats = useMemo(() => getBusinessStats(industryId), [industryId]);
  const layoutOverride = useConfigStore((state) => state.industryConfigs[industryId]?.layout);
  const layout = useMemo(() => layoutOverride ?? getLayoutConfig(industryId), [layoutOverride, industryId]);
  
  const computeMetrics = useCallback(() => {
    // Mirror exactly what mechanics.ts does (line 580-605)
    // This ensures we use the same calculation path as the game
    const baseStats = getBusinessStats(industryId);
    const baseMonthlyExpenses = getMonthlyBaseExpenses(industryId);
    
    // Calculate metrics exactly like mechanics.ts does
    // Note: Game uses fallbacks (?? 1, ?? 10, ?? 0) for calculations to work
    // But we also track base values (without fallbacks) to show N/A when missing
    // Check if values exist in the returned config (not using fallbacks)
    return {
      // Calculated values (with effects applied) - same as game uses
      spawnIntervalSeconds: effectManager.calculate(
        GameMetric.SpawnIntervalSeconds,
        baseStats.customerSpawnIntervalSeconds,
      ),
      serviceSpeedMultiplier: effectManager.calculate(GameMetric.ServiceSpeedMultiplier, 1.0),
      serviceRooms: effectManager.calculate(GameMetric.ServiceRooms, baseStats.treatmentRooms),
      serviceRevenueMultiplier: effectManager.calculate(
        GameMetric.ServiceRevenueMultiplier,
        baseStats.serviceRevenueMultiplier ?? 1,
      ),
      serviceRevenueFlatBonus: effectManager.calculate(GameMetric.ServiceRevenueFlatBonus, 0),
      serviceRevenueScale: baseStats.serviceRevenueScale ?? 1,
      conversionRate: effectManager.calculate(GameMetric.ConversionRate, baseStats.conversionRate ?? 10),
      failureRate: effectManager.calculate(GameMetric.FailureRate, baseStats.failureRate ?? 0),
      monthlyExpenses: effectManager.calculate(GameMetric.MonthlyExpenses, baseMonthlyExpenses),
      monthlyTimeCapacity: effectManager.calculate(GameMetric.MonthlyTimeCapacity, 0),
      // EXP gain/loss are config-only (read directly from baseStats, not modifiable by effects)
      expGainPerHappyCustomer: (typeof baseStats.expGainPerHappyCustomer === 'number' && !Number.isNaN(baseStats.expGainPerHappyCustomer))
        ? baseStats.expGainPerHappyCustomer
        : 1,
      expLossPerAngryCustomer: (typeof baseStats.expLossPerAngryCustomer === 'number' && !Number.isNaN(baseStats.expLossPerAngryCustomer))
        ? baseStats.expLossPerAngryCustomer
        : 1,
      // Tier-specific multipliers
      highTierRevenueMultiplier: effectManager.calculate(GameMetric.HighTierServiceRevenueMultiplier, 1),
      midTierRevenueMultiplier: effectManager.calculate(GameMetric.MidTierServiceRevenueMultiplier, 1),
      lowTierRevenueMultiplier: effectManager.calculate(GameMetric.LowTierServiceRevenueMultiplier, 1),
      highTierWeightageMultiplier: effectManager.calculate(GameMetric.HighTierServiceWeightageMultiplier, 1),
      midTierWeightageMultiplier: effectManager.calculate(GameMetric.MidTierServiceWeightageMultiplier, 1),
      lowTierWeightageMultiplier: effectManager.calculate(GameMetric.LowTierServiceWeightageMultiplier, 1),
      
      // Base values (without fallbacks) - check if they exist in config
      // If value exists in baseStats, use it; otherwise check if it's using default
      baseServiceRevenueMultiplier: baseStats.serviceRevenueMultiplier,
      baseServiceRevenueScale: baseStats.serviceRevenueScale,
      baseConversionRate: baseStats.conversionRate,
      baseFailureRate: baseStats.failureRate,
      baseTreatmentRooms: baseStats.treatmentRooms,
      baseExpGainPerHappy: baseStats.expGainPerHappyCustomer,
      baseExpLossPerAngry: baseStats.expLossPerAngryCustomer,
    };
  }, [industryId]);

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
  // Get service room positions for rendering beds (from database or fallback)
  const serviceRoomPositions = layout.serviceRoomPositions;
  // Use serviceRooms from metrics (no cap - handled by upgrades)
  // For display: show undefined to indicate missing config
  // For array operations: use fallback to prevent crashes
  const serviceRoomsDisplay = metrics.serviceRooms !== undefined 
    ? Math.max(1, Math.round(metrics.serviceRooms))
    : undefined;
  const serviceRooms = serviceRoomsDisplay ?? 1; // Fallback for array operations
  const mapBackground = selectedIndustry.mapImage ?? '/images/maps/dental-map.png';
  const staffPositions = layout.staffPositions;
  const TILE_SIZE = 32;

  // Use calculated values (with effects) - these match what the game uses
  const spawnIntervalSeconds = metrics.spawnIntervalSeconds;
  const customersPerMinute = spawnIntervalSeconds > 0 ? 60 / spawnIntervalSeconds : null;
  const serviceSpeedMultiplier = metrics.serviceSpeedMultiplier;
  const serviceRevenueMultiplier = metrics.serviceRevenueMultiplier;
  const serviceRevenueBonus = metrics.serviceRevenueFlatBonus;
  const serviceRevenueScale = metrics.serviceRevenueScale;
  const failureRate = metrics.failureRate;
  // Use conversionRate from calculated metrics (same as game uses)
  const conversionRateValue = metrics.conversionRate;
  const monthlyExpensesValue = metrics.monthlyExpenses;
  const monthlyTimeCapacity = metrics.monthlyTimeCapacity;
  
  // Base stats (non-editable) - read directly from config (same as game uses)
  const expGainPerHappy = metrics.expGainPerHappyCustomer; // Read directly from config
  const expLossPerAngry = metrics.expLossPerAngryCustomer; // Read directly from config
  const hasExpGainConfig = typeof metrics.baseExpGainPerHappy === 'number' && !Number.isNaN(metrics.baseExpGainPerHappy);
  const hasExpLossConfig = typeof metrics.baseExpLossPerAngry === 'number' && !Number.isNaN(metrics.baseExpLossPerAngry);
  
  const customerPatience = businessStats.customerPatienceSeconds;
  const monthDuration = businessStats.monthDurationSeconds;
  
  // Check if base values exist (to show N/A when missing)
  const baseConversionRate = metrics.baseConversionRate;
  const showConversionRate = baseConversionRate !== undefined && conversionRateValue !== baseConversionRate;

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
          <div className="bg-black/75 text-white text-xs sm:text-[13px] px-3 py-2 rounded-lg shadow-lg space-y-1.5 max-w-[280px] max-h-[80vh] overflow-y-auto">
            <div className="font-semibold text-sm mb-1 sticky top-0 bg-black/75 pb-1">Live Modifiers</div>
            
            {/* Customer Flow Section */}
            <div className="space-y-1 border-b border-gray-600 pb-1">
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Customer Flow</div>
              <div>
                <span className="text-gray-300">Spawn interval:</span>{' '}
                <span className="font-semibold">
                  {spawnIntervalSeconds.toFixed(2)}s
                  {customersPerMinute != null ? ` (${customersPerMinute.toFixed(1)}/min)` : ''}
                </span>
              </div>
              <div>
                <span className="text-gray-300">Conversion rate:</span>{' '}
                <span className="font-semibold">{conversionRateValue.toFixed(1)}%</span>
                {baseConversionRate === undefined ? (
                  <span className="text-red-400 text-[10px] ml-1">(base: N/A)</span>
                ) : showConversionRate && (
                  <span className="text-gray-400 text-[10px] ml-1">(base: {baseConversionRate}%)</span>
                )}
              </div>
            </div>

            {/* Service Performance Section */}
            <div className="space-y-1 border-b border-gray-600 pb-1">
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Service Performance</div>
              <div>
                <span className="text-gray-300">Service speed:</span>{' '}
                <span className="font-semibold">×{serviceSpeedMultiplier.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-300">{serviceRoomsLabel}:</span>{' '}
                {serviceRoomsDisplay !== undefined ? (
                  <span className="font-semibold">{serviceRoomsDisplay}</span>
                ) : (
                  <span className="text-red-400">N/A</span>
                )}
              </div>
              {failureRate > 0 && (
                <div>
                  <span className="text-gray-300">Failure rate:</span>{' '}
                  <span className="font-semibold text-red-400">{failureRate.toFixed(1)}%</span>
                  {metrics.baseFailureRate === undefined && (
                    <span className="text-red-400 text-[10px] ml-1">(base: N/A)</span>
                  )}
                </div>
              )}
            </div>

            {/* Revenue Modifiers Section */}
            <div className="space-y-1 border-b border-gray-600 pb-1">
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Revenue Modifiers</div>
              <div>
                <span className="text-gray-300">Price multiplier:</span>{' '}
                <span className="font-semibold">×{serviceRevenueMultiplier.toFixed(2)}</span>
                {metrics.baseServiceRevenueMultiplier === undefined && (
                  <span className="text-red-400 text-[10px] ml-1">(base: N/A)</span>
                )}
              </div>
              {serviceRevenueBonus !== 0 && (
                <div>
                  <span className="text-gray-300">Price bonus:</span>{' '}
                  <span className="font-semibold">
                    {serviceRevenueBonus >= 0 ? '+' : '-'}${Math.abs(serviceRevenueBonus).toFixed(0)}
                  </span>
                </div>
              )}
              {serviceRevenueScale !== 1 && (
                <div>
                  <span className="text-gray-300">Payout scale:</span>{' '}
                  <span className="font-semibold">×{serviceRevenueScale.toFixed(2)}</span>
                  {metrics.baseServiceRevenueScale === undefined && (
                    <span className="text-red-400 text-[10px] ml-1">(base: N/A)</span>
                  )}
                </div>
              )}
            </div>

            {/* Expenses & Capacity Section */}
            {(monthlyExpensesValue > 0 || monthlyTimeCapacity > 0) && (
              <div className="space-y-1 border-b border-gray-600 pb-1">
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">Expenses & Capacity</div>
                {monthlyExpensesValue > 0 && (
                  <div>
                    <span className="text-gray-300">Monthly expenses:</span>{' '}
                    <span className="font-semibold">${monthlyExpensesValue.toLocaleString()}</span>
                  </div>
                )}
                {monthlyTimeCapacity > 0 && (
                  <div>
                    <span className="text-gray-300">Time capacity bonus:</span>{' '}
                    <span className="font-semibold">+{monthlyTimeCapacity}h/month</span>
                  </div>
                )}
              </div>
            )}

            {/* Tier Modifiers Section (always shown) */}
            <div className="space-y-1 border-b border-gray-600 pb-1">
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Tier Modifiers</div>
              <div className="pl-2 space-y-0.5">
                <div className="text-[10px] text-gray-400">Revenue Multipliers:</div>
                <div className="text-[11px] flex justify-between">
                  <span className="text-gray-300">High:</span>
                  <span className="font-semibold">×{metrics.highTierRevenueMultiplier.toFixed(2)}</span>
                </div>
                <div className="text-[11px] flex justify-between">
                  <span className="text-gray-300">Mid:</span>
                  <span className="font-semibold">×{metrics.midTierRevenueMultiplier.toFixed(2)}</span>
                </div>
                <div className="text-[11px] flex justify-between">
                  <span className="text-gray-300">Low:</span>
                  <span className="font-semibold">×{metrics.lowTierRevenueMultiplier.toFixed(2)}</span>
                </div>
              </div>
              <div className="pl-2 space-y-0.5 mt-1">
                <div className="text-[10px] text-gray-400">Selection Weight:</div>
                <div className="text-[11px] flex justify-between">
                  <span className="text-gray-300">High:</span>
                  <span className="font-semibold">×{metrics.highTierWeightageMultiplier.toFixed(2)}</span>
                </div>
                <div className="text-[11px] flex justify-between">
                  <span className="text-gray-300">Mid:</span>
                  <span className="font-semibold">×{metrics.midTierWeightageMultiplier.toFixed(2)}</span>
                </div>
                <div className="text-[11px] flex justify-between">
                  <span className="text-gray-300">Low:</span>
                  <span className="font-semibold">×{metrics.lowTierWeightageMultiplier.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* EXP Modifiers Section (config-only, not modifiable by effects) */}
            <div className="space-y-1 border-b border-gray-600 pb-1">
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">EXP Modifiers</div>
              <div>
                <span className="text-gray-300">EXP per happy:</span>{' '}
                <span className="font-semibold text-green-400">+{expGainPerHappy}</span>
                {!hasExpGainConfig && (
                  <span className="text-red-400 text-[10px] ml-1">(base: N/A)</span>
                )}
              </div>
              <div>
                <span className="text-gray-300">EXP per angry:</span>{' '}
                <span className="font-semibold text-red-400">-{expLossPerAngry}</span>
                {!hasExpLossConfig && (
                  <span className="text-red-400 text-[10px] ml-1">(base: N/A)</span>
                )}
              </div>
            </div>

            {/* Base Stats Section (non-editable) */}
            <div className="space-y-1">
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Base Stats</div>
              <div>
                <span className="text-gray-300">Customer patience:</span>{' '}
                {customerPatience !== undefined ? (
                  <span className="font-semibold">{customerPatience}s</span>
                ) : (
                  <span className="text-red-400">N/A</span>
                )}
              </div>
              <div>
                <span className="text-gray-300">Month duration:</span>{' '}
                {monthDuration !== undefined ? (
                  <span className="font-semibold">{monthDuration}s</span>
                ) : (
                  <span className="text-red-400">N/A</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Conversion Progress HUD - Below TopBar */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40">
        <div className="bg-black/75 text-white px-3 py-2 rounded-lg shadow-lg min-w-[220px]">
          <div className="text-center mb-2">
            <div className="text-sm font-semibold text-blue-300">Lead Conversion Progress</div>
            <div className="text-xs text-gray-300">Generate leads → Convert to customers</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Next Customer</span>
              <span className="font-bold">{Math.round(leadProgress)}%</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, leadProgress)}%`,
                  backgroundColor: leadProgress >= 100 ? '#10b981' : '#3b82f6'
                }}
              />
            </div>
            <div className="text-xs text-center text-gray-300">
              Conversion Rate: {conversionRate}% per lead
            </div>
          </div>
        </div>
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
            // Use capacity image from config (industry-specific or global)
            const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
            const bedImagePath = getCapacityImageForIndustry(industryId);
            
            // Don't render if no image is configured
            if (!bedImagePath) {
              return null;
            }
            
            // Multi-tile support: get dimensions from position or default to 1x1
            const width = position.width ?? 1;
            const height = position.height ?? 1;
            const anchor = position.anchor ?? 'top-left';
            
            // Calculate pixel dimensions
            const pixelWidth = width * TILE_SIZE;
            const pixelHeight = height * TILE_SIZE;
            
            // Calculate pixel position based on anchor point
            // Start with the top-left corner of the tile at the grid coordinate
            let pixelX = position.x * TILE_SIZE;
            let pixelY = position.y * TILE_SIZE;
            
            // Adjust position based on anchor point
            // For center anchors, we want to center on the tile center, not the tile corner
            const tileCenterX = pixelX + TILE_SIZE / 2;
            const tileCenterY = pixelY + TILE_SIZE / 2;
            
            // Horizontal alignment
            if (anchor === 'top-center' || anchor === 'center' || anchor === 'bottom-center') {
              // Center the graphic horizontally on the tile center
              pixelX = tileCenterX - pixelWidth / 2;
            } else if (anchor === 'top-right' || anchor === 'center-right' || anchor === 'bottom-right') {
              // Align right edge with the right edge of the tile
              pixelX = pixelX + TILE_SIZE - pixelWidth;
            }
            // 'top-left', 'center-left', 'bottom-left' use left edge of tile (no adjustment)
            
            // Vertical alignment
            if (anchor === 'center-left' || anchor === 'center' || anchor === 'center-right') {
              // Center the graphic vertically on the tile center
              pixelY = tileCenterY - pixelHeight / 2;
            } else if (anchor === 'bottom-left' || anchor === 'bottom-center' || anchor === 'bottom-right') {
              // Align bottom edge with the bottom edge of the tile
              pixelY = pixelY + TILE_SIZE - pixelHeight;
            }
            // 'top-left', 'top-center', 'top-right' use top edge of tile (no adjustment)
            
            
            return (
              <div
                key={`bed-${index}`}
                className="absolute pointer-events-none"
                style={{
                  left: `${pixelX}px`,
                  top: `${pixelY}px`,
                  width: `${pixelWidth}px`,
                  height: `${pixelHeight}px`,
                  backgroundImage: `url(${bedImagePath})`,
                  backgroundSize: '100% 100%', // Fill the entire multi-tile area
                  backgroundPosition: 'center center',
                  backgroundRepeat: 'no-repeat',
                  imageRendering: 'pixelated',
                  zIndex: 5, // Below customers (zIndex 10)
                  // Debug outline (remove in production)
                  // ...(process.env.NODE_ENV === 'development' && {
                  //   border: '1px solid rgba(255, 0, 0, 0.5)',
                  //   boxSizing: 'border-box'
                  // })
                }}
              />
            );
          })}

          {/* Render all leads as sprites (behind customers) */}
          {(leads || []).map((lead) => (
            <SpriteLead
              key={lead.id}
              lead={lead}
              scaleFactor={scaleFactor}
            />
          ))}

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
