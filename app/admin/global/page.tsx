'use client';

import { GlobalConfigTab } from '../components/GlobalConfigTab';
import { useSimulationConfig } from '../hooks/useSimulationConfig';

export default function GlobalConfigPage() {
  const globalConfig = useSimulationConfig({ configType: 'global' });


  return (
    <div className="max-w-5xl">
      <GlobalConfigTab
        globalLoading={globalConfig.loading}
        globalStatus={globalConfig.status}
        globalSaving={globalConfig.saving}
        metrics={globalConfig.businessMetrics}
        stats={globalConfig.businessStats}
        winCondition={globalConfig.winCondition}
        loseCondition={globalConfig.loseCondition}
        uiConfig={globalConfig.uiConfig}
        onUpdateMetrics={globalConfig.updateMetrics}
        onUpdateStats={globalConfig.updateStats}
        onUpdateWinCondition={globalConfig.updateWinCondition}
        onUpdateLoseCondition={globalConfig.updateLoseCondition}
        onUpdateUiConfig={globalConfig.updateUiConfig}
        onSave={globalConfig.save}
      />
    </div>
  );
}
