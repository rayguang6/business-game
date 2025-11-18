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
                  value={metrics.startingCash}
                  onChange={(e) => onUpdateMetrics({ startingCash: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Monthly Expenses</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={metrics.monthlyExpenses}
                  onChange={(e) => onUpdateMetrics({ monthlyExpenses: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Starting Reputation</label>
                <input
                  type="number"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={metrics.startingReputation}
                  onChange={(e) => onUpdateMetrics({ startingReputation: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Founder Work Hours (per month)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={metrics.founderWorkHours}
                  onChange={(e) => onUpdateMetrics({ founderWorkHours: Number(e.target.value) })}
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
                <label className="block text-xs text-slate-400 mb-1">Ticks Per Second</label>
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={stats.ticksPerSecond}
                  onChange={(e) => onUpdateStats({ ticksPerSecond: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Month Duration (sec)</label>
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={stats.monthDurationSeconds}
                  onChange={(e) => onUpdateStats({ monthDurationSeconds: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Customer Spawn Interval (sec)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={stats.customerSpawnIntervalSeconds}
                  onChange={(e) => onUpdateStats({ customerSpawnIntervalSeconds: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Customer Patience (sec)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={stats.customerPatienceSeconds}
                  onChange={(e) => onUpdateStats({ customerPatienceSeconds: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Leaving Angry Duration (ticks)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={stats.leavingAngryDurationTicks}
                  onChange={(e) => onUpdateStats({ leavingAngryDurationTicks: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Treatment Rooms</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={stats.treatmentRooms}
                  onChange={(e) => onUpdateStats({ treatmentRooms: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Rep Gain per Happy</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={stats.reputationGainPerHappyCustomer}
                  onChange={(e) => onUpdateStats({ reputationGainPerHappyCustomer: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Rep Loss per Angry</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={stats.reputationLossPerAngryCustomer}
                  onChange={(e) => onUpdateStats({ reputationLossPerAngryCustomer: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Base Happy Probability</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={stats.baseHappyProbability}
                  onChange={(e) => onUpdateStats({ baseHappyProbability: Number(e.target.value) })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Event Trigger Seconds (comma-separated)</label>
                <input
                  type="text"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={eventSecondsInput}
                  onChange={(e) => onUpdateEventSeconds(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Service Revenue Multiplier</label>
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
                <label className="block text-xs text-slate-400 mb-1">Service Revenue Scale</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                  value={stats.serviceRevenueScale}
                  onChange={(e) => onUpdateStats({ serviceRevenueScale: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Spawn Position X</label>
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
                <label className="block text-xs text-slate-400 mb-1">Spawn Position Y</label>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Founder Hours Max</label>
              <input
                type="number"
                min="0"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200"
                value={winCondition.founderHoursMax}
                onChange={(e) => onUpdateWinCondition({ founderHoursMax: Number(e.target.value) })}
              />
              <p className="text-xs text-slate-500 mt-1">Maximum founder hours per month to win</p>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Monthly Profit Target</label>
              <input
                type="number"
                min="0"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200"
                value={winCondition.monthlyProfitTarget}
                onChange={(e) => onUpdateWinCondition({ monthlyProfitTarget: Number(e.target.value) })}
              />
              <p className="text-xs text-slate-500 mt-1">Minimum profit per month required</p>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Consecutive Months Required</label>
              <input
                type="number"
                min="1"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200"
                value={winCondition.consecutiveMonthsRequired}
                onChange={(e) => onUpdateWinCondition({ consecutiveMonthsRequired: Number(e.target.value) })}
              />
              <p className="text-xs text-slate-500 mt-1">Number of consecutive months needed</p>
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
              <label className="block text-xs text-slate-400 mb-1">Reputation Threshold</label>
              <input
                type="number"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200"
                value={loseCondition.reputationThreshold}
                onChange={(e) => onUpdateLoseCondition({ reputationThreshold: Number(e.target.value) })}
              />
              <p className="text-xs text-slate-500 mt-1">Game over if reputation &lt;= this value (default: 0)</p>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Founder Hours Max (Burnout)</label>
              <input
                type="number"
                min="0"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-200"
                value={loseCondition.founderHoursMax}
                onChange={(e) => onUpdateLoseCondition({ founderHoursMax: Number(e.target.value) })}
              />
              <p className="text-xs text-slate-500 mt-1">Game over if founder hours &gt; this value (default: 400)</p>
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

