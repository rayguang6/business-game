'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { CustomerStatus } from '@/lib/features/customers';
import type { Staff } from '@/lib/features/staff';
import { WaitingArea } from './WaitingArea';
import { TreatmentRoom } from './TreatmentRoom';
import { Character2D } from './Character2D';
import { SpriteCustomer } from './SpriteCustomer';
import { SpriteLead } from './SpriteLead';
import { SpriteStaff } from './SpriteStaff';
import { GridOverlay } from './GridOverlay';
import { LeadProgress } from '../ui/LeadProgress';
import { DEFAULT_INDUSTRY_ID, getBusinessStats, getBusinessMetrics, getLayoutConfig, getCapacityImageForIndustry } from '@/lib/game/config';
import { IndustryId } from '@/lib/game/types';
import { effectManager, GameMetric } from '@/lib/game/effectManager';
import { useConfigStore } from '@/lib/store/configStore';
import { getMonthlyBaseExpenses } from '@/lib/features/economy';
import { ConfigErrorPage } from '../ui/ConfigErrorPage';

// Canvas scaling configuration
const CANVAS_CONFIG = {
  // Reference size (what we design for) - 10x10 tiles at 32px each
  REFERENCE_SIZE: 320, // 10 tiles × 32px = 320px
  // Responsive breakpoints
  BREAKPOINTS: {
    mobile: 320,   // 1x scale
    tablet: 384,   // 1.2x scale
    desktop:560,  // 1.75x scale
    large: 960     // 2.25x scale for very wide screens
  }
};

// HUD moved to GameClient for unified layout

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
    conversionRate,
    gameTime,
    hiredStaff,
    mainCharacter,
  } = useGameStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(350);
  const [scaleFactor, setScaleFactor] = useState(1);
  // Hide by default - toggle with 'D' key for debugging
  const [showModifiers, setShowModifiers] = useState(false);
  // Hide grid by default - toggle with 'G' key for debugging
  const [showGrid, setShowGrid] = useState(false);

  // Calculate responsive canvas size
  useEffect(() => {
    const updateCanvasSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Determine canvas size based on screen size
      let size = CANVAS_CONFIG.BREAKPOINTS.mobile;
      if (width >= 2160) size = CANVAS_CONFIG.BREAKPOINTS.large;      
      else if (width >= 1024) size = CANVAS_CONFIG.BREAKPOINTS.desktop; 
      else if (width >= 768) size = CANVAS_CONFIG.BREAKPOINTS.tablet;   
      
      setCanvasSize(size);
      setScaleFactor(size / CANVAS_CONFIG.REFERENCE_SIZE);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Keyboard shortcut to toggle debug stats (development mode only)
  useEffect(() => {
    // Only enable in development mode
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      // Press 'D' key to toggle debug stats
      if (e.key === 'd' || e.key === 'D') {
        // Only toggle if not typing in an input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          setShowModifiers((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Keyboard shortcut to toggle grid overlay (development mode only)
  useEffect(() => {
    // Only enable in development mode
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      // Press 'G' key to toggle grid overlay
      if (e.key === 'g' || e.key === 'G') {
        // Only toggle if not typing in an input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          setShowGrid((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  const configStatus = useConfigStore((state) => state.configStatus);
  const globalConfig = useConfigStore((state) => state.globalConfig);
  const industryConfig = useConfigStore((state) => state.industryConfigs[industryId]);
  
  // Get businessStats fresh each time (same as mechanics.ts does)
  // Depend on config store state so it recomputes when config is loaded
  const businessStats = useMemo(() => getBusinessStats(industryId), [industryId, globalConfig, industryConfig]);
  const layoutOverride = useConfigStore((state) => state.industryConfigs[industryId]?.layout);
  const layout = useMemo(() => layoutOverride ?? getLayoutConfig(industryId), [layoutOverride, industryId, industryConfig]);

  // Define computeMetrics BEFORE conditional returns (Rules of Hooks)
  const computeMetrics = useCallback(() => {
    // Mirror exactly what mechanics.ts does (line 580-605)
    // This ensures we use the same calculation path as the game
    const baseStats = getBusinessStats(industryId);
    const baseMetrics = getBusinessMetrics(industryId);
    
    // Safe fallback for monthly expenses if metrics aren't loaded yet
    const baseMonthlyExpenses = baseMetrics?.monthlyExpenses ?? 0;
    
    // Early return if baseStats is null (shouldn't happen due to validation above, but TypeScript needs this)
    if (!baseStats) {
      return {
        leadsPerMonth: 20,
        spawnIntervalSeconds: 3,
        serviceSpeedMultiplier: 1.0,
        serviceCapacity: 1,
        serviceRevenueMultiplier: 1,
        serviceRevenueFlatBonus: 0,
        serviceRevenueScale: 1,
        conversionRate: 10,
        failureRate: 0,
        monthlyExpenses: baseMonthlyExpenses,
        expGainPerHappyCustomer: 1,
        expLossPerAngryCustomer: 1,
        highTierRevenueMultiplier: 1,
        midTierRevenueMultiplier: 1,
        lowTierRevenueMultiplier: 1,
        highTierWeightageMultiplier: 1,
        midTierWeightageMultiplier: 1,
        lowTierWeightageMultiplier: 1,
        baseServiceRevenueMultiplier: undefined,
        baseServiceRevenueScale: undefined,
        baseConversionRate: undefined,
        baseFailureRate: undefined,
        baseServiceCapacity: undefined,
        baseExpGainPerHappy: undefined,
        baseExpLossPerAngry: undefined,
      };
    }
    
    // Calculate metrics exactly like mechanics.ts does
    // Note: Game uses fallbacks (?? 1, ?? 10, ?? 0) for calculations to work
    // But we also track base values (without fallbacks) to show N/A when missing
    // Check if values exist in the returned config (not using fallbacks)
    
    // Calculate leadsPerMonth with effects applied, then convert to spawnIntervalSeconds
    const leadsPerMonth = Math.max(0, Math.round(effectManager.calculate(GameMetric.LeadsPerMonth, baseStats.leadsPerMonth)));
    const monthDurationSeconds = baseStats.monthDurationSeconds;
    // Formula: spawnIntervalSeconds = monthDurationSeconds / leadsPerMonth
    // Example: 60s month / 1 lead = 60s per lead
    // Example: 60s month / 2 leads = 30s per lead
    const spawnIntervalSeconds = monthDurationSeconds > 0 && leadsPerMonth > 0
      ? monthDurationSeconds / leadsPerMonth
      : monthDurationSeconds; // If no leads, use month duration as fallback (no spawning)
    
    return {
      // Calculated values (with effects applied) - same as game uses
      leadsPerMonth,
      spawnIntervalSeconds,
      serviceSpeedMultiplier: effectManager.calculate(GameMetric.ServiceSpeedMultiplier, 1.0),
      serviceCapacity: effectManager.calculate(GameMetric.ServiceCapacity, baseStats.serviceCapacity),
      serviceRevenueMultiplier: effectManager.calculate(
        GameMetric.ServiceRevenueMultiplier,
        baseStats.serviceRevenueMultiplier ?? 1,
      ),
      serviceRevenueFlatBonus: effectManager.calculate(GameMetric.ServiceRevenueFlatBonus, 0),
      serviceRevenueScale: baseStats.serviceRevenueScale ?? 1,
      conversionRate: effectManager.calculate(GameMetric.ConversionRate, baseStats.conversionRate ?? 10),
      failureRate: effectManager.calculate(GameMetric.FailureRate, baseStats.failureRate ?? 0),
      monthlyExpenses: effectManager.calculate(GameMetric.MonthlyExpenses, baseMonthlyExpenses),
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
      baseServiceCapacity: baseStats.serviceCapacity,
      baseExpGainPerHappy: baseStats.expGainPerHappyCustomer,
      baseExpLossPerAngry: baseStats.expLossPerAngryCustomer,
    };
  }, [industryId, globalConfig, industryConfig]);

  const [metrics, setMetrics] = useState(() => computeMetrics());

  useEffect(() => {
    setMetrics(computeMetrics());
    const unsubscribe = effectManager.subscribe(() => {
      setMetrics(computeMetrics());
    });
    return () => unsubscribe();
  }, [computeMetrics]);

  // Wait for config to be ready before showing errors
  // If config is still loading, show a loading state instead of error
  if (configStatus !== 'ready') {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center">
          <div className="text-lg font-semibold text-white mb-2">Loading game configuration...</div>
          <div className="text-sm text-gray-400">Please wait while we load the game data.</div>
        </div>
      </div>
    );
  }

  // Validate required config - show error if missing (only after config is ready)
  if (!businessStats || !layout) {
    return (
      <ConfigErrorPage
        title="Configuration Missing"
        message="Required game configuration is missing. Please configure this industry in the admin panel."
        errorType="database"
        details={
          !businessStats
            ? 'Business stats are not configured for this industry. Please configure business_stats in the admin panel.'
            : 'Layout configuration is missing for this industry. Please configure layout positions (entry_position, waiting_positions, service_rooms, staff_positions) in the admin panel.'
        }
      />
    );
  }

  if (!selectedIndustry) return null;
  const serviceCapacityLabel = 'Service Capacity';
  // Get service room positions for rendering beds (from database or fallback)
  const serviceRooms = layout.serviceRooms;
  // Use serviceCapacity from metrics (no cap - handled by upgrades)
  // For display: show undefined to indicate missing config
  // For array operations: use fallback to prevent crashes
  const serviceCapacityDisplay = metrics.serviceCapacity !== undefined 
    ? Math.max(1, Math.round(metrics.serviceCapacity))
    : undefined;
  const serviceCapacity = serviceCapacityDisplay ?? 1; // Fallback for array operations
  const mapBackground = selectedIndustry.mapImage ?? '/images/maps/dental-map.png';
  const staffPositions = layout.staffPositions;
  // Get main character position from main character state if available, otherwise from layout config
  const mainCharacterPosition = mainCharacter && mainCharacter.x !== undefined && mainCharacter.y !== undefined
    ? {
        x: mainCharacter.x,
        y: mainCharacter.y,
        facingDirection: mainCharacter.facingDirection,
      }
    : (layout.mainCharacterPosition 
        ?? (staffPositions.length > 0 ? staffPositions[0] : { x: 4, y: 0 }));
  // Get main character sprite image from main character state (already initialized with proper fallback)
  const mainCharacterSpriteImage = mainCharacter?.spriteImage || '/images/staff/staff1.png';
  const TILE_SIZE = 32;

  // Base stats (non-editable) - read directly from config (same as game uses)
  const customerPatience = effectManager.calculate(GameMetric.CustomerPatienceSeconds, businessStats.customerPatienceSeconds);
  const monthDuration = businessStats.monthDurationSeconds;
  
  // Use calculated values (with effects) - these match what the game uses
  const leadsPerMonth = metrics.leadsPerMonth;
  const spawnIntervalSeconds = metrics.spawnIntervalSeconds;
  const serviceSpeedMultiplier = metrics.serviceSpeedMultiplier;
  const serviceRevenueMultiplier = metrics.serviceRevenueMultiplier;
  const serviceRevenueBonus = metrics.serviceRevenueFlatBonus;
  const serviceRevenueScale = metrics.serviceRevenueScale;
  const failureRate = metrics.failureRate;
  // Use conversionRate from calculated metrics (same as game uses)
  const conversionRateValue = metrics.conversionRate;
  const monthlyExpensesValue = metrics.monthlyExpenses;
  
  // Base stats (non-editable) - read directly from config (same as game uses)
  const expGainPerHappy = metrics.expGainPerHappyCustomer; // Read directly from config
  const expLossPerAngry = metrics.expLossPerAngryCustomer; // Read directly from config
  const hasExpGainConfig = typeof metrics.baseExpGainPerHappy === 'number' && !Number.isNaN(metrics.baseExpGainPerHappy);
  const hasExpLossConfig = typeof metrics.baseExpLossPerAngry === 'number' && !Number.isNaN(metrics.baseExpLossPerAngry);
  
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
    <div className="h-full w-full bg-[#8ed0fb] relative overflow-hidden flex items-center justify-end md:justify-center">
      {/* Debug stats panel - toggle with 'D' key (development mode only) */}
      {process.env.NODE_ENV === 'development' && showModifiers && (
        <div className="absolute bottom-3 right-3 z-40">
          <div className="bg-black/75 text-white text-xs sm:text-[13px] px-3 py-2 rounded-lg shadow-lg space-y-1.5 max-w-[280px] max-h-[80vh] overflow-y-auto">
            <div className="font-semibold text-sm mb-1 sticky top-0 bg-black/75 pb-1">Live Modifiers</div>

            {/* Lead Flow Section */}
            <div className="space-y-1 border-b border-gray-600 pb-1">
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Lead Flow</div>
              <div>
                <span className="text-gray-300">Leads per month:</span>{' '}
                <span className="font-semibold">
                  {leadsPerMonth != null ? `${leadsPerMonth}` : 'N/A'}
                </span>
                {spawnIntervalSeconds > 0 && monthDuration > 0 && (
                  <div className="text-xs text-slate-500 mt-0.5 ml-4">
                    Spawn interval: {spawnIntervalSeconds.toFixed(2)}s
                    <br />
                    Month duration: {monthDuration}s
                    <br />
                    <span className="text-slate-400">
                      Formula: {monthDuration}s ÷ {leadsPerMonth} = {spawnIntervalSeconds.toFixed(2)}s per lead
                    </span>
                  </div>
                )}
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
                <span className="text-gray-300">{serviceCapacityLabel}:</span>{' '}
                {serviceCapacityDisplay !== undefined ? (
                  <span className="font-semibold">{serviceCapacityDisplay}</span>
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
                <span className="text-gray-300">Revenue bonus:</span>{' '}
                <span className="font-semibold">{serviceRevenueMultiplier.toFixed(0)}%</span>
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
            {monthlyExpensesValue > 0 && (
              <div className="space-y-1 border-b border-gray-600 pb-1">
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">Expenses</div>
                <div>
                  <span className="text-gray-300">Monthly expenses:</span>{' '}
                  <span className="font-semibold">${monthlyExpensesValue.toLocaleString()}</span>
                </div>
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
        </div>
      )}


      {/* Lead Progress Widget - Bottom Left - DISABLED FOR NOW */}
      {/* <LeadProgress position="bottom-left" /> */}

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
        <GridOverlay scaleFactor={scaleFactor} showGrid={showGrid} />

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
          {/* Render main character at configured position */}
          {mainCharacter && (
            <SpriteStaff
              key={mainCharacter.id}
              staff={{
                ...mainCharacter,
                spriteImage: mainCharacterSpriteImage, // Use sprite from layout config (overrides main character's sprite)
              } as Staff}
              position={mainCharacterPosition}
              scaleFactor={scaleFactor}
            />
          )}

          {/* Render all hired staff - use dynamic positions when available, fallback to staffPositions */}
          {hiredStaff.map((staff, index) => {
            // Use fallback position from staffPositions array (for idle staff without dynamic positions)
            const fallbackPosition = staffPositions[index] || staffPositions[0] || { x: 4, y: 0 };
            
            return (
              <SpriteStaff
                key={staff.id}
                staff={staff}
                position={fallbackPosition}
                scaleFactor={scaleFactor}
              />
            );
          })}

          {/* Render beds at service room positions (only for active rooms) */}
          {serviceRooms.slice(0, serviceCapacity).map((room, index) => {
            // Use capacity image from config (industry-specific or global)
            const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
            const bedImagePath = getCapacityImageForIndustry(industryId);
            
            // Don't render if no image is configured
            if (!bedImagePath) {
              return null;
            }
            
            // Use customer position for bed rendering
            const position = room.customerPosition;
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
                  {serviceCapacityLabel}
                </h4>
                <div 
                  className="text-gray-500"
                  style={{ fontSize: `${12 * scaleFactor}px` }}
                >
                  {customers.filter((c) => c.status === CustomerStatus.InService).length}/{serviceCapacity} in service
                </div>
              </div>
              <div className="space-y-2">
                {Array.from({ length: serviceCapacity }, (_, index) => (
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
