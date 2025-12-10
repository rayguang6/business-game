import { useState, useCallback, useEffect } from 'react';
import type { IndustryId, GridPosition, ServiceRoomConfig } from '@/lib/game/types';
import type { BusinessMetrics, BusinessStats, MovementConfig, MapConfig } from '@/lib/game/types';
import type { WinCondition, LoseCondition } from '@/lib/game/winConditions';
import { fetchGlobalConfig, fetchIndustryConfig, upsertGlobalConfig, upsertIndustryConfig } from '@/lib/server/actions/adminActions';
import type { Operation } from './types';
import { useToastFunctions } from '../components/ui/ToastContext';

type UiConfig = {
  eventAutoSelectDurationSeconds?: number;
  outcomePopupDurationSeconds?: number;
};

type ConfigType = 'global' | 'industry';

interface UseSimulationConfigOptions {
  industryId?: IndustryId;
  configType: ConfigType;
}

interface UseSimulationConfigReturn {
  // Data - nullable for industry configs (means using global defaults)
  businessMetrics: BusinessMetrics | null;
  businessStats: BusinessStats | null;

  // Movement (global only)
  movement: MovementConfig | null;

  // Map config - separate fields
  mapWidth: number | null;
  mapHeight: number | null;
  mapWalls: GridPosition[];

  // Layout config - separate fields (industry-specific)
  entryPosition: GridPosition | null;
  waitingPositions: GridPosition[];
  serviceRooms: ServiceRoomConfig[];
  staffPositions: GridPosition[];
  mainCharacterPosition: GridPosition | null;
  mainCharacterSpriteImage: string;

  // UI/Media config
  capacityImage: string;
  customerImages: string[];
  staffNamePool: string[];
  leadDialogues: string[];

  // Game conditions
  winCondition: WinCondition | null;
  loseCondition: LoseCondition | null;

  // UI timing config
  uiConfig: UiConfig;

  // Event sequencing (industry-specific)
  eventSelectionMode: 'random' | 'sequence';
  eventSequence: string[];

  // Status
  loading: boolean;
  saving: boolean;
  status: string | null;

  // Actions
  updateMetrics: (updates: Partial<BusinessMetrics>) => void;
  updateStats: (updates: Partial<BusinessStats>) => void;
  setBusinessMetrics: (value: BusinessMetrics | null) => void;
  setBusinessStats: (value: BusinessStats | null) => void;
  updateMovement: (movement: MovementConfig | null) => void;
  updateMapConfig: (width: number | null, height: number | null, walls: GridPosition[]) => void;
  updateLayoutConfig: (updates: {
    entryPosition?: GridPosition | null;
    waitingPositions?: GridPosition[];
    serviceRooms?: ServiceRoomConfig[];
    staffPositions?: GridPosition[];
    mainCharacterPosition?: GridPosition | null;
    mainCharacterSpriteImage?: string;
  }) => void;
  updateWinCondition: (updates: Partial<WinCondition>) => void;
  updateLoseCondition: (updates: Partial<LoseCondition>) => void;
  setWinCondition: (value: WinCondition | null) => void;
  setLoseCondition: (value: LoseCondition | null) => void;
  updateUiConfig: (updates: Partial<UiConfig>) => void;
  updateEventConfig: (mode: 'random' | 'sequence', sequence: string[]) => void;
  updateMediaConfig: (updates: {
    capacityImage?: string;
    customerImages?: string[];
    staffNamePool?: string[];
    leadDialogues?: string[];
  }) => void;
  save: () => Promise<void>;
  reset: () => void;

}

export function useSimulationConfig({
  industryId,
  configType
}: UseSimulationConfigOptions): UseSimulationConfigReturn {
  // UI defaults - these will be overwritten by DB data
  const getDefaultMetrics = (): BusinessMetrics => ({
    startingCash: configType === 'global' ? 10000 : 0,
    monthlyExpenses: configType === 'global' ? 1000 : 0,
    startingExp: 0,
  });

  const getDefaultStats = (): BusinessStats => ({
    ticksPerSecond: 10,
    monthDurationSeconds: 60,
    leadsPerMonth: 20, // 60s month / 3s interval = 20 leads/month
    customerPatienceSeconds: 10,
    leavingAngryDurationTicks: 10,
    customerSpawnPosition: { x: 4, y: 9 },
    serviceCapacity: 2,
    expGainPerHappyCustomer: 1,
    expLossPerAngryCustomer: 1,
    expPerLevel: 200,
    eventTriggerSeconds: [],
    serviceRevenueMultiplier: 100,
    serviceRevenueScale: 10,
  });

  const getDefaultMovement = (): MovementConfig => ({
    customerTilesPerTick: 0.1,
    animationReferenceTilesPerTick: 0.15,
    walkFrameDurationMs: 200,
    minWalkFrameDurationMs: 100,
    maxWalkFrameDurationMs: 300,
    celebrationFrameDurationMs: 150,
  });

  // State
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(
    configType === 'global' ? getDefaultMetrics() : null
  );
  const [businessStats, setBusinessStats] = useState<BusinessStats | null>(
    configType === 'global' ? getDefaultStats() : null
  );
  const [movement, setMovement] = useState<MovementConfig | null>(
    configType === 'global' ? getDefaultMovement() : null
  );


  // Map config
  const [mapWidth, setMapWidth] = useState<number | null>(null);
  const [mapHeight, setMapHeight] = useState<number | null>(null);
  const [mapWalls, setMapWalls] = useState<GridPosition[]>([]);

  // Layout config (industry-specific)
  const [entryPosition, setEntryPosition] = useState<GridPosition | null>(null);
  const [waitingPositions, setWaitingPositions] = useState<GridPosition[]>([]);
  const [serviceRooms, setServiceRooms] = useState<ServiceRoomConfig[]>([]);
  const [staffPositions, setStaffPositions] = useState<GridPosition[]>([]);
  const [mainCharacterPosition, setMainCharacterPosition] = useState<GridPosition | null>(null);
  const [mainCharacterSpriteImage, setMainCharacterSpriteImage] = useState<string>('');

  // UI/Media config
  const [capacityImage, setCapacityImage] = useState<string>('');
  const [customerImages, setCustomerImages] = useState<string[]>([]);
  const [staffNamePool, setStaffNamePool] = useState<string[]>([]);
  const [leadDialogues, setLeadDialogues] = useState<string[]>([]);

  // Game conditions
  const [winCondition, setWinCondition] = useState<WinCondition | null>(null);
  const [loseCondition, setLoseCondition] = useState<LoseCondition | null>(null);

  // UI timing config
  const [uiConfig, setUiConfig] = useState<UiConfig>({
    eventAutoSelectDurationSeconds: 10,
    outcomePopupDurationSeconds: 5,
  });

  // Event sequencing (industry-specific)
  const [eventSelectionMode, setEventSelectionMode] = useState<'random' | 'sequence'>('random');
  const [eventSequence, setEventSequence] = useState<string[]>([]);

  // Status
  const [operation, setOperation] = useState<Operation>('idle');
  const [status, setStatus] = useState<string | null>(null);
  const { success, error, info } = useToastFunctions();

  // Load data on mount
  useEffect(() => {
    let isMounted = true;

    const loadConfig = async () => {
      if (configType === 'industry' && !industryId) return;

      setOperation('loading');
      setStatus(null);

      try {
        const result = configType === 'global'
          ? await fetchGlobalConfig()
          : await fetchIndustryConfig(industryId!);

        if (!isMounted) return;

        if (!result) {
          const message = configType === 'global'
            ? 'No global config found. Using defaults.'
            : 'No industry config found. Using global defaults.';
          info(message);
          setStatus(message);
          setOperation('idle');
          return;
        }

        // Update state with loaded data
        if (result.businessMetrics) setBusinessMetrics(result.businessMetrics);
        if (result.businessStats) {
          setBusinessStats(result.businessStats);
        }
        if (result.movement) {
          setMovement(result.movement);
        }

        if (result.mapConfig) {
          setMapWidth(result.mapConfig.width);
          setMapHeight(result.mapConfig.height);
          setMapWalls(result.mapConfig.walls || []);
        }

        if (result.layoutConfig) {
          setEntryPosition(result.layoutConfig.entryPosition || null);
          setWaitingPositions(result.layoutConfig.waitingPositions || []);
          setServiceRooms(result.layoutConfig.serviceRooms || []);
          setStaffPositions(result.layoutConfig.staffPositions || []);
          setMainCharacterPosition(result.layoutConfig.mainCharacterPosition || null);
          setMainCharacterSpriteImage(result.layoutConfig.mainCharacterSpriteImage || '');
        }

        if (result.staffNamePool) setStaffNamePool(result.staffNamePool);

        if (result.winCondition) setWinCondition(result.winCondition);
        if (result.loseCondition) setLoseCondition(result.loseCondition);

        if (result.uiConfig) setUiConfig(prev => ({ ...prev, ...result.uiConfig }));

        if (result.eventSelectionMode) setEventSelectionMode(result.eventSelectionMode);
        if (result.eventSequence) setEventSequence(result.eventSequence);

        // Config loaded successfully - no toast needed
      } catch (err) {
        console.error(`Failed to load ${configType} config`, err);
        const errorMessage = `Failed to load ${configType} config: ${err instanceof Error ? err.message : 'Unknown error'}`;
        error(errorMessage);
        setStatus(errorMessage);
      } finally {
        if (isMounted) {
          setOperation('idle');
        }
      }
    };

    loadConfig();

    return () => {
      isMounted = false;
    };
  }, [configType, industryId]);

  // Update functions
  const updateMetrics = useCallback((updates: Partial<BusinessMetrics>) => {
    setBusinessMetrics(prev => {
      const current = prev || getDefaultMetrics();
      return { ...current, ...updates };
    });
  }, []);

  const updateStats = useCallback((updates: Partial<BusinessStats>) => {
    setBusinessStats(prev => {
      const current = prev || getDefaultStats();
      return { ...current, ...updates };
    });
  }, []);

  // Direct setters for BusinessMetrics and BusinessStats (support null for global defaults)
  const setBusinessMetricsDirect = useCallback((value: BusinessMetrics | null) => {
    setBusinessMetrics(value);
  }, []);

  const setBusinessStatsDirect = useCallback((value: BusinessStats | null) => {
    setBusinessStats(value);
  }, []);

  // Direct setters for win/lose conditions
  const setWinConditionDirect = useCallback((value: WinCondition | null) => {
    setWinCondition(value);
  }, []);

  const setLoseConditionDirect = useCallback((value: LoseCondition | null) => {
    setLoseCondition(value);
  }, []);

  const updateMovement = useCallback((newMovement: MovementConfig | null) => {
    setMovement(newMovement);
  }, []);

  const updateMapConfig = useCallback((width: number | null, height: number | null, walls: GridPosition[]) => {
    setMapWidth(width);
    setMapHeight(height);
    setMapWalls(walls);
  }, []);

  const updateLayoutConfig = useCallback((updates: {
    entryPosition?: GridPosition | null;
    waitingPositions?: GridPosition[];
    serviceRooms?: ServiceRoomConfig[];
    staffPositions?: GridPosition[];
    mainCharacterPosition?: GridPosition | null;
    mainCharacterSpriteImage?: string;
  }) => {
    if (updates.entryPosition !== undefined) setEntryPosition(updates.entryPosition);
    if (updates.waitingPositions !== undefined) setWaitingPositions(updates.waitingPositions);
    if (updates.serviceRooms !== undefined) setServiceRooms(updates.serviceRooms);
    if (updates.staffPositions !== undefined) setStaffPositions(updates.staffPositions);
    if (updates.mainCharacterPosition !== undefined) setMainCharacterPosition(updates.mainCharacterPosition);
    if (updates.mainCharacterSpriteImage !== undefined) setMainCharacterSpriteImage(updates.mainCharacterSpriteImage);
  }, []);

  const updateWinCondition = useCallback((updates: Partial<WinCondition>) => {
    setWinCondition(prev => {
      const current = prev || {};
      const merged = { ...current, ...updates };

      // Remove undefined values and empty strings
      const cleaned: Partial<WinCondition> = {};
      Object.entries(merged).forEach(([key, value]) => {
        if (value !== undefined && !(typeof value === 'string' && value === '')) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (cleaned as any)[key] = value;
        }
      });

      return Object.keys(cleaned).length > 0 ? cleaned as WinCondition : null;
    });
  }, []);

  const updateLoseCondition = useCallback((updates: Partial<LoseCondition>) => {
    setLoseCondition(prev => {
      const current = prev || {};
      const merged = { ...current, ...updates };

      // Remove undefined values and empty strings
      const cleaned: Partial<LoseCondition> = {};
      Object.entries(merged).forEach(([key, value]) => {
        if (value !== undefined && !(typeof value === 'string' && value === '')) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (cleaned as any)[key] = value;
        }
      });

      return Object.keys(cleaned).length > 0 ? cleaned as LoseCondition : null;
    });
  }, []);

  const updateUiConfig = useCallback((updates: Partial<UiConfig>) => {
    setUiConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const updateEventConfig = useCallback((mode: 'random' | 'sequence', sequence: string[]) => {
    setEventSelectionMode(mode);
    setEventSequence(sequence);
  }, []);

  const updateMediaConfig = useCallback((updates: {
    capacityImage?: string;
    customerImages?: string[];
    staffNamePool?: string[];
    leadDialogues?: string[];
  }) => {
    if (updates.capacityImage !== undefined) setCapacityImage(updates.capacityImage);
    if (updates.customerImages !== undefined) setCustomerImages(updates.customerImages);
    if (updates.staffNamePool !== undefined) setStaffNamePool(updates.staffNamePool);
    if (updates.leadDialogues !== undefined) setLeadDialogues(updates.leadDialogues);
  }, []);

  const reset = useCallback(() => {
    if (configType === 'global') {
      setBusinessMetrics(getDefaultMetrics());
      setBusinessStats(getDefaultStats());
      setMovement(getDefaultMovement());
    } else {
      setBusinessMetrics(null);
      setBusinessStats(null);
      setMovement(null);
    }

    setMapWidth(null);
    setMapHeight(null);
    setMapWalls([]);

    setEntryPosition(null);
    setWaitingPositions([]);
    setServiceRooms([]);
    setStaffPositions([]);
    setMainCharacterPosition(null);
    setMainCharacterSpriteImage('');

    setCapacityImage('');
    setCustomerImages([]);
    setStaffNamePool([]);
    setLeadDialogues([]);

    setWinCondition(null);
    setLoseCondition(null);

    setUiConfig({
      eventAutoSelectDurationSeconds: 10,
      outcomePopupDurationSeconds: 5,
    });

    setEventSelectionMode('random');
    setEventSequence([]);
  }, [configType]);

  const save = useCallback(async () => {
    if (configType === 'industry' && !industryId) {
      const errorMessage = 'No industry selected';
      error(errorMessage);
      setStatus(errorMessage);
      return;
    }

    setOperation('saving');
    setStatus(null);

    try {
      const configData = {
        businessMetrics: businessMetrics || undefined,
        businessStats: businessStats || undefined,
        movement: movement || undefined,
        mapWidth,
        mapHeight,
        mapWalls: mapWalls.length > 0 ? mapWalls : null,
        // Layout config (industry-specific)
        ...(configType === 'industry' && {
          entryPosition,
          waitingPositions: waitingPositions.length > 0 ? waitingPositions : null,
          serviceRooms: serviceRooms.length > 0 ? serviceRooms : null,
          staffPositions: staffPositions.length > 0 ? staffPositions : null,
          mainCharacterPosition,
          mainCharacterSpriteImage: mainCharacterSpriteImage || null,
        }),
        capacityImage: capacityImage || null,
        customerImages: customerImages.length > 0 ? customerImages : null,
        staffNamePool: staffNamePool.length > 0 ? staffNamePool : null,
        leadDialogues: leadDialogues.length > 0 ? leadDialogues : null,
        winCondition: winCondition || undefined,
        loseCondition: loseCondition || undefined,
        uiConfig,
        // Event sequencing (industry-specific)
        ...(configType === 'industry' && {
          eventSelectionMode,
          eventSequence,
        }),
      };

      const result = configType === 'global'
        ? await upsertGlobalConfig(configData)
        : await upsertIndustryConfig(industryId!, configData);

      if (!result.success) {
        const errorMessage = result.message || `Failed to save ${configType} config`;
        error(errorMessage);
        setStatus(errorMessage);
        return;
      }

      const successMessage = `${configType === 'global' ? 'Global' : 'Industry'} config saved successfully`;
      success(successMessage);
      setStatus(successMessage);
    } catch (err) {
      console.error(`Failed to save ${configType} config`, err);
      const errorMessage = `Failed to save ${configType} config: ${err instanceof Error ? err.message : 'Unknown error'}`;
      error(errorMessage);
      setStatus(errorMessage);
    } finally {
      setOperation('idle');
    }
  }, [
    configType,
    industryId,
    businessMetrics,
    businessStats,
    movement,
    mapWidth,
    mapHeight,
    mapWalls,
    entryPosition,
    waitingPositions,
    serviceRooms,
    staffPositions,
    mainCharacterPosition,
    mainCharacterSpriteImage,
    capacityImage,
    customerImages,
    staffNamePool,
    leadDialogues,
    winCondition,
    loseCondition,
    uiConfig,
    eventSelectionMode,
    eventSequence,
  ]);

  return {
    // Data
    businessMetrics,
    businessStats,
    movement,
    mapWidth,
    mapHeight,
    mapWalls,
    entryPosition,
    waitingPositions,
    serviceRooms,
    staffPositions,
    mainCharacterPosition,
    mainCharacterSpriteImage,
    capacityImage,
    customerImages,
    staffNamePool,
    leadDialogues,
    winCondition,
    loseCondition,
    uiConfig,
    eventSelectionMode,
    eventSequence,

    // Status
    loading: operation === 'loading',
    saving: operation === 'saving',
    status: status || null,


    // Actions
    updateMetrics,
    updateStats,
    setBusinessMetrics: setBusinessMetricsDirect,
    setBusinessStats: setBusinessStatsDirect,
    updateMovement,
    updateMapConfig,
    updateLayoutConfig,
    updateWinCondition,
    updateLoseCondition,
    setWinCondition: setWinConditionDirect,
    setLoseCondition: setLoseConditionDirect,
    updateUiConfig,
    updateEventConfig,
    updateMediaConfig,
    save,
    reset,

  };
}