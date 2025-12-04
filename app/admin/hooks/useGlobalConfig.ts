import { useState, useCallback, useEffect } from 'react';
import { fetchGlobalSimulationConfig, upsertGlobalSimulationConfig } from '@/lib/data/simulationConfigRepository';
// Note: Using defaults only for admin UI form initialization, not runtime game behavior
import { DEFAULT_GLOBAL_SIMULATION_CONFIG } from '@/lib/game/industryConfigs';
import { DEFAULT_WIN_CONDITION, DEFAULT_LOSE_CONDITION, type WinCondition, type LoseCondition } from '@/lib/game/winConditions';
import type { BusinessMetrics, BusinessStats, MovementConfig, MapConfig } from '@/lib/game/types';
import type { Operation } from './types';
import { useConfigStore } from '@/lib/store/configStore';

export function useGlobalConfig() {
  // UI defaults only - actual data loads from DB and overwrites these
  const initialGlobal = DEFAULT_GLOBAL_SIMULATION_CONFIG;
  const [metrics, setMetrics] = useState<BusinessMetrics>({ ...initialGlobal.businessMetrics });
  const [stats, setStats] = useState<BusinessStats>({ ...initialGlobal.businessStats });
  const [eventSecondsInput, setEventSecondsInput] = useState<string>(
    (initialGlobal.businessStats.eventTriggerSeconds || []).join(',')
  );
  const [movementJSON, setMovementJSON] = useState<string>(JSON.stringify(initialGlobal.movement, null, 2));
  const [mapConfigJSON, setMapConfigJSON] = useState<string>('');
  const [capacityImage, setCapacityImage] = useState<string>('');
  const [customerImages, setCustomerImages] = useState<string[]>([]);
  const [staffNamePool, setStaffNamePool] = useState<string[]>([]);
  const [leadDialogues, setLeadDialogues] = useState<string[]>([]);
  const [winCondition, setWinCondition] = useState<WinCondition>({ ...DEFAULT_WIN_CONDITION });
  const [loseCondition, setLoseCondition] = useState<LoseCondition>({ ...DEFAULT_LOSE_CONDITION });
  const [uiConfig, setUiConfig] = useState<{
    eventAutoSelectDurationSeconds?: number;
    outcomePopupDurationSeconds?: number;
  }>({
    eventAutoSelectDurationSeconds: 10,
    outcomePopupDurationSeconds: 5,
  });
  const [status, setStatus] = useState<string | null>(null);
  const [operation, setOperation] = useState<Operation>('idle');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setOperation('loading');
      try {
        const global = await fetchGlobalSimulationConfig();
        if (isMounted && global) {
          if (global.businessMetrics) setMetrics(global.businessMetrics);
          if (global.businessStats) {
            // Merge with defaults to ensure all fields are present
            const mergedStats = { ...initialGlobal.businessStats, ...global.businessStats };
            setStats(mergedStats);
            setEventSecondsInput((mergedStats.eventTriggerSeconds || []).join(','));
          }
          if (global.movement) setMovementJSON(JSON.stringify(global.movement, null, 2));
          if (global.mapConfig) {
            setMapConfigJSON(JSON.stringify(global.mapConfig, null, 2));
          }
          if (global.capacityImage) setCapacityImage(global.capacityImage);
          if (global.customerImages) setCustomerImages(global.customerImages);
          if (global.staffNamePool) setStaffNamePool(global.staffNamePool);
          if (global.leadDialogues) setLeadDialogues(global.leadDialogues);
          if (global.winCondition) setWinCondition(global.winCondition);
          if (global.loseCondition) setLoseCondition(global.loseCondition);
          if (global.uiConfig) setUiConfig(prev => ({ ...prev, ...global.uiConfig }));
        }
      } catch (err) {
        console.error('Failed to load global config', err);
      } finally {
        if (isMounted) {
          setOperation('idle');
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const save = useCallback(async () => {
    setStatus(null);
    let businessMetrics: BusinessMetrics = metrics;
    let businessStats: BusinessStats = { ...stats };
    let movement: any;

    // Normalize Business Stats derived inputs
    const parsedEventSeconds = eventSecondsInput
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n >= 0);
    businessStats.eventTriggerSeconds = parsedEventSeconds;
    try {
      movement = JSON.parse(movementJSON);
    } catch (e) {
      setStatus('Invalid JSON in Movement.');
      return;
    }

    // Parse map config
    let mapConfig: MapConfig | undefined;

    if (mapConfigJSON.trim()) {
      try {
        mapConfig = JSON.parse(mapConfigJSON);
      } catch (e) {
        setStatus('Invalid JSON in Map Config.');
        setOperation('idle');
        return;
      }
    }

    setOperation('saving');
    const result = await upsertGlobalSimulationConfig({
      businessMetrics,
      businessStats,
      movement,
      mapConfig,
      capacityImage: capacityImage || null,
      customerImages: customerImages.length > 0 ? customerImages : null,
      staffNamePool: staffNamePool.length > 0 ? staffNamePool : null,
      leadDialogues: leadDialogues.length > 0 ? leadDialogues.filter(d => d.trim() !== '') : null,
      winCondition,
      loseCondition,
      uiConfig,
    });
    setOperation('idle');

    if (!result.success) {
      setStatus(result.message ?? 'Failed to save global config.');
      return;
    }

    // Update the config store so the game immediately sees the changes
    useConfigStore.getState().setGlobalConfig({
      businessMetrics,
      businessStats,
      movement,
      mapConfig,
      capacityImage: capacityImage || undefined,
      customerImages: customerImages.length > 0 ? customerImages : undefined,
      staffNamePool: staffNamePool.length > 0 ? staffNamePool : undefined,
      leadDialogues: leadDialogues.length > 0 ? leadDialogues : undefined,
      winCondition,
      loseCondition,
      uiConfig,
    });

    setStatus('Global config saved.');
  }, [metrics, stats, eventSecondsInput, movementJSON, mapConfigJSON, capacityImage, customerImages, staffNamePool, leadDialogues, winCondition, loseCondition, uiConfig]);

  const updateMetrics = useCallback((updates: Partial<BusinessMetrics>) => {
    setMetrics(prev => ({ ...prev, ...updates }));
  }, []);

  const updateStats = useCallback((updates: Partial<BusinessStats>) => {
    setStats(prev => ({ ...prev, ...updates }));
  }, []);

  const updateWinCondition = useCallback((updates: Partial<WinCondition>) => {
    setWinCondition(prev => ({ ...prev, ...updates }));
  }, []);

  const updateLoseCondition = useCallback((updates: Partial<LoseCondition>) => {
    setLoseCondition(prev => ({ ...prev, ...updates }));
  }, []);

  const updateUiConfig = useCallback((updates: Partial<typeof uiConfig>) => {
    setUiConfig(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    metrics,
    stats,
    eventSecondsInput,
    movementJSON,
    mapConfigJSON,
    capacityImage,
    customerImages,
    staffNamePool,
    leadDialogues,
    winCondition,
    loseCondition,
    uiConfig,
    status,
    loading: operation === 'loading',
    saving: operation === 'saving',
    operation,
    setEventSecondsInput,
    setMovementJSON,
    setMapConfigJSON,
    setCapacityImage,
    setCustomerImages,
    setStaffNamePool,
    setLeadDialogues,
    updateMetrics,
    updateStats,
    updateWinCondition,
    updateLoseCondition,
    updateUiConfig,
    save,
  };
}

