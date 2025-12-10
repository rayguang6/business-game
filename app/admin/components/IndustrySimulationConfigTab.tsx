'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BusinessMetrics, BusinessStats, GridPosition, AnchorPoint, ServiceRoomConfig } from '@/lib/game/types';
import type { WinCondition, LoseCondition } from '@/lib/game/winConditions';
import { getMetricDefinition, calculateCustomersPerMonth } from '@/lib/game/metrics/registry';
import { GameMetric } from '@/lib/game/effectManager';
import { NumberInput } from './NumberInput';
import { ExpPerLevelConfig } from './ExpPerLevelConfig';

interface IndustrySimulationConfigTabProps {
  industryName: string;
  loading: boolean;
  saving: boolean;
  // Data (nullable - means using global defaults)
  businessMetrics: BusinessMetrics | null;
  businessStats: BusinessStats | null;
  // Global config values for reference
  globalMetrics?: BusinessMetrics | null;
  globalStats?: BusinessStats | null;
  mapWidth: number | null;
  mapHeight: number | null;
  mapWalls: GridPosition[];
  entryPosition: GridPosition | null;
  waitingPositions: GridPosition[];
  serviceRooms: ServiceRoomConfig[];
  staffPositions: GridPosition[];
  mainCharacterPosition: GridPosition | null;
  mainCharacterSpriteImage: string;
  capacityImage: string;
  leadDialogues: string[] | null;
  winCondition: WinCondition | null;
  loseCondition: LoseCondition | null;
  // Event sequencing
  eventSelectionMode: 'random' | 'sequence';
  eventSequence: string[];
  events: Array<{ id: string; title: string }>;
  // customerImages and staffNamePool removed - they're global only
  // Setters
  setBusinessMetrics: (value: BusinessMetrics | null) => void;
  setBusinessStats: (value: BusinessStats | null) => void;
  setMapWidth: (value: number | null) => void;
  setMapHeight: (value: number | null) => void;
  setMapWalls: (value: GridPosition[]) => void;
  setEntryPosition: (value: GridPosition | null) => void;
  setWaitingPositions: (value: GridPosition[]) => void;
  setServiceRooms: (value: ServiceRoomConfig[]) => void;
  setStaffPositions: (value: GridPosition[]) => void;
  setMainCharacterPosition: (value: GridPosition | null) => void;
  setMainCharacterSpriteImage: (value: string) => void;
  setCapacityImage: (value: string) => void;
  setLeadDialogues: (value: string[] | null) => void;
  setWinCondition: (value: WinCondition | null) => void;
  setLoseCondition: (value: LoseCondition | null) => void;
  setEventSelectionMode: (mode: 'random' | 'sequence') => void;
  setEventSequence: (sequence: string[]) => void;
  onSave: () => Promise<void>;
}

// Validation helper function
function validateIndustryConfig(
  entryPosition: GridPosition | null,
  waitingPositions: GridPosition[],
  serviceRooms: ServiceRoomConfig[],
  staffPositions: GridPosition[],
): string[] {
  const errors: string[] = [];

  // Validate entry position
  if (!entryPosition) {
    errors.push('Entry position is required');
  } else {
    if (typeof entryPosition.x !== 'number' || isNaN(entryPosition.x) || entryPosition.x < 0) {
      errors.push('Entry position X must be a non-negative number');
    }
    if (typeof entryPosition.y !== 'number' || isNaN(entryPosition.y) || entryPosition.y < 0) {
      errors.push('Entry position Y must be a non-negative number');
    }
  }

  // Validate waiting positions
  waitingPositions.forEach((pos, index) => {
    if (typeof pos.x !== 'number' || isNaN(pos.x) || pos.x < 0) {
      errors.push(`Waiting position ${index + 1} X must be a non-negative number`);
    }
    if (typeof pos.y !== 'number' || isNaN(pos.y) || pos.y < 0) {
      errors.push(`Waiting position ${index + 1} Y must be a non-negative number`);
    }
  });

  // Validate service rooms
  serviceRooms.forEach((room, index) => {
    if (!room.customerPosition) {
      errors.push(`Service room ${room.roomId || index + 1} is missing customer position`);
    } else {
      if (typeof room.customerPosition.x !== 'number' || isNaN(room.customerPosition.x) || room.customerPosition.x < 0) {
        errors.push(`Service room ${room.roomId || index + 1} customer position X must be a non-negative number`);
      }
      if (typeof room.customerPosition.y !== 'number' || isNaN(room.customerPosition.y) || room.customerPosition.y < 0) {
        errors.push(`Service room ${room.roomId || index + 1} customer position Y must be a non-negative number`);
      }
    }
    if (!room.staffPosition) {
      errors.push(`Service room ${room.roomId || index + 1} is missing staff position`);
    } else {
      if (typeof room.staffPosition.x !== 'number' || isNaN(room.staffPosition.x) || room.staffPosition.x < 0) {
        errors.push(`Service room ${room.roomId || index + 1} staff position X must be a non-negative number`);
      }
      if (typeof room.staffPosition.y !== 'number' || isNaN(room.staffPosition.y) || room.staffPosition.y < 0) {
        errors.push(`Service room ${room.roomId || index + 1} staff position Y must be a non-negative number`);
      }
    }
  });

  // Validate staff positions
  staffPositions.forEach((pos, index) => {
    if (typeof pos.x !== 'number' || isNaN(pos.x) || pos.x < 0) {
      errors.push(`Staff position ${index + 1} X must be a non-negative number`);
    }
    if (typeof pos.y !== 'number' || isNaN(pos.y) || pos.y < 0) {
      errors.push(`Staff position ${index + 1} Y must be a non-negative number`);
    }
  });

  return errors;
}

export function IndustrySimulationConfigTab({
  industryName,
  loading,
  saving,
  businessMetrics,
  businessStats,
  globalMetrics,
  globalStats,
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
  leadDialogues,
  winCondition,
  loseCondition,
  eventSelectionMode,
  eventSequence,
  events,
  setBusinessMetrics,
  setBusinessStats,
  setMapWidth,
  setMapHeight,
  setMapWalls,
  setEntryPosition,
  setWaitingPositions,
  setServiceRooms,
  setStaffPositions,
  setMainCharacterPosition,
  setMainCharacterSpriteImage,
  setCapacityImage,
  setLeadDialogues,
  setWinCondition,
  setLoseCondition,
  setEventSelectionMode,
  setEventSequence,
  onSave,
}: IndustrySimulationConfigTabProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Wrapper for onSave that validates first
  const handleSave = useCallback(async () => {
    const errors = validateIndustryConfig(entryPosition, waitingPositions, serviceRooms, staffPositions);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);
    await onSave();
  }, [entryPosition, waitingPositions, serviceRooms, staffPositions, onSave]);

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!saving && !loading) {
          handleSave();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [saving, loading, handleSave]);

  // Helper functions for event sequencing
  const moveEventUp = (index: number) => {
    if (index > 0) {
      const newSequence = [...eventSequence];
      [newSequence[index - 1], newSequence[index]] = [newSequence[index], newSequence[index - 1]];
      setEventSequence(newSequence);
    }
  };

  const moveEventDown = (index: number) => {
    if (index < eventSequence.length - 1) {
      const newSequence = [...eventSequence];
      [newSequence[index], newSequence[index + 1]] = [newSequence[index + 1], newSequence[index]];
      setEventSequence(newSequence);
    }
  };

  const removeEventFromSequence = (eventId: string) => {
    setEventSequence(eventSequence.filter(id => id !== eventId));
  };

  const addEventToSequence = (eventId: string) => {
    if (!eventSequence.includes(eventId)) {
      setEventSequence([...eventSequence, eventId]);
    }
  };

  // Helper to get value or empty string for inputs
  const getValue = (val: number | null | undefined): string => {
    return val !== null && val !== undefined ? String(val) : '';
  };

  const getArrayValue = (arr: number[] | null | undefined): string => {
    return arr && arr.length > 0 ? arr.join(', ') : '';
  };

  const updateMetrics = (updates: Partial<BusinessMetrics>) => {
    // Merge with existing data, allowing undefined to clear values
    const current = businessMetrics || {};
    const merged = { ...current, ...updates };
    
    // Remove undefined/null values from the merged object
    const cleaned: Partial<BusinessMetrics> = {};
    Object.entries(merged).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (cleaned as any)[key] = value;
      }
    });
    
    // If cleaned object is empty, set to null (use global)
    // Otherwise, set the cleaned object
    if (Object.keys(cleaned).length === 0) {
      setBusinessMetrics(null);
    } else {
      setBusinessMetrics(cleaned as BusinessMetrics);
    }
  };

  const updateStats = (updates: Partial<BusinessStats>) => {
    // Merge with existing data, allowing undefined to clear values
    const current = businessStats || {};
    const merged = { ...current, ...updates };
    
    // Remove undefined/null values from the merged object
    const cleaned: Partial<BusinessStats> = {};
    Object.entries(merged).forEach(([key, value]) => {
      // Special handling for arrays and objects
      if (Array.isArray(value)) {
        if (value.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (cleaned as any)[key] = value;
        }
      } else if (typeof value === 'object' && value !== null) {
        // Keep objects (like customerSpawnPosition)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (cleaned as any)[key] = value;
      } else if (value !== undefined && value !== null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (cleaned as any)[key] = value;
      }
    });
    
    // If cleaned object is empty, set to null (use global)
    // Otherwise, set the cleaned object
    if (Object.keys(cleaned).length === 0) {
      setBusinessStats(null);
    } else {
      setBusinessStats(cleaned as BusinessStats);
    }
  };

  const updateWinCondition = (updates: Partial<WinCondition>) => {
    const current = winCondition || {};
    const merged = { ...current, ...updates };

    // Remove undefined values and empty strings
    const cleaned: Partial<WinCondition> = {};
    Object.entries(merged).forEach(([key, value]) => {
      if (value !== undefined && !(typeof value === 'string' && value === '')) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (cleaned as any)[key] = value;
      }
    });

    // If all win condition fields are empty, set to empty object to explicitly disable
    // This distinguishes from null (use global defaults)
    if (Object.keys(cleaned).length === 0) {
      setWinCondition({} as WinCondition); // Empty object means "no win conditions"
    } else {
      setWinCondition(cleaned as WinCondition);
    }
  };

  const updateLoseCondition = (updates: Partial<LoseCondition>) => {
    const current = loseCondition || {};
    const merged = { ...current, ...updates };

    // Remove undefined values and empty strings
    const cleaned: Partial<LoseCondition> = {};
    Object.entries(merged).forEach(([key, value]) => {
      if (value !== undefined && !(typeof value === 'string' && value === '')) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (cleaned as any)[key] = value;
      }
    });

    // If all lose condition fields are empty, set to empty object to explicitly disable
    // This distinguishes from null (use global defaults)
    if (Object.keys(cleaned).length === 0) {
      setLoseCondition({} as LoseCondition); // Empty object means "no lose conditions"
    } else {
      setLoseCondition(cleaned as LoseCondition);
    }
  };

  // Layout position helpers - now much simpler!
  const updateEntryPosition = (field: 'x' | 'y', value: number) => {
    setEntryPosition({ ...(entryPosition || { x: 0, y: 0 }), [field]: value });
  };

  const addPosition = (type: 'waiting' | 'staff', x: number, y: number) => {
    const pos: GridPosition = { x, y };
    if (type === 'waiting') {
      setWaitingPositions([...waitingPositions, pos]);
    } else {
      setStaffPositions([...staffPositions, pos]);
    }
  };

  const addServiceRoom = () => {
    const nextRoomId = serviceRooms.length > 0 
      ? Math.max(...serviceRooms.map(r => r.roomId)) + 1 
      : 1;
    const newRoom: ServiceRoomConfig = {
      roomId: nextRoomId,
      customerPosition: { x: 0, y: 0 },
      staffPosition: { x: 0, y: 0 },
    };
    setServiceRooms([...serviceRooms, newRoom]);
  };

  const removePosition = (type: 'waiting' | 'staff', index: number) => {
    if (type === 'waiting') {
      setWaitingPositions(waitingPositions.filter((_, i) => i !== index));
    } else {
      setStaffPositions(staffPositions.filter((_, i) => i !== index));
    }
  };

  const removeServiceRoom = (index: number) => {
    setServiceRooms(serviceRooms.filter((_, i) => i !== index));
  };

  const updatePosition = (type: 'waiting' | 'staff', index: number, field: 'x' | 'y' | 'facingDirection' | 'width' | 'height' | 'anchor', value: number | string | null) => {
    if (type === 'waiting') {
      setWaitingPositions(waitingPositions.map((pos, i) => i === index ? { ...pos, [field]: value } : pos));
    } else {
      setStaffPositions(staffPositions.map((pos, i) => i === index ? { ...pos, [field]: value } : pos));
    }
  };

  const updateServiceRoomPosition = (
    roomIndex: number, 
    positionType: 'customer' | 'staff', 
    field: 'x' | 'y' | 'facingDirection' | 'width' | 'height' | 'anchor', 
    value: number | string | null
  ) => {
    setServiceRooms(serviceRooms.map((room, i) => {
      if (i === roomIndex) {
        const updatedRoom = { ...room };
        if (positionType === 'customer') {
          updatedRoom.customerPosition = { ...room.customerPosition, [field]: value };
        } else {
          updatedRoom.staffPosition = { ...room.staffPosition, [field]: value };
        }
        return updatedRoom;
      }
      return room;
    }));
  };

  // Map wall helpers
  const addMapWall = () => setMapWalls([...mapWalls, { x: 0, y: 0 }]);
  const removeMapWall = (index: number) => setMapWalls(mapWalls.filter((_, i) => i !== index));
  const updateMapWall = (index: number, field: 'x' | 'y', value: number) => {
    setMapWalls(mapWalls.map((wall, i) => i === index ? { ...wall, [field]: value } : wall));
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-semibold">Simulation Config</h2>
        <p className="text-sm text-slate-400 mt-1">Configure simulation settings for <span className="font-medium text-slate-300">{industryName}</span>.</p>
      </div>

      <div className="p-6 space-y-8 max-h-[calc(100vh-300px)] overflow-y-auto">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">{loading ? 'Loading…' : ' '}</span>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-rose-900/20 border border-rose-700 rounded-lg p-4">
            <div className="text-sm font-semibold text-rose-400 mb-2">Validation Errors</div>
            <ul className="list-disc list-inside space-y-1 text-sm text-rose-300">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Business Metrics */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Business Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Starting Cash</label>
              <NumberInput
                min="0"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                value={getValue(businessMetrics?.startingCash)}
                onChange={(e) => updateMetrics({ startingCash: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Monthly Expenses</label>
              <NumberInput
                min="0"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                value={getValue(businessMetrics?.monthlyExpenses)}
                onChange={(e) => updateMetrics({ monthlyExpenses: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Starting EXP</label>
              <NumberInput
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                value={getValue(businessMetrics?.startingExp)}
                onChange={(e) => updateMetrics({ startingExp: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Starting Time (Hours)</label>
              <NumberInput
                min="0"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                value={getValue(businessMetrics?.startingTime)}
                onChange={(e) => updateMetrics({ startingTime: e.target.value === '' ? undefined : Number(e.target.value) })}
                placeholder="Leave empty to disable"
              />
              <p className="text-xs text-slate-500 mt-1">
                Monthly available time (refreshes each month). Set to enable time currency.
              </p>
            </div>
          </div>
        </div>

        {/* Business Stats */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Business Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Ticks Per Second</label>
              <NumberInput
                min="1"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                value={getValue(businessStats?.ticksPerSecond)}
                onChange={(e) => updateStats({ ticksPerSecond: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Month Duration (sec)</label>
              <NumberInput
                min="0"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                value={getValue(businessStats?.monthDurationSeconds)}
                onChange={(e) => updateStats({ monthDurationSeconds: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Leads Per Month</label>
              <NumberInput
                min="1"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                value={getValue(businessStats?.leadsPerMonth)}
                onChange={(e) => updateStats({ leadsPerMonth: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
              {(businessStats?.leadsPerMonth ?? globalStats?.leadsPerMonth) && 
               (businessStats?.monthDurationSeconds ?? globalStats?.monthDurationSeconds) && (
                <div className="text-xs text-slate-500 mt-1">
                  = spawn interval: {(
                    (businessStats?.monthDurationSeconds ?? globalStats?.monthDurationSeconds ?? 0) / 
                    (businessStats?.leadsPerMonth ?? globalStats?.leadsPerMonth ?? 1)
                  ).toFixed(2)}s
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Customer Patience (sec)</label>
              <NumberInput
                min="0"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                value={getValue(businessStats?.customerPatienceSeconds)}
                onChange={(e) => updateStats({ customerPatienceSeconds: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Leaving Angry Duration (ticks)</label>
              <NumberInput
                min="0"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                value={getValue(businessStats?.leavingAngryDurationTicks)}
                onChange={(e) => updateStats({ leavingAngryDurationTicks: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Service Capacity</label>
              <NumberInput
                min="0"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                value={getValue(businessStats?.serviceCapacity)}
                onChange={(e) => updateStats({ serviceCapacity: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Service Revenue Multiplier</label>
              <NumberInput
                step="0.01"
                min="0"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                value={getValue(businessStats?.serviceRevenueMultiplier)}
                onChange={(e) => updateStats({ serviceRevenueMultiplier: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Service Revenue Scale</label>
              <NumberInput
                min="0"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                value={getValue(businessStats?.serviceRevenueScale)}
                onChange={(e) => updateStats({ serviceRevenueScale: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Spawn Position X</label>
              <NumberInput
                min="0"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                value={getValue(businessStats?.customerSpawnPosition?.x)}
                onChange={(e) => {
                  const xValue = e.target.value === '' ? undefined : Number(e.target.value);
                  const currentPos = businessStats?.customerSpawnPosition || { x: 0, y: 0 };
                  if (xValue !== undefined) {
                    updateStats({ customerSpawnPosition: { ...currentPos, x: xValue } });
                  }
                }}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Spawn Position Y</label>
              <NumberInput
                min="0"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                value={getValue(businessStats?.customerSpawnPosition?.y)}
                onChange={(e) => {
                  const yValue = e.target.value === '' ? undefined : Number(e.target.value);
                  const currentPos = businessStats?.customerSpawnPosition || { x: 0, y: 0 };
                  if (yValue !== undefined) {
                    updateStats({ customerSpawnPosition: { ...currentPos, y: yValue } });
                  }
                }}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Event Trigger Times (seconds)</label>
              <input
                type="text"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                value={getArrayValue(businessStats?.eventTriggerSeconds)}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  if (value === '') {
                    updateStats({ eventTriggerSeconds: [] });
                  } else {
                    const numbers = value.split(',').map(s => s.trim()).filter(s => s).map(s => Number(s)).filter(n => !isNaN(n));
                    updateStats({ eventTriggerSeconds: numbers });
                  }
                }}
                placeholder="15, 30, 45"
              />
              <p className="text-xs text-slate-500 mt-1">Comma-separated list of seconds when events should trigger during a month</p>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">EXP Gain per Happy Customer</label>
              <NumberInput
                min="0"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                value={getValue(businessStats?.expGainPerHappyCustomer)}
                onChange={(e) => updateStats({ expGainPerHappyCustomer: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">EXP Loss per Angry Customer</label>
              <NumberInput
                min="0"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                value={getValue(businessStats?.expLossPerAngryCustomer)}
                onChange={(e) => updateStats({ expLossPerAngryCustomer: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">EXP Required Per Level</label>
              <ExpPerLevelConfig
                value={businessStats?.expPerLevel}
                onChange={(value) => updateStats({ expPerLevel: value })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Conversion Rate</label>
              <NumberInput
                min="0"
                step="0.1"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                value={getValue(businessStats?.conversionRate)}
                onChange={(e) => updateStats({ conversionRate: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Failure Rate (%)</label>
              <NumberInput
                min="0"
                max="100"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                value={getValue(businessStats?.failureRate)}
                onChange={(e) => updateStats({ failureRate: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
              <p className="text-xs text-slate-500 mt-1">Base failure rate percentage (0-100%)</p>
            </div>
          </div>
        </div>

        {/* Win/Lose Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Win Condition</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Cash Target</label>
                <NumberInput  min="0" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getValue(winCondition?.cashTarget)} onChange={(e) => updateWinCondition({ cashTarget: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="Leave empty to disable" />
                <p className="text-xs text-slate-500 mt-1">Target cash amount to win the game. Leave empty to disable cash-based winning.</p>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Month Target</label>
                <NumberInput  min="0" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getValue(winCondition?.monthTarget)} onChange={(e) => updateWinCondition({ monthTarget: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="Leave empty to disable" />
                <p className="text-xs text-slate-500 mt-1">Win by surviving this many months. Leave empty to disable month-based winning.</p>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Custom Victory Title (Optional)</label>
                <input type="text" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={winCondition?.customTitle || ''} onChange={(e) => updateWinCondition({ customTitle: e.target.value || undefined })} placeholder="🎉 Mission Accomplished!" />
                <p className="text-xs text-slate-500 mt-1">Override the default victory title</p>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Custom Victory Message (Optional)</label>
                <textarea rows={3} className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 resize-none" value={winCondition?.customMessage || ''} onChange={(e) => updateWinCondition({ customMessage: e.target.value || undefined })} placeholder="Congratulations! You've successfully completed your business challenge!" />
                <p className="text-xs text-slate-500 mt-1">Override the default victory message</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Lose Condition</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Cash Threshold</label>
                <NumberInput  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getValue(loseCondition?.cashThreshold)} onChange={(e) => updateLoseCondition({ cashThreshold: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="Leave empty to disable" />
                <p className="text-xs text-slate-500 mt-1">Game over if cash ≤ this value. Leave empty to disable cash-based game over.</p>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Time Threshold</label>
                <NumberInput  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getValue(loseCondition?.timeThreshold)} onChange={(e) => updateLoseCondition({ timeThreshold: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="Leave empty to disable" />
                <p className="text-xs text-slate-500 mt-1">Game over if available time ≤ this value. Leave empty to disable time-based game over.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Capacity Image */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Capacity Image</h3>
          <input type="text" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={capacityImage} onChange={(e) => setCapacityImage(e.target.value)} placeholder="/images/beds/bed.png" />
        </div>

        {/* Lead Dialogues */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Lead Dialogues</h3>
          <p className="text-sm text-slate-400">Custom dialogue lines that leads will randomly display when browsing your business.</p>
          <div className="space-y-2">
            {(leadDialogues || []).map((dialogue, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={dialogue}
                  onChange={(e) => {
                    const newDialogues = [...(leadDialogues || [])];
                    newDialogues[index] = e.target.value;
                    setLeadDialogues(newDialogues);
                  }}
                  placeholder="Enter dialogue text..."
                  className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 text-sm"
                />
                <button
                  onClick={() => {
                    const newDialogues = (leadDialogues || []).filter((_, i) => i !== index);
                    setLeadDialogues(newDialogues.length > 0 ? newDialogues : null);
                  }}
                  className="px-2 py-2 text-rose-400 hover:text-rose-300 rounded"
                  title="Remove dialogue"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const newDialogues = [...(leadDialogues || []), ''];
                setLeadDialogues(newDialogues);
              }}
              className="w-full px-3 py-2 text-sm text-blue-400 hover:text-blue-300 border border-slate-600 hover:border-blue-400 rounded-lg transition-colors"
            >
              + Add Dialogue Line
            </button>
          </div>
          <div className="mt-3 p-2 bg-slate-800/50 rounded text-xs text-slate-400">
            💡 Leads are potential customers who walk around browsing your business. Custom dialogues help create unique personalities for this industry.
          </div>
        </div>

        {/* Map Config - Broken Down */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Map Configuration</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Map Width</label>
              <NumberInput  min="1" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={mapWidth ?? ''} onChange={(e) => setMapWidth(e.target.value ? Number(e.target.value) : null)} placeholder="10" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Map Height</label>
              <NumberInput  min="1" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={mapHeight ?? ''} onChange={(e) => setMapHeight(e.target.value ? Number(e.target.value) : null)} placeholder="10" />
            </div>
          </div>

          {/* Map Walls */}
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">Map Walls</label>
              <button onClick={addMapWall} className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded">+ Add</button>
            </div>
            <div className="space-y-2">
              {mapWalls.map((wall, idx) => (
                <div key={idx} className="flex gap-2">
                  <NumberInput  className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm" placeholder="X" value={wall.x} onChange={(e) => updateMapWall(idx, 'x', Number(e.target.value))} />
                  <NumberInput  className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm" placeholder="Y" value={wall.y} onChange={(e) => updateMapWall(idx, 'y', Number(e.target.value))} />
                  <button onClick={() => removeMapWall(idx)} className="px-2 py-1 bg-rose-600 hover:bg-rose-700 rounded text-sm">Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Layout Positions - At Bottom */}
        <div className="space-y-3 border-t border-slate-800 pt-6">
          <div>
            <h3 className="text-lg font-semibold">Layout Positions</h3>
            <p className="text-xs text-slate-500 mt-1">Configure where entities appear on the map</p>
          </div>
          
          {/* Entry Position */}
          <div className="bg-slate-800 rounded-lg p-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Entry Position</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">X</label>
                <NumberInput  className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200" value={entryPosition?.x ?? 0} onChange={(e) => updateEntryPosition('x', Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Y</label>
                <NumberInput  className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200" value={entryPosition?.y ?? 0} onChange={(e) => updateEntryPosition('y', Number(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Waiting Positions */}
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">Waiting Positions</label>
              <button onClick={() => addPosition('waiting', 0, 0)} className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded">+ Add</button>
            </div>
            <p className="text-xs text-slate-400 mb-2">Configure facing direction for each position (e.g., restaurant tables facing each other)</p>
            <div className="space-y-2">
              {waitingPositions.map((pos, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <NumberInput  className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm" placeholder="X" value={pos.x} onChange={(e) => updatePosition('waiting', idx, 'x', Number(e.target.value))} />
                  <NumberInput  className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm" placeholder="Y" value={pos.y} onChange={(e) => updatePosition('waiting', idx, 'y', Number(e.target.value))} />
                  <select 
                    className="w-24 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                    value={pos.facingDirection || 'right'}
                    onChange={(e) => updatePosition('waiting', idx, 'facingDirection', e.target.value as 'down' | 'left' | 'up' | 'right')}
                  >
                    <option value="right">Right →</option>
                    <option value="left">Left ←</option>
                    <option value="down">Down ↓</option>
                    <option value="up">Up ↑</option>
                  </select>
                  <button onClick={() => removePosition('waiting', idx)} className="px-2 py-1 bg-rose-600 hover:bg-rose-700 rounded text-sm">Remove</button>
                </div>
              ))}
            </div>
          </div>

          {/* Service Room Positions */}
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">Service Rooms</label>
              <button onClick={addServiceRoom} className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded">+ Add Room</button>
            </div>
            <p className="text-xs text-slate-400 mb-2">Configure customer and staff positions for each service room</p>
            <div className="space-y-4">
              {serviceRooms.map((room, idx) => (
                <div key={idx} className="bg-slate-700/50 rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">Room {room.roomId}</span>
                    <button onClick={() => removeServiceRoom(idx)} className="px-2 py-1 bg-rose-600 hover:bg-rose-700 rounded text-sm">Remove</button>
                  </div>
                  
                  {/* Customer Position */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400">Customer Position</label>
                    <div className="flex gap-2 items-center">
                      <NumberInput
                        className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                        placeholder="X"
                        value={room.customerPosition.x}
                        onChange={(e) => updateServiceRoomPosition(idx, 'customer', 'x', Number(e.target.value))}
                      />
                      <NumberInput
                        className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                        placeholder="Y"
                        value={room.customerPosition.y}
                        onChange={(e) => updateServiceRoomPosition(idx, 'customer', 'y', Number(e.target.value))}
                      />
                      <select 
                        className="w-24 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                        value={room.customerPosition.facingDirection || 'down'}
                        onChange={(e) => updateServiceRoomPosition(idx, 'customer', 'facingDirection', e.target.value as 'down' | 'left' | 'up' | 'right')}
                      >
                        <option value="down">Down ↓</option>
                        <option value="up">Up ↑</option>
                        <option value="left">Left ←</option>
                        <option value="right">Right →</option>
                      </select>
                    </div>
                    {/* Customer Multi-tile Size (Optional) */}
                    <div className="flex gap-2 items-center text-xs text-slate-400">
                      <span className="w-16">Size:</span>
                      <NumberInput
                        min="1"
                        className="w-16 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-xs"
                        placeholder="W"
                        value={room.customerPosition.width ?? ''}
                        onChange={(e) => updateServiceRoomPosition(idx, 'customer', 'width', e.target.value ? Number(e.target.value) : null)}
                      />
                      <span className="text-slate-500">×</span>
                      <NumberInput
                        min="1"
                        className="w-16 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-xs"
                        placeholder="H"
                        value={room.customerPosition.height ?? ''}
                        onChange={(e) => updateServiceRoomPosition(idx, 'customer', 'height', e.target.value ? Number(e.target.value) : null)}
                      />
                      <span className="text-slate-500 ml-2">tiles</span>
                      <select 
                        className="w-32 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-xs ml-auto"
                        value={room.customerPosition.anchor || 'top-left'}
                        onChange={(e) => updateServiceRoomPosition(idx, 'customer', 'anchor', e.target.value as AnchorPoint)}
                      >
                        <option value="top-left">Top-Left</option>
                        <option value="top-center">Top-Center</option>
                        <option value="top-right">Top-Right</option>
                        <option value="center-left">Center-Left</option>
                        <option value="center">Center</option>
                        <option value="center-right">Center-Right</option>
                        <option value="bottom-left">Bottom-Left</option>
                        <option value="bottom-center">Bottom-Center</option>
                        <option value="bottom-right">Bottom-Right</option>
                      </select>
                    </div>
                  </div>

                  {/* Staff Position */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400">Staff Position</label>
                    <div className="flex gap-2 items-center">
                      <NumberInput
                        className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                        placeholder="X"
                        value={room.staffPosition.x}
                        onChange={(e) => updateServiceRoomPosition(idx, 'staff', 'x', Number(e.target.value))}
                      />
                      <NumberInput
                        className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                        placeholder="Y"
                        value={room.staffPosition.y}
                        onChange={(e) => updateServiceRoomPosition(idx, 'staff', 'y', Number(e.target.value))}
                      />
                      <select 
                        className="w-24 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                        value={room.staffPosition.facingDirection || 'down'}
                        onChange={(e) => updateServiceRoomPosition(idx, 'staff', 'facingDirection', e.target.value as 'down' | 'left' | 'up' | 'right')}
                      >
                        <option value="down">Down ↓</option>
                        <option value="up">Up ↑</option>
                        <option value="left">Left ←</option>
                        <option value="right">Right →</option>
                      </select>
                    </div>
                    {/* Staff Multi-tile Size (Optional) */}
                    <div className="flex gap-2 items-center text-xs text-slate-400">
                      <span className="w-16">Size:</span>
                      <NumberInput
                        min="1"
                        className="w-16 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-xs"
                        placeholder="W"
                        value={room.staffPosition.width ?? ''}
                        onChange={(e) => updateServiceRoomPosition(idx, 'staff', 'width', e.target.value ? Number(e.target.value) : null)}
                      />
                      <span className="text-slate-500">×</span>
                      <NumberInput
                        min="1"
                        className="w-16 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-xs"
                        placeholder="H"
                        value={room.staffPosition.height ?? ''}
                        onChange={(e) => updateServiceRoomPosition(idx, 'staff', 'height', e.target.value ? Number(e.target.value) : null)}
                      />
                      <span className="text-slate-500 ml-2">tiles</span>
                      <select 
                        className="w-32 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-xs ml-auto"
                        value={room.staffPosition.anchor || 'top-left'}
                        onChange={(e) => updateServiceRoomPosition(idx, 'staff', 'anchor', e.target.value as AnchorPoint)}
                      >
                        <option value="top-left">Top-Left</option>
                        <option value="top-center">Top-Center</option>
                        <option value="top-right">Top-Right</option>
                        <option value="center-left">Center-Left</option>
                        <option value="center">Center</option>
                        <option value="center-right">Center-Right</option>
                        <option value="bottom-left">Bottom-Left</option>
                        <option value="bottom-center">Bottom-Center</option>
                        <option value="bottom-right">Bottom-Right</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Staff Positions */}
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">Staff Positions</label>
              <button onClick={() => addPosition('staff', 0, 0)} className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded">+ Add</button>
            </div>
            <div className="space-y-2">
              {staffPositions.map((pos, idx) => (
                <div key={idx} className="flex gap-2">
                  <NumberInput  className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm" placeholder="X" value={pos.x} onChange={(e) => updatePosition('staff', idx, 'x', Number(e.target.value))} />
                  <NumberInput  className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm" placeholder="Y" value={pos.y} onChange={(e) => updatePosition('staff', idx, 'y', Number(e.target.value))} />
                  <button onClick={() => removePosition('staff', idx)} className="px-2 py-1 bg-rose-600 hover:bg-rose-700 rounded text-sm">Remove</button>
                </div>
              ))}
            </div>
          </div>

          {/* Main Character Position */}
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">Main Character Position</label>
              {mainCharacterPosition ? (
                <button onClick={() => setMainCharacterPosition(null)} className="text-xs px-2 py-1 bg-rose-600 hover:bg-rose-700 rounded">Clear</button>
              ) : (
                <button onClick={() => setMainCharacterPosition({ x: 4, y: 0 })} className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded">+ Add</button>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-2">Optional: Position for the main character (founder). If not set, defaults to first staff position.</p>
            {mainCharacterPosition ? (
              <div className="flex gap-2">
                <NumberInput
                  className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                  placeholder="X"
                  value={mainCharacterPosition.x}
                  onChange={(e) => setMainCharacterPosition({ ...mainCharacterPosition, x: Number(e.target.value) })}
                />
                <NumberInput
                  className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                  placeholder="Y"
                  value={mainCharacterPosition.y}
                  onChange={(e) => setMainCharacterPosition({ ...mainCharacterPosition, y: Number(e.target.value) })}
                />
              </div>
            ) : (
              <div className="text-sm text-slate-400 py-2">Not configured (will use default)</div>
            )}
          </div>

          {/* Main Character Sprite Image */}
          <div className="bg-slate-800 rounded-lg p-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Main Character Sprite Image</label>
            <p className="text-xs text-slate-400 mb-2">Optional: Custom sprite image path for the main character (founder). Leave empty to use default sprite.</p>
            <input
              type="text"
              className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200 text-sm"
              placeholder="/images/staff/staff1.png"
              value={mainCharacterSpriteImage}
              onChange={(e) => setMainCharacterSpriteImage(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">Example: /images/staff/staff1.png or /images/staff/custom-sprite.png</p>
          </div>
        </div>

        {/* Event Sequencing */}
        <div className="pt-6 mt-6 border-t border-slate-800">
          <h3 className="text-lg font-semibold mb-4">Event Sequencing</h3>

          <div className="space-y-4">
            {/* Selection Mode */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Event Selection Mode
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="eventSelectionMode"
                    value="random"
                    checked={eventSelectionMode === 'random'}
                    onChange={(e) => setEventSelectionMode(e.target.value as 'random' | 'sequence')}
                    className="text-blue-600 bg-slate-800 border-slate-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-slate-200 font-medium">Random Selection</span>
                    <p className="text-sm text-slate-400">Events are chosen randomly from available events</p>
                  </div>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="eventSelectionMode"
                    value="sequence"
                    checked={eventSelectionMode === 'sequence'}
                    onChange={(e) => setEventSelectionMode(e.target.value as 'random' | 'sequence')}
                    className="text-blue-600 bg-slate-800 border-slate-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-slate-200 font-medium">Sequential Selection</span>
                    <p className="text-sm text-slate-400">Events are shown in the configured order, cycling back when complete</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Sequence Configuration - Only show when sequence mode is selected */}
            {eventSelectionMode === 'sequence' && (
              <div className="space-y-4">
                <div className="border-t border-slate-800 pt-4">
                  <h4 className="text-md font-semibold text-slate-200 mb-4">Event Sequence Order</h4>

                  {loading ? (
                    <div className="text-sm text-slate-400">Loading events...</div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Current Sequence */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-semibold text-slate-300">
                          Event Sequence ({eventSequence.length})
                        </h5>

                        {eventSequence.length === 0 ? (
                          <div className="text-sm text-slate-500 italic p-4 bg-slate-800/50 rounded-lg border border-slate-700 border-dashed">
                            No events in sequence yet.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {eventSequence.map((eventId, index) => {
                              const event = events.find(e => e.id === eventId);
                              return (
                                <div
                                  key={eventId}
                                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 bg-slate-800"
                                >
                                  <span className="text-xs font-mono text-slate-400 w-6 text-center">
                                    {index + 1}
                                  </span>

                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-slate-200 truncate">
                                      {event?.title || `Unknown Event (${eventId})`}
                                    </div>
                                    <div className="text-xs text-slate-400 font-mono">
                                      {eventId}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => moveEventUp(index)}
                                      disabled={index === 0}
                                      className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Move up"
                                    >
                                      ↑
                                    </button>
                                    <button
                                      onClick={() => moveEventDown(index)}
                                      disabled={index === eventSequence.length - 1}
                                      className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Move down"
                                    >
                                      ↓
                                    </button>
                                    <button
                                      onClick={() => removeEventFromSequence(eventId)}
                                      className="p-1 text-red-400 hover:text-red-300"
                                      title="Remove from sequence"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Available Events */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-semibold text-slate-300">
                          Available Events ({events.filter(e => !eventSequence.includes(e.id)).length})
                        </h5>

                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {events
                            .filter(event => !eventSequence.includes(event.id))
                            .map((event) => (
                              <div
                                key={event.id}
                                className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700/60 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-slate-200 truncate">
                                    {event.title}
                                  </div>
                                  <div className="text-xs text-slate-400 font-mono">
                                    {event.id}
                                  </div>
                                </div>
                                <button
                                  onClick={() => addEventToSequence(event.id)}
                                  className="px-3 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
                                  title="Add to sequence"
                                >
                                  Add
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-slate-800/50 rounded-lg text-xs text-slate-400">
                    💡 Use the ↑↓ buttons to reorder events in the sequence. Events will trigger in this order and cycle back when complete.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button onClick={handleSave} disabled={saving || loading || validationErrors.length > 0} className={`px-6 py-2 rounded-lg font-medium transition ${saving || loading || validationErrors.length > 0 ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
            {saving ? 'Saving…' : 'Save Config'}
          </button>
        </div>

        {/* Floating Save Button */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl px-6 py-3 shadow-2xl">
            <button onClick={handleSave} disabled={saving || loading || validationErrors.length > 0} className={`px-6 py-2 rounded-lg font-medium transition ${saving || loading || validationErrors.length > 0 ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
              {saving ? '💾 Saving…' : '💾 Save Config (⌘↵)'}
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
