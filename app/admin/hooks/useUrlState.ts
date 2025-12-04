'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function useUrlState() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL or defaults
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get('tab') || 'industries'
  );

  const [selectedIndustryId, setSelectedIndustryId] = useState<string | null>(
    searchParams.get('industry') || null
  );

  // Update URL when state changes
  const updateUrl = useCallback((updates: { tab?: string; industry?: string | null }) => {
    const params = new URLSearchParams(searchParams);

    if (updates.tab !== undefined) {
      if (updates.tab) {
        params.set('tab', updates.tab);
      } else {
        params.delete('tab');
      }
    }

    if (updates.industry !== undefined) {
      if (updates.industry) {
        params.set('industry', updates.industry);
      } else {
        params.delete('industry');
      }
    }

    // Use replace to avoid adding to browser history
    const newUrl = `/admin${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, router]);

  // Enhanced setters that update both state and URL
  const setTabWithUrl = useCallback((tab: string) => {
    setActiveTab(tab);
    updateUrl({ tab });
  }, [updateUrl]);

  const setIndustryWithUrl = useCallback((industryId: string | null) => {
    setSelectedIndustryId(industryId);
    updateUrl({ industry: industryId });
  }, [updateUrl]);

  // Sync state with URL changes (e.g., browser back/forward)
  useEffect(() => {
    const tab = searchParams.get('tab');
    const industry = searchParams.get('industry');

    // Only update if different to prevent unnecessary re-renders
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }

    if (industry !== selectedIndustryId) {
      setSelectedIndustryId(industry);
    }
  }, [searchParams, activeTab, selectedIndustryId]);

  return {
    activeTab,
    selectedIndustryId,
    setActiveTab: setTabWithUrl,
    setSelectedIndustryId: setIndustryWithUrl,
  };
}
