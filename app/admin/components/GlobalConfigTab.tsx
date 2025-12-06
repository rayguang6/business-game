'use client';

import { useEffect, useState } from 'react';
import type { BusinessMetrics, BusinessStats, MovementConfig } from '@/lib/game/types';
import type { WinCondition, LoseCondition } from '@/lib/game/winConditions';

type UiConfig = {
  eventAutoSelectDurationSeconds?: number;
  outcomePopupDurationSeconds?: number;
};

interface GlobalConfigTabProps {
  globalLoading: boolean;
  globalStatus: string | null;
  globalSaving: boolean;
  metrics: BusinessMetrics | null;
  stats: BusinessStats | null;
  movement: MovementConfig | null;
  winCondition: WinCondition | null;
  loseCondition: LoseCondition | null;
  uiConfig: UiConfig;
  onUpdateMetrics: (updates: Partial<BusinessMetrics>) => void;
  onUpdateStats: (updates: Partial<BusinessStats>) => void;
  onUpdateMovement: (movement: MovementConfig | null) => void;
  onUpdateWinCondition: (updates: Partial<WinCondition>) => void;
  onUpdateLoseCondition: (updates: Partial<LoseCondition>) => void;
  onUpdateUiConfig: (updates: Partial<UiConfig>) => void;
  onSave: () => Promise<void>;
}

export function GlobalConfigTab({
  globalLoading,
  globalStatus,
  globalSaving,
  metrics,
  stats,
  movement,
  winCondition,
  loseCondition,
  uiConfig,
  onUpdateMetrics,
  onUpdateStats,
  onUpdateMovement,
  onUpdateWinCondition,
  onUpdateLoseCondition,
  onUpdateUiConfig,
  onSave,
}: GlobalConfigTabProps) {
  // Helper to get value or empty string for inputs
  const getValue = (val: number | null | undefined): string => {
    return val !== null && val !== undefined ? String(val) : '';
  };

  const getArrayValue = (arr: number[] | null | undefined): string => {
    return arr && arr.length > 0 ? arr.join(', ') : '';
  };
  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!globalSaving) {
          onSave();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [globalSaving, onSave]);

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-semibold">Simulation Config</h2>
        <p className="text-sm text-slate-400 mt-1">Configure simulation settings.</p>
      </div>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">{globalLoading ? 'Loading…' : ' '}</span>
          {globalStatus && <span className="text-sm text-slate-300">{globalStatus}</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-300">Business Metrics</label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Starting Cash</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(metrics?.startingCash)}
                  onChange={(e) => onUpdateMetrics({ startingCash: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Monthly Expenses</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(metrics?.monthlyExpenses)}
                  onChange={(e) => onUpdateMetrics({ monthlyExpenses: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Starting EXP</label>
                <input
                  type="number"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(metrics?.startingExp)}
                  onChange={(e) => onUpdateMetrics({ startingExp: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Starting Freedom Score</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(metrics?.startingFreedomScore)}
                  onChange={(e) => onUpdateMetrics({ startingFreedomScore: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Starting Time (Hours)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(metrics?.startingTime)}
                  onChange={(e) => onUpdateMetrics({ startingTime: e.target.value === '' ? undefined : Number(e.target.value) })}
                  placeholder="Leave empty to disable"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Monthly available time (refreshes each month). Set to enable time currency.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-300">Business Stats</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Ticks Per Second</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(stats?.ticksPerSecond)}
                  onChange={(e) => onUpdateStats({ ticksPerSecond: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Month Duration (sec)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(stats?.monthDurationSeconds)}
                  onChange={(e) => onUpdateStats({ monthDurationSeconds: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Customer Spawn Interval (sec)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(stats?.customerSpawnIntervalSeconds)}
                  onChange={(e) => onUpdateStats({ customerSpawnIntervalSeconds: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Customer Patience (sec)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(stats?.customerPatienceSeconds)}
                  onChange={(e) => onUpdateStats({ customerPatienceSeconds: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Leaving Angry Duration (ticks)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(stats?.leavingAngryDurationTicks)}
                  onChange={(e) => onUpdateStats({ leavingAngryDurationTicks: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Service Capacity</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(stats?.serviceCapacity)}
                  onChange={(e) => onUpdateStats({ serviceCapacity: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">EXP Gain per Happy Customer</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(stats?.expGainPerHappyCustomer)}
                  onChange={(e) => onUpdateStats({ expGainPerHappyCustomer: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">EXP Loss per Angry Customer</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(stats?.expLossPerAngryCustomer)}
                  onChange={(e) => onUpdateStats({ expLossPerAngryCustomer: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">EXP Required Per Level</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(stats?.expPerLevel)}
                  onChange={(e) => onUpdateStats({ expPerLevel: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Service Revenue Multiplier</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(stats?.serviceRevenueMultiplier)}
                  onChange={(e) => onUpdateStats({ serviceRevenueMultiplier: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Service Revenue Scale</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(stats?.serviceRevenueScale)}
                  onChange={(e) => onUpdateStats({ serviceRevenueScale: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Spawn Position X</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(stats?.customerSpawnPosition?.x)}
                  onChange={(e) => {
                    const xValue = e.target.value === '' ? undefined : Number(e.target.value);
                    const currentPos = stats?.customerSpawnPosition || { x: 0, y: 0 };
                    if (xValue !== undefined) {
                      onUpdateStats({
                        customerSpawnPosition: { ...currentPos, x: xValue },
                      });
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Spawn Position Y</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(stats?.customerSpawnPosition?.y)}
                  onChange={(e) => {
                    const yValue = e.target.value === '' ? undefined : Number(e.target.value);
                    const currentPos = stats?.customerSpawnPosition || { x: 0, y: 0 };
                    if (yValue !== undefined) {
                      onUpdateStats({
                        customerSpawnPosition: { ...currentPos, y: yValue },
                      });
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Event Trigger Times (seconds)</label>
                <input
                  type="text"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getArrayValue(stats?.eventTriggerSeconds)}
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    if (value === '') {
                      onUpdateStats({ eventTriggerSeconds: [] });
                    } else {
                      const numbers = value.split(',').map(s => s.trim()).filter(s => s).map(s => Number(s)).filter(n => !isNaN(n));
                      onUpdateStats({ eventTriggerSeconds: numbers });
                    }
                  }}
                  placeholder="15, 30, 45"
                />
                <p className="text-xs text-slate-500 mt-1">Comma-separated list of seconds when events should trigger during a month</p>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Conversion Rate</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(stats?.conversionRate)}
                  onChange={(e) => onUpdateStats({ conversionRate: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Failure Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(stats?.failureRate)}
                  onChange={(e) => onUpdateStats({ failureRate: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
                <p className="text-xs text-slate-500 mt-1">Base failure rate percentage (0-100%)</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-300">Movement Config</label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Customer Tiles Per Tick</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(movement?.customerTilesPerTick)}
                  onChange={(e) => {
                    const newValue = e.target.value === '' ? undefined : Number(e.target.value);
                    if (movement && newValue !== undefined) {
                      onUpdateMovement({ ...movement, customerTilesPerTick: newValue });
                    } else if (newValue !== undefined) {
                      onUpdateMovement({
                        customerTilesPerTick: newValue,
                        animationReferenceTilesPerTick: 0.25,
                        walkFrameDurationMs: 200,
                        minWalkFrameDurationMs: 80,
                        maxWalkFrameDurationMs: 320,
                        celebrationFrameDurationMs: 200,
                      });
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Animation Reference Tiles Per Tick</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(movement?.animationReferenceTilesPerTick)}
                  onChange={(e) => {
                    const newValue = e.target.value === '' ? undefined : Number(e.target.value);
                    if (movement && newValue !== undefined) {
                      onUpdateMovement({ ...movement, animationReferenceTilesPerTick: newValue });
                    } else if (newValue !== undefined) {
                      onUpdateMovement({
                        customerTilesPerTick: 0.25,
                        animationReferenceTilesPerTick: newValue,
                        walkFrameDurationMs: 200,
                        minWalkFrameDurationMs: 80,
                        maxWalkFrameDurationMs: 320,
                        celebrationFrameDurationMs: 200,
                      });
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Walk Frame Duration (ms)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(movement?.walkFrameDurationMs)}
                  onChange={(e) => {
                    const newValue = e.target.value === '' ? undefined : Number(e.target.value);
                    if (movement && newValue !== undefined) {
                      onUpdateMovement({ ...movement, walkFrameDurationMs: newValue });
                    } else if (newValue !== undefined) {
                      onUpdateMovement({
                        customerTilesPerTick: 0.25,
                        animationReferenceTilesPerTick: 0.25,
                        walkFrameDurationMs: newValue,
                        minWalkFrameDurationMs: 80,
                        maxWalkFrameDurationMs: 320,
                        celebrationFrameDurationMs: 200,
                      });
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Min Walk Frame Duration (ms)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(movement?.minWalkFrameDurationMs)}
                  onChange={(e) => {
                    const newValue = e.target.value === '' ? undefined : Number(e.target.value);
                    if (movement && newValue !== undefined) {
                      onUpdateMovement({ ...movement, minWalkFrameDurationMs: newValue });
                    } else if (newValue !== undefined) {
                      onUpdateMovement({
                        customerTilesPerTick: 0.25,
                        animationReferenceTilesPerTick: 0.25,
                        walkFrameDurationMs: 200,
                        minWalkFrameDurationMs: newValue,
                        maxWalkFrameDurationMs: 320,
                        celebrationFrameDurationMs: 200,
                      });
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Max Walk Frame Duration (ms)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(movement?.maxWalkFrameDurationMs)}
                  onChange={(e) => {
                    const newValue = e.target.value === '' ? undefined : Number(e.target.value);
                    if (movement && newValue !== undefined) {
                      onUpdateMovement({ ...movement, maxWalkFrameDurationMs: newValue });
                    } else if (newValue !== undefined) {
                      onUpdateMovement({
                        customerTilesPerTick: 0.25,
                        animationReferenceTilesPerTick: 0.25,
                        walkFrameDurationMs: 200,
                        minWalkFrameDurationMs: 80,
                        maxWalkFrameDurationMs: newValue,
                        celebrationFrameDurationMs: 200,
                      });
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Celebration Frame Duration (ms)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={getValue(movement?.celebrationFrameDurationMs)}
                  onChange={(e) => {
                    const newValue = e.target.value === '' ? undefined : Number(e.target.value);
                    if (movement && newValue !== undefined) {
                      onUpdateMovement({ ...movement, celebrationFrameDurationMs: newValue });
                    } else if (newValue !== undefined) {
                      onUpdateMovement({
                        customerTilesPerTick: 0.25,
                        animationReferenceTilesPerTick: 0.25,
                        walkFrameDurationMs: 200,
                        minWalkFrameDurationMs: 80,
                        maxWalkFrameDurationMs: 320,
                        celebrationFrameDurationMs: newValue,
                      });
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <label className="block text-sm font-semibold text-slate-300 mb-4">UI Configuration</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Event Auto-Select Duration (seconds)</label>
              <input
                type="number"
                min="1"
                max="60"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200"
                value={uiConfig.eventAutoSelectDurationSeconds ?? 10}
                onChange={(e) => onUpdateUiConfig({ eventAutoSelectDurationSeconds: Number(e.target.value) })}
              />
              <p className="text-xs text-slate-500 mt-1">How long to wait before auto-selecting the default event choice</p>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Outcome Popup Duration (seconds)</label>
              <input
                type="number"
                min="1"
                max="30"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200"
                value={uiConfig.outcomePopupDurationSeconds ?? 5}
                onChange={(e) => onUpdateUiConfig({ outcomePopupDurationSeconds: Number(e.target.value) })}
              />
              <p className="text-xs text-slate-500 mt-1">How long outcome popups stay visible before auto-dismissing</p>
            </div>
          </div>
        </div>




        <div className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <label className="block text-sm font-semibold text-slate-300 mb-4">Win Condition</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Cash Target</label>
              <input
                type="number"
                min="0"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200"
                value={getValue(winCondition?.cashTarget)}
                onChange={(e) => onUpdateWinCondition({ cashTarget: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
              <p className="text-xs text-slate-500 mt-1">Target cash amount to win the game</p>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Month Target</label>
              <input
                type="number"
                min="0"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200"
                value={getValue(winCondition?.monthTarget)}
                onChange={(e) => onUpdateWinCondition({ monthTarget: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
              <p className="text-xs text-slate-500 mt-1">Win by surviving this many months</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Custom Victory Title (Optional)</label>
              <input
                type="text"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200"
                value={winCondition?.customTitle || ''}
                onChange={(e) => onUpdateWinCondition({ customTitle: e.target.value || undefined })}
                placeholder="🎉 Mission Accomplished!"
              />
              <p className="text-xs text-slate-500 mt-1">Override the default victory title</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Custom Victory Message (Optional)</label>
              <textarea
                rows={3}
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200 resize-none"
                value={winCondition?.customMessage || ''}
                onChange={(e) => onUpdateWinCondition({ customMessage: e.target.value || undefined })}
                placeholder="Congratulations! You've successfully completed your business challenge!"
              />
              <p className="text-xs text-slate-500 mt-1">Override the default victory message</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <label className="block text-sm font-semibold text-slate-300 mb-4">Lose Condition</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Cash Threshold</label>
              <input
                type="number"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200"
                value={getValue(loseCondition?.cashThreshold)}
                onChange={(e) => onUpdateLoseCondition({ cashThreshold: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
              <p className="text-xs text-slate-500 mt-1">Game over if cash &lt;= this value</p>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Time Threshold</label>
              <input
                type="number"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200"
                value={getValue(loseCondition?.timeThreshold)}
                onChange={(e) => onUpdateLoseCondition({ timeThreshold: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
              <p className="text-xs text-slate-500 mt-1">Game over if available time &lt;= this value (only applies if time system is enabled)</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={globalSaving}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              globalSaving
                ? 'bg-slate-700 text-slate-400 cursor-wait'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {globalSaving ? 'Saving…' : 'Save Config'}
          </button>
        </div>

        {/* Floating Save Button */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl px-6 py-3 shadow-2xl">
            <button
              type="button"
              onClick={onSave}
              disabled={globalSaving}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${
                globalSaving
                  ? 'bg-slate-700 text-slate-400 cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {globalSaving ? '💾 Saving…' : '💾 Save Config (⌘↵)'}
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}

