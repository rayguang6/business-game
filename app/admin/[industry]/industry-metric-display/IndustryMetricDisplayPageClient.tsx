'use client';

import { useEffect, useState } from 'react';
import { MetricDisplayConfigTab } from '../../components/MetricDisplayConfigTab';
import { useMetricDisplayConfig } from '../../hooks/useMetricDisplayConfig';
import type { Industry } from '@/lib/features/industries';

interface IndustryMetricDisplayPageClientProps {
  industry: string;
  industries: Industry[];
}

export default function IndustryMetricDisplayPageClient({ industry, industries }: IndustryMetricDisplayPageClientProps) {
  const config = useMetricDisplayConfig({ industryId: industry });
  const [industryName, setIndustryName] = useState<string>(industry);

  // Set industry name from props
  useEffect(() => {
    const found = industries.find(i => i.id === industry);
    if (found) {
      setIndustryName(found.name);
    }
  }, [industry, industries]);

  return (
    <div className="w-full p-8">
      <MetricDisplayConfigTab
        industryId={industry}
        industryName={industryName}
        loading={config.loading}
        saving={config.saving}
        configs={config.configs}
        globalConfigs={config.globalConfigs}
        updateConfig={config.updateConfig}
        saveAll={config.saveAll}
        deleteConfig={config.deleteConfig}
        hasChanges={config.hasChanges}
      />
    </div>
  );
}
