'use client';

import { useState, useEffect } from 'react';
import { MetricDisplayConfigTab } from '../components/MetricDisplayConfigTab';
import { useMetricDisplayConfig } from '../hooks/useMetricDisplayConfig';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/types';

export default function MetricDisplayPage() {
  const [referenceIndustryId, setReferenceIndustryId] = useState<string | undefined>(undefined);

  // Get selected industry from localStorage (same as AdminLayoutClient)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin_last_industry');
      if (stored) {
        setReferenceIndustryId(stored);
      } else {
        setReferenceIndustryId(DEFAULT_INDUSTRY_ID);
      }
    }
  }, []);

  // Listen for industry changes from the dropdown
  useEffect(() => {
    const handleIndustryChange = (event: CustomEvent<string> | Event) => {
      const industryId = (event as CustomEvent<string>).detail || 
                        (typeof window !== 'undefined' ? localStorage.getItem('admin_last_industry') : null);
      if (industryId) {
        setReferenceIndustryId(industryId);
      }
    };

    const handleStorageChange = () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('admin_last_industry');
        if (stored) {
          setReferenceIndustryId(stored);
        }
      }
    };

    // Listen for custom event from AdminLayoutClient
    window.addEventListener('industryChanged', handleIndustryChange as EventListener);
    // Also listen for storage events (in case of cross-tab updates)
    window.addEventListener('storage', handleStorageChange);
    
    // Poll localStorage periodically as fallback
    const interval = setInterval(() => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('admin_last_industry');
        if (stored && stored !== referenceIndustryId) {
          setReferenceIndustryId(stored);
        }
      }
    }, 500);
    
    return () => {
      window.removeEventListener('industryChanged', handleIndustryChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [referenceIndustryId]);

  const config = useMetricDisplayConfig({ 
    industryId: 'global',
    referenceIndustryId: referenceIndustryId as any,
  });

  return (
    <div className="w-full p-8">
      <MetricDisplayConfigTab
        industryId="global"
        referenceIndustryId={referenceIndustryId}
        loading={config.loading}
        saving={config.saving}
        configs={config.configs}
        globalConfigs={config.globalConfigs}
        referenceConfigs={config.referenceConfigs}
        updateConfig={config.updateConfig}
        saveAll={config.saveAll}
        deleteConfig={config.deleteConfig}
        hasChanges={config.hasChanges}
      />
    </div>
  );
}
