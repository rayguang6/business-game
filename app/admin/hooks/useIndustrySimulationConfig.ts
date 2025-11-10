import { useState, useEffect, useCallback } from 'react';
import type { IndustryId, GridPosition } from '@/lib/game/types';
import type {
  BusinessMetrics,
  BusinessStats,
} from '@/lib/game/types';
import type { WinCondition, LoseCondition } from '@/lib/game/winConditions';
import {
  fetchIndustrySimulationConfig,
  upsertIndustrySimulationConfig,
} from '@/lib/data/industrySimulationConfigRepository';

type Operation = 'idle' | 'loading' | 'saving';

export function useIndustrySimulationConfig(industryId: IndustryId | null) {
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null);
  const [businessStats, setBusinessStats] = useState<BusinessStats | null>(null);
  
  // Map config - separate fields (no more JSON parsing!)
  const [mapWidth, setMapWidth] = useState<number | null>(null);
  const [mapHeight, setMapHeight] = useState<number | null>(null);
  const [mapWalls, setMapWalls] = useState<GridPosition[]>([]);
  
  // Layout config - separate fields (no more JSON parsing!)
  const [entryPosition, setEntryPosition] = useState<GridPosition | null>(null);
  const [waitingPositions, setWaitingPositions] = useState<GridPosition[]>([]);
  const [serviceRoomPositions, setServiceRoomPositions] = useState<GridPosition[]>([]);
  const [staffPositions, setStaffPositions] = useState<GridPosition[]>([]);
  
  const [capacityImage, setCapacityImage] = useState<string>('');
  const [winCondition, setWinCondition] = useState<WinCondition | null>(null);
  const [loseCondition, setLoseCondition] = useState<LoseCondition | null>(null);
  // customerImages and staffNamePool removed - they're global only

  const [operation, setOperation] = useState<Operation>('idle');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!industryId) {
      setBusinessMetrics(null);
      setBusinessStats(null);
      setMapWidth(null);
      setMapHeight(null);
      setMapWalls([]);
      setEntryPosition(null);
      setWaitingPositions([]);
      setServiceRoomPositions([]);
      setStaffPositions([]);
      setCapacityImage('');
      setWinCondition(null);
      setLoseCondition(null);
      return;
    }

    let isMounted = true;
    (async () => {
      setOperation('loading');
      try {
        const config = await fetchIndustrySimulationConfig(industryId);
        if (isMounted && config) {
          if (config.businessMetrics) setBusinessMetrics(config.businessMetrics);
          if (config.businessStats) setBusinessStats(config.businessStats);
          
          // Load map config from separate fields (no JSON parsing!)
          if (config.mapConfig) {
            setMapWidth(config.mapConfig.width);
            setMapHeight(config.mapConfig.height);
            setMapWalls(config.mapConfig.walls || []);
          }
          
          // Load layout config from separate fields (no JSON parsing!)
          if (config.layoutConfig) {
            setEntryPosition(config.layoutConfig.entryPosition || null);
            setWaitingPositions(config.layoutConfig.waitingPositions || []);
            setServiceRoomPositions(config.layoutConfig.serviceRoomPositions || []);
            setStaffPositions(config.layoutConfig.staffPositions || []);
          }
          
          if (config.capacityImage) setCapacityImage(config.capacityImage);
          if (config.winCondition) setWinCondition(config.winCondition);
          if (config.loseCondition) setLoseCondition(config.loseCondition);
          // customerImages and staffNamePool removed - they're global only
        }
      } catch (err) {
        console.error('Failed to load industry simulation config', err);
        if (isMounted) {
          setStatus({ type: 'error', message: 'Failed to load config' });
        }
      } finally {
        if (isMounted) {
          setOperation('idle');
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [industryId]);

  const save = useCallback(async () => {
    if (!industryId) {
      setStatus({ type: 'error', message: 'No industry selected' });
      return;
    }

    setStatus(null);
    setOperation('saving');

    try {
      // Save all fields directly - no JSON parsing needed!
      const result = await upsertIndustrySimulationConfig(industryId, {
        businessMetrics: businessMetrics ?? undefined,
        businessStats: businessStats ?? undefined,
        // Movement removed - it's global only
        mapWidth: mapWidth ?? null,
        mapHeight: mapHeight ?? null,
        mapWalls: mapWalls.length > 0 ? mapWalls : null,
        entryPosition: entryPosition ?? null,
        waitingPositions: waitingPositions.length > 0 ? waitingPositions : null,
        serviceRoomPositions: serviceRoomPositions.length > 0 ? serviceRoomPositions : null,
        staffPositions: staffPositions.length > 0 ? staffPositions : null,
        capacityImage: capacityImage || null,
        winCondition: winCondition ?? undefined,
        loseCondition: loseCondition ?? undefined,
        // customerImages and staffNamePool removed - they're global only
      });

      if (result.success) {
        setStatus({ type: 'success', message: 'Config saved successfully!' });
      } else {
        setStatus({ type: 'error', message: result.message || 'Failed to save config' });
      }
    } catch (err) {
      console.error('Failed to save industry simulation config', err);
      setStatus({ type: 'error', message: 'Failed to save config' });
    } finally {
      setOperation('idle');
    }
  }, [
    industryId,
    businessMetrics,
    businessStats,
    mapWidth,
    mapHeight,
    mapWalls,
    entryPosition,
    waitingPositions,
    serviceRoomPositions,
    staffPositions,
    capacityImage,
    winCondition,
    loseCondition,
  ]);

  const updateMetrics = useCallback((updates: Partial<BusinessMetrics>) => {
    setBusinessMetrics((prev) => {
      const current = prev || {
        startingCash: 0,
        monthlyExpenses: 0,
        startingReputation: 0,
        founderWorkHours: 0,
      };
      return { ...current, ...updates };
    });
  }, []);

  const updateStats = useCallback((updates: Partial<BusinessStats>) => {
    setBusinessStats((prev) => {
      const current = prev || {
        ticksPerSecond: 10,
        monthDurationSeconds: 60,
        customerSpawnIntervalSeconds: 3,
        customerPatienceSeconds: 10,
        leavingAngryDurationTicks: 10,
        customerSpawnPosition: { x: 4, y: 9 },
        treatmentRooms: 2,
        reputationGainPerHappyCustomer: 1,
        reputationLossPerAngryCustomer: 1,
        baseHappyProbability: 1,
        eventTriggerSeconds: [],
        serviceRevenueMultiplier: 1,
        serviceRevenueScale: 10,
      };
      return { ...current, ...updates };
    });
  }, []);

  const updateWinCondition = useCallback((updates: Partial<WinCondition>) => {
    setWinCondition((prev) => {
      const current = prev || {
        founderHoursMax: 40,
        monthlyProfitTarget: 0,
        consecutiveMonthsRequired: 2,
      };
      return { ...current, ...updates };
    });
  }, []);

  const updateLoseCondition = useCallback((updates: Partial<LoseCondition>) => {
    setLoseCondition((prev) => {
      const current = prev || {
        cashThreshold: 0,
        reputationThreshold: 0,
        founderHoursMax: 400,
      };
      return { ...current, ...updates };
    });
  }, []);

  return {
    // Data
    businessMetrics,
    businessStats,
    mapWidth,
    mapHeight,
    mapWalls,
    entryPosition,
    waitingPositions,
    serviceRoomPositions,
    staffPositions,
    capacityImage,
    winCondition,
    loseCondition,
    // Setters
    setBusinessMetrics,
    setBusinessStats,
    setMapWidth,
    setMapHeight,
    setMapWalls,
    setEntryPosition,
    setWaitingPositions,
    setServiceRoomPositions,
    setStaffPositions,
    setCapacityImage,
    setWinCondition,
    setLoseCondition,
    // Update helpers
    updateMetrics,
    updateStats,
    updateWinCondition,
    updateLoseCondition,
    // Operations
    operation,
    status,
    save,
  };
}

