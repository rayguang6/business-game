import { useState, useCallback, useEffect } from 'react';
import { fetchGlobalSimulationConfig, upsertGlobalSimulationConfig } from '@/lib/data/simulationConfigRepository';
import { DEFAULT_GLOBAL_SIMULATION_CONFIG } from '@/lib/game/industryConfigs';
import { DEFAULT_WIN_CONDITION, DEFAULT_LOSE_CONDITION, type WinCondition, type LoseCondition } from '@/lib/game/winConditions';
import type { BusinessMetrics, BusinessStats, MovementConfig } from '@/lib/game/types';
import type { Operation } from './types';

export function useGlobalConfig() {
  const initialGlobal = DEFAULT_GLOBAL_SIMULATION_CONFIG;
  const [metrics, setMetrics] = useState<BusinessMetrics>({ ...initialGlobal.businessMetrics });
  const [stats, setStats] = useState<BusinessStats>({ ...initialGlobal.businessStats });
  const [eventSecondsInput, setEventSecondsInput] = useState<string>(
    (initialGlobal.businessStats.eventTriggerSeconds || []).join(',')
  );
  const [movementJSON, setMovementJSON] = useState<string>(JSON.stringify(initialGlobal.movement, null, 2));
  const [winCondition, setWinCondition] = useState<WinCondition>({ ...DEFAULT_WIN_CONDITION });
  const [loseCondition, setLoseCondition] = useState<LoseCondition>({ ...DEFAULT_LOSE_CONDITION });
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
            setStats(global.businessStats);
            setEventSecondsInput((global.businessStats.eventTriggerSeconds || []).join(','));
          }
          if (global.movement) setMovementJSON(JSON.stringify(global.movement, null, 2));
          if (global.winCondition) setWinCondition(global.winCondition);
          if (global.loseCondition) setLoseCondition(global.loseCondition);
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

    setOperation('saving');
    const result = await upsertGlobalSimulationConfig({
      businessMetrics,
      businessStats,
      movement,
      winCondition,
      loseCondition,
    });
    setOperation('idle');

    if (!result.success) {
      setStatus(result.message ?? 'Failed to save global config.');
      return;
    }

    setStatus('Global config saved.');
  }, [metrics, stats, eventSecondsInput, movementJSON, winCondition, loseCondition]);

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

  return {
    metrics,
    stats,
    eventSecondsInput,
    movementJSON,
    winCondition,
    loseCondition,
    status,
    loading: operation === 'loading',
    saving: operation === 'saving',
    operation,
    setEventSecondsInput,
    setMovementJSON,
    updateMetrics,
    updateStats,
    updateWinCondition,
    updateLoseCondition,
    save,
  };
}

