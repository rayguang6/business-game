'use client';

import React, { useState, useCallback } from 'react';
import { GlobalConfigTab } from '../components/GlobalConfigTab';
import { useSimulationConfig } from '../hooks/useSimulationConfig';
import { fetchRouteProtection, updateRouteProtection } from '@/lib/server/actions/adminActions';
import { useToastFunctions } from '../components/ui/ToastContext';

type RouteProtectionConfig = {
  enabled: boolean;
  redirectTarget?: string;
};

export default function GlobalConfigPage() {
  const globalConfig = useSimulationConfig({ configType: 'global' });
  const { showToast } = useToastFunctions();

  const [routeProtection, setRouteProtection] = useState<RouteProtectionConfig | null>(null);
  const [routeProtectionLoading, setRouteProtectionLoading] = useState(false);

  // Load route protection config
  const loadRouteProtection = useCallback(async () => {
    try {
      setRouteProtectionLoading(true);
      const config = await fetchRouteProtection();
      setRouteProtection(config);
    } catch (error) {
      console.error('Failed to load route protection:', error);
      showToast('Failed to load route protection settings', 'error');
    } finally {
      setRouteProtectionLoading(false);
    }
  }, [showToast]);

  // Update route protection
  const handleUpdateRouteProtection = useCallback((updates: Partial<RouteProtectionConfig>) => {
    setRouteProtection(prev => prev ? { ...prev, ...updates } : { enabled: false, ...updates });
  }, []);

  // Save route protection
  const handleSaveRouteProtection = useCallback(async () => {
    if (!routeProtection) return;

    try {
      setRouteProtectionLoading(true);
      const result = await updateRouteProtection(routeProtection.enabled, routeProtection.redirectTarget);
      if (result.success) {
        showToast('Route protection settings saved successfully', 'success');
        await loadRouteProtection(); // Reload to get updated data
      } else {
        showToast(result.message || 'Failed to save route protection', 'error');
      }
    } catch (error) {
      console.error('Failed to save route protection:', error);
      showToast('Failed to save route protection settings', 'error');
    } finally {
      setRouteProtectionLoading(false);
    }
  }, [routeProtection, showToast, loadRouteProtection]);

  // Load route protection on mount
  React.useEffect(() => {
    loadRouteProtection();
  }, [loadRouteProtection]);


  // Combined save function
  const handleSave = useCallback(async () => {
    // Save simulation config first
    await globalConfig.save();
    // Then save route protection
    await handleSaveRouteProtection();
  }, [globalConfig.save, handleSaveRouteProtection]);

  return (
    <div className="w-full p-8">
      <GlobalConfigTab
        globalLoading={globalConfig.loading || routeProtectionLoading}
        globalSaving={globalConfig.saving || routeProtectionLoading}
        metrics={globalConfig.businessMetrics}
        stats={globalConfig.businessStats}
        movement={globalConfig.movement}
        winCondition={globalConfig.winCondition}
        loseCondition={globalConfig.loseCondition}
        uiConfig={globalConfig.uiConfig}
        customerImages={globalConfig.customerImages}
        routeProtection={routeProtection}
        onUpdateMetrics={globalConfig.updateMetrics}
        onUpdateStats={globalConfig.updateStats}
        onUpdateMovement={globalConfig.updateMovement}
        onUpdateWinCondition={globalConfig.updateWinCondition}
        onUpdateLoseCondition={globalConfig.updateLoseCondition}
        onUpdateUiConfig={globalConfig.updateUiConfig}
        onUpdateMediaConfig={globalConfig.updateMediaConfig}
        onUpdateRouteProtection={handleUpdateRouteProtection}
        onSave={handleSave}
      />
    </div>
  );
}
