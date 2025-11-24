'use client';

import type { BusinessMetrics, BusinessStats, MovementConfig } from '@/lib/game/types';
import type { WinCondition, LoseCondition } from '@/lib/game/winConditions';

interface GlobalConfigTabProps {
  globalLoading: boolean;
  globalStatus: string | null;
  globalSaving: boolean;
  metrics: BusinessMetrics;
  stats: BusinessStats;
  eventSecondsInput: string;
  movementJSON: string;
  winCondition: WinCondition;
  loseCondition: LoseCondition;
  onUpdateMetrics: (updates: Partial<BusinessMetrics>) => void;
  onUpdateStats: (updates: Partial<BusinessStats>) => void;
  onUpdateEventSeconds: (value: string) => void;
  onUpdateMovementJSON: (value: string) => void;
  onUpdateWinCondition: (updates: Partial<WinCondition>) => void;
  onUpdateLoseCondition: (updates: Partial<LoseCondition>) => void;
  onSave: () => Promise<void>;
}

export function GlobalConfigTab({
  globalLoading,
  globalStatus,
  globalSaving,
  metrics,
  stats,
  eventSecondsInput,
  movementJSON,
  winCondition,
  loseCondition,
  onUpdateMetrics,
  onUpdateStats,
  onUpdateEventSeconds,
  onUpdateMovementJSON,
  onUpdateWinCondition,
  onUpdateLoseCondition,
  onSave,
}: GlobalConfigTabProps) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-semibold">Global Simulation Config</h2>
        <p className="text-sm text-slate-400 mt-1">Edit core defaults used by all industries.</p>
        <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <p className="text-xs text-slate-300">
            <span className="font-semibold">How it works:</span> Values set here become defaults for all industries.
            Industries can override specific values in their own config. Priority: <span className="font-mono text-slate-200">Industry → Global → Code Defaults</span>
          </p>
        </div>
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
                <label className="block text-xs text-slate-400 mb-1">
                  Starting Cash
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 rounded">Commonly Overridden</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={metrics.startingCash}
                  onChange={(e) => onUpdateMetrics({ startingCash: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Monthly Expenses
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 rounded">Commonly Overridden</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={metrics.monthlyExpenses}
                  onChange={(e) => onUpdateMetrics({ monthlyExpenses: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Starting EXP
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-blue-500/20 text-blue-300 rounded">Global Default</span>
                </label>
                <input
                  type="number"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={metrics.startingExp}
                  onChange={(e) => onUpdateMetrics({ startingExp: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Starting Freedom Score</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={metrics.startingFreedomScore}
                  onChange={(e) => onUpdateMetrics({ startingFreedomScore: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Starting Time (Hours)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={metrics.startingTime ?? ''}
                  onChange={(e) => onUpdateMetrics({ startingTime: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="0 (leave empty to disable)"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Monthly time budget (refreshes each month). Set to enable time currency.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-300">Business Stats</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Ticks Per Second
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-green-500/20 text-green-300 rounded">Never Override</span>
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={stats.ticksPerSecond}
                  onChange={(e) => onUpdateStats({ ticksPerSecond: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Month Duration (sec)
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-green-500/20 text-green-300 rounded">Never Override</span>
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={stats.monthDurationSeconds}
                  onChange={(e) => onUpdateStats({ monthDurationSeconds: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Customer Spawn Interval (sec)
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 rounded">Commonly Overridden</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={stats.customerSpawnIntervalSeconds}
                  onChange={(e) => onUpdateStats({ customerSpawnIntervalSeconds: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Customer Patience (sec)
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 rounded">Commonly Overridden</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={stats.customerPatienceSeconds}
                  onChange={(e) => onUpdateStats({ customerPatienceSeconds: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Leaving Angry Duration (ticks)
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-green-500/20 text-green-300 rounded">Never Override</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={stats.leavingAngryDurationTicks}
                  onChange={(e) => onUpdateStats({ leavingAngryDurationTicks: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Treatment Rooms
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 rounded">Commonly Overridden</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={stats.treatmentRooms}
                  onChange={(e) => onUpdateStats({ treatmentRooms: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  EXP Gain per Happy Customer
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-blue-500/20 text-blue-300 rounded">Global Default</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={stats.expGainPerHappyCustomer ?? ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? undefined : Number(e.target.value);
                    if (value !== undefined && !isNaN(value)) {
                      onUpdateStats({ expGainPerHappyCustomer: value });
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  EXP Loss per Angry Customer
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-blue-500/20 text-blue-300 rounded">Global Default</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={stats.expLossPerAngryCustomer ?? ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? undefined : Number(e.target.value);
                    if (value !== undefined && !isNaN(value)) {
                      onUpdateStats({ expLossPerAngryCustomer: value });
                    }
                  }}
                />
              </div>
              <div>
                {/* baseHappyProbability removed - not used in game mechanics */}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">
                  Event Trigger Seconds (comma-separated)
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-green-500/20 text-green-300 rounded">Never Override</span>
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={eventSecondsInput}
                  onChange={(e) => onUpdateEventSeconds(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Service Revenue Multiplier
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 rounded">Commonly Overridden</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={stats.serviceRevenueMultiplier}
                  onChange={(e) => onUpdateStats({ serviceRevenueMultiplier: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Service Revenue Scale
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 rounded">Commonly Overridden</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={stats.serviceRevenueScale}
                  onChange={(e) => onUpdateStats({ serviceRevenueScale: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Spawn Position X
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 rounded">Always Override</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={stats.customerSpawnPosition.x}
                  onChange={(e) =>
                    onUpdateStats({
                      customerSpawnPosition: { ...stats.customerSpawnPosition, x: Number(e.target.value) },
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Spawn Position Y
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 rounded">Always Override</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={stats.customerSpawnPosition.y}
                  onChange={(e) =>
                    onUpdateStats({
                      customerSpawnPosition: { ...stats.customerSpawnPosition, y: Number(e.target.value) },
                    })
                  }
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-300">Movement</label>
            <textarea
              rows={10}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200 font-mono text-xs"
              value={movementJSON}
              onChange={(e) => onUpdateMovementJSON(e.target.value)}
            />
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
                value={winCondition.cashTarget}
                onChange={(e) => onUpdateWinCondition({ cashTarget: Number(e.target.value) })}
              />
              <p className="text-xs text-slate-500 mt-1">Target cash amount to win the game</p>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Month Target (Optional)</label>
              <input
                type="number"
                min="1"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200"
                value={winCondition.monthTarget || ''}
                onChange={(e) => onUpdateWinCondition({ monthTarget: e.target.value ? Number(e.target.value) : undefined })}
              />
              <p className="text-xs text-slate-500 mt-1">Win by surviving this many months</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Custom Victory Title (Optional)</label>
              <input
                type="text"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200"
                value={winCondition.customTitle || ''}
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
                value={winCondition.customMessage || ''}
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
                value={loseCondition.cashThreshold}
                onChange={(e) => onUpdateLoseCondition({ cashThreshold: Number(e.target.value) })}
              />
              <p className="text-xs text-slate-500 mt-1">Game over if cash &lt;= this value (default: 0)</p>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Time Threshold</label>
              <input
                type="number"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200"
                value={loseCondition.timeThreshold}
                onChange={(e) => onUpdateLoseCondition({ timeThreshold: Number(e.target.value) })}
              />
              <p className="text-xs text-slate-500 mt-1">Game over if available time &lt;= this value (default: 0, only applies if time system is enabled)</p>
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
                ? 'bg-amber-900 text-amber-200 cursor-wait'
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            {globalSaving ? 'Saving…' : 'Save Global Config'}
          </button>
        </div>
      </div>
    </section>
  );
}

