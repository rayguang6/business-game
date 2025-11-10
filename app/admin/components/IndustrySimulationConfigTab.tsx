'use client';

import { useState } from 'react';
import type { BusinessMetrics, BusinessStats, GridPosition } from '@/lib/game/types';
import type { WinCondition, LoseCondition } from '@/lib/game/winConditions';

interface IndustrySimulationConfigTabProps {
  industryName: string;
  loading: boolean;
  status: { type: 'success' | 'error'; message: string } | null;
  saving: boolean;
  // Data (nullable - means using global defaults)
  businessMetrics: BusinessMetrics | null;
  businessStats: BusinessStats | null;
  mapWidth: number | null;
  mapHeight: number | null;
  mapWalls: GridPosition[];
  entryPosition: GridPosition | null;
  waitingPositions: GridPosition[];
  serviceRoomPositions: GridPosition[];
  staffPositions: GridPosition[];
  capacityImage: string;
  winCondition: WinCondition | null;
  loseCondition: LoseCondition | null;
  // customerImages and staffNamePool removed - they're global only
  // Setters
  setBusinessMetrics: (value: BusinessMetrics | null) => void;
  setBusinessStats: (value: BusinessStats | null) => void;
  setMapWidth: (value: number | null) => void;
  setMapHeight: (value: number | null) => void;
  setMapWalls: (value: GridPosition[]) => void;
  setEntryPosition: (value: GridPosition | null) => void;
  setWaitingPositions: (value: GridPosition[]) => void;
  setServiceRoomPositions: (value: GridPosition[]) => void;
  setStaffPositions: (value: GridPosition[]) => void;
  setCapacityImage: (value: string) => void;
  setWinCondition: (value: WinCondition | null) => void;
  setLoseCondition: (value: LoseCondition | null) => void;
  onSave: () => Promise<void>;
}

export function IndustrySimulationConfigTab({
  industryName,
  loading,
  status,
  saving,
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
  onSave,
}: IndustrySimulationConfigTabProps) {

  // Helper functions
  const getMetrics = (): BusinessMetrics => businessMetrics || { startingCash: 0, monthlyExpenses: 0, startingReputation: 0, founderWorkHours: 0 };
  const getStats = (): BusinessStats => businessStats || {
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
  const getWinCondition = (): WinCondition => winCondition || { founderHoursMax: 40, monthlyProfitTarget: 0, consecutiveMonthsRequired: 2 };
  const getLoseCondition = (): LoseCondition => loseCondition || { cashThreshold: 0, reputationThreshold: 0, founderHoursMax: 400 };

  const updateMetrics = (updates: Partial<BusinessMetrics>) => {
    const current = getMetrics();
    setBusinessMetrics({ ...current, ...updates });
  };

  const updateStats = (updates: Partial<BusinessStats>) => {
    const current = getStats();
    setBusinessStats({ ...current, ...updates });
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

  const addPosition = (type: 'waiting' | 'serviceRoom' | 'staff', x: number, y: number) => {
    const pos: GridPosition = { x, y };
    if (type === 'waiting') {
      setWaitingPositions([...waitingPositions, pos]);
    } else if (type === 'serviceRoom') {
      setServiceRoomPositions([...serviceRoomPositions, pos]);
    } else {
      setStaffPositions([...staffPositions, pos]);
    }
  };

  const removePosition = (type: 'waiting' | 'serviceRoom' | 'staff', index: number) => {
    if (type === 'waiting') {
      setWaitingPositions(waitingPositions.filter((_, i) => i !== index));
    } else if (type === 'serviceRoom') {
      setServiceRoomPositions(serviceRoomPositions.filter((_, i) => i !== index));
    } else {
      setStaffPositions(staffPositions.filter((_, i) => i !== index));
    }
  };

  const updatePosition = (type: 'waiting' | 'serviceRoom' | 'staff', index: number, field: 'x' | 'y', value: number) => {
    if (type === 'waiting') {
      setWaitingPositions(waitingPositions.map((pos, i) => i === index ? { ...pos, [field]: value } : pos));
    } else if (type === 'serviceRoom') {
      setServiceRoomPositions(serviceRoomPositions.map((pos, i) => i === index ? { ...pos, [field]: value } : pos));
    } else {
      setStaffPositions(staffPositions.map((pos, i) => i === index ? { ...pos, [field]: value } : pos));
    }
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
        setServiceRoomPositions([]);
        setStaffPositions([]);
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
              <label className="block text-xs text-slate-400 mb-1">Starting Cash</label>
              <input type="number" min="0" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getMetrics().startingCash} onChange={(e) => updateMetrics({ startingCash: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Monthly Expenses</label>
              <input type="number" min="0" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getMetrics().monthlyExpenses} onChange={(e) => updateMetrics({ monthlyExpenses: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Starting Reputation</label>
              <input type="number" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getMetrics().startingReputation} onChange={(e) => updateMetrics({ startingReputation: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Founder Work Hours</label>
              <input type="number" min="0" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getMetrics().founderWorkHours} onChange={(e) => updateMetrics({ founderWorkHours: Number(e.target.value) })} />
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
              <label className="block text-xs text-slate-400 mb-1">Ticks Per Second</label>
              <input type="number" min="1" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getStats().ticksPerSecond} onChange={(e) => updateStats({ ticksPerSecond: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Month Duration (sec)</label>
              <input type="number" min="1" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getStats().monthDurationSeconds} onChange={(e) => updateStats({ monthDurationSeconds: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Spawn Interval (sec)</label>
              <input type="number" min="0" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getStats().customerSpawnIntervalSeconds} onChange={(e) => updateStats({ customerSpawnIntervalSeconds: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Customer Patience (sec)</label>
              <input type="number" min="0" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getStats().customerPatienceSeconds} onChange={(e) => updateStats({ customerPatienceSeconds: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Treatment Rooms</label>
              <input type="number" min="0" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getStats().treatmentRooms} onChange={(e) => updateStats({ treatmentRooms: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Service Revenue Multiplier</label>
              <input type="number" step="0.01" min="0" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getStats().serviceRevenueMultiplier ?? 1} onChange={(e) => updateStats({ serviceRevenueMultiplier: Number(e.target.value) })} />
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
                <label className="block text-xs text-slate-400 mb-1">Founder Hours Max</label>
                <input type="number" min="0" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getWinCondition().founderHoursMax} onChange={(e) => updateWinCondition({ founderHoursMax: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Monthly Profit Target</label>
                <input type="number" min="0" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getWinCondition().monthlyProfitTarget} onChange={(e) => updateWinCondition({ monthlyProfitTarget: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Consecutive Months Required</label>
                <input type="number" min="1" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getWinCondition().consecutiveMonthsRequired} onChange={(e) => updateWinCondition({ consecutiveMonthsRequired: Number(e.target.value) })} />
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
                <label className="block text-xs text-slate-400 mb-1">Reputation Threshold</label>
                <input type="number" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getLoseCondition().reputationThreshold} onChange={(e) => updateLoseCondition({ reputationThreshold: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Founder Hours Max (Burnout)</label>
                <input type="number" min="0" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200" value={getLoseCondition().founderHoursMax} onChange={(e) => updateLoseCondition({ founderHoursMax: Number(e.target.value) })} />
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
            {(entryPosition || waitingPositions.length > 0 || serviceRoomPositions.length > 0 || staffPositions.length > 0) && (
              <button onClick={() => clearField('layout')} className="text-xs text-rose-400 hover:text-rose-300">
                Clear (use global)
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
            <div className="space-y-2">
              {waitingPositions.map((pos, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="number" className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm" placeholder="X" value={pos.x} onChange={(e) => updatePosition('waiting', idx, 'x', Number(e.target.value))} />
                  <input type="number" className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm" placeholder="Y" value={pos.y} onChange={(e) => updatePosition('waiting', idx, 'y', Number(e.target.value))} />
                  <button onClick={() => removePosition('waiting', idx)} className="px-2 py-1 bg-rose-600 hover:bg-rose-700 rounded text-sm">Remove</button>
                </div>
              ))}
            </div>
          </div>

          {/* Service Room Positions */}
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">Service Room Positions</label>
              <button onClick={() => addPosition('serviceRoom', 0, 0)} className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded">+ Add</button>
            </div>
            <div className="space-y-2">
              {serviceRoomPositions.map((pos, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="number" className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm" placeholder="X" value={pos.x} onChange={(e) => updatePosition('serviceRoom', idx, 'x', Number(e.target.value))} />
                  <input type="number" className="w-20 rounded-lg bg-slate-700 border border-slate-600 px-2 py-1 text-slate-200 text-sm" placeholder="Y" value={pos.y} onChange={(e) => updatePosition('serviceRoom', idx, 'y', Number(e.target.value))} />
                  <button onClick={() => removePosition('serviceRoom', idx)} className="px-2 py-1 bg-rose-600 hover:bg-rose-700 rounded text-sm">Remove</button>
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
