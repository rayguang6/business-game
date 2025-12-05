'use client';

import { useCallback } from 'react';
import { GlobalConfigTab } from '../components/GlobalConfigTab';
import { useGlobalConfig } from '../hooks/useGlobalConfig';

export default function GlobalConfigPage() {
  const globalConfig = useGlobalConfig();

  // Wrapper for capacity image setter to match interface
  const handleUpdateCapacityImage = useCallback((capacityImage: string | null) => {
    globalConfig.setCapacityImage(capacityImage || '');
  }, [globalConfig]);

  return (
    <div className="max-w-5xl">
      <GlobalConfigTab
        globalLoading={globalConfig.loading}
        globalStatus={globalConfig.status}
        globalSaving={globalConfig.saving}
        metrics={globalConfig.metrics}
        stats={globalConfig.stats}
        eventSecondsInput={globalConfig.eventSecondsInput}
        movementJSON={globalConfig.movementJSON}
        leadDialogues={globalConfig.leadDialogues}
        customerImages={globalConfig.customerImages}
        capacityImage={globalConfig.capacityImage}
        winCondition={globalConfig.winCondition}
        loseCondition={globalConfig.loseCondition}
        uiConfig={globalConfig.uiConfig}
        onUpdateMetrics={globalConfig.updateMetrics}
        onUpdateStats={globalConfig.updateStats}
        onUpdateEventSeconds={globalConfig.setEventSecondsInput}
        onUpdateMovementJSON={globalConfig.setMovementJSON}
        onUpdateLeadDialogues={globalConfig.setLeadDialogues}
        onUpdateCustomerImages={globalConfig.setCustomerImages}
        onUpdateCapacityImage={handleUpdateCapacityImage}
        onUpdateWinCondition={globalConfig.updateWinCondition}
        onUpdateLoseCondition={globalConfig.updateLoseCondition}
        onUpdateUiConfig={globalConfig.updateUiConfig}
        onSave={globalConfig.save}
      />
    </div>
  );
}
