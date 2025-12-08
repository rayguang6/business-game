'use server';

import { fetchIndustriesFromSupabase, upsertIndustryToSupabase, deleteIndustryFromSupabase } from '@/lib/data/industryRepository';
import { fetchServicesForIndustry, upsertServiceForIndustry, deleteServiceById } from '@/lib/data/serviceRepository';
import { fetchUpgradesForIndustry, upsertUpgradeForIndustry, deleteUpgradeById } from '@/lib/data/upgradeRepository';
import { fetchEventsForIndustry, upsertEventForIndustry, deleteEventById } from '@/lib/data/eventRepository';
import { fetchMarketingCampaignsForIndustry, upsertMarketingCampaignForIndustry, deleteMarketingCampaignById } from '@/lib/data/marketingRepository';
import { fetchStaffDataForIndustry, upsertStaffRole, deleteStaffRole, upsertStaffPreset, deleteStaffPreset } from '@/lib/data/staffRepository';
import { fetchFlagsForIndustry, upsertFlagForIndustry, deleteFlagById } from '@/lib/data/flagRepository';
import { fetchConditionsForIndustry, upsertConditionForIndustry, deleteConditionById } from '@/lib/data/conditionRepository';
// Import unified simulation config repository
import { fetchSimulationConfig, upsertSimulationConfig } from '@/lib/data/simulationConfigRepository';
import { fetchAllMetricDisplayConfigs, fetchIndustrySpecificMetricDisplayConfigs, upsertMetricDisplayConfig, deleteMetricDisplayConfig } from '@/lib/data/metricDisplayConfigRepository';
import { seedMetricDisplayConfig } from '@/lib/data/seedMetricDisplayConfig';
import type { MetricDisplayConfig } from '@/lib/data/metricDisplayConfigRepository';
import { GameMetric } from '@/lib/game/effectManager';
import type { Industry } from '@/lib/features/industries';
import type { IndustryId, IndustryServiceDefinition, UpgradeDefinition } from '@/lib/game/types';
import type { GameEvent } from '@/lib/types/gameEvents';
import type { MarketingCampaign } from '@/lib/store/slices/marketingSlice';
import type { GameFlag } from '@/lib/data/flagRepository';
import type { GameCondition } from '@/lib/types/conditions';
import type { BusinessMetrics, BusinessStats, MovementConfig, MapConfig } from '@/lib/game/types';
import type { WinCondition, LoseCondition } from '@/lib/game/winConditions';
import type { SimulationLayoutConfig, GridPosition, ServiceRoomConfig } from '@/lib/game/types';

// Fetch Actions
export async function fetchIndustries() {
  return await fetchIndustriesFromSupabase();
}

export async function fetchServices(industryId: IndustryId) {
  return await fetchServicesForIndustry(industryId);
}

export async function fetchUpgrades(industryId: IndustryId) {
  return await fetchUpgradesForIndustry(industryId);
}

export async function fetchEvents(industryId: IndustryId) {
  return await fetchEventsForIndustry(industryId);
}

export async function fetchMarketingCampaigns(industryId: IndustryId) {
  return await fetchMarketingCampaignsForIndustry(industryId);
}

export async function fetchStaffData(industryId: IndustryId) {
  return await fetchStaffDataForIndustry(industryId);
}

export async function fetchFlags(industryId: IndustryId) {
  return await fetchFlagsForIndustry(industryId);
}

export async function fetchConditions(industryId: IndustryId) {
  return await fetchConditionsForIndustry(industryId);
}

export async function fetchGlobalConfig() {
  return await fetchSimulationConfig('global');
}

export async function fetchIndustryConfig(industryId: IndustryId) {
  return await fetchSimulationConfig(industryId);
}

export async function fetchMetricDisplayConfigs(industryId: IndustryId | 'global') {
  return await fetchAllMetricDisplayConfigs(industryId);
}

export async function fetchIndustrySpecificMetricDisplayConfigsAction(industryId: IndustryId) {
  return await fetchIndustrySpecificMetricDisplayConfigs(industryId);
}

// Industry Actions
export async function upsertIndustry(industry: Industry) {
  return await upsertIndustryToSupabase(industry);
}

export async function deleteIndustry(id: string) {
  return await deleteIndustryFromSupabase(id);
}

// Service Actions
export async function upsertService(service: IndustryServiceDefinition) {
  return await upsertServiceForIndustry(service);
}

export async function deleteService(id: string) {
  return await deleteServiceById(id);
}

// Upgrade Actions
export async function upsertUpgrade(industryId: IndustryId, upgrade: UpgradeDefinition) {
  return await upsertUpgradeForIndustry(industryId, upgrade);
}

export async function deleteUpgrade(id: string) {
  return await deleteUpgradeById(id);
}

// Event Actions
export async function upsertEvent(industryId: IndustryId, event: GameEvent) {
  return await upsertEventForIndustry(industryId, event);
}

export async function deleteEvent(id: string) {
  return await deleteEventById(id);
}

// Marketing Actions
export async function upsertMarketingCampaign(industryId: string, campaign: MarketingCampaign) {
  return await upsertMarketingCampaignForIndustry(industryId, campaign);
}

export async function deleteMarketingCampaign(id: string, industryId: IndustryId) {
  return await deleteMarketingCampaignById(id, industryId);
}

// Staff Actions
export async function upsertStaffRoleAction(role: {
  id: string;
  industryId: IndustryId;
  name: string;
  salary: number;
  effects: any[];
  spriteImage?: string;
  setsFlag?: string;
  requirements?: any[];
  order?: number;
}) {
  return await upsertStaffRole(role);
}

export async function deleteStaffRoleAction(id: string, industryId: IndustryId) {
  return await deleteStaffRole(id, industryId);
}

export async function upsertStaffPresetAction(preset: {
  id: string;
  industryId: IndustryId;
  roleId: string;
  name?: string;
  salary?: number;
  serviceSpeed?: number;
}) {
  return await upsertStaffPreset(preset);
}

export async function deleteStaffPresetAction(id: string, industryId: IndustryId) {
  return await deleteStaffPreset(id, industryId);
}

// Flag Actions
export async function upsertFlag(industryId: IndustryId, flag: { id: string; name: string; description: string }) {
  return await upsertFlagForIndustry(industryId, flag);
}

export async function deleteFlag(id: string) {
  return await deleteFlagById(id);
}

// Condition Actions
export async function upsertCondition(industryId: IndustryId, condition: GameCondition) {
  return await upsertConditionForIndustry(industryId, condition);
}

export async function deleteCondition(id: string) {
  return await deleteConditionById(id);
}

// Global Config Actions
export async function upsertGlobalConfig(config: {
  businessMetrics?: BusinessMetrics;
  businessStats?: BusinessStats;
  movement?: MovementConfig;
  mapConfig?: MapConfig;
  mapWidth?: number | null;
  mapHeight?: number | null;
  mapWalls?: Array<{ x: number; y: number }> | null;
  capacityImage?: string | null;
  winCondition?: WinCondition;
  loseCondition?: LoseCondition;
  customerImages?: string[] | null;
  staffNamePool?: string[] | null;
  leadDialogues?: string[] | null;
  uiConfig?: {
    eventAutoSelectDurationSeconds?: number;
    outcomePopupDurationSeconds?: number;
  };
}) {
  return await upsertSimulationConfig('global', config);
}

// Industry Config Actions
export async function upsertIndustryConfig(
  industryId: IndustryId,
  config: {
    businessMetrics?: BusinessMetrics;
    businessStats?: BusinessStats;
    mapConfig?: MapConfig;
    mapWidth?: number | null;
    mapHeight?: number | null;
    mapWalls?: Array<{ x: number; y: number }> | null;
    layoutConfig?: SimulationLayoutConfig;
    entryPosition?: GridPosition | null;
    waitingPositions?: GridPosition[] | null;
    serviceRooms?: ServiceRoomConfig[] | null;
    staffPositions?: GridPosition[] | null;
    mainCharacterPosition?: GridPosition | null;
    mainCharacterSpriteImage?: string | null;
    capacityImage?: string | null;
    winCondition?: WinCondition;
    loseCondition?: LoseCondition;
    eventSelectionMode?: 'random' | 'sequence';
    eventSequence?: string[];
    leadDialogues?: string[] | null;
  },
) {
  return await upsertSimulationConfig(industryId, config);
}

// Metric Display Config Actions
export async function upsertMetricDisplayConfigAction(
  config: Omit<MetricDisplayConfig, 'id' | 'createdAt' | 'updatedAt'>,
) {
  return await upsertMetricDisplayConfig(config);
}

export async function deleteMetricDisplayConfigAction(
  industryId: string,
  metricId: GameMetric,
) {
  return await deleteMetricDisplayConfig(industryId, metricId);
}

export async function seedMetricDisplayConfigAction() {
  return await seedMetricDisplayConfig();
}

