'use client';

import { useState } from 'react';
import type { BusinessMetrics, BusinessStats, GridPosition, AnchorPoint, ServiceRoomConfig } from '@/lib/game/types';
import type { WinCondition, LoseCondition } from '@/lib/game/winConditions';

interface IndustrySimulationConfigTabProps {
  industryName: string;
  loading: boolean;
  status: { type: 'success' | 'error'; message: string } | null;
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
  setWinCondition: (value: WinCondition | null) => void;
  setLoseCondition: (value: LoseCondition | null) => void;
  setEventSelectionMode: (mode: 'random' | 'sequence') => void;
  setEventSequence: (sequence: string[]) => void;
  onSave: () => Promise<void>;
}

export function IndustrySimulationConfigTab({
  industryName,
  loading,
  status,
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
  setWinCondition,
  setLoseCondition,
  setEventSelectionMode,
  setEventSequence,
  onSave,
}: IndustrySimulationConfigTabProps) {

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

  // Helper functions - return current values or defaults for display
  const getMetrics = (): BusinessMetrics => businessMetrics || {
    startingCash: 0,
    monthlyExpenses: 0,
    startingExp: 0,
    startingFreedomScore: 0,
  };
  const getStats = (): BusinessStats => businessStats || {
    ticksPerSecond: 10,
    monthDurationSeconds: 60,
    customerSpawnIntervalSeconds: 3,
    customerPatienceSeconds: 10,
    leavingAngryDurationTicks: 10,
    customerSpawnPosition: { x: 4, y: 9 },
    serviceCapacity: 2,
    expGainPerHappyCustomer: 1,
    expLossPerAngryCustomer: 1,
    eventTriggerSeconds: [],
    serviceRevenueMultiplier: 1,
    serviceRevenueScale: 10,
  };
  const getWinCondition = (): WinCondition => winCondition || { cashTarget: 50000 };
  const getLoseCondition = (): LoseCondition => loseCondition || { cashThreshold: 0, timeThreshold: 0 };

  const updateMetrics = (updates: Partial<BusinessMetrics>) => {
    // Merge with existing data, allowing undefined to clear values
    const current = businessMetrics || {};
    const merged = { ...current, ...updates };
    
    // Remove undefined/null values from the merged object
    const cleaned: Partial<BusinessMetrics> = {};
    Object.entries(merged).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
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
          (cleaned as any)[key] = value;
        }
      } else if (typeof value === 'object' && value !== null) {
        // Keep objects (like customerSpawnPosition)
        (cleaned as any)[key] = value;
      } else if (value !== undefined && value !== null) {
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
    const current = getWinCondition();
    setWinCondition({ ...current, ...updates });
  };

  const updateLoseCondition = (updates: Partial<LoseCondition>) => {
    const current = getLoseCondition();
    setLoseCondition({ ...current, ...updates });
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

  const clearField = (field: string) => {
    switch (field) {
      case 'metrics': setBusinessMetrics(null); break;
      case 'stats': setBusinessStats(null); break;
      case 'map': 
        setMapWidth(null);
        setMapHeight(null);
        setMapWalls([]);
        break;
      case 'layout': 
        setEntryPosition(null);
        setWaitingPositions([]);
        setServiceRooms([]);
        setStaffPositions([]);
        setMainCharacterPosition(null);
        setMainCharacterSpriteImage('');
        break;
      case 'capacity': setCapacityImage(''); break;
      case 'win': setWinCondition(null); break;
      case 'lose': setLoseCondition(null); break;
    }
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-semibold">Industry Simulation Config</h2>
        <p className="text-sm text-slate-400 mt-1">
          Override simulation settings for <span className="font-medium text-slate-300">{industryName}</span>.
          Leave fields empty to use global defaults.
        </p>
        <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <p className="text-xs text-slate-300">
            <span className="font-semibold">Tip:</span> Only override values that differ from global defaults.
            Values shown below are your overrides. Empty fields inherit from Global Config.
          </p>
        </div>
      </div>

      <div className="p-6 space-y-8 max-h-[calc(100vh-300px)] overflow-y-auto">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">{loading ? 'Loading…' : ' '}</span>
          {status && (
            <span className={`text-sm ${status.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {status.message}
            </span>
          )}
        </div>

        {/* Business Metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Business Metrics</h3>
            {businessMetrics && (
              <button onClick={() => clearField('metrics')} className="text-xs text-rose-400 hover:text-rose-300">
                Clear (use global)
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Starting Cash
                {globalMetrics?.startingCash !== undefined && !businessMetrics?.startingCash && (
                  <span className="ml-2 text-[10px] text-slate-500">(global: {globalMetrics.startingCash})</span>
                )}
              </label>
              <input 
                type="number" 
                min="0" 
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" 
                value={getMetrics().startingCash ?? ''} 
                onChange={(e) => updateMetrics({ startingCash: e.target.value === '' ? undefined : Number(e.target.value) })} 
                placeholder={globalMetrics?.startingCash?.toString() || "0"} 
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Monthly Expenses
                {globalMetrics?.monthlyExpenses !== undefined && !businessMetrics?.monthlyExpenses && (
                  <span className="ml-2 text-[10px] text-slate-500">(global: {globalMetrics.monthlyExpenses})</span>
                )}
              </label>
              <input 
                type="number" 
                min="0" 
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" 
                value={getMetrics().monthlyExpenses ?? ''} 
                onChange={(e) => updateMetrics({ monthlyExpenses: e.target.value === '' ? undefined : Number(e.target.value) })} 
                placeholder={globalMetrics?.monthlyExpenses?.toString() || "0"} 
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Starting EXP
                {globalMetrics?.startingExp !== undefined && !businessMetrics?.startingExp && (
                  <span className="ml-2 text-[10px] text-slate-500">(global: {globalMetrics.startingExp})</span>
                )}
              </label>
              <input 
                type="number" 
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" 
                value={getMetrics().startingExp ?? ''} 
                onChange={(e) => updateMetrics({ startingExp: e.target.value === '' ? undefined : Number(e.target.value) })} 
                placeholder={globalMetrics?.startingExp?.toString() || "0"} 
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Starting Freedom Score
                {globalMetrics?.startingFreedomScore !== undefined && !businessMetrics?.startingFreedomScore && (
                  <span className="ml-2 text-[10px] text-slate-500">(global: {globalMetrics.startingFreedomScore})</span>
                )}
              </label>
              <input 
                type="number" 
                min="0" 
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" 
                value={getMetrics().startingFreedomScore ?? ''} 
                onChange={(e) => updateMetrics({ startingFreedomScore: e.target.value === '' ? undefined : Number(e.target.value) })} 
                placeholder={globalMetrics?.startingFreedomScore?.toString() || "0"} 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Starting Time (Hours)</label>
              <input
                type="number"
                min="0"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                value={getMetrics().startingTime ?? ''}
                onChange={(e) => updateMetrics({ startingTime: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="0 (leave empty to disable)"
              />
              <p className="text-xs text-slate-500 mt-1">
                Monthly time budget (refreshes each month). Set to enable time currency.
              </p>
            </div>
          </div>
        </div>

        {/* Business Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Business Stats</h3>
            {businessStats && (
              <button onClick={() => clearField('stats')} className="text-xs text-rose-400 hover:text-rose-300">
                Clear (use global)
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Ticks Per Second
                {globalStats?.ticksPerSecond !== undefined && !businessStats?.ticksPerSecond && (
                  <span className="ml-2 text-[10px] text-slate-500">(global: {globalStats.ticksPerSecond})</span>
                )}
              </label>
              <input 
                type="number" 
                min="1" 
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" 
                value={getStats().ticksPerSecond} 
                onChange={(e) => updateStats({ ticksPerSecond: e.target.value === '' ? undefined : Number(e.target.value) })} 
                placeholder={globalStats?.ticksPerSecond?.toString()}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Month Duration (sec)
                {globalStats?.monthDurationSeconds !== undefined && !businessStats?.monthDurationSeconds && (
                  <span className="ml-2 text-[10px] text-slate-500">(global: {globalStats.monthDurationSeconds})</span>
                )}
              </label>
              <input 
                type="number" 
                min="1" 
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" 
                value={getStats().monthDurationSeconds} 
                onChange={(e) => updateStats({ monthDurationSeconds: e.target.value === '' ? undefined : Number(e.target.value) })} 
                placeholder={globalStats?.monthDurationSeconds?.toString()}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Spawn Interval (sec)
                {globalStats?.customerSpawnIntervalSeconds !== undefined && !businessStats?.customerSpawnIntervalSeconds && (
                  <span className="ml-2 text-[10px] text-slate-500">(global: {globalStats.customerSpawnIntervalSeconds})</span>
                )}
              </label>
              <input 
                type="number" 
                min="0" 
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" 
                value={getStats().customerSpawnIntervalSeconds} 
                onChange={(e) => updateStats({ customerSpawnIntervalSeconds: e.target.value === '' ? undefined : Number(e.target.value) })} 
                placeholder={globalStats?.customerSpawnIntervalSeconds?.toString()}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Customer Patience (sec)
                {globalStats?.customerPatienceSeconds !== undefined && !businessStats?.customerPatienceSeconds && (
                  <span className="ml-2 text-[10px] text-slate-500">(global: {globalStats.customerPatienceSeconds})</span>
                )}
              </label>
              <input 
                type="number" 
                min="0" 
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" 
                value={getStats().customerPatienceSeconds} 
                onChange={(e) => updateStats({ customerPatienceSeconds: e.target.value === '' ? undefined : Number(e.target.value) })} 
                placeholder={globalStats?.customerPatienceSeconds?.toString()}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Service Capacity
                {globalStats?.serviceCapacity !== undefined && !businessStats?.serviceCapacity && (
                  <span className="ml-2 text-[10px] text-slate-500">(global: {globalStats.serviceCapacity})</span>
                )}
              </label>
              <input 
                type="number" 
                min="0" 
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" 
                value={getStats().serviceCapacity} 
                onChange={(e) => updateStats({ serviceCapacity: e.target.value === '' ? undefined : Number(e.target.value) })} 
                placeholder={globalStats?.serviceCapacity?.toString()}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Service Revenue Multiplier
                {globalStats?.serviceRevenueMultiplier !== undefined && !businessStats?.serviceRevenueMultiplier && (
                  <span className="ml-2 text-[10px] text-slate-500">(global: {globalStats.serviceRevenueMultiplier})</span>
                )}
              </label>
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" 
                value={getStats().serviceRevenueMultiplier ?? ''} 
                onChange={(e) => updateStats({ serviceRevenueMultiplier: e.target.value === '' ? undefined : Number(e.target.value) })} 
                placeholder={globalStats?.serviceRevenueMultiplier?.toString() || "1"}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Lead Conversion Rate
                {globalStats?.conversionRate !== undefined && !businessStats?.conversionRate && (
                  <span className="ml-2 text-[10px] text-slate-500">(global: {globalStats.conversionRate})</span>
                )}
              </label>
              <input 
                type="number" 
                min="0.1" 
                step="0.1" 
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" 
                value={getStats().conversionRate ?? ''} 
                onChange={(e) => updateStats({ conversionRate: e.target.value === '' ? undefined : Number(e.target.value) })} 
                placeholder={globalStats?.conversionRate?.toString() || "10"}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Failure Rate (%)
                {globalStats?.failureRate !== undefined && !businessStats?.failureRate && (
                  <span className="ml-2 text-[10px] text-slate-500">(global: {globalStats.failureRate})</span>
                )}
              </label>
              <input 
                type="number" 
                min="0" 
                max="100" 
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" 
                value={getStats().failureRate ?? ''} 
                onChange={(e) => updateStats({ failureRate: e.target.value === '' ? undefined : Number(e.target.value) })} 
                placeholder={globalStats?.failureRate?.toString() || "0"}
              />
              <p className="text-xs text-slate-500 mt-1">Base failure rate percentage (0-100%)</p>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Service Revenue Scale
                {globalStats?.serviceRevenueScale !== undefined && !businessStats?.serviceRevenueScale && (
                  <span className="ml-2 text-[10px] text-slate-500">(global: {globalStats.serviceRevenueScale})</span>
                )}
              </label>
              <input 
                type="number" 
                min="0" 
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" 
                value={getStats().serviceRevenueScale ?? ''} 
                onChange={(e) => updateStats({ serviceRevenueScale: e.target.value === '' ? undefined : Number(e.target.value) })} 
                placeholder={globalStats?.serviceRevenueScale?.toString() || "10"}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                EXP Gain per Happy Customer
                {globalStats?.expGainPerHappyCustomer !== undefined && !businessStats?.expGainPerHappyCustomer && (
                  <span className="ml-2 text-[10px] text-slate-500">(global: {globalStats.expGainPerHappyCustomer})</span>
                )}
              </label>
              <input 
                type="number" 
                min="0" 
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" 
                value={getStats().expGainPerHappyCustomer ?? ''} 
                onChange={(e) => updateStats({ expGainPerHappyCustomer: e.target.value === '' ? undefined : Number(e.target.value) })} 
                placeholder={globalStats?.expGainPerHappyCustomer?.toString() || "2"}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                EXP Loss per Angry Customer
                {globalStats?.expLossPerAngryCustomer !== undefined && !businessStats?.expLossPerAngryCustomer && (
                  <span className="ml-2 text-[10px] text-slate-500">(global: {globalStats.expLossPerAngryCustomer})</span>
                )}
              </label>
              <input 
                type="number" 
                min="0" 
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" 
                value={getStats().expLossPerAngryCustomer ?? ''} 
                onChange={(e) => updateStats({ expLossPerAngryCustomer: e.target.value === '' ? undefined : Number(e.target.value) })} 
                placeholder={globalStats?.expLossPerAngryCustomer?.toString() || "1"}
              />
            </div>
          </div>
        </div>

        {/* Win/Lose Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Win Condition</h3>
              {winCondition && (
                <button onClick={() => clearField('win')} className="text-xs text-rose-400 hover:text-rose-300">
                  Clear (use global)
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Cash Target</label>
                <input type="number" min="0" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getWinCondition().cashTarget} onChange={(e) => updateWinCondition({ cashTarget: Number(e.target.value) })} />
                <p className="text-xs text-slate-500 mt-1">Target cash amount to win the game</p>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Month Target (Optional)</label>
                <input type="number" min="1" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getWinCondition().monthTarget || ''} onChange={(e) => updateWinCondition({ monthTarget: e.target.value ? Number(e.target.value) : undefined })} />
                <p className="text-xs text-slate-500 mt-1">Win by surviving this many months (alternative to cash target)</p>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Custom Victory Title (Optional)</label>
                <input type="text" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getWinCondition().customTitle || ''} onChange={(e) => updateWinCondition({ customTitle: e.target.value || undefined })} placeholder="🎉 Mission Accomplished!" />
                <p className="text-xs text-slate-500 mt-1">Override the default victory title</p>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Custom Victory Message (Optional)</label>
                <textarea rows={3} className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 resize-none" value={getWinCondition().customMessage || ''} onChange={(e) => updateWinCondition({ customMessage: e.target.value || undefined })} placeholder="Congratulations! You've successfully completed your business challenge!" />
                <p className="text-xs text-slate-500 mt-1">Override the default victory message</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Lose Condition</h3>
              {loseCondition && (
                <button onClick={() => clearField('lose')} className="text-xs text-rose-400 hover:text-rose-300">
                  Clear (use global)
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Cash Threshold</label>
                <input type="number" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getLoseCondition().cashThreshold} onChange={(e) => updateLoseCondition({ cashThreshold: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Time Threshold</label>
                <input type="number" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getLoseCondition().timeThreshold} onChange={(e) => updateLoseCondition({ timeThreshold: Number(e.target.value) })} />
                <p className="text-xs text-slate-500 mt-1">Game over if available time &lt;= this value (default: 0, only applies if time system is enabled)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Capacity Image */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Capacity Image</h3>
            {capacityImage && (
              <button onClick={() => clearField('capacity')} className="text-xs text-rose-400 hover:text-rose-300">
                Clear (use global)
              </button>
            )}
          </div>
          <input type="text" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={capacityImage} onChange={(e) => setCapacityImage(e.target.value)} placeholder="/images/beds/bed.png" />
        </div>

        {/* Map Config - Broken Down */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Map Configuration</h3>
            {(mapWidth !== null || mapHeight !== null || mapWalls.length > 0) && (
              <button onClick={() => clearField('map')} className="text-xs text-rose-400 hover:text-rose-300">
                Clear (use global)
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Map Width</label>
              <input type="number" min="1" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={mapWidth ?? ''} onChange={(e) => setMapWidth(e.target.value ? Number(e.target.value) : null)} placeholder="10" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Map Height</label>
              <input type="number" min="1" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={mapHeight ?? ''} onChange={(e) => setMapHeight(e.target.value ? Number(e.target.value) : null)} placeholder="10" />
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
                  <input type="number" className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm" placeholder="X" value={wall.x} onChange={(e) => updateMapWall(idx, 'x', Number(e.target.value))} />
                  <input type="number" className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm" placeholder="Y" value={wall.y} onChange={(e) => updateMapWall(idx, 'y', Number(e.target.value))} />
                  <button onClick={() => removeMapWall(idx)} className="px-2 py-1 bg-rose-600 hover:bg-rose-700 rounded text-sm">Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Layout Positions - At Bottom */}
        <div className="space-y-3 border-t border-slate-800 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Layout Positions</h3>
              <p className="text-xs text-slate-500 mt-1">Configure where entities appear on the map</p>
            </div>
            {(entryPosition || waitingPositions.length > 0 || serviceRooms.length > 0 || staffPositions.length > 0) && (
              <button onClick={() => clearField('layout')} className="text-xs text-rose-400 hover:text-rose-300">
                Clear Layout
              </button>
            )}
          </div>
          
          {/* Entry Position */}
          <div className="bg-slate-800 rounded-lg p-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Entry Position</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">X</label>
                <input type="number" className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200" value={entryPosition?.x ?? 0} onChange={(e) => updateEntryPosition('x', Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Y</label>
                <input type="number" className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200" value={entryPosition?.y ?? 0} onChange={(e) => updateEntryPosition('y', Number(e.target.value))} />
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
                  <input type="number" className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm" placeholder="X" value={pos.x} onChange={(e) => updatePosition('waiting', idx, 'x', Number(e.target.value))} />
                  <input type="number" className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm" placeholder="Y" value={pos.y} onChange={(e) => updatePosition('waiting', idx, 'y', Number(e.target.value))} />
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
                      <input 
                        type="number" 
                        className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm" 
                        placeholder="X" 
                        value={room.customerPosition.x} 
                        onChange={(e) => updateServiceRoomPosition(idx, 'customer', 'x', Number(e.target.value))} 
                      />
                      <input 
                        type="number" 
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
                      <input 
                        type="number" 
                        min="1"
                        className="w-16 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-xs" 
                        placeholder="W" 
                        value={room.customerPosition.width ?? ''} 
                        onChange={(e) => updateServiceRoomPosition(idx, 'customer', 'width', e.target.value ? Number(e.target.value) : null)} 
                      />
                      <span className="text-slate-500">×</span>
                      <input 
                        type="number" 
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
                      <input 
                        type="number" 
                        className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm" 
                        placeholder="X" 
                        value={room.staffPosition.x} 
                        onChange={(e) => updateServiceRoomPosition(idx, 'staff', 'x', Number(e.target.value))} 
                      />
                      <input 
                        type="number" 
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
                      <input 
                        type="number" 
                        min="1"
                        className="w-16 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-xs" 
                        placeholder="W" 
                        value={room.staffPosition.width ?? ''} 
                        onChange={(e) => updateServiceRoomPosition(idx, 'staff', 'width', e.target.value ? Number(e.target.value) : null)} 
                      />
                      <span className="text-slate-500">×</span>
                      <input 
                        type="number" 
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
                  <input type="number" className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm" placeholder="X" value={pos.x} onChange={(e) => updatePosition('staff', idx, 'x', Number(e.target.value))} />
                  <input type="number" className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm" placeholder="Y" value={pos.y} onChange={(e) => updatePosition('staff', idx, 'y', Number(e.target.value))} />
                  <button onClick={() => removePosition('staff', idx)} className="px-2 py-1 bg-rose-600 hover:bg-rose-700 rounded text-sm">Remove</button>
                </div>
              ))}
            </div>
          </div>

          {/* Main Character Position */}
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">Main Character Position (Founder)</label>
              {mainCharacterPosition ? (
                <button onClick={() => setMainCharacterPosition(null)} className="text-xs px-2 py-1 bg-rose-600 hover:bg-rose-700 rounded">Clear</button>
              ) : (
                <button onClick={() => setMainCharacterPosition({ x: 4, y: 0 })} className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded">+ Add</button>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-2">Optional: Position for the main character (founder). If not set, defaults to first staff position.</p>
            {mainCharacterPosition ? (
              <div className="flex gap-2">
                <input 
                  type="number" 
                  className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm" 
                  placeholder="X" 
                  value={mainCharacterPosition.x} 
                  onChange={(e) => setMainCharacterPosition({ ...mainCharacterPosition, x: Number(e.target.value) })} 
                />
                <input 
                  type="number" 
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
          <button onClick={onSave} disabled={saving || loading} className={`px-6 py-2 rounded-lg font-medium transition ${saving || loading ? 'bg-slate-700 text-slate-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
            {saving ? 'Saving…' : 'Save Industry Config'}
          </button>
        </div>
      </div>
    </section>
  );
}
