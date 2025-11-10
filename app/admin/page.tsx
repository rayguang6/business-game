'use client';

import { useEffect, useState } from 'react';
import {
  fetchIndustriesFromSupabase,
  upsertIndustryToSupabase,
  deleteIndustryFromSupabase,
} from '@/lib/data/industryRepository';
import {
  fetchServicesForIndustry,
  upsertServiceForIndustry,
  deleteServiceById,
} from '@/lib/data/serviceRepository';
import type { Industry } from '@/lib/features/industries';
import type { IndustryServiceDefinition, BusinessMetrics, BusinessStats, MovementConfig, Requirement } from '@/lib/game/types';
import { fetchGlobalSimulationConfig, upsertGlobalSimulationConfig } from '@/lib/data/simulationConfigRepository';
import { DEFAULT_GLOBAL_SIMULATION_CONFIG } from '@/lib/game/industryConfigs';
import { DEFAULT_WIN_CONDITION, DEFAULT_LOSE_CONDITION, type WinCondition, type LoseCondition } from '@/lib/game/winConditions';
import {
  fetchStaffDataForIndustry,
  upsertStaffRole,
  deleteStaffRole,
  upsertStaffPreset,
  deleteStaffPreset,
} from '@/lib/data/staffRepository';
import type { StaffRoleConfig, StaffPreset } from '@/lib/game/staffConfig';
import { fetchUpgradesForIndustry, upsertUpgradeForIndustry, deleteUpgradeById } from '@/lib/data/upgradeRepository';
import type { UpgradeDefinition, UpgradeEffect } from '@/lib/game/types';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import { fetchMarketingCampaignsForIndustry, upsertMarketingCampaignForIndustry, deleteMarketingCampaignById } from '@/lib/data/marketingRepository';
import type { MarketingCampaign } from '@/lib/store/slices/marketingSlice';
import { fetchEventsForIndustry, upsertEventForIndustry, deleteEventById } from '@/lib/data/eventRepository';
import type { GameEvent, GameEventChoice, GameEventConsequence, GameEventEffect } from '@/lib/types/gameEvents';
import { fetchFlagsForIndustry, upsertFlagForIndustry, deleteFlagById } from '@/lib/data/flagRepository';
import type { GameFlag } from '@/lib/data/flagRepository';
import { fetchConditionsForIndustry, upsertConditionForIndustry, deleteConditionById } from '@/lib/data/conditionRepository';
import type { GameCondition, ConditionOperator } from '@/lib/types/conditions';
import { ConditionMetric } from '@/lib/types/conditions';
import { FlagsTab } from './components/FlagsTab';
import { ConditionsTab } from './components/ConditionsTab';
import { MarketingTab } from './components/MarketingTab';
import { UpgradesTab } from './components/UpgradesTab';
import { StaffTab } from './components/StaffTab';
import { ServicesTab } from './components/ServicesTab';
import { IndustriesTab } from './components/IndustriesTab';
import { GlobalConfigTab } from './components/GlobalConfigTab';
import { RequirementsSelector } from './components/RequirementsSelector';
import { makeUniqueId, slugify } from './components/utils';

interface FormState {
  id: string;
  name: string;
  icon: string;
  description: string;
  image: string;
  mapImage: string;
  isAvailable: boolean;
}

const emptyForm: FormState = {
  id: '',
  name: '',
  icon: '',
  description: '',
  image: '',
  mapImage: '',
  isAvailable: true,
};


interface ServiceFormState {
  id: string;
  name: string;
  duration: string;
  price: string;
  requirements: Requirement[];
  pricingCategory: string;
  weightage: string;
}

const emptyServiceForm: ServiceFormState = {
  id: '',
  name: '',
  duration: '0',
  price: '0',
  requirements: [],
  pricingCategory: '',
  weightage: '1',
};

export default function AdminPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<string>('industries');

  const [industries, setIndustries] = useState<Industry[]>([]);
  const [selectedIndustryId, setSelectedIndustryId] = useState<string>('');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [services, setServices] = useState<IndustryServiceDefinition[]>([]);
  const [serviceForm, setServiceForm] = useState<ServiceFormState>(emptyServiceForm);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [serviceStatus, setServiceStatus] = useState<string | null>(null);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceSaving, setServiceSaving] = useState(false);
  const [serviceDeleting, setServiceDeleting] = useState(false);
  const [isCreatingService, setIsCreatingService] = useState(false);

  // Global simulation config state (JSON textareas for careful, incremental rollout)
  const initialGlobal = DEFAULT_GLOBAL_SIMULATION_CONFIG;
  const [metrics, setMetrics] = useState<BusinessMetrics>({ ...initialGlobal.businessMetrics });
  const [stats, setStats] = useState<BusinessStats>({ ...initialGlobal.businessStats });
  const [eventSecondsInput, setEventSecondsInput] = useState<string>(
    (initialGlobal.businessStats.eventTriggerSeconds || []).join(',')
  );
  const [movementJSON, setMovementJSON] = useState<string>(JSON.stringify(initialGlobal.movement, null, 2));
  const [winCondition, setWinCondition] = useState<WinCondition>({ ...DEFAULT_WIN_CONDITION });
  const [loseCondition, setLoseCondition] = useState<LoseCondition>({ ...DEFAULT_LOSE_CONDITION });
  const [globalStatus, setGlobalStatus] = useState<string | null>(null);
  const [globalLoading, setGlobalLoading] = useState<boolean>(false);
  const [globalSaving, setGlobalSaving] = useState<boolean>(false);

  // Staff management state
  const [staffRoles, setStaffRoles] = useState<StaffRoleConfig[]>([]);
  const [staffPresets, setStaffPresets] = useState<StaffPreset[]>([]);
  const [staffLoading, setStaffLoading] = useState<boolean>(false);
  const [staffStatus, setStaffStatus] = useState<string | null>(null);

  const [roleForm, setRoleForm] = useState<{ id: string; name: string; salary: string; effects: Array<{ metric: GameMetric; type: EffectType; value: string }>; emoji: string; setsFlag?: string; requirements: Requirement[] }>({ id: '', name: '', salary: '0', effects: [], emoji: '🧑‍💼', requirements: [] });
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [roleSaving, setRoleSaving] = useState<boolean>(false);
  const [roleDeleting, setRoleDeleting] = useState<boolean>(false);
  const [isCreatingRole, setIsCreatingRole] = useState<boolean>(false);

  const [presetForm, setPresetForm] = useState<{ id: string; roleId: string; name: string; salary?: string; serviceSpeed?: string; emoji?: string }>({ id: '', roleId: '', name: '' });
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [presetSaving, setPresetSaving] = useState<boolean>(false);
  const [presetDeleting, setPresetDeleting] = useState<boolean>(false);
  const [isCreatingPreset, setIsCreatingPreset] = useState<boolean>(false);

  // Upgrades management state
  const [upgrades, setUpgrades] = useState<UpgradeDefinition[]>([]);
  const [selectedUpgradeId, setSelectedUpgradeId] = useState<string>('');
  const [isCreatingUpgrade, setIsCreatingUpgrade] = useState<boolean>(false);
  const [upgradeSaving, setUpgradeSaving] = useState<boolean>(false);
  const [upgradeDeleting, setUpgradeDeleting] = useState<boolean>(false);
  const [upgradesLoading, setUpgradesLoading] = useState<boolean>(false);
  const [upgradeStatus, setUpgradeStatus] = useState<string | null>(null);
  const [upgradeForm, setUpgradeForm] = useState<{ id: string; name: string; description: string; icon: string; cost: string; maxLevel: string; setsFlag?: string; requirements: Requirement[] }>({ id: '', name: '', description: '', icon: '⚙️', cost: '0', maxLevel: '1', requirements: [] });
  const [effectsForm, setEffectsForm] = useState<Array<{ metric: GameMetric; type: EffectType; value: string }>>([]);

  // Marketing management state
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [isCreatingCampaign, setIsCreatingCampaign] = useState<boolean>(false);
  const [campaignSaving, setCampaignSaving] = useState<boolean>(false);
  const [campaignDeleting, setCampaignDeleting] = useState<boolean>(false);
  const [campaignsLoading, setCampaignsLoading] = useState<boolean>(false);
  const [campaignStatus, setCampaignStatus] = useState<string | null>(null);
  const [campaignForm, setCampaignForm] = useState<{ id: string; name: string; description: string; cost: string; cooldownSeconds: string; setsFlag?: string; requirements: Requirement[] }>({ id: '', name: '', description: '', cost: '0', cooldownSeconds: '15', requirements: [] });
  const [campaignEffectsForm, setCampaignEffectsForm] = useState<Array<{ metric: GameMetric; type: EffectType; value: string; durationSeconds: string }>>([]);

  // Events management state (base only for now)
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(false);
  const [eventStatus, setEventStatus] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isCreatingEvent, setIsCreatingEvent] = useState<boolean>(false);
  const [eventSaving, setEventSaving] = useState<boolean>(false);
  const [eventDeleting, setEventDeleting] = useState<boolean>(false);
  const [eventForm, setEventForm] = useState<{ id: string; title: string; category: 'opportunity' | 'risk'; summary: string }>({ id: '', title: '', category: 'opportunity', summary: '' });
  const [eventChoices, setEventChoices] = useState<GameEventChoice[]>([]);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string>('');
  const [isCreatingChoice, setIsCreatingChoice] = useState<boolean>(false);
  const [choiceForm, setChoiceForm] = useState<{ id: string; label: string; description: string; cost: string; setsFlag?: string }>({ id: '', label: '', description: '', cost: '' });

  // Consequences editor state for the selected choice
  const [selectedConsequenceId, setSelectedConsequenceId] = useState<string>('');
  const [isCreatingConsequence, setIsCreatingConsequence] = useState<boolean>(false);
  const [consequenceForm, setConsequenceForm] = useState<{
    id: string;
    label: string;
    description: string;
    weight: string;
    effects: Array<
      | { type: 'cash'; amount: string; label?: string }
      | { type: 'dynamicCash'; expression: string; label?: string }
      | { type: 'reputation'; amount: string }
      | { type: 'metric'; metric: GameMetric; effectType: EffectType; value: string; durationSeconds: string; priority?: string }
    >;
  }>({ id: '', label: '', description: '', weight: '1', effects: [] });

  // JSON import/export state
  const [showJsonImport, setShowJsonImport] = useState<boolean>(false);
  const [jsonImportText, setJsonImportText] = useState<string>('');
  const [jsonImportErrors, setJsonImportErrors] = useState<string[]>([]);
  const [jsonImporting, setJsonImporting] = useState<boolean>(false);

  // Flags management state
  const [flags, setFlags] = useState<GameFlag[]>([]);
  const [flagsLoading, setFlagsLoading] = useState<boolean>(false);
  const [flagStatus, setFlagStatus] = useState<string | null>(null);
  const [selectedFlagId, setSelectedFlagId] = useState<string>('');
  const [isCreatingFlag, setIsCreatingFlag] = useState<boolean>(false);
  const [flagSaving, setFlagSaving] = useState<boolean>(false);
  const [flagDeleting, setFlagDeleting] = useState<boolean>(false);
  const [flagForm, setFlagForm] = useState<{ id: string; name: string; description: string }>({ id: '', name: '', description: '' });

  // Conditions management state
  const [conditions, setConditions] = useState<GameCondition[]>([]);
  const [conditionsLoading, setConditionsLoading] = useState<boolean>(false);
  const [conditionsStatus, setConditionsStatus] = useState<string | null>(null);
  const [selectedConditionId, setSelectedConditionId] = useState<string>('');
  const [isCreatingCondition, setIsCreatingCondition] = useState<boolean>(false);
  const [conditionForm, setConditionForm] = useState<{ id: string; name: string; description: string; metric: ConditionMetric; operator: ConditionOperator; value: string }>({ id: '', name: '', description: '', metric: ConditionMetric.Cash, operator: 'greater', value: '0' });
  const [conditionSaving, setConditionSaving] = useState<boolean>(false);
  const [conditionDeleting, setConditionDeleting] = useState<boolean>(false);

  // Persist helper: upserts the current event with provided choices
  const persistEventWithChoices = async (nextChoices: GameEventChoice[], successMessage: string = 'Event saved.') => {
    if (!form.id || !eventForm.id) {
      setEventStatus('Saved locally. Save Event to persist.');
      return;
    }
    const id = eventForm.id.trim();
    const title = eventForm.title.trim();
    const summary = eventForm.summary.trim();
    const category = eventForm.category;
    if (!id || !title || !summary) {
      setEventStatus('Saved locally. Fill required fields to persist.');
      return;
    }
    const payload: GameEvent = { id, title, category, summary, choices: nextChoices } as GameEvent;
    setEventSaving(true);
    const result = await upsertEventForIndustry(form.id, payload);
    setEventSaving(false);
    if (!result.success) {
      setEventStatus(result.message ?? 'Failed to save event.');
      return;
    }
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === id);
      const nextItem: GameEvent = payload;
      const next = exists ? prev.map((e) => (e.id === id ? nextItem : e)) : [...prev, nextItem];
      return next.sort((a, b) => a.title.localeCompare(b.title));
    });
    setEventStatus(successMessage);
  };

  const METRIC_OPTIONS: { value: GameMetric; label: string }[] = [
    { value: GameMetric.ServiceRooms, label: 'Service Rooms' },
    { value: GameMetric.MonthlyExpenses, label: 'Monthly Expenses' },
    { value: GameMetric.ServiceSpeedMultiplier, label: 'Service Speed Multiplier' },
    { value: GameMetric.SpawnIntervalSeconds, label: 'Spawn Interval (seconds)' },
    { value: GameMetric.ServiceRevenueFlatBonus, label: 'Service Revenue (flat bonus)' },
    { value: GameMetric.ServiceRevenueMultiplier, label: 'Service Revenue Multiplier' },
    { value: GameMetric.HappyProbability, label: 'Happy Probability' },
    { value: GameMetric.ReputationMultiplier, label: 'Reputation Multiplier' },
    { value: GameMetric.FounderWorkingHours, label: 'Founder Working Hours' },
    // Tier-specific service metrics
    { value: GameMetric.HighTierServiceRevenueMultiplier, label: 'High-Tier Service Revenue Multiplier' },
    { value: GameMetric.HighTierServiceWeightageMultiplier, label: 'High-Tier Service Weightage Multiplier' },
    { value: GameMetric.MidTierServiceRevenueMultiplier, label: 'Mid-Tier Service Revenue Multiplier' },
    { value: GameMetric.MidTierServiceWeightageMultiplier, label: 'Mid-Tier Service Weightage Multiplier' },
    { value: GameMetric.LowTierServiceRevenueMultiplier, label: 'Low-Tier Service Revenue Multiplier' },
    { value: GameMetric.LowTierServiceWeightageMultiplier, label: 'Low-Tier Service Weightage Multiplier' },
  ];

  const EFFECT_TYPE_OPTIONS: { value: EffectType; label: string; hint: string }[] = [
    { value: EffectType.Add, label: 'Add (flat)', hint: 'Add or subtract a flat amount, e.g. +1 room or +100 revenue' },
    { value: EffectType.Percent, label: 'Percent (%)', hint: 'Increase/decrease by percentage, e.g. +15% speed' },
    { value: EffectType.Multiply, label: 'Multiply (×)', hint: 'Multiply the value, e.g. ×1.5 for 50% boost' },
    { value: EffectType.Set, label: 'Set (=)', hint: 'Force a value to a number, overwrites others' },
  ];

  // Utilities moved to ./components/utils.ts

  const selectService = (service: IndustryServiceDefinition, resetMessage: boolean = true) => {
    setSelectedServiceId(service.id);
    setIsCreatingService(false);
    setServiceForm({
      id: service.id,
      name: service.name,
      duration: service.duration.toString(),
      price: service.price.toString(),
      requirements: service.requirements || [],
      pricingCategory: service.pricingCategory || '',
      weightage: service.weightage?.toString() || '1',
    });
    if (resetMessage) {
      setServiceStatus(null);
    }
  };

  const loadServicesForIndustry = async (industryId: string) => {
    setServiceLoading(true);
    setServiceStatus(null);
    setServices([]);
    setSelectedServiceId('');
    setServiceForm(emptyServiceForm);
    setIsCreatingService(false);

    const result = await fetchServicesForIndustry(industryId);
    setServiceLoading(false);

    if (!result || result.length === 0) {
      setServices([]);
      return;
    }

    const sorted = result.slice().sort((a, b) => a.name.localeCompare(b.name));
    setServices(sorted);
    selectService(sorted[0], false);
  };

  const selectIndustry = (industry: Industry) => {
    setSelectedIndustryId(industry.id);
    setIsCreating(false);
    setForm({
      id: industry.id,
      name: industry.name,
      icon: industry.icon,
      description: industry.description,
      image: industry.image ?? '',
      mapImage: industry.mapImage ?? '',
      isAvailable: industry.isAvailable ?? true,
    });
    setStatusMessage(null);
    loadServicesForIndustry(industry.id);
    loadFlagsForIndustry(industry.id);  // Load flags first!
    loadStaffForIndustry(industry.id);
    loadUpgradesForIndustry(industry.id);
    loadMarketingCampaigns(industry.id);
    loadEventsForIndustry(industry.id);
    loadConditionsForIndustry(industry.id);
  };

  useEffect(() => {
    let isMounted = true;

    (async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load global simulation config first
        setGlobalLoading(true);
        const global = await fetchGlobalSimulationConfig();
        if (isMounted && global) {
          if (global.businessMetrics) setMetrics(global.businessMetrics);
          if (global.businessStats) {
            setStats(global.businessStats);
            setEventSecondsInput((global.businessStats.eventTriggerSeconds || []).join(','));
          }
          if (global.movement) setMovementJSON(JSON.stringify(global.movement, null, 2));
          if (global.winCondition) setWinCondition(global.winCondition);
          if (global.loseCondition) setLoseCondition(global.loseCondition);
        }
        setGlobalLoading(false);

        const data = await fetchIndustriesFromSupabase();
        if (!isMounted) {
          return;
        }

        if (data) {
          setIndustries(data);
          if (data.length > 0) {
            selectIndustry(data[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load industries for admin panel', err);
        if (isMounted) {
          setError('Failed to load industries.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadStaffForIndustry = async (industryId: string) => {
    setStaffLoading(true);
    setStaffStatus(null);
    setStaffRoles([]);
    setStaffPresets([]);
    setSelectedRoleId('');
    setSelectedPresetId('');
    setIsCreatingRole(false);
    setIsCreatingPreset(false);

    const data = await fetchStaffDataForIndustry(industryId);
    setStaffLoading(false);
    if (!data) {
      return;
    }
    const rolesSorted = data.roles.slice().sort((a, b) => a.name.localeCompare(b.name));
    const presetsSorted = data.initialStaff.slice().sort((a, b) => a.name.localeCompare(b.name));
    setStaffRoles(rolesSorted);
    setStaffPresets(presetsSorted);
    if (rolesSorted.length > 0) {
      const first = rolesSorted[0];
      setSelectedRoleId(first.id);
      // Convert effects array to form format (handle both old and new formats)
      const effects = first.effects || [];
      // If no effects but old format properties exist, convert them
      if (effects.length === 0 && ('serviceSpeed' in first || 'workloadReduction' in first)) {
        const legacyEffects: Array<{ metric: GameMetric; type: EffectType; value: string }> = [];
        if ('serviceSpeed' in first && (first as any).serviceSpeed > 0) {
          legacyEffects.push({ metric: GameMetric.ServiceSpeedMultiplier, type: EffectType.Percent, value: String((first as any).serviceSpeed) });
        }
        if ('workloadReduction' in first && (first as any).workloadReduction > 0) {
          legacyEffects.push({ metric: GameMetric.FounderWorkingHours, type: EffectType.Add, value: String(-(first as any).workloadReduction) });
        }
        setRoleForm({ id: first.id, name: first.name, salary: String(first.salary), effects: legacyEffects, emoji: first.emoji, setsFlag: first.setsFlag, requirements: first.requirements || [] });
      } else {
        setRoleForm({ id: first.id, name: first.name, salary: String(first.salary), effects: effects.map(e => ({ metric: e.metric, type: e.type, value: String(e.value) })), emoji: first.emoji, setsFlag: first.setsFlag, requirements: first.requirements || [] });
      }
    }
    if (presetsSorted.length > 0) {
      const firstP = presetsSorted[0];
      setSelectedPresetId(firstP.id);
      setPresetForm({ id: firstP.id, roleId: firstP.roleId, name: firstP.name, salary: firstP.salary !== undefined ? String(firstP.salary) : undefined, serviceSpeed: firstP.serviceSpeed !== undefined ? String(firstP.serviceSpeed) : undefined, emoji: firstP.emoji });
    }
  };

  const loadUpgradesForIndustry = async (industryId: string) => {
    setUpgradesLoading(true);
    setUpgradeStatus(null);
    setUpgrades([]);
    setSelectedUpgradeId('');
    setIsCreatingUpgrade(false);
    setUpgradeForm({ id: '', name: '', description: '', icon: '⚙️', cost: '0', maxLevel: '1', requirements: [] });
    setEffectsForm([]);
    const result = await fetchUpgradesForIndustry(industryId);
    setUpgradesLoading(false);
    if (!result) return;
    const sorted = result.slice().sort((a, b) => a.name.localeCompare(b.name));
    setUpgrades(sorted);
    if (sorted.length > 0) selectUpgrade(sorted[0], false);
  };

  const selectUpgrade = (upgrade: UpgradeDefinition, resetMsg = true) => {
    setSelectedUpgradeId(upgrade.id);
    setIsCreatingUpgrade(false);
    setUpgradeForm({ id: upgrade.id, name: upgrade.name, description: upgrade.description, icon: upgrade.icon, cost: String(upgrade.cost), maxLevel: String(upgrade.maxLevel), setsFlag: upgrade.setsFlag, requirements: upgrade.requirements || [] });
    setEffectsForm(upgrade.effects.map((e) => ({ metric: e.metric, type: e.type, value: String(e.value) })));
    if (resetMsg) setUpgradeStatus(null);
  };

  const handleCreateUpgrade = () => {
    if (!form.id) { setUpgradeStatus('Save the industry first.'); return; }
    setIsCreatingUpgrade(true);
    setSelectedUpgradeId('');
    setUpgradeForm({ id: '', name: '', description: '', icon: '⚙️', cost: '0', maxLevel: '1', setsFlag: '', requirements: [] });
    setEffectsForm([]);
    setUpgradeStatus(null);
  };

  const handleSaveUpgrade = async () => {
    if (!form.id) { setUpgradeStatus('Save the industry first.'); return; }
    const id = upgradeForm.id.trim();
    const name = upgradeForm.name.trim();
    const description = upgradeForm.description.trim();
    const icon = upgradeForm.icon.trim() || '⚙️';
    const cost = Number(upgradeForm.cost);
    const maxLevel = Number(upgradeForm.maxLevel);
    if (!id || !name) { setUpgradeStatus('Upgrade id and name are required.'); return; }
    if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(maxLevel) || maxLevel < 1) {
      setUpgradeStatus('Cost must be >= 0 and Max Level >= 1.');
      return;
    }
    const setsFlag = upgradeForm.setsFlag?.trim() || undefined;
    const requirements = upgradeForm.requirements;
    const effects: UpgradeEffect[] = effectsForm.map((ef) => ({
      metric: ef.metric,
      type: ef.type,
      value: Number(ef.value) || 0,
    }));
    setUpgradeSaving(true);
    const result = await upsertUpgradeForIndustry(form.id, { id, name, description, icon, cost, maxLevel, effects, setsFlag, requirements });
    setUpgradeSaving(false);
    if (!result.success) { setUpgradeStatus(result.message ?? 'Failed to save upgrade.'); return; }
    setUpgrades((prev) => {
      const exists = prev.some((u) => u.id === id);
      const nextItem: UpgradeDefinition = { id, name, description, icon, cost, maxLevel, effects, setsFlag, requirements };
      const next = exists ? prev.map((u) => (u.id === id ? nextItem : u)) : [...prev, nextItem];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    setUpgradeStatus('Upgrade saved.');
    setIsCreatingUpgrade(false);
    setSelectedUpgradeId(id);
  };

  const handleDeleteUpgrade = async () => {
    if (isCreatingUpgrade || !selectedUpgradeId) return;
    if (!window.confirm(`Delete upgrade "${upgradeForm.name || selectedUpgradeId}"?`)) return;
    setUpgradeDeleting(true);
    const result = await deleteUpgradeById(selectedUpgradeId);
    setUpgradeDeleting(false);
    if (!result.success) { setUpgradeStatus(result.message ?? 'Failed to delete upgrade.'); return; }
    setUpgrades((prev) => prev.filter((u) => u.id !== selectedUpgradeId));
    setSelectedUpgradeId('');
    setUpgradeForm({ id: '', name: '', description: '', icon: '⚙️', cost: '0', maxLevel: '1', setsFlag: '', requirements: [] });
    setEffectsForm([]);
    setUpgradeStatus('Upgrade deleted.');
  };

  const loadMarketingCampaigns = async (industryId: string) => {
    console.log('Loading marketing campaigns for industry:', industryId);
    setCampaignsLoading(true);
    setCampaignStatus(null);
    setCampaigns([]);
    setSelectedCampaignId('');
    setIsCreatingCampaign(false);
    setCampaignForm({ id: '', name: '', description: '', cost: '0', cooldownSeconds: '15', requirements: [] });
    setCampaignEffectsForm([]);
    const result = await fetchMarketingCampaignsForIndustry(industryId);
    console.log('Marketing campaigns result:', result);
    setCampaignsLoading(false);
    if (!result) {
      console.log('No marketing campaigns returned');
      return;
    }
    setCampaigns(result);
    if (result.length > 0) selectCampaign(result[0], false);
  };

  const selectCampaign = (campaign: MarketingCampaign, resetMsg = true) => {
    setSelectedCampaignId(campaign.id);
    setIsCreatingCampaign(false);
    setCampaignForm({ id: campaign.id, name: campaign.name, description: campaign.description, cost: String(campaign.cost), cooldownSeconds: String(campaign.cooldownSeconds), setsFlag: campaign.setsFlag, requirements: campaign.requirements || [] });
    setCampaignEffectsForm(campaign.effects.map((e) => ({ metric: e.metric, type: e.type, value: String(e.value), durationSeconds: String(e.durationSeconds ?? '') })));
    if (resetMsg) setCampaignStatus(null);
  };

  const handleCreateCampaign = () => {
    setIsCreatingCampaign(true);
    setSelectedCampaignId('');
    setCampaignForm({ id: '', name: '', description: '', cost: '0', cooldownSeconds: '15', setsFlag: '', requirements: [] });
    setCampaignEffectsForm([]);
    setCampaignStatus(null);
  };

  const handleSaveCampaign = async () => {
    const id = campaignForm.id.trim();
    const name = campaignForm.name.trim();
    const description = campaignForm.description.trim();
    const cost = Number(campaignForm.cost);
    const cooldownSeconds = Number(campaignForm.cooldownSeconds);
    if (!id || !name) { setCampaignStatus('Campaign id and name are required.'); return; }
    if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(cooldownSeconds) || cooldownSeconds < 0) {
      setCampaignStatus('Cost must be >= 0 and Cooldown >= 0 seconds (recommended: 10-30 seconds).');
      return;
    }
    const setsFlag = campaignForm.setsFlag?.trim() || undefined;
    const requirements = campaignForm.requirements;
    const effects = campaignEffectsForm.map((ef) => ({
      metric: ef.metric,
      type: ef.type,
      value: Number(ef.value) || 0,
      durationSeconds: ef.durationSeconds === '' ? null : Number(ef.durationSeconds) || null
    }));
    setCampaignSaving(true);
    const result = await upsertMarketingCampaignForIndustry(selectedIndustryId, { id, name, description, cost, cooldownSeconds, effects, setsFlag, requirements });
    setCampaignSaving(false);
    if (!result.success) { setCampaignStatus(result.message ?? 'Failed to save campaign.'); return; }
    setCampaigns((prev) => {
      const exists = prev.some((c) => c.id === id);
      const nextItem: MarketingCampaign = { id, name, description, cost, cooldownSeconds, effects, setsFlag, requirements };
      const next = exists ? prev.map((c) => (c.id === id ? nextItem : c)) : [...prev, nextItem];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    setCampaignStatus('Campaign saved.');
    setIsCreatingCampaign(false);
    setSelectedCampaignId(id);
  };

  const handleDeleteCampaign = async () => {
    if (isCreatingCampaign || !selectedCampaignId) return;
    if (!window.confirm(`Delete campaign "${campaignForm.name || selectedCampaignId}"?`)) return;
    setCampaignDeleting(true);
    const result = await deleteMarketingCampaignById(selectedCampaignId, selectedIndustryId);
    setCampaignDeleting(false);
    if (!result.success) { setCampaignStatus(result.message ?? 'Failed to delete campaign.'); return; }
    setCampaigns((prev) => prev.filter((c) => c.id !== selectedCampaignId));
    setSelectedCampaignId('');
    setCampaignForm({ id: '', name: '', description: '', cost: '0', cooldownSeconds: '15', setsFlag: '', requirements: [] });
    setCampaignEffectsForm([]);
    setCampaignStatus('Campaign deleted.');
  };

  const loadFlagsForIndustry = async (industryId: string) => {
    setFlagsLoading(true);
    setFlagStatus(null);
    setFlags([]);
    setSelectedFlagId('');
    setIsCreatingFlag(false);
    setFlagForm({ id: '', name: '', description: '' });
    const result = await fetchFlagsForIndustry(industryId);
    setFlagsLoading(false);
    if (!result) return;
    setFlags(result);
    if (result.length > 0) selectFlag(result[0], false);
  };

  const loadConditionsForIndustry = async (industryId: string) => {
    setConditionsLoading(true);
    setConditionsStatus(null);
    setConditions([]);
    setSelectedConditionId('');
    setIsCreatingCondition(false);
    setConditionForm({ id: '', name: '', description: '', metric: ConditionMetric.Cash, operator: 'greater', value: '0' });
    const result = await fetchConditionsForIndustry(industryId);
    setConditionsLoading(false);
    if (!result) return;
    setConditions(result);
    if (result.length > 0) selectCondition(result[0], false);
  };

  const loadEventsForIndustry = async (industryId: string) => {
    setEventsLoading(true);
    setEventStatus(null);
    setEvents([]);
    setSelectedEventId('');
    setIsCreatingEvent(false);
    setEventForm({ id: '', title: '', category: 'opportunity', summary: '' });
    setEventChoices([]);
    const result = await fetchEventsForIndustry(industryId);
    setEventsLoading(false);
    if (!result) return;
    const sorted = result.slice().sort((a, b) => a.title.localeCompare(b.title));
    setEvents(sorted);
    if (sorted.length > 0) selectEvent(sorted[0], false);
  };

  const selectFlag = (flag: GameFlag, resetMsg = true) => {
    setSelectedFlagId(flag.id);
    setIsCreatingFlag(false);
    setFlagForm({ id: flag.id, name: flag.name, description: flag.description });
    if (resetMsg) setFlagStatus(null);
  };

  const handleCreateFlag = () => {
    if (!form.id) { setFlagStatus('Save the industry first.'); return; }
    setIsCreatingFlag(true);
    setSelectedFlagId('');
    setFlagForm({ id: '', name: '', description: '' });
    setFlagStatus(null);
  };

  const handleSaveFlag = async () => {
    if (!form.id) { setFlagStatus('Save the industry first.'); return; }
    const id = flagForm.id.trim();
    const name = flagForm.name.trim();
    const description = flagForm.description.trim();
    if (!id || !name) { setFlagStatus('Flag id and name are required.'); return; }
    setFlagSaving(true);
    const result = await upsertFlagForIndustry(form.id, { id, name, description });
    setFlagSaving(false);
    if (!result.success) { setFlagStatus(result.message ?? 'Failed to save flag.'); return; }
    const result2 = await fetchFlagsForIndustry(form.id);
    if (result2) {
      setFlags(result2);
      if (result2.length > 0) selectFlag(result2.find(f => f.id === id) || result2[0], false);
    }
    setFlagStatus('Flag saved.');
    setIsCreatingFlag(false);
    setSelectedFlagId(id);
  };

  const handleDeleteFlag = async () => {
    if (isCreatingFlag || !selectedFlagId) return;
    if (!window.confirm(`Delete flag "${flagForm.name || selectedFlagId}"?`)) return;
    setFlagDeleting(true);
    const result = await deleteFlagById(selectedFlagId);
    setFlagDeleting(false);
    if (!result.success) { setFlagStatus(result.message ?? 'Failed to delete flag.'); return; }
    const result2 = await fetchFlagsForIndustry(form.id);
    if (result2) {
      setFlags(result2);
      if (result2.length > 0) selectFlag(result2[0], false);
      else {
        setSelectedFlagId('');
        setFlagForm({ id: '', name: '', description: '' });
        setIsCreatingFlag(false);
      }
    }
    setFlagStatus('Flag deleted.');
  };

  const selectCondition = (condition: GameCondition, resetMsg = true) => {
    setSelectedConditionId(condition.id);
    setIsCreatingCondition(false);
    setConditionForm({
      id: condition.id,
      name: condition.name,
      description: condition.description,
      metric: condition.metric as ConditionMetric,
      operator: condition.operator,
      value: String(condition.value)
    });
    if (resetMsg) setConditionsStatus(null);
  };

  const handleCreateCondition = () => {
    if (!form.id) { setConditionsStatus('Save the industry first.'); return; }
    setIsCreatingCondition(true);
    setSelectedConditionId('');
    setConditionForm({ id: '', name: '', description: '', metric: ConditionMetric.Cash, operator: 'greater', value: '0' });
    setConditionsStatus(null);
  };

  const handleSaveCondition = async () => {
    if (!form.id) { setConditionsStatus('Save the industry first.'); return; }
    const id = conditionForm.id.trim();
    const name = conditionForm.name.trim();
    const description = conditionForm.description.trim();
    const metric = conditionForm.metric;
    const operator = conditionForm.operator;
    const value = Number(conditionForm.value);

    if (!id || !name) { setConditionsStatus('Condition id and name are required.'); return; }
    if (!Number.isFinite(value)) { setConditionsStatus('Value must be a valid number.'); return; }

    setConditionSaving(true);
    const result = await upsertConditionForIndustry(form.id, { id, name, description, metric, operator, value });
    setConditionSaving(false);
    if (!result.success) { setConditionsStatus(result.message ?? 'Failed to save condition.'); return; }
    const result2 = await fetchConditionsForIndustry(form.id);
    if (result2) {
      setConditions(result2);
      if (result2.length > 0) selectCondition(result2.find(c => c.id === id) || result2[0], false);
    }
    setConditionsStatus('Condition saved.');
    setIsCreatingCondition(false);
    setSelectedConditionId(id);
  };

  const handleDeleteCondition = async () => {
    if (isCreatingCondition || !selectedConditionId) return;
    if (!window.confirm(`Delete condition "${conditionForm.name || selectedConditionId}"?`)) return;
    setConditionDeleting(true);
    const result = await deleteConditionById(selectedConditionId);
    setConditionDeleting(false);
    if (!result.success) { setConditionsStatus(result.message ?? 'Failed to delete condition.'); return; }
    const result2 = await fetchConditionsForIndustry(form.id);
    if (result2) {
      setConditions(result2);
      if (result2.length > 0) selectCondition(result2[0], false);
      else {
        setSelectedConditionId('');
        setConditionForm({ id: '', name: '', description: '', metric: ConditionMetric.Cash, operator: 'greater', value: '0' });
        setIsCreatingCondition(false);
      }
    }
    setConditionsStatus('Condition deleted.');
  };

  const selectEvent = (event: GameEvent, resetMsg = true) => {
    setSelectedEventId(event.id);
    setIsCreatingEvent(false);
    setEventForm({ id: event.id, title: event.title, category: event.category, summary: event.summary });
    setEventChoices(event.choices);
    setSelectedChoiceId('');
    setIsCreatingChoice(false);
    setChoiceForm({ id: '', label: '', description: '', cost: '', setsFlag: '' });
    setSelectedConsequenceId('');
    setIsCreatingConsequence(false);
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [] });
    if (resetMsg) setEventStatus(null);
  };

  const handleCreateEvent = () => {
    if (!form.id) { setEventStatus('Save the industry first.'); return; }
    setIsCreatingEvent(true);
    setSelectedEventId('');
    setEventForm({ id: '', title: '', category: 'opportunity', summary: '' });
    setEventChoices([]);
    setSelectedChoiceId('');
    setIsCreatingChoice(false);
    setChoiceForm({ id: '', label: '', description: '', cost: '', setsFlag: '' });
    setSelectedConsequenceId('');
    setIsCreatingConsequence(false);
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [] });
    setEventStatus(null);
  };

  const handleSaveEvent = async () => {
    if (!form.id) { setEventStatus('Save the industry first.'); return; }
    const id = eventForm.id.trim();
    const title = eventForm.title.trim();
    const summary = eventForm.summary.trim();
    const category = eventForm.category;
    if (!id || !title || !summary) { setEventStatus('Event id, title and summary are required.'); return; }
    const payload: GameEvent = { id, title, category, summary, choices: eventChoices } as GameEvent;
    setEventSaving(true);
    const result = await upsertEventForIndustry(form.id, payload);
    setEventSaving(false);
    if (!result.success) { setEventStatus(result.message ?? 'Failed to save event.'); return; }
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === id);
      const nextItem: GameEvent = payload;
      const next = exists ? prev.map((e) => (e.id === id ? nextItem : e)) : [...prev, nextItem];
      return next.sort((a, b) => a.title.localeCompare(b.title));
    });
    setEventStatus('Event saved.');
    setIsCreatingEvent(false);
    setSelectedEventId(id);
  };

  const handleDeleteEvent = async () => {
    if (isCreatingEvent || !selectedEventId) return;
    if (!window.confirm(`Delete event "${eventForm.title || selectedEventId}"?`)) return;
    setEventDeleting(true);
    const result = await deleteEventById(selectedEventId);
    setEventDeleting(false);
    if (!result.success) { setEventStatus(result.message ?? 'Failed to delete event.'); return; }
    setEvents((prev) => prev.filter((e) => e.id !== selectedEventId));
    setSelectedEventId('');
    setEventForm({ id: '', title: '', category: 'opportunity', summary: '' });
    setEventChoices([]);
    setSelectedChoiceId('');
    setIsCreatingChoice(false);
    setChoiceForm({ id: '', label: '', description: '', cost: '', setsFlag: '' });
    setSelectedConsequenceId('');
    setIsCreatingConsequence(false);
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [] });
    setEventStatus('Event deleted.');
  };

  const selectChoice = (choice: GameEventChoice) => {
    setIsCreatingChoice(false);
    setSelectedChoiceId(choice.id);
    setChoiceForm({ id: choice.id, label: choice.label, description: choice.description ?? '', cost: choice.cost !== undefined ? String(choice.cost) : '', setsFlag: choice.setsFlag });
    setSelectedConsequenceId('');
    setIsCreatingConsequence(false);
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [] });
  };

  const handleCreateChoice = () => {
    if (!selectedEventId && !isCreatingEvent) { setEventStatus('Create or select an event first.'); return; }
    setIsCreatingChoice(true);
    setSelectedChoiceId('');
    setChoiceForm({ id: '', label: '', description: '', cost: '', setsFlag: '' });
    setSelectedConsequenceId('');
    setIsCreatingConsequence(false);
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [] });
  };

  const handleSaveChoice = () => {
    const id = choiceForm.id.trim();
    const label = choiceForm.label.trim();
    const description = choiceForm.description.trim();
    const cost = choiceForm.cost.trim() === '' ? undefined : Number(choiceForm.cost);
    const setsFlag = choiceForm.setsFlag?.trim() || undefined;
    if (!id || !label) { setEventStatus('Choice id and label are required.'); return; }
    if (cost !== undefined && (!Number.isFinite(cost) || cost < 0)) { setEventStatus('Choice cost must be a non-negative number.'); return; }

    const exists = eventChoices.some((c) => c.id === id);
    const nextItem: GameEventChoice = { id, label, description: description || undefined, cost, setsFlag, consequences: exists ? eventChoices.find(c => c.id === id)!.consequences : [] };
    const next = (exists ? eventChoices.map((c) => (c.id === id ? nextItem : c)) : [...eventChoices, nextItem])
      .sort((a, b) => a.label.localeCompare(b.label));
    setEventChoices(next);
    setIsCreatingChoice(false);
    setSelectedChoiceId(id);
    void persistEventWithChoices(next, 'Choice saved.');
  };

  const handleDeleteChoice = () => {
    if (isCreatingChoice || !selectedChoiceId) return;
    const next = eventChoices.filter((c) => c.id !== selectedChoiceId);
    setEventChoices(next);
    setSelectedChoiceId('');
    setChoiceForm({ id: '', label: '', description: '', cost: '', setsFlag: '' });
    setSelectedConsequenceId('');
    setIsCreatingConsequence(false);
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [] });
    void persistEventWithChoices(next, 'Choice deleted.');
  };

  const selectConsequence = (consequence: GameEventConsequence) => {
    if (!consequence) return;

    setIsCreatingConsequence(false);
    setSelectedConsequenceId(consequence.id);
    setConsequenceForm({
      id: consequence.id || '',
      label: consequence.label ?? '',
      description: consequence.description ?? '',
      weight: String(consequence.weight || 1),
      effects: (consequence.effects || []).map((ef: GameEventEffect) => {
        if (ef.type === 'cash') {
          return { type: 'cash', amount: String(ef.amount || 0), label: ef.label };
        } else if (ef.type === 'dynamicCash') {
          return { type: 'dynamicCash', expression: String(ef.expression || ''), label: ef.label };
        } else if (ef.type === 'reputation') {
          return { type: 'reputation', amount: String(ef.amount || 0) };
        } else if (ef.type === 'metric') {
          return {
            type: 'metric',
            metric: ef.metric,
            effectType: ef.effectType,
            value: String(ef.value || 0),
            durationSeconds: String(ef.durationSeconds ?? ''),
            priority: ef.priority !== undefined ? String(ef.priority) : undefined,
          };
        }
        return ef; // fallback
      }),
    });
  };

  const handleCreateConsequence = () => {
    if (!selectedChoiceId && !isCreatingChoice) { setEventStatus('Create or select a choice first.'); return; }
    setIsCreatingConsequence(true);
    setSelectedConsequenceId('');
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [] });
  };

  const handleSaveConsequence = () => {
    if (!selectedChoiceId && !isCreatingChoice) { setEventStatus('Create or select a choice first.'); return; }
    const id = consequenceForm.id.trim();
    const label = consequenceForm.label.trim();
    const description = consequenceForm.description.trim();
    const weightNum = Number(consequenceForm.weight);
    if (!id || !Number.isInteger(weightNum) || weightNum <= 0) { setEventStatus('Consequence id and positive integer weight are required.'); return; }

    const normalizedEffects = consequenceForm.effects.map((ef) => {
      if (ef.type === 'cash') {
        return {
          type: 'cash' as const,
          amount: Number(ef.amount) || 0,
          ...(ef.label ? { label: ef.label } : {}),
        };
      } else if (ef.type === 'dynamicCash') {
        return {
          type: 'dynamicCash' as const,
          expression: String(ef.expression || ''),
          ...(ef.label ? { label: ef.label } : {}),
        };
      } else if (ef.type === 'reputation') {
        return {
          type: 'reputation' as const,
          amount: Number(ef.amount) || 0,
        };
      } else if (ef.type === 'metric') {
        return {
          type: 'metric' as const,
          metric: ef.metric,
          effectType: ef.effectType,
          value: Number(ef.value) || 0,
          durationSeconds: ef.durationSeconds === '' ? null : Number(ef.durationSeconds) || null,
          priority: ef.priority !== undefined && ef.priority !== '' ? Number(ef.priority) : undefined,
        };
      }
      return ef; // fallback
    }) as GameEventEffect[];

    const idx = eventChoices.findIndex((c) => c.id === selectedChoiceId);
    if (idx === -1) return;
    const choice = eventChoices[idx];
    const exists = choice.consequences.some((cs) => cs.id === id);
    const nextConsequence: GameEventConsequence = {
      id,
      label: label || undefined,
      description: description || undefined,
      weight: weightNum,
      effects: normalizedEffects,
    };
    const nextConsequences = exists
      ? choice.consequences.map((cs) => (cs.id === id ? nextConsequence : cs))
      : [...choice.consequences, nextConsequence];
    const nextChoice: GameEventChoice = { ...choice, consequences: nextConsequences };
    const next = [...eventChoices];
    next[idx] = nextChoice;
    setEventChoices(next);
    setIsCreatingConsequence(false);
    setSelectedConsequenceId(id);
    void persistEventWithChoices(next, 'Consequence saved.');
  };

  const handleDeleteConsequence = () => {
    if (isCreatingConsequence || !selectedConsequenceId) return;
    const idx = eventChoices.findIndex((c) => c.id === selectedChoiceId);
    if (idx === -1) return;
    const choice = eventChoices[idx];
    const nextChoice: GameEventChoice = {
      ...choice,
      consequences: choice.consequences.filter((cs) => cs.id !== selectedConsequenceId),
    };
    const next = [...eventChoices];
    next[idx] = nextChoice;
    setEventChoices(next);
    setSelectedConsequenceId('');
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [] });
    void persistEventWithChoices(next, 'Consequence deleted.');
  };

  // JSON import/export functions for events
  const isValidGameMetric = (value: any): value is GameMetric => {
    return typeof value === 'string' && Object.values(GameMetric).includes(value as GameMetric);
  };

  const isValidEffectType = (value: any): value is EffectType => {
    return typeof value === 'string' && Object.values(EffectType).includes(value as EffectType);
  };

  const validateGameEvent = (data: any): data is GameEvent => {
    if (!data || typeof data !== 'object') return false;
    if (typeof data.id !== 'string' || !data.id.trim()) return false;
    if (typeof data.title !== 'string' || !data.title.trim()) return false;
    if (data.category !== 'opportunity' && data.category !== 'risk') return false;
    if (typeof data.summary !== 'string' || !data.summary.trim()) return false;
    if (!Array.isArray(data.choices)) return false;

    for (const choice of data.choices) {
      if (!choice || typeof choice !== 'object') return false;
      if (typeof choice.id !== 'string' || !choice.id.trim()) return false;
      if (typeof choice.label !== 'string' || !choice.label.trim()) return false;
      if (choice.description !== undefined && typeof choice.description !== 'string') return false;
      if (choice.cost !== undefined && (typeof choice.cost !== 'number' || choice.cost < 0)) return false;
      if (!Array.isArray(choice.consequences)) return false;

      for (const consequence of choice.consequences) {
        if (!consequence || typeof consequence !== 'object') return false;
        if (typeof consequence.id !== 'string' || !consequence.id.trim()) return false;
        if (consequence.label !== undefined && typeof consequence.label !== 'string') return false;
        if (consequence.description !== undefined && typeof consequence.description !== 'string') return false;
        if (typeof consequence.weight !== 'number' || consequence.weight < 1) return false;

        if (!Array.isArray(consequence.effects)) return false;
        for (const effect of consequence.effects) {
          if (effect.type === 'cash' || effect.type === 'reputation') {
            if (typeof effect.amount !== 'number') return false;
          } else if (effect.type === 'dynamicCash') {
            if (typeof effect.expression !== 'string' || !effect.expression.trim()) return false;
          } else {
            return false;
          }
        }

        // Validate effects (now unified - includes metric effects with duration)
        if (!Array.isArray(consequence.effects)) return false;
        for (const effect of consequence.effects) {
          if (!effect || typeof effect !== 'object') return false;
          if (effect.type === 'metric') {
            if (!isValidGameMetric(effect.metric)) return false;
            if (!isValidEffectType(effect.effectType)) return false;
            if (typeof effect.value !== 'number') return false;
            if (effect.durationSeconds !== null && typeof effect.durationSeconds !== 'number') return false;
            if (effect.priority !== undefined && typeof effect.priority !== 'number') return false;
          } else if (effect.type === 'cash') {
            if (typeof effect.amount !== 'number') return false;
            if (effect.label !== undefined && typeof effect.label !== 'string') return false;
          } else if (effect.type === 'reputation') {
            if (typeof effect.amount !== 'number') return false;
          } else if (effect.type === 'dynamicCash') {
            if (typeof effect.expression !== 'string' || !effect.expression.trim()) return false;
            if (effect.label !== undefined && typeof effect.label !== 'string') return false;
          } else {
            return false; // invalid effect type
          }
        }
      }
    }
    return true;
  };

  const validateAndGetErrors = (data: any, path = ''): string[] => {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push(`${path}: must be an object`);
      return errors;
    }

    if (typeof data.id !== 'string' || !data.id.trim()) {
      errors.push(`${path}.id: required string, cannot be empty`);
    }

    if (typeof data.title !== 'string' || !data.title.trim()) {
      errors.push(`${path}.title: required string, cannot be empty`);
    }

    if (data.category !== 'opportunity' && data.category !== 'risk') {
      errors.push(`${path}.category: must be "opportunity" or "risk"`);
    }

    if (typeof data.summary !== 'string' || !data.summary.trim()) {
      errors.push(`${path}.summary: required string, cannot be empty`);
    }

    if (!Array.isArray(data.choices)) {
      errors.push(`${path}.choices: must be an array`);
    } else {
      data.choices.forEach((choice: any, choiceIndex: number) => {
        const choicePath = `${path}.choices[${choiceIndex}]`;

        if (!choice || typeof choice !== 'object') {
          errors.push(`${choicePath}: must be an object`);
          return;
        }

        if (typeof choice.id !== 'string' || !choice.id.trim()) {
          errors.push(`${choicePath}.id: required string, cannot be empty`);
        }

        if (typeof choice.label !== 'string' || !choice.label.trim()) {
          errors.push(`${choicePath}.label: required string, cannot be empty`);
        }

        if (choice.description !== undefined && typeof choice.description !== 'string') {
          errors.push(`${choicePath}.description: must be a string if provided`);
        }

        if (choice.cost !== undefined && (typeof choice.cost !== 'number' || choice.cost < 0)) {
          errors.push(`${choicePath}.cost: must be a non-negative number if provided`);
        }

        if (!Array.isArray(choice.consequences)) {
          errors.push(`${choicePath}.consequences: must be an array`);
        } else {
          choice.consequences.forEach((consequence: any, consIndex: number) => {
            const consPath = `${choicePath}.consequences[${consIndex}]`;

            if (!consequence || typeof consequence !== 'object') {
              errors.push(`${consPath}: must be an object`);
              return;
            }

            if (typeof consequence.id !== 'string' || !consequence.id.trim()) {
              errors.push(`${consPath}.id: required string, cannot be empty`);
            }

            if (consequence.label !== undefined && typeof consequence.label !== 'string') {
              errors.push(`${consPath}.label: must be a string if provided`);
            }

            if (consequence.description !== undefined && typeof consequence.description !== 'string') {
              errors.push(`${consPath}.description: must be a string if provided`);
            }

            if (typeof consequence.weight !== 'number' || consequence.weight < 1) {
              errors.push(`${consPath}.weight: must be a number >= 1`);
            }

            if (!Array.isArray(consequence.effects)) {
              errors.push(`${consPath}.effects: must be an array`);
            } else {
              consequence.effects.forEach((effect: any, effectIndex: number) => {
                const effectPath = `${consPath}.effects[${effectIndex}]`;
                if (effect?.type === 'cash') {
                  if (typeof effect.amount !== 'number') {
                    errors.push(`${effectPath}.amount: must be a number`);
                  }
                  if (effect.label !== undefined && typeof effect.label !== 'string') {
                    errors.push(`${effectPath}.label: must be a string if provided`);
                  }
                } else if (effect?.type === 'reputation') {
                  if (typeof effect.amount !== 'number') {
                    errors.push(`${effectPath}.amount: must be a number`);
                  }
                } else if (effect?.type === 'metric') {
                  if (!isValidGameMetric(effect.metric)) {
                    errors.push(`${effectPath}.metric: must be a valid GameMetric`);
                  }
                  if (!isValidEffectType(effect.effectType)) {
                    errors.push(`${effectPath}.effectType: must be a valid EffectType`);
                  }
                  if (typeof effect.value !== 'number') {
                    errors.push(`${effectPath}.value: must be a number`);
                  }
                  if (effect.durationSeconds !== null && typeof effect.durationSeconds !== 'number') {
                    errors.push(`${effectPath}.durationSeconds: must be a number or null`);
                  }
                  if (effect.priority !== undefined && typeof effect.priority !== 'number') {
                    errors.push(`${effectPath}.priority: must be a number if provided`);
                  }
                } else if (effect?.type === 'dynamicCash') {
                  if (typeof effect.expression !== 'string' || !effect.expression.trim()) {
                    errors.push(`${effectPath}.expression: must be a non-empty string`);
                  }
                  if (effect.label !== undefined && typeof effect.label !== 'string') {
                    errors.push(`${effectPath}.label: must be a string if provided`);
                  }
                } else {
                  errors.push(`${effectPath}.type: must be "cash", "reputation", "metric", or "dynamicCash"`);
                }
              });
            }
          });
        }
      });
    }

    return errors;
  };

  const handleJsonImport = async () => {
    if (!form.id) {
      setJsonImportErrors(['Save the industry first.']);
      return;
    }

    try {
      const parsed = JSON.parse(jsonImportText);
      const eventsToImport: GameEvent[] = [];
      const allErrors: string[] = [];

      if (Array.isArray(parsed)) {
        for (let i = 0; i < parsed.length; i++) {
          const errors = validateAndGetErrors(parsed[i], `Event ${i}`);
          if (errors.length > 0) {
            allErrors.push(...errors);
          } else if (validateGameEvent(parsed[i])) {
            eventsToImport.push(parsed[i]);
          }
        }
      } else {
        const errors = validateAndGetErrors(parsed, 'Event');
        if (errors.length > 0) {
          allErrors.push(...errors);
        } else if (validateGameEvent(parsed)) {
          eventsToImport.push(parsed);
        }
      }

      if (allErrors.length > 0) {
        setJsonImportErrors(allErrors);
        return;
      }

      if (eventsToImport.length === 0) {
        setJsonImportErrors(['No valid events found to import.']);
        return;
      }

      setJsonImportErrors([]);
      setJsonImporting(true);

      let successCount = 0;
      let errorMessages: string[] = [];

      for (const event of eventsToImport) {
        try {
          const result = await upsertEventForIndustry(form.id, event);
          if (result.success) {
            successCount++;
            // Update local state
            setEvents((prev) => {
              const exists = prev.some((e) => e.id === event.id);
              const next = exists ? prev.map((e) => (e.id === event.id ? event : e)) : [...prev, event];
              return next.sort((a, b) => a.title.localeCompare(b.title));
            });
          } else {
            errorMessages.push(`Failed to import "${event.title}": ${result.message}`);
          }
        } catch (error) {
          errorMessages.push(`Failed to import "${event.title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setJsonImporting(false);
      if (successCount > 0) {
        setEventStatus(`Successfully imported ${successCount} event(s).`);
        setShowJsonImport(false);
        setJsonImportText('');
      }
      if (errorMessages.length > 0) {
        setJsonImportErrors(errorMessages);
      }
    } catch (error) {
      setJsonImportErrors([`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown parsing error'}`]);
    }
  };

  const handleJsonExport = () => {
    const exportData = JSON.stringify(events, null, 2);
    navigator.clipboard.writeText(exportData).then(() => {
      setEventStatus('Events JSON copied to clipboard!');
    }).catch(() => {
      // Fallback: show in textarea
      setJsonImportText(exportData);
      setShowJsonImport(true);
      setEventStatus('Events JSON shown below. Copy manually.');
    });
  };

  const handleJsonAutoFill = () => {
    if (!form.id) {
      setJsonImportErrors(['Save the industry first.']);
      return;
    }

    try {
      const parsed = JSON.parse(jsonImportText);
      const errors = validateAndGetErrors(parsed, 'Event');
      if (errors.length > 0) {
        setJsonImportErrors(errors);
        return;
      }

      if (!validateGameEvent(parsed)) {
        setJsonImportErrors(['Validation failed despite passing error checks. This is a bug.']);
        return;
      }

      // Auto-fill the form
      setEventForm({
        id: parsed.id,
        title: parsed.title,
        category: parsed.category,
        summary: parsed.summary
      });
      setEventChoices(parsed.choices);
      setSelectedChoiceId('');
      setIsCreatingChoice(false);
      setChoiceForm({ id: '', label: '', description: '', cost: '', setsFlag: '' });
      setSelectedConsequenceId('');
      setIsCreatingConsequence(false);
      setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [] });
      setIsCreatingEvent(true);
      setSelectedEventId('');

      setJsonImportErrors([]);
      setShowJsonImport(false);
      setJsonImportText('');
      setEventStatus('Event form auto-filled. Make any changes and save.');
    } catch (error) {
      setJsonImportErrors([`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown parsing error'}`]);
    }
  };

  const selectRole = (role: StaffRoleConfig) => {
    setIsCreatingRole(false);
    setSelectedRoleId(role.id);
    // Convert effects array to form format (handle both old and new formats)
    const effects = role.effects || [];
    // If no effects but old format properties exist, convert them
    if (effects.length === 0 && ('serviceSpeed' in role || 'workloadReduction' in role)) {
      const legacyEffects: Array<{ metric: GameMetric; type: EffectType; value: string }> = [];
      if ('serviceSpeed' in role && (role as any).serviceSpeed > 0) {
        legacyEffects.push({ metric: GameMetric.ServiceSpeedMultiplier, type: EffectType.Percent, value: String((role as any).serviceSpeed) });
      }
      if ('workloadReduction' in role && (role as any).workloadReduction > 0) {
        legacyEffects.push({ metric: GameMetric.FounderWorkingHours, type: EffectType.Add, value: String(-(role as any).workloadReduction) });
      }
      setRoleForm({ id: role.id, name: role.name, salary: String(role.salary), effects: legacyEffects, emoji: role.emoji, setsFlag: role.setsFlag, requirements: role.requirements || [] });
    } else {
      setRoleForm({ id: role.id, name: role.name, salary: String(role.salary), effects: effects.map(e => ({ metric: e.metric, type: e.type, value: String(e.value) })), emoji: role.emoji, setsFlag: role.setsFlag, requirements: role.requirements || [] });
    }
    setStaffStatus(null);
  };

  const handleCreateRole = () => {
    if (!form.id) {
      setStaffStatus('Save the industry first.');
      return;
    }
    setIsCreatingRole(true);
    setSelectedRoleId('');
    setRoleForm({ id: '', name: '', salary: '0', effects: [], emoji: '🧑‍💼', setsFlag: '', requirements: [] });
    setStaffStatus(null);
  };

  const handleSaveRole = async () => {
    if (!form.id) {
      setStaffStatus('Save the industry first.');
      return;
    }
    const id = roleForm.id.trim();
    const name = roleForm.name.trim();
    const salary = Number(roleForm.salary);

    if (!id || !name) {
      setStaffStatus('Role id and name are required.');
      return;
    }
    if (!Number.isFinite(salary) || salary < 0) {
      setStaffStatus('Salary must be non-negative.');
      return;
    }

    // Validate effects from form
    const effects: UpgradeEffect[] = [];
    for (const effect of roleForm.effects) {
      const value = Number(effect.value);
      if (!Number.isFinite(value)) {
        setStaffStatus(`Effect value must be a valid number: ${effect.value}`);
        return;
      }
      effects.push({
        metric: effect.metric,
        type: effect.type,
        value: value,
      });
    }
    setRoleSaving(true);
    const setsFlag = roleForm.setsFlag?.trim() || undefined;
    const requirements = roleForm.requirements;
    const result = await upsertStaffRole({ id, industryId: form.id, name, salary, effects, emoji: roleForm.emoji.trim() || undefined, setsFlag, requirements });
    setRoleSaving(false);
    if (!result.success) {
      setStaffStatus(result.message ?? 'Failed to save role.');
      return;
    }
    setStaffRoles((prev) => {
      const exists = prev.some((r) => r.id === id);
      const next = exists ? prev.map((r) => (r.id === id ? { id, name, salary, effects, emoji: roleForm.emoji.trim() || '🧑‍💼', setsFlag, requirements } : r)) : [...prev, { id, name, salary, effects, emoji: roleForm.emoji.trim() || '🧑‍💼', setsFlag, requirements }];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    setStaffStatus('Role saved.');
    setIsCreatingRole(false);
    setSelectedRoleId(id);
  };

  const handleDeleteRole = async () => {
    if (isCreatingRole || !selectedRoleId) return;
    const hasPresets = staffPresets.some((p) => p.roleId === selectedRoleId);
    if (hasPresets) {
      setStaffStatus('Delete presets using this role first.');
      return;
    }
    if (!window.confirm(`Delete role "${roleForm.name || selectedRoleId}"?`)) return;
    setRoleDeleting(true);
    const result = await deleteStaffRole(selectedRoleId);
    setRoleDeleting(false);
    if (!result.success) {
      setStaffStatus(result.message ?? 'Failed to delete role.');
      return;
    }
    setStaffRoles((prev) => prev.filter((r) => r.id !== selectedRoleId));
    setSelectedRoleId('');
    setRoleForm({ id: '', name: '', salary: '0', effects: [], emoji: '🧑‍💼', setsFlag: '', requirements: [] });
    setStaffStatus('Role deleted.');
  };

  const selectPreset = (preset: StaffPreset) => {
    setIsCreatingPreset(false);
    setSelectedPresetId(preset.id);
    setPresetForm({ id: preset.id, roleId: preset.roleId, name: preset.name, salary: preset.salary !== undefined ? String(preset.salary) : undefined, serviceSpeed: preset.serviceSpeed !== undefined ? String(preset.serviceSpeed) : undefined, emoji: preset.emoji });
    setStaffStatus(null);
  };

  const handleCreatePreset = () => {
    if (!form.id) {
      setStaffStatus('Save the industry first.');
      return;
    }
    setIsCreatingPreset(true);
    setSelectedPresetId('');
    setPresetForm({ id: '', roleId: staffRoles[0]?.id ?? '', name: '' });
    setStaffStatus(null);
  };

  const handleSavePreset = async () => {
    if (!form.id) {
      setStaffStatus('Save the industry first.');
      return;
    }
    const id = presetForm.id.trim();
    const roleId = presetForm.roleId.trim();
    const name = presetForm.name.trim();
    if (!id || !roleId) {
      setStaffStatus('Preset id and role are required.');
      return;
    }
    const salary = presetForm.salary !== undefined && presetForm.salary !== '' ? Number(presetForm.salary) : undefined;
    const serviceSpeed = presetForm.serviceSpeed !== undefined && presetForm.serviceSpeed !== '' ? Number(presetForm.serviceSpeed) : undefined;
    if ((salary !== undefined && (!Number.isFinite(salary) || salary < 0)) || (serviceSpeed !== undefined && (!Number.isFinite(serviceSpeed) || serviceSpeed < 0))) {
      setStaffStatus('Overrides must be non-negative numbers.');
      return;
    }
    setPresetSaving(true);
    const result = await upsertStaffPreset({ id, industryId: form.id, roleId, name: name || undefined, salary, serviceSpeed, emoji: presetForm.emoji?.trim() || undefined });
    setPresetSaving(false);
    if (!result.success) {
      setStaffStatus(result.message ?? 'Failed to save preset.');
      return;
    }
    setStaffPresets((prev) => {
      const exists = prev.some((p) => p.id === id);
      const nextItem: StaffPreset = { id, roleId, name: name || 'Staff' };
      if (salary !== undefined) (nextItem as any).salary = salary;
      if (serviceSpeed !== undefined) (nextItem as any).serviceSpeed = serviceSpeed;
      if (presetForm.emoji?.trim()) (nextItem as any).emoji = presetForm.emoji.trim();
      const next = exists ? prev.map((p) => (p.id === id ? nextItem : p)) : [...prev, nextItem];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    setStaffStatus('Preset saved.');
    setIsCreatingPreset(false);
    setSelectedPresetId(id);
  };

  const handleDeletePreset = async () => {
    if (isCreatingPreset || !selectedPresetId) return;
    if (!window.confirm(`Delete preset "${presetForm.name || selectedPresetId}"?`)) return;
    setPresetDeleting(true);
    const result = await deleteStaffPreset(selectedPresetId);
    setPresetDeleting(false);
    if (!result.success) {
      setStaffStatus(result.message ?? 'Failed to delete preset.');
      return;
    }
    setStaffPresets((prev) => prev.filter((p) => p.id !== selectedPresetId));
    setSelectedPresetId('');
    setPresetForm({ id: '', roleId: staffRoles[0]?.id ?? '', name: '' });
    setStaffStatus('Preset deleted.');
  };

  const handleGlobalSave = async () => {
    setGlobalStatus(null);
    let businessMetrics: BusinessMetrics = metrics;
    let businessStats: BusinessStats = { ...stats };
    let movement: any;

    // Normalize Business Stats derived inputs
    const parsedEventSeconds = eventSecondsInput
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n >= 0);
    businessStats.eventTriggerSeconds = parsedEventSeconds;
    try {
      movement = JSON.parse(movementJSON);
    } catch (e) {
      setGlobalStatus('Invalid JSON in Movement.');
      return;
    }

    setGlobalSaving(true);
    const result = await upsertGlobalSimulationConfig({
      businessMetrics,
      businessStats,
      movement,
      winCondition,
      loseCondition,
    });
    setGlobalSaving(false);

    if (!result.success) {
      setGlobalStatus(result.message ?? 'Failed to save global config.');
      return;
    }

    setGlobalStatus('Global config saved.');
  };

  const handleSelect = (industryId: string) => {
    const selected = industries.find((item) => item.id === industryId);
    if (!selected) {
      return;
    }

    selectIndustry(selected);
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setForm({ ...emptyForm, icon: '🏢' });
    setServices([]);
    setServiceForm(emptyServiceForm);
    setSelectedServiceId('');
    setIsCreatingService(false);
    setStatusMessage(null);
    setServiceStatus(null);
  };

  const handleSave = async () => {
    const trimmedName = form.name.trim();
    let trimmedId = form.id.trim();

    if (!form.name.trim()) {
      setStatusMessage('Name is required.');
      return;
    }

    if (!trimmedId) {
      trimmedId = slugify(trimmedName);
      if (!trimmedId) {
        setStatusMessage('Industry ID is required.');
        return;
      }
    }

    setIsSaving(true);
    setStatusMessage(null);

    const payload: Industry = {
      id: trimmedId,
      name: trimmedName,
      icon: form.icon.trim() || '🏢',
      description: form.description.trim(),
      image: form.image.trim() || undefined,
      mapImage: form.mapImage.trim() || undefined,
      isAvailable: form.isAvailable,
    };

    const result = await upsertIndustryToSupabase(payload);
    setIsSaving(false);

    if (!result.success || !result.data) {
      setStatusMessage(result.message ?? 'Failed to save industry.');
      return;
    }

    setIndustries((prev) => {
      const exists = prev.some((item) => item.id === result.data!.id);
      const next = exists
        ? prev.map((item) => (item.id === result.data!.id ? result.data! : item))
        : [...prev, result.data!];

      return next.sort((a, b) => a.name.localeCompare(b.name));
    });

    selectIndustry(result.data);
    setStatusMessage('Industry saved successfully.');
  };

  const handleDelete = async () => {
    if (isCreating || !form.id) {
      return;
    }

    if (!window.confirm(`Delete industry "${form.name || form.id}"? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    setStatusMessage(null);

    const result = await deleteIndustryFromSupabase(form.id);
    setIsDeleting(false);

    if (!result.success) {
      setStatusMessage(result.message ?? 'Failed to delete industry.');
      return;
    }

    setIndustries((prev) => prev.filter((item) => item.id !== form.id));
    setForm(emptyForm);
    setIsCreating(false);
    setServices([]);
    setServiceForm(emptyServiceForm);
    setSelectedServiceId('');
    setIsCreatingService(false);
    setStatusMessage('Industry deleted.');
  };

  const handleCreateService = () => {
    if (!form.id) {
      setServiceStatus('Save the industry before adding services.');
      return;
    }

    setIsCreatingService(true);
    setSelectedServiceId('');
    setServiceForm({ ...emptyServiceForm, requirements: [] });
    setServiceStatus(null);
  };

  const handleServiceSave = async () => {
    if (!form.id) {
      setServiceStatus('Save the industry before adding services.');
      return;
    }

    const name = serviceForm.name.trim();
    let serviceId = serviceForm.id.trim();

    if (!name) {
      setServiceStatus('Service name is required.');
      return;
    }

    if (!serviceId) {
      serviceId = slugify(`${form.id}-${name}`);
    }

    const durationValue = Number(serviceForm.duration);
    const priceValue = Number(serviceForm.price);
    const weightageValue = serviceForm.weightage ? Number(serviceForm.weightage) : undefined;

    if (!Number.isFinite(durationValue) || durationValue < 0) {
      setServiceStatus('Duration must be a non-negative number.');
      return;
    }

    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setServiceStatus('Price must be a non-negative number.');
      return;
    }

    if (weightageValue !== undefined && (!Number.isFinite(weightageValue) || weightageValue <= 0)) {
      setServiceStatus('Weightage must be a positive number.');
      return;
    }

    // Validate pricing category
    const pricingCategory = serviceForm.pricingCategory?.trim();
    const validCategory = pricingCategory && ['low', 'mid', 'high'].includes(pricingCategory.toLowerCase())
      ? pricingCategory.toLowerCase() as 'low' | 'mid' | 'high'
      : undefined;

    setServiceSaving(true);
    setServiceStatus(null);

    const payload: IndustryServiceDefinition = {
      id: serviceId,
      industryId: form.id,
      name,
      duration: durationValue,
      price: priceValue,
      requirements: serviceForm.requirements || undefined,
      pricingCategory: validCategory,
      weightage: weightageValue,
    };

    const result = await upsertServiceForIndustry(payload);
    setServiceSaving(false);

    if (!result.success || !result.data) {
      setServiceStatus(result.message ?? 'Failed to save service.');
      return;
    }

    setServices((prev) => {
      const exists = prev.some((item) => item.id === result.data!.id);
      const next = exists
        ? prev.map((item) => (item.id === result.data!.id ? result.data! : item))
        : [...prev, result.data!];

      return next.sort((a, b) => a.name.localeCompare(b.name));
    });

    selectService(result.data);
    setServiceStatus('Service saved.');
  };

  const handleServiceDelete = async () => {
    if (isCreatingService || !serviceForm.id) {
      return;
    }

    if (!window.confirm(`Delete service "${serviceForm.name || serviceForm.id}"?`)) {
      return;
    }

    setServiceDeleting(true);
    setServiceStatus(null);

    const result = await deleteServiceById(serviceForm.id);
    setServiceDeleting(false);

    if (!result.success) {
      setServiceStatus(result.message ?? 'Failed to delete service.');
      return;
    }

    setServices((prev) => prev.filter((item) => item.id !== serviceForm.id));
    setServiceForm({ ...emptyServiceForm, requirements: [] });
    setSelectedServiceId('');
    setIsCreatingService(false);
    setServiceStatus('Service deleted.');
  };

  // Tab configuration
  const tabs = [
    { id: 'industries', label: 'Industries', icon: '🏢' },
    { id: 'flags', label: 'Flags', icon: '🏁' },
    { id: 'conditions', label: 'Conditions', icon: '📊' },
    { id: 'events', label: 'Events', icon: '📅' },
    { id: 'marketing', label: 'Marketing', icon: '📢' },
    { id: 'upgrades', label: 'Upgrades', icon: '⚙️' },
    { id: 'services', label: 'Services', icon: '🛎️' },
    { id: 'staff', label: 'Staff', icon: '👥' },
    { id: 'global', label: 'Global Config', icon: '⚡' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-sm text-slate-400">Edit base game content directly</p>
        </header>

        {/* Global Industry Selector */}
        {activeTab !== 'industries' && activeTab !== 'global' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-200">Select Industry</h3>
                {form.id && (
                  <span className="text-sm text-slate-400">
                    Selected: <span className="text-slate-200 font-medium">{form.icon} {form.name}</span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {isLoading ? (
                  <div className="text-sm text-slate-400">Loading industries...</div>
                ) : error ? (
                  <div className="text-sm text-rose-400">{error}</div>
                ) : industries.length === 0 ? (
                  <div className="text-sm text-slate-400">No industries available. Create one in the Industries tab.</div>
                ) : (
                  industries.map((industry) => (
                    <button
                      key={industry.id}
                      onClick={() => handleSelect(industry.id)}
                      className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                        form.id === industry.id
                          ? 'border-blue-400 bg-blue-500/10 text-blue-200'
                          : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                      }`}
                    >
                      {industry.icon} {industry.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl">
          <nav className="flex flex-wrap border-b border-slate-800">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Global Config Section */}
        {activeTab === 'global' && (
          <GlobalConfigTab
            globalLoading={globalLoading}
            globalStatus={globalStatus}
            globalSaving={globalSaving}
            metrics={metrics}
            stats={stats}
            eventSecondsInput={eventSecondsInput}
            movementJSON={movementJSON}
            winCondition={winCondition}
            loseCondition={loseCondition}
            onUpdateMetrics={(updates) => setMetrics((p) => ({ ...p, ...updates }))}
            onUpdateStats={(updates) => setStats((p) => ({ ...p, ...updates }))}
            onUpdateEventSeconds={setEventSecondsInput}
            onUpdateMovementJSON={setMovementJSON}
            onUpdateWinCondition={(updates) => setWinCondition((p) => ({ ...p, ...updates }))}
            onUpdateLoseCondition={(updates) => setLoseCondition((p) => ({ ...p, ...updates }))}
            onSave={handleGlobalSave}
          />
        )}

        {/* Old Global Config Section - REMOVED */}
        {false && activeTab === 'global-old' && (
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
                      onChange={(e) => setMetrics((prev) => ({ ...prev, startingCash: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Monthly Expenses</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      value={metrics.monthlyExpenses}
                      onChange={(e) => setMetrics((prev) => ({ ...prev, monthlyExpenses: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Starting Reputation</label>
                    <input
                      type="number"
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      value={metrics.startingReputation}
                      onChange={(e) => setMetrics((prev) => ({ ...prev, startingReputation: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Founder Work Hours (per month)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      value={metrics.founderWorkHours}
                      onChange={(e) => setMetrics((prev) => ({ ...prev, founderWorkHours: Number(e.target.value) }))}
                    />
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
                      onChange={(e) => setStats((p) => ({ ...p, ticksPerSecond: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Month Duration (sec)</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      value={stats.monthDurationSeconds}
                      onChange={(e) => setStats((p) => ({ ...p, monthDurationSeconds: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Customer Spawn Interval (sec)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      value={stats.customerSpawnIntervalSeconds}
                      onChange={(e) => setStats((p) => ({ ...p, customerSpawnIntervalSeconds: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Customer Patience (sec)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      value={stats.customerPatienceSeconds}
                      onChange={(e) => setStats((p) => ({ ...p, customerPatienceSeconds: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Leaving Angry Duration (ticks)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      value={stats.leavingAngryDurationTicks}
                      onChange={(e) => setStats((p) => ({ ...p, leavingAngryDurationTicks: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Treatment Rooms</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      value={stats.treatmentRooms}
                      onChange={(e) => setStats((p) => ({ ...p, treatmentRooms: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Rep Gain per Happy</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      value={stats.reputationGainPerHappyCustomer}
                      onChange={(e) => setStats((p) => ({ ...p, reputationGainPerHappyCustomer: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Rep Loss per Angry</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      value={stats.reputationLossPerAngryCustomer}
                      onChange={(e) => setStats((p) => ({ ...p, reputationLossPerAngryCustomer: Number(e.target.value) }))}
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
                      onChange={(e) => setStats((p) => ({ ...p, baseHappyProbability: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1">Event Trigger Seconds (comma-separated)</label>
                    <input
                      type="text"
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      value={eventSecondsInput}
                      onChange={(e) => setEventSecondsInput(e.target.value)}
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
                      onChange={(e) => setStats((p) => ({ ...p, serviceRevenueMultiplier: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Service Revenue Scale</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      value={stats.serviceRevenueScale}
                      onChange={(e) => setStats((p) => ({ ...p, serviceRevenueScale: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Spawn Position X</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      value={stats.customerSpawnPosition.x}
                      onChange={(e) => setStats((p) => ({ ...p, customerSpawnPosition: { ...p.customerSpawnPosition, x: Number(e.target.value) } }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Spawn Position Y</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      value={stats.customerSpawnPosition.y}
                      onChange={(e) => setStats((p) => ({ ...p, customerSpawnPosition: { ...p.customerSpawnPosition, y: Number(e.target.value) } }))}
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
                  onChange={(e) => setMovementJSON(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleGlobalSave}
                disabled={globalSaving}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  globalSaving ? 'bg-amber-900 text-amber-200 cursor-wait' : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                {globalSaving ? 'Saving…' : 'Save Global Config'}
              </button>
            </div>
          </div>
        </section>
        )}

        {/* Industries Section */}
        {activeTab === 'industries' && (
          <IndustriesTab
            industries={industries}
            isLoading={isLoading}
            error={error}
            form={form}
            isSaving={isSaving}
            isDeleting={isDeleting}
            statusMessage={statusMessage}
            isCreating={isCreating}
            onSelectIndustry={(industryId) => handleSelect(industryId)}
            onCreateNew={handleCreateNew}
            onSave={handleSave}
            onDelete={handleDelete}
            onReset={() => {
              if (!isCreating) {
                const current = industries.find((item) => item.id === form.id);
                if (current) {
                  setForm({
                    id: current.id,
                    name: current.name,
                    icon: current.icon,
                    description: current.description,
                    image: current.image ?? '',
                    mapImage: current.mapImage ?? '',
                    isAvailable: current.isAvailable ?? true,
                  });
                }
              } else {
                setForm({ id: '', name: '', icon: '', description: '', image: '', mapImage: '', isAvailable: true });
                setIsCreating(false);
              }
              setStatusMessage(null);
            }}
            onUpdateForm={(updates) => setForm((p) => ({ ...p, ...updates }))}
          />
        )}

        {/* Old Industries Section - REMOVED */}
        {false && activeTab === 'industries-old' && (
        <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-2xl font-semibold">Industries</h2>
            <p className="text-sm text-slate-400 mt-1">
              Select an industry and edit its basic metadata. Changes persist immediately to Supabase.
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={handleCreateNew}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-sky-500 text-sky-200 hover:bg-sky-500/10"
              >
                + New Industry
              </button>
              {statusMessage && (
                <span className="text-sm text-slate-300">{statusMessage}</span>
              )}
            </div>

            {isLoading ? (
              <div className="text-sm text-slate-400">Loading industries...</div>
            ) : error ? (
              <div className="text-sm text-rose-400">{error}</div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {industries.map((industry) => (
                    <button
                      key={industry.id}
                      onClick={() => handleSelect(industry.id)}
                      className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                        form.id === industry.id
                          ? 'border-sky-400 bg-sky-500/10 text-sky-200'
                          : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                      }`}
                    >
                      {industry.icon} {industry.name}
                    </button>
                  ))}
                </div>

                {form.id || isCreating ? (
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-300 mb-1">
                        Industry ID
                      </label>
                      <input
                        value={form.id}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, id: event.target.value }))
                        }
                        disabled={!isCreating}
                        className={`w-full rounded-lg border px-3 py-2 text-slate-200 ${
                          isCreating
                            ? 'bg-slate-900 border-slate-600'
                            : 'bg-slate-800 border-slate-700 cursor-not-allowed'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Name</label>
                      <input
                        value={form.name}
                        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                        onBlur={() => {
                          if (isCreating && !form.id && form.name.trim()) {
                            const base = slugify(form.name.trim());
                            const unique = makeUniqueId(base, new Set(industries.map((i) => i.id)));
                            setForm((prev) => ({ ...prev, id: unique }));
                          }
                        }}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Icon</label>
                      <input
                        value={form.icon}
                        onChange={(event) => setForm((prev) => ({ ...prev, icon: event.target.value }))}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-300 mb-1">
                        Short Description
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                        rows={3}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Image URL</label>
                      <input
                        value={form.image}
                        onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.value }))}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Map Image URL</label>
                      <input
                        value={form.mapImage}
                        onChange={(event) => setForm((prev) => ({ ...prev, mapImage: event.target.value }))}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>

                    <div className="md:col-span-2 flex items-center gap-2">
                      <input
                        id="industry-available"
                        type="checkbox"
                        checked={form.isAvailable}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, isAvailable: event.target.checked }))
                        }
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-400"
                      />
                      <label htmlFor="industry-available" className="text-sm font-semibold text-slate-300">
                        Available for selection
                      </label>
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={isSaving || isDeleting}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                            isSaving
                              ? 'bg-sky-900 text-sky-300 cursor-wait'
                              : 'bg-sky-600 hover:bg-sky-500 text-white'
                          }`}
                        >
                          {isSaving ? 'Saving…' : 'Save Changes'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (!isCreating) {
                              const current = industries.find((item) => item.id === form.id);
                              if (current) {
                                setForm({
                                  id: current.id,
                                  name: current.name,
                                  icon: current.icon,
                                  description: current.description,
                                  image: current.image ?? '',
                                  mapImage: current.mapImage ?? '',
                                  isAvailable: current.isAvailable ?? true,
                                });
                              }
                            } else {
                              setForm(emptyForm);
                              setIsCreating(false);
                            }
                            setStatusMessage(null);
                          }}
                          disabled={isSaving || isDeleting}
                          className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                        >
                          {isCreating ? 'Cancel' : 'Reset'}
                        </button>

                        {!isCreating && (
                          <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting || isSaving}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                              isDeleting
                                ? 'bg-rose-900 text-rose-200 cursor-wait'
                                : 'bg-rose-600 hover:bg-rose-500 text-white'
                            }`}
                          >
                            {isDeleting ? 'Deleting…' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="text-sm text-slate-400">
                    Select an industry above to view its current details.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
        )}

        {/* Flags Section */}
        {activeTab === 'flags' && (
          <FlagsTab
            industryId={form.id}
            flags={flags}
            flagsLoading={flagsLoading}
            flagStatus={flagStatus}
            selectedFlagId={selectedFlagId}
            isCreatingFlag={isCreatingFlag}
            flagForm={flagForm}
            flagSaving={flagSaving}
            flagDeleting={flagDeleting}
            onSelectFlag={(flag) => selectFlag(flag)}
            onCreateFlag={handleCreateFlag}
            onSaveFlag={handleSaveFlag}
            onDeleteFlag={handleDeleteFlag}
            onReset={() => {
              if (selectedFlagId && !isCreatingFlag) {
                const existing = flags.find((f) => f.id === selectedFlagId);
                if (existing) selectFlag(existing);
              } else {
                setIsCreatingFlag(false);
                setSelectedFlagId('');
                setFlagForm({ id: '', name: '', description: '' });
              }
              setFlagStatus(null);
            }}
            onUpdateForm={(updates) => setFlagForm((p) => ({ ...p, ...updates }))}
          />
        )}

        {/* Conditions Section */}
        {activeTab === 'conditions' && (
          <ConditionsTab
            industryId={form.id}
            conditions={conditions}
            conditionsLoading={conditionsLoading}
            conditionsStatus={conditionsStatus}
            selectedConditionId={selectedConditionId}
            isCreatingCondition={isCreatingCondition}
            conditionForm={conditionForm}
            conditionSaving={conditionSaving}
            conditionDeleting={conditionDeleting}
            onSelectCondition={(condition) => selectCondition(condition)}
            onCreateCondition={handleCreateCondition}
            onSaveCondition={handleSaveCondition}
            onDeleteCondition={handleDeleteCondition}
            onReset={() => {
              if (selectedConditionId && !isCreatingCondition) {
                const existing = conditions.find((c) => c.id === selectedConditionId);
                if (existing) selectCondition(existing);
              } else {
                setIsCreatingCondition(false);
                setSelectedConditionId('');
                setConditionForm({
                  id: '',
                  name: '',
                  description: '',
                  metric: ConditionMetric.Cash,
                  operator: 'greater',
                  value: '0',
                });
              }
              setConditionsStatus(null);
            }}
            onUpdateForm={(updates) => setConditionForm((p) => ({ ...p, ...updates }))}
          />
        )}

        {/* Old Conditions Section - REMOVED */}
        {false && activeTab === 'conditions-old' && (
        <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-2xl font-semibold">Conditions</h2>
            <p className="text-sm text-slate-400 mt-1">Create metric-based conditions that can be checked by the game logic.</p>
          </div>
          <div className="p-6 space-y-6">
            {!form.id ? (
              <div className="text-sm text-slate-400">Select or create an industry first.</div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    {conditionsStatus && <span className="text-sm text-slate-300">{conditionsStatus}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateCondition}
                    disabled={conditionSaving || conditionDeleting}
                    className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + New Condition
                  </button>
                </div>

                {conditionsLoading ? (
                  <div className="text-sm text-slate-400">Loading conditions…</div>
                ) : conditions.length === 0 && !isCreatingCondition ? (
                  <div className="text-sm text-slate-400">No conditions configured yet.</div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {conditions.map((condition) => (
                        <button
                          key={condition.id}
                          onClick={() => selectCondition(condition)}
                          className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                            selectedConditionId === condition.id && !isCreatingCondition
                              ? 'border-slate-400 bg-slate-800 text-slate-100'
                              : 'border-slate-600 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {condition.name}
                        </button>
                      ))}
                      {isCreatingCondition && (
                        <button className="px-3 py-2 rounded-lg border border-slate-400 bg-slate-800 text-slate-100 text-sm font-medium">
                          New Condition
                        </button>
                      )}
                    </div>

                    {(selectedConditionId || isCreatingCondition) && (
                      <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-1">Condition ID (auto-generated)</label>
                          <input
                            value={conditionForm.id}
                            disabled={true}
                            className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-400 cursor-not-allowed"
                          />
                          <p className="text-xs text-slate-500 mt-1">ID will be auto-generated from name</p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-1">Name</label>
                          <input
                            value={conditionForm.name}
                            onChange={(e) => setConditionForm((p) => ({ ...p, name: e.target.value }))}
                            onBlur={() => {
                              if (isCreatingCondition && conditionForm.name.trim()) {
                                const base = slugify(conditionForm.name.trim());
                                const unique = makeUniqueId(base, new Set(conditions.map((c) => c.id)));
                                setConditionForm((prev) => ({ ...prev, id: unique }));
                              }
                            }}
                            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-slate-300 mb-1">Description</label>
                          <textarea
                            rows={2}
                            value={conditionForm.description}
                            onChange={(e) => setConditionForm((p) => ({ ...p, description: e.target.value }))}
                            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-1">Metric</label>
                          <select
                            value={conditionForm.metric}
                            onChange={(e) => setConditionForm((p) => ({ ...p, metric: e.target.value as ConditionMetric }))}
                            className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                          >
                            <option value={ConditionMetric.Cash}>Cash</option>
                            <option value={ConditionMetric.Reputation}>Reputation</option>
                            <option value={ConditionMetric.Expenses}>Monthly Expenses</option>
                            <option value={ConditionMetric.GameTime}>Game Time (seconds)</option>
                            <option value={ConditionMetric.FounderWorkingHours}>Founder Working Hours</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-1">Operator</label>
                          <select
                            value={conditionForm.operator}
                            onChange={(e) => setConditionForm((p) => ({ ...p, operator: e.target.value as ConditionOperator }))}
                            className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                          >
                            <option value="greater">&gt; Greater than</option>
                            <option value="less">&lt; Less than</option>
                            <option value="equals">= Equals</option>
                            <option value="greater_equal">≥ Greater or equal</option>
                            <option value="less_equal">≤ Less or equal</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-1">Value</label>
                          <input
                            type="number"
                            step="0.01"
                            value={conditionForm.value}
                            onChange={(e) => setConditionForm((p) => ({ ...p, value: e.target.value }))}
                            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                          />
                        </div>

                        <div className="md:col-span-2 flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={handleSaveCondition}
                            disabled={conditionSaving || conditionDeleting}
                            className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {conditionSaving ? 'Saving…' : 'Save Condition'}
                          </button>
                          {selectedConditionId && !isCreatingCondition && (
                            <button
                              type="button"
                              onClick={handleDeleteCondition}
                              disabled={conditionSaving || conditionDeleting}
                              className="px-4 py-2 rounded-lg text-sm font-semibold border border-red-600 text-red-400 hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {conditionDeleting ? 'Deleting…' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
        )}

        {/* Events Section */}
        {activeTab === 'events' && (
        <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-2xl font-semibold">Events</h2>
            <p className="text-sm text-slate-400 mt-1">Create events with title, summary, and category. Choices and consequences coming next.</p>
          </div>
          <div className="p-6 space-y-6">
            {!form.id ? (
              <div className="text-sm text-slate-400">Select or create an industry first.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCreateEvent}
                      className="px-3 py-2 text-sm font-medium rounded-lg border border-fuchsia-500 text-fuchsia-200 hover:bg-fuchsia-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isCreating || !form.id}
                    >
                      + New Event
                    </button>
                    <button
                      onClick={() => setShowJsonImport(true)}
                      className="px-3 py-2 text-sm font-medium rounded-lg border border-blue-500 text-blue-200 hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!form.id}
                      title="Import events from JSON"
                    >
                      📋 Import JSON
                    </button>
                    <button
                      onClick={handleJsonExport}
                      className="px-3 py-2 text-sm font-medium rounded-lg border border-green-500 text-green-200 hover:bg-green-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={events.length === 0}
                      title="Export events to JSON"
                    >
                      📤 Export JSON
                    </button>
                  </div>
                  {eventStatus && <span className="text-sm text-slate-300">{eventStatus}</span>}
                </div>

                {eventsLoading ? (
                  <div className="text-sm text-slate-400">Loading events…</div>
                ) : events.length === 0 && !isCreatingEvent ? (
                  <div className="text-sm text-slate-400">No events configured yet.</div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {events.map((ev) => (
                        <button
                          key={ev.id}
                          onClick={() => selectEvent(ev)}
                          className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                            selectedEventId === ev.id && !isCreatingEvent
                              ? 'border-fuchsia-400 bg-fuchsia-500/10 text-fuchsia-200'
                              : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                          }`}
                        >
                          {ev.title}
                        </button>
                      ))}
                    </div>

                    {(selectedEventId || isCreatingEvent) && (
                      <div>
                      <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-1">Event ID</label>
                          <input
                            value={eventForm.id}
                            onChange={(e) => setEventForm((p) => ({ ...p, id: e.target.value }))}
                            disabled={!isCreatingEvent && !!selectedEventId}
                            className={`w-full rounded-lg border px-3 py-2 text-slate-200 ${
                              isCreatingEvent || !selectedEventId ? 'bg-slate-900 border-slate-600' : 'bg-slate-800 border-slate-700 cursor-not-allowed'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-1">Category</label>
                          <select
                            value={eventForm.category}
                            onChange={(e) => setEventForm((p) => ({ ...p, category: e.target.value as 'opportunity' | 'risk' }))}
                            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                          >
                            <option value="opportunity">Opportunity</option>
                            <option value="risk">Risk</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-slate-300 mb-1">Title</label>
                          <input
                            value={eventForm.title}
                            onChange={(e) => {
                              const nextTitle = e.target.value;
                              setEventForm((p) => ({ ...p, title: nextTitle }));
                            }}
                            onBlur={() => {
                              setEventForm((p) => {
                                if (!p.id && p.title.trim()) {
                                  const nextId = makeUniqueId(slugify(p.title.trim()), new Set(events.map((ev) => ev.id)));
                                  return { ...p, id: nextId };
                                }
                                return p;
                              });
                            }}
                            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-slate-300 mb-1">Summary</label>
                          <textarea
                            rows={3}
                            value={eventForm.summary}
                            onChange={(e) => setEventForm((p) => ({ ...p, summary: e.target.value }))}
                            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                          />
                        </div>
                        <div className="md:col-span-2 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={handleSaveEvent}
                            disabled={eventSaving || eventDeleting}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                              eventSaving ? 'bg-fuchsia-900 text-fuchsia-200 cursor-wait' : 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white'
                            }`}
                          >
                            {eventSaving ? 'Saving…' : 'Save Event'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedEventId && !isCreatingEvent) {
                                const existing = events.find((e) => e.id === selectedEventId);
                                if (existing) selectEvent(existing);
                              } else {
                                setIsCreatingEvent(false);
                                setSelectedEventId('');
                                setEventForm({ id: '', title: '', category: 'opportunity', summary: '' });
                                setEventChoices([]);
                              }
                              setEventStatus(null);
                            }}
                            disabled={eventSaving || eventDeleting}
                            className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                          >
                            {isCreatingEvent ? 'Cancel' : 'Reset'}
                          </button>
                          {!isCreatingEvent && selectedEventId && (
                            <button
                              type="button"
                              onClick={handleDeleteEvent}
                              disabled={eventDeleting || eventSaving}
                              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                eventDeleting ? 'bg-rose-900 text-rose-200 cursor-wait' : 'bg-rose-600 hover:bg-rose-500 text-white'
                              }`}
                            >
                              {eventDeleting ? 'Deleting…' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </form>

                      <div className="pt-4 mt-4 border-t border-slate-800">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-fuchsia-300">Choices</h3>
                            <button
                              type="button"
                              onClick={handleCreateChoice}
                              className="px-3 py-2 text-sm font-medium rounded-lg border border-fuchsia-500 text-fuchsia-200 hover:bg-fuchsia-500/10"
                            >
                              + Add Choice
                            </button>
                          </div>
                          {eventChoices.length === 0 && !isCreatingChoice ? (
                            <div className="text-sm text-slate-400">No choices added yet.</div>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex flex-wrap gap-2">
                                {eventChoices.map((ch) => (
                                  <button
                                    key={ch.id}
                                    type="button"
                                    onClick={() => selectChoice(ch)}
                                    className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                                      selectedChoiceId === ch.id && !isCreatingChoice
                                        ? 'border-fuchsia-400 bg-fuchsia-500/10 text-fuchsia-200'
                                        : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                                    }`}
                                  >
                                    {ch.label}
                                  </button>
                                ))}
                              </div>

                              {(selectedChoiceId || isCreatingChoice) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                  <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-1">Choice ID</label>
                                    <input
                                      value={choiceForm.id}
                                      onChange={(e) => setChoiceForm((p) => ({ ...p, id: e.target.value }))}
                                      disabled={!isCreatingChoice && !!selectedChoiceId}
                                      className={`w-full rounded-lg border px-3 py-2 text-slate-200 ${
                                        isCreatingChoice || !selectedChoiceId ? 'bg-slate-900 border-slate-600' : 'bg-slate-800 border-slate-700 cursor-not-allowed'
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-1">Label</label>
                                    <input
                                      value={choiceForm.label}
                                      onChange={(e) => {
                                        const nextLabel = e.target.value;
                                        setChoiceForm((p) => ({ ...p, label: nextLabel }));
                                      }}
                                      onBlur={() => {
                                        setChoiceForm((p) => {
                                          if (!p.id && p.label.trim()) {
                                            const nextId = makeUniqueId(slugify(p.label.trim()), new Set(eventChoices.map((c) => c.id)));
                                            return { ...p, id: nextId };
                                          }
                                          return p;
                                        });
                                      }}
                                      className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-300 mb-1">Description (optional)</label>
                                    <textarea
                                      rows={2}
                                      value={choiceForm.description}
                                      onChange={(e) => setChoiceForm((p) => ({ ...p, description: e.target.value }))}
                                      className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-1">Cost (optional)</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={choiceForm.cost}
                                      onChange={(e) => setChoiceForm((p) => ({ ...p, cost: e.target.value }))}
                                      className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-1">Sets Flag (optional)</label>
                                    <select
                                      value={choiceForm.setsFlag || ''}
                                      onChange={(e) => setChoiceForm((p) => ({ ...p, setsFlag: e.target.value }))}
                                      disabled={flagsLoading}
                                      className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200 disabled:opacity-50"
                                    >
                                      <option value="">
                                        {flagsLoading ? 'Loading flags...' : 'None'}
                                      </option>
                                      {!flagsLoading && flags.map((flag) => (
                                        <option key={flag.id} value={flag.id}>
                                          {flag.name}
                                        </option>
                                      ))}
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">Flag to set when this choice is selected</p>
                                  </div>
                                  <div className="md:col-span-2 flex flex-wrap gap-3">
                                    <button
                                      type="button"
                                      onClick={handleSaveChoice}
                                      className="px-4 py-2 rounded-lg text-sm font-semibold transition bg-fuchsia-600 hover:bg-fuchsia-500 text-white"
                                    >
                                      Save Choice
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (selectedChoiceId && !isCreatingChoice) {
                                          const existing = eventChoices.find((c) => c.id === selectedChoiceId);
                                          if (existing) selectChoice(existing);
                                        } else {
                                          setIsCreatingChoice(false);
                                          setSelectedChoiceId('');
                                          setChoiceForm({ id: '', label: '', description: '', cost: '', setsFlag: '' });
                                        }
                                        setEventStatus(null);
                                      }}
                                      className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                                    >
                                      {isCreatingChoice ? 'Cancel' : 'Reset'}
                                    </button>
                                    {!isCreatingChoice && selectedChoiceId && (
                                      <button
                                        type="button"
                                        onClick={handleDeleteChoice}
                                        className="px-4 py-2 rounded-lg text-sm font-semibold transition bg-rose-600 hover:bg-rose-500 text-white"
                                      >
                                        Delete Choice
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                              {(selectedChoiceId || isCreatingChoice) && (
                                <div className="mt-6">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-md font-semibold">Consequences</h4>
                                    <button
                                      type="button"
                                      onClick={handleCreateConsequence}
                                      className="px-3 py-2 text-sm font-medium rounded-lg border border-amber-500 text-amber-200 hover:bg-amber-500/10"
                                    >
                                      + Add Consequence
                                    </button>
                                  </div>
                                  {/* List of consequences */}
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {(() => {
                                      const current = eventChoices.find((c) => c.id === selectedChoiceId);
                                      return (current?.consequences ?? []).map((cs) => (
                                        <button
                                          key={cs.id}
                                          type="button"
                                          onClick={() => selectConsequence(cs)}
                                          className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                                            selectedConsequenceId === cs.id && !isCreatingConsequence
                                              ? 'border-amber-400 bg-amber-500/10 text-amber-200'
                                              : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                                          }`}
                                        >
                                          {cs.label || cs.id}
                                        </button>
                                      ));
                                    })()}
                                  </div>

                                  {(selectedConsequenceId || isCreatingConsequence) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-900/60 rounded-lg border border-slate-700">
                                      <div>
                                        <label className="block text-sm font-semibold text-slate-300 mb-1">Consequence ID</label>
                                        <input
                                          value={consequenceForm.id}
                                          onChange={(e) => setConsequenceForm((p) => ({ ...p, id: e.target.value }))}
                                          disabled={!isCreatingConsequence && !!selectedConsequenceId}
                                          className={`w-full rounded-lg border px-3 py-2 text-slate-200 ${
                                            isCreatingConsequence || !selectedConsequenceId ? 'bg-slate-900 border-slate-600' : 'bg-slate-800 border-slate-700 cursor-not-allowed'
                                          }`}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-semibold text-slate-300 mb-1">Weight</label>
                                        <input
                                          type="number"
                                          min="1"
                                          value={consequenceForm.weight}
                                          onChange={(e) => setConsequenceForm((p) => ({ ...p, weight: e.target.value }))}
                                          className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-semibold text-slate-300 mb-1">Label (optional)</label>
                                        <input
                                          value={consequenceForm.label}
                                          onChange={(e) => {
                                            const nextLabel = e.target.value;
                                            setConsequenceForm((p) => ({ ...p, label: nextLabel }));
                                          }}
                                          onBlur={() => {
                                            setConsequenceForm((p) => {
                                              if (!p.id && p.label.trim()) {
                                                const current = eventChoices.find((c) => c.id === selectedChoiceId);
                                                const existingIds = new Set((current?.consequences ?? []).map((cs) => cs.id));
                                                const nextId = makeUniqueId(slugify(p.label.trim()), existingIds);
                                                return { ...p, id: nextId };
                                              }
                                              return p;
                                            });
                                          }}
                                          className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                                        />
                                      </div>
                                      <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-slate-300 mb-1">Description (optional)</label>
                                        <textarea
                                          rows={2}
                                          value={consequenceForm.description}
                                          onChange={(e) => setConsequenceForm((p) => ({ ...p, description: e.target.value }))}
                                          className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200"
                                        />
                                      </div>

                                      {/* Effects editor */}
                                      <div className="md:col-span-2">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-sm font-semibold text-slate-300">Effects</span>
                                          <div className="flex gap-2 flex-wrap">
                                            <button
                                              type="button"
                                              onClick={() => setConsequenceForm((p) => ({ ...p, effects: [...p.effects, { type: 'cash', amount: '0', label: '' }] }))}
                                              className="px-2 py-1 text-xs rounded border border-emerald-500 text-emerald-200 hover:bg-emerald-500/10"
                                            >
                                              + Cash
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setConsequenceForm((p) => ({ ...p, effects: [...p.effects, { type: 'reputation', amount: '0' }] }))}
                                              className="px-2 py-1 text-xs rounded border border-emerald-500 text-emerald-200 hover:bg-emerald-500/10"
                                            >
                                              + Reputation
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setConsequenceForm((p) => ({ ...p, effects: [...p.effects, { type: 'dynamicCash', expression: 'expenses*1', label: '' }] }))}
                                              className="px-2 py-1 text-xs rounded border border-purple-500 text-purple-200 hover:bg-purple-500/10"
                                            >
                                              + Dynamic Cash
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setConsequenceForm((p) => ({ ...p, effects: [...p.effects, { type: 'metric', metric: METRIC_OPTIONS[0].value, effectType: EFFECT_TYPE_OPTIONS[0].value, value: '0', durationSeconds: '' }] }))}
                                              className="px-2 py-1 text-xs rounded border border-indigo-500 text-indigo-200 hover:bg-indigo-500/10"
                                            >
                                              + Metric Effect
                                            </button>
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          {consequenceForm.effects.map((ef, idx) => (
                                            <div key={idx} className={`grid gap-2 items-end ${ef.type === 'metric' ? 'grid-cols-1 sm:grid-cols-6' : ef.type === 'dynamicCash' ? 'grid-cols-1 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
                                              <div>
                                                <label className="block text-xs text-slate-400 mb-1">Type</label>
                                                <select
                                                  value={ef.type}
                                                  onChange={(e) => setConsequenceForm((p) => ({
                                                    ...p,
                                                    effects: p.effects.map((row, i) => i === idx ? (
                                                      e.target.value === 'cash' ? { type: 'cash' as const, amount: '0', label: '' } :
                                                      e.target.value === 'reputation' ? { type: 'reputation' as const, amount: '0' } :
                                                      e.target.value === 'dynamicCash' ? { type: 'dynamicCash' as const, expression: 'expenses*1', label: '' } :
                                                      { type: 'metric' as const, metric: METRIC_OPTIONS[0].value, effectType: EFFECT_TYPE_OPTIONS[0].value, value: '0', durationSeconds: '', priority: '' }
                                                    ) : row),
                                                  }))}
                                                  className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                >
                                                  <option value="cash">Cash</option>
                                                  <option value="reputation">Reputation</option>
                                                  <option value="dynamicCash">Dynamic Cash</option>
                                                  <option value="metric">Metric Effect</option>
                                                </select>
                                              </div>

                                              {ef.type === 'cash' || ef.type === 'reputation' ? (
                                                <>
                                                  <div>
                                                    <label className="block text-xs text-slate-400 mb-1">Amount</label>
                                                    <input
                                                      type="number"
                                                      value={ef.amount}
                                                      onChange={(e) => setConsequenceForm((p) => ({
                                                        ...p,
                                                        effects: p.effects.map((row, i) => i === idx ? { ...row, amount: e.target.value } : row),
                                                      }))}
                                                      className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                    />
                                                  </div>
                                                  {ef.type === 'cash' && (
                                                    <div>
                                                      <label className="block text-xs text-slate-400 mb-1">Label (optional)</label>
                                                      <input
                                                        value={ef.label ?? ''}
                                                        onChange={(e) => setConsequenceForm((p) => ({
                                                          ...p,
                                                          effects: p.effects.map((row, i) => i === idx ? { ...row, label: e.target.value } : row),
                                                        }))}
                                                        className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                      />
                                                    </div>
                                                  )}
                                                </>
                                              ) : ef.type === 'dynamicCash' ? (
                                                <>
                                                  <div>
                                                    <label className="block text-xs text-slate-400 mb-1">Expression</label>
                                                    <input
                                                      type="text"
                                                      value={ef.expression}
                                                      onChange={(e) => setConsequenceForm((p) => ({
                                                        ...p,
                                                        effects: p.effects.map((row, i) => i === idx ? { ...row, expression: e.target.value } : row),
                                                      }))}
                                                      placeholder="expenses*3"
                                                      className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                    />
                                                  </div>
                                                  <div>
                                                    <label className="block text-xs text-slate-400 mb-1">Label (optional)</label>
                                                    <input
                                                      value={ef.label ?? ''}
                                                      onChange={(e) => setConsequenceForm((p) => ({
                                                        ...p,
                                                        effects: p.effects.map((row, i) => i === idx ? { ...row, label: e.target.value } : row),
                                                      }))}
                                                      className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                    />
                                                  </div>
                                                </>
                                              ) : ef.type === 'metric' ? (
                                                <>
                                                  <div>
                                                    <label className="block text-xs text-slate-400 mb-1">Metric</label>
                                                    <select
                                                      value={ef.metric}
                                                      onChange={(e) => setConsequenceForm((p) => ({
                                                        ...p,
                                                        effects: p.effects.map((row, i) => i === idx ? { ...row, metric: e.target.value as GameMetric } : row),
                                                      }))}
                                                      className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                    >
                                                      {METRIC_OPTIONS.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                      ))}
                                                    </select>
                                                  </div>
                                                  <div>
                                                    <label className="block text-xs text-slate-400 mb-1">Effect Type</label>
                                                    <select
                                                      value={ef.effectType}
                                                      onChange={(e) => setConsequenceForm((p) => ({
                                                        ...p,
                                                        effects: p.effects.map((row, i) => i === idx ? { ...row, effectType: e.target.value as EffectType } : row),
                                                      }))}
                                                      className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                    >
                                                      {EFFECT_TYPE_OPTIONS.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                      ))}
                                                    </select>
                                                  </div>
                                                  <div>
                                                    <label className="block text-xs text-slate-400 mb-1">Value</label>
                                                    <input
                                                      type="number"
                                                      value={ef.value}
                                                      onChange={(e) => setConsequenceForm((p) => ({
                                                        ...p,
                                                        effects: p.effects.map((row, i) => i === idx ? { ...row, value: e.target.value } : row),
                                                      }))}
                                                      className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                    />
                                                  </div>
                                                  <div>
                                                    <label className="block text-xs text-slate-400 mb-1">Duration (s)</label>
                                                    <input
                                                      type="number"
                                                      min="0"
                                                      step="1"
                                                      placeholder="Empty = permanent"
                                                      value={ef.durationSeconds}
                                                      onChange={(e) => setConsequenceForm((p) => ({
                                                        ...p,
                                                        effects: p.effects.map((row, i) => i === idx ? { ...row, durationSeconds: e.target.value } : row),
                                                      }))}
                                                      className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                    />
                                                  </div>
                                                </>
                                              ) : null}

                                              <div className="flex items-center gap-2">
                                                <button
                                                  type="button"
                                                  onClick={() => setConsequenceForm((p) => ({
                                                    ...p,
                                                    effects: p.effects.filter((_, i) => i !== idx),
                                                  }))}
                                                  className="text-xs text-rose-300 hover:text-rose-200 px-2 py-1 rounded"
                                                >
                                                  Remove
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>


                                      <div className="md:col-span-2 flex flex-wrap gap-3">
                                        <button type="button" onClick={handleSaveConsequence} className="px-4 py-2 rounded-lg text-sm font-semibold transition bg-amber-600 hover:bg-amber-500 text-white">
                                          Save Consequence
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (selectedConsequenceId && !isCreatingConsequence) {
                                              const current = eventChoices.find((c) => c.id === selectedChoiceId);
                                              const existing = current?.consequences.find((cs) => cs.id === selectedConsequenceId);
                                              if (existing) selectConsequence(existing);
                                            } else {
                                              setIsCreatingConsequence(false);
                                              setSelectedConsequenceId('');
                                              setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [] });
                                            }
                                            setEventStatus(null);
                                          }}
                                          className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                                        >
                                          {isCreatingConsequence ? 'Cancel' : 'Reset'}
                                        </button>
                                        {!isCreatingConsequence && selectedConsequenceId && (
                                          <button type="button" onClick={handleDeleteConsequence} className="px-4 py-2 rounded-lg text-sm font-semibold transition bg-rose-600 hover:bg-rose-500 text-white">
                                            Delete Consequence
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
        )}

        {/* JSON Import Modal for Events - inside Events tab */}
        {activeTab === 'events' && showJsonImport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-slate-100">Import Events from JSON</h3>
                  <button
                    onClick={() => {
                      setShowJsonImport(false);
                      setJsonImportText('');
                      setJsonImportErrors([]);
                    }}
                    className="text-slate-400 hover:text-slate-200 text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>
                <div className="text-sm text-slate-400 mt-2 space-y-1">
                  <p>Paste JSON for a single event to auto-fill the form, or an array of events for bulk import.</p>
                  <p><strong>Valid metrics:</strong> {Object.values(GameMetric).join(', ')}</p>
                  <p><strong>Valid effect types:</strong> {Object.values(EffectType).join(', ')}</p>
                  <p><strong>Immediate effects:</strong> "cash", "reputation"</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">JSON Data</label>
                  <textarea
                    value={jsonImportText}
                    onChange={(e) => setJsonImportText(e.target.value)}
                    placeholder="Paste your JSON here, or click 'Load Sample' to get started with an example..."
                    rows={20}
                    className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200 font-mono text-sm"
                  />
                </div>

                {jsonImportErrors.length > 0 && (
                  <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                    <h4 className="text-red-300 font-semibold mb-2">Import Errors:</h4>
                    <ul className="text-red-200 text-sm space-y-1">
                      {jsonImportErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      setJsonImportText(`{
  "id": "sample-equipment-upgrade",
  "title": "Equipment Upgrade Available",
  "category": "opportunity",
  "summary": "A vendor offers premium equipment at a discounted price. This could improve service quality and attract more customers.",
  "choices": [
    {
      "id": "upgrade-equipment",
      "label": "Purchase Upgrade",
      "cost": 2500,
      "description": "Invest in better equipment to improve service quality",
      "consequences": [
        {
          "id": "successful-upgrade",
          "label": "Upgrade Successful",
          "weight": 85,
          "effects": [
            {
              "type": "reputation",
              "amount": 3
            },
            {
              "type": "metric",
              "metric": "serviceSpeedMultiplier",
              "effectType": "percent",
              "value": 15,
              "durationSeconds": 45
            }
          ]
        }
      ]
    },
    {
      "id": "decline-offer",
      "label": "Decline for Now",
      "consequences": [
        {
          "id": "status-quo",
          "label": "Continue as Usual",
          "weight": 100,
          "effects": []
        }
      ]
    }
  ]
}`);
                      setJsonImportErrors([]);
                    }}
                    className="px-3 py-2 rounded-lg text-sm font-semibold border border-purple-500 text-purple-200 hover:bg-purple-500/10"
                    title="Load a sample event JSON to get started"
                  >
                    📄 Load Sample
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowJsonImport(false);
                        setJsonImportText('');
                        setJsonImportErrors([]);
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleJsonAutoFill}
                      disabled={!jsonImportText.trim()}
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 hover:bg-green-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Auto-fill form with single event JSON"
                    >
                      Auto-fill Form
                    </button>
                    <button
                      onClick={handleJsonImport}
                      disabled={jsonImporting || !jsonImportText.trim()}
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {jsonImporting ? 'Importing…' : 'Bulk Import'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Marketing Section */}
        {activeTab === 'marketing' && (
          <MarketingTab
            campaigns={campaigns}
            campaignsLoading={campaignsLoading}
            campaignStatus={campaignStatus}
            selectedCampaignId={selectedCampaignId}
            isCreatingCampaign={isCreatingCampaign}
            campaignForm={campaignForm}
            campaignEffectsForm={campaignEffectsForm}
            campaignSaving={campaignSaving}
            campaignDeleting={campaignDeleting}
            flags={flags}
            flagsLoading={flagsLoading}
            conditions={conditions}
            conditionsLoading={conditionsLoading}
            metricOptions={METRIC_OPTIONS}
            effectTypeOptions={EFFECT_TYPE_OPTIONS}
            onSelectCampaign={(campaign) => selectCampaign(campaign)}
            onCreateCampaign={handleCreateCampaign}
            onSaveCampaign={handleSaveCampaign}
            onDeleteCampaign={handleDeleteCampaign}
            onReset={() => {
              if (selectedCampaignId && !isCreatingCampaign) {
                const existing = campaigns.find((c) => c.id === selectedCampaignId);
                if (existing) selectCampaign(existing);
              } else {
                setIsCreatingCampaign(false);
                setSelectedCampaignId('');
                setCampaignForm({ id: '', name: '', description: '', cost: '0', cooldownSeconds: '15', requirements: [] });
                setCampaignEffectsForm([]);
              }
              setCampaignStatus(null);
            }}
            onUpdateForm={(updates) => setCampaignForm((p) => ({ ...p, ...updates }))}
            onUpdateEffects={setCampaignEffectsForm}
          />
        )}

        {/* Old Marketing Section - REMOVED */}
        {false && activeTab === 'marketing-old' && (
        <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-2xl font-semibold">Marketing Campaigns</h2>
            <p className="text-sm text-slate-400 mt-1">Create campaigns with cost, duration, and temporary effects.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleCreateCampaign}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-pink-500 text-pink-200 hover:bg-pink-500/10"
              >
                + New Campaign
              </button>
              {campaignStatus && <span className="text-sm text-slate-300">{campaignStatus}</span>}
            </div>

            {campaignsLoading ? (
              <div className="text-sm text-slate-400">Loading campaigns…</div>
            ) : campaigns.length === 0 && !isCreatingCampaign ? (
              <div className="text-sm text-slate-400">No campaigns yet.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {campaigns.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectCampaign(c)}
                      className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                        selectedCampaignId === c.id && !isCreatingCampaign
                          ? 'border-pink-400 bg-pink-500/10 text-pink-200'
                          : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>

                {(selectedCampaignId || isCreatingCampaign) && (
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Campaign ID</label>
                      <input
                        value={campaignForm.id}
                        onChange={(e) => setCampaignForm((p) => ({ ...p, id: e.target.value }))}
                        disabled={!isCreatingCampaign && !!selectedCampaignId}
                        className={`w-full rounded-lg border px-3 py-2 text-slate-200 ${
                          isCreatingCampaign || !selectedCampaignId ? 'bg-slate-900 border-slate-600' : 'bg-slate-800 border-slate-700 cursor-not-allowed'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Name</label>
                      <input
                        value={campaignForm.name}
                        onChange={(e) => setCampaignForm((p) => ({ ...p, name: e.target.value }))}
                        onBlur={() => {
                          if (!campaignForm.id && campaignForm.name.trim()) {
                            const base = slugify(campaignForm.name.trim());
                            const unique = makeUniqueId(base, new Set(campaigns.map((c) => c.id)));
                            setCampaignForm((prev) => ({ ...prev, id: unique }));
                          }
                        }}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Description</label>
                      <textarea
                        rows={3}
                        value={campaignForm.description}
                        onChange={(e) => setCampaignForm((p) => ({ ...p, description: e.target.value }))}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Cost</label>
                      <input
                        type="number"
                        min="0"
                        value={campaignForm.cost}
                        onChange={(e) => setCampaignForm((p) => ({ ...p, cost: e.target.value }))}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Cooldown (seconds)</label>
                      <input
                        type="number"
                        min="0"
                        value={campaignForm.cooldownSeconds}
                        onChange={(e) => setCampaignForm((p) => ({ ...p, cooldownSeconds: e.target.value }))}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Sets Flag</label>
                      <select
                        value={campaignForm.setsFlag || ''}
                        onChange={(e) => setCampaignForm((p) => ({ ...p, setsFlag: e.target.value }))}
                        disabled={flagsLoading}
                        className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200 disabled:opacity-50"
                      >
                        <option value="">
                          {flagsLoading ? 'Loading flags...' : 'None'}
                        </option>
                        {!flagsLoading && flags.map((flag) => (
                          <option key={flag.id} value={flag.id}>
                            {flag.name} ({flag.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Requirements</label>
                      <RequirementsSelector
                        flags={flags}
                        conditions={conditions}
                        flagsLoading={flagsLoading}
                        conditionsLoading={conditionsLoading}
                        requirements={campaignForm.requirements || []}
                        onRequirementsChange={(requirements) => setCampaignForm((p) => ({ ...p, requirements }))}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-300">Effects (temporary)</h4>
                          <p className="text-xs text-slate-400 mt-1">Add = flat, Percent = +/-%, Multiply = × factor, Set = exact value.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCampaignEffectsForm((prev) => [...prev, { metric: GameMetric.SpawnIntervalSeconds, type: EffectType.Add, value: '0', durationSeconds: '30' }])}
                          className="px-2 py-1 text-xs rounded-md border border-slate-600 text-slate-200 hover:bg-slate-800"
                        >
                          + Add Effect
                        </button>
                      </div>
                      <div className="space-y-2">
                        {campaignEffectsForm.map((ef, idx) => (
                          <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                            <select
                              value={ef.metric}
                              onChange={(e) => setCampaignEffectsForm((prev) => prev.map((row, i) => i === idx ? { ...row, metric: e.target.value as GameMetric } : row))}
                              className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                            >
                              {METRIC_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            <select
                              value={ef.type}
                              onChange={(e) => setCampaignEffectsForm((prev) => prev.map((row, i) => i === idx ? { ...row, type: e.target.value as EffectType } : row))}
                              className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                            >
                              {EFFECT_TYPE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            <input
                              placeholder="value"
                              type="number"
                              value={ef.value}
                              onChange={(e) => setCampaignEffectsForm((prev) => prev.map((row, i) => i === idx ? { ...row, value: e.target.value } : row))}
                              className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                            />
                            <input
                              placeholder="duration (sec)"
                              type="number"
                              value={ef.durationSeconds}
                              onChange={(e) => setCampaignEffectsForm((prev) => prev.map((row, i) => i === idx ? { ...row, durationSeconds: e.target.value } : row))}
                              className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => setCampaignEffectsForm((prev) => prev.filter((_, i) => i !== idx))}
                              className="px-2 py-2 text-xs rounded-md border border-rose-600 text-rose-200 hover:bg-rose-900"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleSaveCampaign}
                        disabled={campaignSaving || campaignDeleting}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                          campaignSaving ? 'bg-pink-900 text-pink-200 cursor-wait' : 'bg-pink-600 hover:bg-pink-500 text-white'
                        }`}
                      >
                        {campaignSaving ? 'Saving…' : 'Save Campaign'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedCampaignId && !isCreatingCampaign) {
                            const existing = campaigns.find((c) => c.id === selectedCampaignId);
                            if (existing) selectCampaign(existing);
                          } else {
                            setIsCreatingCampaign(false);
                            setSelectedCampaignId('');
                            setCampaignForm({ id: '', name: '', description: '', cost: '0', cooldownSeconds: '15', requirements: [] });
                            setCampaignEffectsForm([]);
                          }
                          setCampaignStatus(null);
                        }}
                        disabled={campaignSaving || campaignDeleting}
                        className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                      >
                        {isCreatingCampaign ? 'Cancel' : 'Reset'}
                      </button>
                      {!isCreatingCampaign && selectedCampaignId && (
                        <button
                          type="button"
                          onClick={handleDeleteCampaign}
                          disabled={campaignDeleting || campaignSaving}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                            campaignDeleting ? 'bg-rose-900 text-rose-200 cursor-wait' : 'bg-rose-600 hover:bg-rose-500 text-white'
                          }`}
                        >
                          {campaignDeleting ? 'Deleting…' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </section>
        )}

        {/* Upgrades Section */}
        {activeTab === 'upgrades' && (
          <UpgradesTab
            industryId={form.id}
            upgrades={upgrades}
            upgradesLoading={upgradesLoading}
            upgradeStatus={upgradeStatus}
            selectedUpgradeId={selectedUpgradeId}
            isCreatingUpgrade={isCreatingUpgrade}
            upgradeForm={upgradeForm}
            effectsForm={effectsForm}
            upgradeSaving={upgradeSaving}
            upgradeDeleting={upgradeDeleting}
            flags={flags}
            flagsLoading={flagsLoading}
            conditions={conditions}
            conditionsLoading={conditionsLoading}
            metricOptions={METRIC_OPTIONS}
            effectTypeOptions={EFFECT_TYPE_OPTIONS}
            onSelectUpgrade={(upgrade) => selectUpgrade(upgrade)}
            onCreateUpgrade={handleCreateUpgrade}
            onSaveUpgrade={handleSaveUpgrade}
            onDeleteUpgrade={handleDeleteUpgrade}
            onReset={() => {
              if (selectedUpgradeId && !isCreatingUpgrade) {
                const existing = upgrades.find((u) => u.id === selectedUpgradeId);
                if (existing) selectUpgrade(existing);
              } else {
                setIsCreatingUpgrade(false);
                setSelectedUpgradeId('');
                setUpgradeForm({ id: '', name: '', description: '', icon: '⚙️', cost: '0', maxLevel: '1', requirements: [] });
                setEffectsForm([]);
              }
              setUpgradeStatus(null);
            }}
            onUpdateForm={(updates) => setUpgradeForm((p) => ({ ...p, ...updates }))}
            onUpdateEffects={setEffectsForm}
          />
        )}

        {/* Old Upgrades Section - REMOVED */}
        {false && activeTab === 'upgrades-old' && (
        <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-2xl font-semibold">Upgrades</h2>
            <p className="text-sm text-slate-400 mt-1">Manage upgrades and their effects for the selected industry.</p>
          </div>
          <div className="p-6 space-y-6">
            {!form.id ? (
              <div className="text-sm text-slate-400">Select or create an industry first.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={handleCreateUpgrade}
                    className="px-3 py-2 text-sm font-medium rounded-lg border border-purple-500 text-purple-200 hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isCreating || !form.id}
                  >
                    + New Upgrade
                  </button>
                  {upgradeStatus && <span className="text-sm text-slate-300">{upgradeStatus}</span>}
                </div>

                {upgradesLoading ? (
                  <div className="text-sm text-slate-400">Loading upgrades…</div>
                ) : upgrades.length === 0 && !isCreatingUpgrade ? (
                  <div className="text-sm text-slate-400">No upgrades configured yet.</div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {upgrades.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => selectUpgrade(u)}
                          className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                            selectedUpgradeId === u.id && !isCreatingUpgrade
                              ? 'border-purple-400 bg-purple-500/10 text-purple-200'
                              : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                          }`}
                        >
                          {u.icon} {u.name}
                        </button>
                      ))}
                    </div>

                    {(selectedUpgradeId || isCreatingUpgrade) && (
                      <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-1">Upgrade ID</label>
                          <input
                            value={upgradeForm.id}
                            onChange={(e) => setUpgradeForm((p) => ({ ...p, id: e.target.value }))}
                            disabled={!isCreatingUpgrade && !!selectedUpgradeId}
                            className={`w-full rounded-lg border px-3 py-2 text-slate-200 ${
                              isCreatingUpgrade || !selectedUpgradeId ? 'bg-slate-900 border-slate-600' : 'bg-slate-800 border-slate-700 cursor-not-allowed'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-1">Name</label>
                          <input
                            value={upgradeForm.name}
                            onChange={(e) => setUpgradeForm((p) => ({ ...p, name: e.target.value }))}
                            onBlur={() => {
                              if (!upgradeForm.id && upgradeForm.name.trim()) {
                                const base = slugify(upgradeForm.name.trim());
                                const unique = makeUniqueId(base, new Set(upgrades.map((u) => u.id)));
                                setUpgradeForm((prev) => ({ ...prev, id: unique }));
                              }
                            }}
                            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-slate-300 mb-1">Description</label>
                          <textarea
                            rows={3}
                            value={upgradeForm.description}
                            onChange={(e) => setUpgradeForm((p) => ({ ...p, description: e.target.value }))}
                            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-1">Icon</label>
                          <input
                            value={upgradeForm.icon}
                            onChange={(e) => setUpgradeForm((p) => ({ ...p, icon: e.target.value }))}
                            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-1">Cost</label>
                          <input
                            type="number"
                            min="0"
                            value={upgradeForm.cost}
                            onChange={(e) => setUpgradeForm((p) => ({ ...p, cost: e.target.value }))}
                            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-1">Max Level</label>
                          <input
                            type="number"
                            min="1"
                            value={upgradeForm.maxLevel}
                            onChange={(e) => setUpgradeForm((p) => ({ ...p, maxLevel: e.target.value }))}
                            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-1">Sets Flag</label>
                          <select
                            value={upgradeForm.setsFlag || ''}
                            onChange={(e) => setUpgradeForm((p) => ({ ...p, setsFlag: e.target.value }))}
                            disabled={flagsLoading}
                            className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200 disabled:opacity-50"
                          >
                            <option value="">
                              {flagsLoading ? 'Loading flags...' : 'None'}
                            </option>
                            {!flagsLoading && flags.map((flag) => (
                              <option key={flag.id} value={flag.id}>
                                {flag.name} ({flag.id})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Requirements</label>
                          <RequirementsSelector
                            flags={flags}
                            conditions={conditions}
                            flagsLoading={flagsLoading}
                            conditionsLoading={conditionsLoading}
                            requirements={upgradeForm.requirements || []}
                            onRequirementsChange={(requirements) => setUpgradeForm((p) => ({ ...p, requirements }))}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-300">Effects</h4>
                              <p className="text-xs text-slate-400 mt-1">
                                Choose a metric and how to apply it. Add = flat amount, Percent = +/-%, Multiply = × factor, Set = exact value.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEffectsForm((prev) => [...prev, { metric: GameMetric.ServiceRooms, type: EffectType.Add, value: '0' }])}
                              className="px-2 py-1 text-xs rounded-md border border-slate-600 text-slate-200 hover:bg-slate-800"
                            >
                              + Add Effect
                            </button>
                          </div>
                          <div className="space-y-2">
                            {effectsForm.map((ef, idx) => (
                              <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                                <select
                                  value={ef.metric}
                                  onChange={(e) => setEffectsForm((prev) => prev.map((row, i) => i === idx ? { ...row, metric: e.target.value as GameMetric } : row))}
                                  className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                                >
                                  {METRIC_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                                <select
                                  value={ef.type}
                                  onChange={(e) => setEffectsForm((prev) => prev.map((row, i) => i === idx ? { ...row, type: e.target.value as EffectType } : row))}
                                  className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                                >
                                  {EFFECT_TYPE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                                <input
                                  placeholder="value"
                                  type="number"
                                  value={ef.value}
                                  onChange={(e) => setEffectsForm((prev) => prev.map((row, i) => i === idx ? { ...row, value: e.target.value } : row))}
                                  className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => setEffectsForm((prev) => prev.filter((_, i) => i !== idx))}
                                  className="px-2 py-2 text-xs rounded-md border border-rose-600 text-rose-200 hover:bg-rose-900"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="md:col-span-2 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={handleSaveUpgrade}
                            disabled={upgradeSaving || upgradeDeleting}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                              upgradeSaving ? 'bg-purple-900 text-purple-200 cursor-wait' : 'bg-purple-600 hover:bg-purple-500 text-white'
                            }`}
                          >
                            {upgradeSaving ? 'Saving…' : 'Save Upgrade'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedUpgradeId && !isCreatingUpgrade) {
                                const existing = upgrades.find((u) => u.id === selectedUpgradeId);
                                if (existing) selectUpgrade(existing);
                              } else {
                                setIsCreatingUpgrade(false);
                                setSelectedUpgradeId('');
                                setUpgradeForm({ id: '', name: '', description: '', icon: '⚙️', cost: '0', maxLevel: '1', requirements: [] });
                                setEffectsForm([]);
                              }
                              setUpgradeStatus(null);
                            }}
                            disabled={upgradeSaving || upgradeDeleting}
                            className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                          >
                            {isCreatingUpgrade ? 'Cancel' : 'Reset'}
                          </button>
                          {!isCreatingUpgrade && selectedUpgradeId && (
                            <button
                              type="button"
                              onClick={handleDeleteUpgrade}
                              disabled={upgradeDeleting || upgradeSaving}
                              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                upgradeDeleting ? 'bg-rose-900 text-rose-200 cursor-wait' : 'bg-rose-600 hover:bg-rose-500 text-white'
                              }`}
                            >
                              {upgradeDeleting ? 'Deleting…' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
        )}

        {/* Services Section */}
        {activeTab === 'services' && (
          <ServicesTab
            industryId={form.id}
            services={services}
            serviceLoading={serviceLoading}
            serviceStatus={serviceStatus}
            selectedServiceId={selectedServiceId}
            isCreatingService={isCreatingService}
            serviceForm={serviceForm}
            serviceSaving={serviceSaving}
            serviceDeleting={serviceDeleting}
            flags={flags}
            flagsLoading={flagsLoading}
            conditions={conditions}
            conditionsLoading={conditionsLoading}
            onSelectService={(service) => selectService(service)}
            onCreateService={handleCreateService}
            onSaveService={handleServiceSave}
            onDeleteService={handleServiceDelete}
            onReset={() => {
              if (selectedServiceId && !isCreatingService) {
                const existing = services.find((item) => item.id === selectedServiceId);
                if (existing) selectService(existing);
              } else {
                setServiceForm({ id: '', name: '', duration: '0', price: '0', requirements: [], pricingCategory: '', weightage: '1' });
                setIsCreatingService(false);
                setSelectedServiceId('');
              }
              setServiceStatus(null);
            }}
            onUpdateForm={(updates) => setServiceForm((p) => ({ ...p, ...updates }))}
          />
        )}

        {/* Old Services Section - REMOVED */}
        {false && activeTab === 'services-old' && (
        <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-2xl font-semibold">Services</h2>
            <p className="text-sm text-slate-400 mt-1">
              Manage the services offered for the selected industry.
            </p>
          </div>

          <div className="p-6 space-y-6">
            {!form.id ? (
              <div className="text-sm text-slate-400">
                Select or create an industry first.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={handleCreateService}
                    className="px-3 py-2 text-sm font-medium rounded-lg border border-emerald-500 text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isCreating || !form.id}
                  >
                    + New Service
                  </button>
                  {serviceStatus && (
                    <span className="text-sm text-slate-300">{serviceStatus}</span>
                  )}
                </div>

                {serviceLoading ? (
                  <div className="text-sm text-slate-400">Loading services...</div>
                ) : services.length === 0 && !isCreatingService ? (
                  <div className="text-sm text-slate-400">
                    No services configured yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {services.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => selectService(service)}
                          className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                            selectedServiceId === service.id && !isCreatingService
                              ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200'
                              : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                          }`}
                        >
                          {service.name}
                        </button>
                      ))}
                    </div>

                    {(selectedServiceId || isCreatingService) && (
                      <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-1">
                            Service ID
                          </label>
                          <input
                            value={serviceForm.id}
                            onChange={(event) =>
                              setServiceForm((prev) => ({ ...prev, id: event.target.value }))
                            }
                            disabled={!isCreatingService && !!selectedServiceId}
                            className={`w-full rounded-lg border px-3 py-2 text-slate-200 ${
                              isCreatingService || !selectedServiceId
                                ? 'bg-slate-900 border-slate-600'
                                : 'bg-slate-800 border-slate-700 cursor-not-allowed'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-1">
                            Name
                          </label>
                          <input
                            value={serviceForm.name}
                            onChange={(event) =>
                              setServiceForm((prev) => ({ ...prev, name: event.target.value }))
                            }
                            onBlur={() => {
                              if (!serviceForm.id && serviceForm.name.trim()) {
                                const base = slugify(`${form.id}-${serviceForm.name.trim()}`);
                                const unique = makeUniqueId(base, new Set(services.map((s) => s.id)));
                                setServiceForm((prev) => ({ ...prev, id: unique }));
                              }
                            }}
                            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-1">
                            Duration (seconds)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={serviceForm.duration}
                            onChange={(event) =>
                              setServiceForm((prev) => ({ ...prev, duration: event.target.value }))
                            }
                            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-1">
                            Price
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={serviceForm.price}
                            onChange={(event) =>
                              setServiceForm((prev) => ({ ...prev, price: event.target.value }))
                            }
                            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                          />
                        </div>

                        <div className="md:col-span-2 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={handleServiceSave}
                            disabled={serviceSaving || serviceDeleting}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                              serviceSaving
                                ? 'bg-emerald-900 text-emerald-200 cursor-wait'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            {serviceSaving ? 'Saving…' : 'Save Service'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (selectedServiceId && !isCreatingService) {
                                const existing = services.find((item) => item.id === selectedServiceId);
                                if (existing) {
                                  selectService(existing);
                                }
                              } else {
                                setServiceForm(emptyServiceForm);
                                setIsCreatingService(false);
                                setSelectedServiceId('');
                              }
                              setServiceStatus(null);
                            }}
                            disabled={serviceSaving || serviceDeleting}
                            className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                          >
                            {isCreatingService ? 'Cancel' : 'Reset'}
                          </button>

                          {!isCreatingService && selectedServiceId && (
                            <button
                              type="button"
                              onClick={handleServiceDelete}
                              disabled={serviceDeleting || serviceSaving}
                              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                serviceDeleting
                                  ? 'bg-rose-900 text-rose-200 cursor-wait'
                                  : 'bg-rose-600 hover:bg-rose-500 text-white'
                              }`}
                            >
                              {serviceDeleting ? 'Deleting…' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
        )}

        {/* Staff Section */}
        {activeTab === 'staff' && (
          <StaffTab
            industryId={form.id}
            staffRoles={staffRoles}
            staffPresets={staffPresets}
            staffLoading={staffLoading}
            staffStatus={staffStatus}
            selectedRoleId={selectedRoleId}
            isCreatingRole={isCreatingRole}
            roleForm={roleForm}
            roleSaving={roleSaving}
            roleDeleting={roleDeleting}
            selectedPresetId={selectedPresetId}
            isCreatingPreset={isCreatingPreset}
            presetForm={presetForm}
            presetSaving={presetSaving}
            presetDeleting={presetDeleting}
            flags={flags}
            flagsLoading={flagsLoading}
            conditions={conditions}
            conditionsLoading={conditionsLoading}
            onSelectRole={(role) => selectRole(role)}
            onCreateRole={handleCreateRole}
            onSaveRole={handleSaveRole}
            onDeleteRole={handleDeleteRole}
            onResetRole={() => {
              if (selectedRoleId && !isCreatingRole) {
                const existing = staffRoles.find((r) => r.id === selectedRoleId);
                if (existing) selectRole(existing);
              } else {
                setIsCreatingRole(false);
                setSelectedRoleId('');
                setRoleForm({ id: '', name: '', salary: '0', effects: [], emoji: '🧑‍💼', requirements: [] });
              }
              setStaffStatus(null);
            }}
            onUpdateRoleForm={(updates) => setRoleForm((p) => ({ ...p, ...updates }))}
            onSelectPreset={(preset) => selectPreset(preset)}
            onCreatePreset={handleCreatePreset}
            onSavePreset={handleSavePreset}
            onDeletePreset={handleDeletePreset}
            onResetPreset={() => {
              if (selectedPresetId && !isCreatingPreset) {
                const existing = staffPresets.find((p) => p.id === selectedPresetId);
                if (existing) selectPreset(existing);
              } else {
                setIsCreatingPreset(false);
                setSelectedPresetId('');
                setPresetForm({ id: '', roleId: staffRoles[0]?.id ?? '', name: '' });
              }
              setStaffStatus(null);
            }}
            onUpdatePresetForm={(updates) => setPresetForm((p) => ({ ...p, ...updates }))}
          />
        )}
      </div>
    </div>
  );
}
