'use client';

import { useEffect } from 'react';
import { GameMetric } from '@/lib/game/effectManager';
import { getAllMetrics, getMetricDefinition } from '@/lib/game/metrics/registry';
import type { IndustryId } from '@/lib/game/types';
import type { MetricDisplayConfig } from '@/lib/data/metricDisplayConfigRepository';

interface MetricDisplayConfigTabProps {
  industryId: IndustryId | 'global';
  industryName?: string;
  referenceIndustryId?: string; // For global page: show this industry's values for reference
  loading: boolean;
  saving: boolean;
  configs: Record<GameMetric, MetricDisplayConfig | null>;
  globalConfigs: Record<GameMetric, MetricDisplayConfig | null>;
  referenceConfigs?: Record<GameMetric, MetricDisplayConfig | null>; // Industry configs for reference (global page only)
  updateConfig: (metricId: GameMetric, updates: Partial<Omit<MetricDisplayConfig, 'id' | 'metricId' | 'industryId' | 'createdAt' | 'updatedAt'>>) => void;
  saveAll: () => Promise<void>;
  deleteConfig: (metricId: GameMetric) => Promise<void>;
  hasChanges: () => boolean;
}

export function MetricDisplayConfigTab({
  industryId,
  industryName,
  referenceIndustryId,
  loading,
  saving,
  configs,
  globalConfigs,
  referenceConfigs,
  updateConfig,
  saveAll,
  deleteConfig,
  hasChanges,
}: MetricDisplayConfigTabProps) {
  const allMetrics = getAllMetrics();
  const isGlobal = industryId === 'global';

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!saving && hasChanges()) {
          saveAll();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [saving, hasChanges, saveAll]);


  const getDisplayValue = (metricId: GameMetric, field: 'displayLabel' | 'description' | 'showOnHUD' | 'showInDetails' | 'unit' | 'priority' | 'iconPath') => {
    const config = configs[metricId];
    const globalConfig = globalConfigs[metricId];
    const codeDef = getMetricDefinition(metricId);
    
    // For industry pages: show industry override if exists, otherwise show global default
    // For global page: show global config if exists, otherwise code default
    if (isGlobal) {
      if (config) {
        return config[field] ?? (field === 'displayLabel' ? codeDef.displayLabel : 
                                field === 'description' ? codeDef.description ?? null :
                                field === 'showOnHUD' ? codeDef.display.showOnHUD :
                                field === 'showInDetails' ? codeDef.display.showInDetails :
                                field === 'priority' ? codeDef.display.priority ?? null :
                                field === 'iconPath' ? null :
                                codeDef.display.unit ?? null);
      }
      return field === 'displayLabel' ? codeDef.displayLabel : 
             field === 'description' ? codeDef.description ?? null :
             field === 'showOnHUD' ? codeDef.display.showOnHUD :
             field === 'showInDetails' ? codeDef.display.showInDetails :
             field === 'priority' ? codeDef.display.priority ?? null :
             field === 'iconPath' ? null :
             codeDef.display.unit ?? null;
    } else {
      // Industry page: show industry override, fallback to global, then code default
      if (config) {
        return config[field] ?? (globalConfig?.[field] ?? 
                                (field === 'displayLabel' ? codeDef.displayLabel : 
                                 field === 'description' ? codeDef.description ?? null :
                                 field === 'showOnHUD' ? codeDef.display.showOnHUD :
                                 field === 'showInDetails' ? codeDef.display.showInDetails :
                                 field === 'priority' ? codeDef.display.priority ?? null :
                                 field === 'iconPath' ? null :
                                 codeDef.display.unit ?? null));
      }
      if (globalConfig) {
        return globalConfig[field] ?? (field === 'displayLabel' ? codeDef.displayLabel : 
                                      field === 'description' ? codeDef.description ?? null :
                                      field === 'showOnHUD' ? codeDef.display.showOnHUD :
                                      field === 'showInDetails' ? codeDef.display.showInDetails :
                                      field === 'priority' ? codeDef.display.priority ?? null :
                                      field === 'iconPath' ? null :
                                      codeDef.display.unit ?? null);
      }
      return field === 'displayLabel' ? codeDef.displayLabel : 
             field === 'description' ? codeDef.description ?? null :
             field === 'showOnHUD' ? codeDef.display.showOnHUD :
             field === 'showInDetails' ? codeDef.display.showInDetails :
             field === 'priority' ? codeDef.display.priority ?? null :
             field === 'iconPath' ? null :
             codeDef.display.unit ?? null;
    }
  };

  // Get reference value (industry-specific value for display on global page)
  const getReferenceValue = (metricId: GameMetric, field: 'displayLabel' | 'description' | 'showOnHUD' | 'showInDetails' | 'unit' | 'priority' | 'iconPath') => {
    if (!isGlobal || !referenceIndustryId || !referenceConfigs) return null;
    const refConfig = referenceConfigs[metricId];
    const globalConfig = globalConfigs[metricId];
    const codeDef = getMetricDefinition(metricId);
    
    if (refConfig) {
      return refConfig[field] ?? (globalConfig?.[field] ?? 
                                  (field === 'displayLabel' ? codeDef.displayLabel : 
                                   field === 'showOnHUD' ? codeDef.display.showOnHUD :
                                   field === 'showInDetails' ? codeDef.display.showInDetails :
                                   field === 'priority' ? codeDef.display.priority ?? null :
                                   codeDef.display.unit ?? null));
    }
    if (globalConfig) {
      return globalConfig[field] ?? (field === 'displayLabel' ? codeDef.displayLabel : 
                                    field === 'showOnHUD' ? codeDef.display.showOnHUD :
                                    field === 'showInDetails' ? codeDef.display.showInDetails :
                                    field === 'priority' ? codeDef.display.priority ?? null :
                                    codeDef.display.unit ?? null);
    }
    return field === 'displayLabel' ? codeDef.displayLabel : 
           field === 'showOnHUD' ? codeDef.display.showOnHUD :
           field === 'showInDetails' ? codeDef.display.showInDetails :
           field === 'priority' ? codeDef.display.priority ?? null :
           codeDef.display.unit ?? null;
  };

  const metricHasChanges = (metricId: GameMetric): boolean => {
    const config = configs[metricId];
    if (!config) return false; // No config means no changes
    
    if (isGlobal) {
      const codeDef = getMetricDefinition(metricId);
      return (
        config.displayLabel !== codeDef.displayLabel ||
        config.description !== (codeDef.description ?? null) ||
        config.unit !== codeDef.display.unit ||
        config.showOnHUD !== codeDef.display.showOnHUD ||
        config.showInDetails !== codeDef.display.showInDetails ||
        config.priority !== (codeDef.display.priority ?? null) ||
        config.iconPath !== null
      );
    } else {
      const globalConfig = globalConfigs[metricId];
      const codeDef = getMetricDefinition(metricId);
      
      const globalValue = globalConfig || {
        displayLabel: codeDef.displayLabel,
        description: codeDef.description ?? null,
        unit: codeDef.display.unit ?? null,
        showOnHUD: codeDef.display.showOnHUD,
        showInDetails: codeDef.display.showInDetails,
        priority: codeDef.display.priority ?? null,
        iconPath: null,
      };
      
      return (
        config.displayLabel !== globalValue.displayLabel ||
        config.description !== globalValue.description ||
        config.unit !== globalValue.unit ||
        config.showOnHUD !== globalValue.showOnHUD ||
        config.showInDetails !== globalValue.showInDetails ||
        config.priority !== globalValue.priority ||
        config.iconPath !== globalValue.iconPath
      );
    }
  };

  return (
    <div className="space-y-6 pt-6 px-4 sm:px-0">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold">Metric Display Configuration</h2>
            <p className="text-sm text-slate-400 mt-1">
              {isGlobal
                ? `Configure global default display settings for all metrics. ${referenceIndustryId ? `Showing ${referenceIndustryId} values for reference. ` : ''}Industries can override these defaults.`
                : `Configure display settings for ${industryName || industryId}. Overrides global defaults.`}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading metrics...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allMetrics.map((metric) => {
            const config = configs[metric.id];
            const globalConfig = globalConfigs[metric.id];
            const codeDef = getMetricDefinition(metric.id);
            const hasChange = metricHasChanges(metric.id);

            const displayLabel = getDisplayValue(metric.id, 'displayLabel') as string;
            const description = getDisplayValue(metric.id, 'description') as string | null;
            const showOnHUD = getDisplayValue(metric.id, 'showOnHUD') as boolean;
            const showInDetails = getDisplayValue(metric.id, 'showInDetails') as boolean;
            const priority = getDisplayValue(metric.id, 'priority') as number | null;
            const unit = getDisplayValue(metric.id, 'unit') as string | null;
            const iconPath = getDisplayValue(metric.id, 'iconPath') as string | null;

            // Reference values (for global page)
            const refDisplayLabel = isGlobal && referenceIndustryId ? getReferenceValue(metric.id, 'displayLabel') as string : null;
            const refDescription = isGlobal && referenceIndustryId ? getReferenceValue(metric.id, 'description') as string | null : null;
            const refShowOnHUD = isGlobal && referenceIndustryId ? getReferenceValue(metric.id, 'showOnHUD') as boolean : null;
            const refShowInDetails = isGlobal && referenceIndustryId ? getReferenceValue(metric.id, 'showInDetails') as boolean : null;
            const refPriority = isGlobal && referenceIndustryId ? getReferenceValue(metric.id, 'priority') as number | null : null;
            const refUnit = isGlobal && referenceIndustryId ? getReferenceValue(metric.id, 'unit') as string | null : null;
            const refIconPath = isGlobal && referenceIndustryId ? getReferenceValue(metric.id, 'iconPath') as string | null : null;

            return (
              <div
                key={metric.id}
                className={`bg-slate-900 border rounded-xl shadow-lg p-4 transition hover:shadow-xl min-w-0 ${
                  hasChange ? 'border-yellow-500 bg-yellow-900/10' : 'border-slate-800'
                }`}
              >
                {/* Metric Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-mono">{metric.id}</span>
                    {hasChange && (
                      <span className="text-xs text-yellow-400 font-medium">● Has changes</span>
                    )}
                  </div>
                  {!isGlobal && config && (
                    <button
                      onClick={() => {
                        if (confirm('Delete industry-specific config? It will fall back to global default.')) {
                          deleteConfig(metric.id);
                        }
                      }}
                      disabled={saving}
                      className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-medium transition disabled:opacity-50"
                      title="Delete override"
                    >
                      Delete
                    </button>
                  )}
                </div>

                {/* Label */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Label</label>
                  <input
                    type="text"
                    value={config?.displayLabel ?? displayLabel}
                    onChange={(e) => updateConfig(metric.id, { displayLabel: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder={codeDef.displayLabel}
                  />
                  {isGlobal && referenceIndustryId && refDisplayLabel !== null && refDisplayLabel !== displayLabel && (
                    <span className="text-xs text-slate-500 mt-1 italic block">
                      {referenceIndustryId}: {refDisplayLabel}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                  <textarea
                    value={config?.description ?? description ?? ''}
                    onChange={(e) => updateConfig(metric.id, { description: e.target.value || null })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder={codeDef.description ?? ''}
                    rows={2}
                  />
                  {isGlobal && referenceIndustryId && refDescription !== null && refDescription !== description && (
                    <span className="text-xs text-slate-500 mt-1 italic block">
                      {referenceIndustryId}: {refDescription}
                    </span>
                  )}
                </div>

                {/* Show on HUD */}
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config?.showOnHUD ?? showOnHUD}
                      onChange={(e) => updateConfig(metric.id, { showOnHUD: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-300">Show on HUD</span>
                  </label>
                </div>

                {/* Show in Details */}
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config?.showInDetails ?? showInDetails}
                      onChange={(e) => updateConfig(metric.id, { showInDetails: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-300">Show in Details</span>
                  </label>
                </div>

                {/* Priority and Unit Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
                    <input
                      type="number"
                      value={config?.priority ?? priority ?? ''}
                      onChange={(e) => updateConfig(metric.id, { priority: e.target.value === '' ? null : parseInt(e.target.value, 10) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder={codeDef.display.priority?.toString() ?? ''}
                    />
                    {isGlobal && referenceIndustryId && refPriority !== null && refPriority !== priority && (
                      <span className="text-xs text-slate-500 mt-1 italic block">
                        {referenceIndustryId}: {refPriority}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Unit</label>
                    <input
                      type="text"
                      value={config?.unit ?? unit ?? ''}
                      onChange={(e) => updateConfig(metric.id, { unit: e.target.value || null })}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder={codeDef.display.unit ?? ''}
                    />
                  </div>
                </div>

                {/* Icon Path */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Icon Path</label>
                  <input
                    type="text"
                    value={config?.iconPath ?? iconPath ?? ''}
                    onChange={(e) => updateConfig(metric.id, { iconPath: e.target.value || null })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="/images/icons/..."
                  />
                  {isGlobal && referenceIndustryId && refIconPath !== null && refIconPath !== iconPath && (
                    <span className="text-xs text-slate-500 mt-1 italic block">
                      {referenceIndustryId}: {refIconPath}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Save Button */}
      {hasChanges() && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl px-6 py-3 shadow-2xl">
            <button
              onClick={saveAll}
              disabled={saving || loading}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${
                saving || loading
                  ? 'bg-slate-700 text-slate-400 cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {saving ? '💾 Saving…' : '💾 Save All Changes (⌘↵)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
