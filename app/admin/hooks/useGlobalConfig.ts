import { useState, useCallback, useEffect } from 'react';
import { fetchGlobalConfig, upsertGlobalConfig } from '@/lib/server/actions/adminActions';
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
  const [capacityImage, setCapacityImage] = useState<string>('');
  const [customerImages, setCustomerImages] = useState<string[]>([]);
  const [leadDialogues, setLeadDialogues] = useState<string[]>([]);
  const [winCondition, setWinCondition] = useState<WinCondition>({ ...DEFAULT_WIN_CONDITION });
  const [loseCondition, setLoseCondition] = useState<LoseCondition>({ ...DEFAULT_LOSE_CONDITION });
  type UiConfig = {
    eventAutoSelectDurationSeconds?: number;
    outcomePopupDurationSeconds?: number;
  };

  const [uiConfig, setUiConfig] = useState<UiConfig>({
    eventAutoSelectDurationSeconds: 10,
    outcomePopupDurationSeconds: 5,
  });
  const [status, setStatus] = useState<string | null>(null);
  const [operation, setOperation] = useState<Operation>('idle');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setOperation('loading');
      setStatus(null); // Clear any previous errors
      try {
        const global = await fetchGlobalConfig();
        if (!isMounted) return;
        
        if (!global) {
          // Config doesn't exist yet - this is OK, will use defaults
          setStatus('No global config found. Using defaults.');
          setOperation('idle');
          return;
        }
        
        if (global.businessMetrics) setMetrics(global.businessMetrics);
        if (global.businessStats) {
          // Merge with defaults to ensure all fields are present
          const mergedStats = { ...initialGlobal.businessStats, ...global.businessStats };
          setStats(mergedStats);
          setEventSecondsInput((mergedStats.eventTriggerSeconds || []).join(','));
        }
        if (global.movement) {
          try {
            setMovementJSON(JSON.stringify(global.movement, null, 2));
          } catch (err) {
            console.error('Failed to stringify movement config', err);
            setStatus('Warning: Failed to parse movement config');
          }
        }
        if (global.capacityImage) setCapacityImage(global.capacityImage);
        if (global.customerImages) setCustomerImages(global.customerImages);
        if (global.leadDialogues) setLeadDialogues(global.leadDialogues);
        if (global.winCondition) setWinCondition(global.winCondition);
        if (global.loseCondition) setLoseCondition(global.loseCondition);
        if (global.uiConfig) setUiConfig((prev: UiConfig) => ({ ...prev, ...global.uiConfig }));
        
        setStatus('Global config loaded successfully');
      } catch (err) {
        console.error('Failed to load global config', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load config';
        setStatus(`Failed to load global config: ${errorMessage}`);
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
    let movement: MovementConfig;

    // Normalize Business Stats derived inputs
    const parsedEventSeconds = eventSecondsInput
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n >= 0);
    businessStats.eventTriggerSeconds = parsedEventSeconds;
    
    // Parse and validate movement JSON
    try {
      movement = JSON.parse(movementJSON);
      
      // Validate movement structure
      if (!movement || typeof movement !== 'object') {
        setStatus('Invalid movement config: must be an object');
        return;
      }
      
      if (typeof movement.customerTilesPerTick !== 'number' || 
          typeof movement.animationReferenceTilesPerTick !== 'number' ||
          typeof movement.walkFrameDurationMs !== 'number') {
        setStatus('Invalid movement config: missing required fields (customerTilesPerTick, animationReferenceTilesPerTick, walkFrameDurationMs)');
        return;
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Invalid JSON';
      setStatus(`Invalid JSON in Movement config: ${errorMessage}`);
      return;
    }

    setOperation('saving');
    
    try {
      const result = await upsertGlobalConfig({
        businessMetrics,
        businessStats,
        movement,
        capacityImage: capacityImage || null,
        customerImages: customerImages.length > 0 ? customerImages : null,
        leadDialogues: leadDialogues.length > 0 ? leadDialogues.filter(d => d.trim() !== '') : null,
        winCondition,
        loseCondition,
        uiConfig,
      });
      
      setOperation('idle');

      if (!result.success) {
        const errorMsg = result.message ?? 'Failed to save global config';
        setStatus(errorMsg);
        return;
      }

      // Update the config store so the game immediately sees the changes
      useConfigStore.getState().setGlobalConfig({
        businessMetrics,
        businessStats,
        movement,
        capacityImage: capacityImage || undefined,
        customerImages: customerImages.length > 0 ? customerImages : undefined,
        leadDialogues: leadDialogues.length > 0 ? leadDialogues : undefined,
        winCondition,
        loseCondition,
        uiConfig,
      });

      setStatus('Global config saved successfully.');
    } catch (err) {
      console.error('Failed to save global config', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save config';
      setStatus(`Failed to save global config: ${errorMessage}`);
      setOperation('idle');
    }
  }, [metrics, stats, eventSecondsInput, movementJSON, capacityImage, customerImages, leadDialogues, winCondition, loseCondition, uiConfig]);

  const updateMetrics = useCallback((updates: Partial<BusinessMetrics>) => {
    setMetrics((prev: BusinessMetrics) => ({ ...prev, ...updates }));
  }, []);

  const updateStats = useCallback((updates: Partial<BusinessStats>) => {
    setStats((prev: BusinessStats) => ({ ...prev, ...updates }));
  }, []);

  const updateWinCondition = useCallback((updates: Partial<WinCondition>) => {
    setWinCondition((prev: WinCondition) => ({ ...prev, ...updates }));
  }, []);

  const updateLoseCondition = useCallback((updates: Partial<LoseCondition>) => {
    setLoseCondition((prev: LoseCondition) => ({ ...prev, ...updates }));
  }, []);

  const updateUiConfig = useCallback((updates: Partial<UiConfig>) => {
    setUiConfig((prev: UiConfig) => ({ ...prev, ...updates }));
  }, []);

  return {
    metrics,
    stats,
    eventSecondsInput,
    movementJSON,
    capacityImage,
    customerImages,
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
    setCapacityImage,
    setCustomerImages,
    setLeadDialogues,
    updateMetrics,
    updateStats,
    updateWinCondition,
    updateLoseCondition,
    updateUiConfig,
    save,
  };
}

