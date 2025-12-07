import { QueryClient } from '@tanstack/react-query';
import { AdminTabEnum } from './routing';
import {
  fetchServices,
  fetchUpgrades,
  fetchEvents,
  fetchMarketingCampaigns,
  fetchFlags,
  fetchConditions,
  fetchStaffData,
} from '@/lib/server/actions/adminActions';
import type { IndustryTab } from './routing';

/**
 * Prefetch data for a specific tab and industry
 */
export async function prefetchTabData(queryClient: QueryClient, industryId: string, tab: IndustryTab) {
  switch (tab) {
    case 'services':
      await queryClient.prefetchQuery({
        queryKey: ['services', industryId],
        queryFn: () => fetchServices(industryId),
      });
      break;
    case 'upgrades':
      await queryClient.prefetchQuery({
        queryKey: ['upgrades', industryId],
        queryFn: () => fetchUpgrades(industryId),
      });
      break;
    case 'events':
      await queryClient.prefetchQuery({
        queryKey: ['events', industryId],
        queryFn: () => fetchEvents(industryId),
      });
      break;
    case 'marketing':
      await queryClient.prefetchQuery({
        queryKey: ['marketing', industryId],
        queryFn: () => fetchMarketingCampaigns(industryId),
      });
      break;
    case 'flags':
      await queryClient.prefetchQuery({
        queryKey: ['flags', industryId],
        queryFn: () => fetchFlags(industryId),
      });
      break;
    case 'conditions':
      await queryClient.prefetchQuery({
        queryKey: ['conditions', industryId],
        queryFn: () => fetchConditions(industryId),
      });
      break;
    case 'roles':
    case 'presets':
      // Staff data includes both roles and presets
      await queryClient.prefetchQuery({
        queryKey: ['staff', industryId],
        queryFn: () => fetchStaffData(industryId),
      });
      break;
    case 'industry-config':
      // Industry config is handled separately, skip for now
      break;
  }
}

/**
 * Prefetch all common data for an industry (useful when switching industries)
 */
export async function prefetchIndustryData(queryClient: QueryClient, industryId: string) {
  // Prefetch the most commonly used tabs in parallel
  await Promise.all([
    prefetchTabData(queryClient, industryId, AdminTabEnum.Services),
    prefetchTabData(queryClient, industryId, AdminTabEnum.Upgrades),
    prefetchTabData(queryClient, industryId, AdminTabEnum.Events),
    prefetchTabData(queryClient, industryId, AdminTabEnum.Flags),
    prefetchTabData(queryClient, industryId, AdminTabEnum.Conditions),
  ]);
}
