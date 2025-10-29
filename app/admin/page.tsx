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
import type { IndustryServiceDefinition, BusinessMetrics, BusinessStats, MovementConfig } from '@/lib/game/types';
import { fetchGlobalSimulationConfig, upsertGlobalSimulationConfig } from '@/lib/data/simulationConfigRepository';
import { getGlobalSimulationConfigValues, setGlobalSimulationConfigValues } from '@/lib/game/industryConfigs';
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
import { fetchMarketingCampaigns, upsertMarketingCampaign, deleteMarketingCampaign } from '@/lib/data/marketingRepository';
import type { MarketingCampaign } from '@/lib/store/slices/marketingSlice';
import { fetchEventsForIndustry, upsertEventForIndustry, deleteEventById } from '@/lib/data/eventRepository';
import type { GameEvent, GameEventChoice, GameEventConsequence, GameEventEffect, GameEventTemporaryEffect } from '@/lib/types/gameEvents';

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
}

const emptyServiceForm: ServiceFormState = {
  id: '',
  name: '',
  duration: '0',
  price: '0',
};

export default function AdminPage() {
  const [industries, setIndustries] = useState<Industry[]>([]);
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
  const initialGlobal = getGlobalSimulationConfigValues();
  const [metrics, setMetrics] = useState<BusinessMetrics>({ ...initialGlobal.businessMetrics });
  const [stats, setStats] = useState<BusinessStats>({ ...initialGlobal.businessStats });
  const [eventSecondsInput, setEventSecondsInput] = useState<string>(
    (initialGlobal.businessStats.eventTriggerSeconds || []).join(',')
  );
  const [movementJSON, setMovementJSON] = useState<string>(JSON.stringify(initialGlobal.movement, null, 2));
  const [globalStatus, setGlobalStatus] = useState<string | null>(null);
  const [globalLoading, setGlobalLoading] = useState<boolean>(false);
  const [globalSaving, setGlobalSaving] = useState<boolean>(false);

  // Staff management state
  const [staffRoles, setStaffRoles] = useState<StaffRoleConfig[]>([]);
  const [staffPresets, setStaffPresets] = useState<StaffPreset[]>([]);
  const [staffLoading, setStaffLoading] = useState<boolean>(false);
  const [staffStatus, setStaffStatus] = useState<string | null>(null);

  const [roleForm, setRoleForm] = useState<{ id: string; name: string; salary: string; serviceSpeed: string; emoji: string }>({ id: '', name: '', salary: '0', serviceSpeed: '0', emoji: '🧑‍💼' });
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
  const [upgradeForm, setUpgradeForm] = useState<{ id: string; name: string; description: string; icon: string; cost: string; maxLevel: string }>({ id: '', name: '', description: '', icon: '⚙️', cost: '0', maxLevel: '1' });
  const [effectsForm, setEffectsForm] = useState<Array<{ metric: GameMetric; type: EffectType; value: string }>>([]);

  // Marketing management state
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [isCreatingCampaign, setIsCreatingCampaign] = useState<boolean>(false);
  const [campaignSaving, setCampaignSaving] = useState<boolean>(false);
  const [campaignDeleting, setCampaignDeleting] = useState<boolean>(false);
  const [campaignsLoading, setCampaignsLoading] = useState<boolean>(false);
  const [campaignStatus, setCampaignStatus] = useState<string | null>(null);
  const [campaignForm, setCampaignForm] = useState<{ id: string; name: string; description: string; cost: string; durationSeconds: string }>({ id: '', name: '', description: '', cost: '0', durationSeconds: '10' });
  const [campaignEffectsForm, setCampaignEffectsForm] = useState<Array<{ metric: GameMetric; type: EffectType; value: string }>>([]);

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
  const [choiceForm, setChoiceForm] = useState<{ id: string; label: string; description: string; cost: string }>({ id: '', label: '', description: '', cost: '' });

  // Consequences editor state for the selected choice
  const [selectedConsequenceId, setSelectedConsequenceId] = useState<string>('');
  const [isCreatingConsequence, setIsCreatingConsequence] = useState<boolean>(false);
  const [consequenceForm, setConsequenceForm] = useState<{
    id: string;
    label: string;
    description: string;
    weight: string;
    effects: Array<{ type: 'cash' | 'reputation'; amount: string; label?: string }>;
    temporaryEffects: Array<{ metric: GameMetric; type: EffectType; value: string; durationSeconds: string; priority?: string }>;
  }>({ id: '', label: '', description: '', weight: '1', effects: [], temporaryEffects: [] });

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
  ];

  const EFFECT_TYPE_OPTIONS: { value: EffectType; label: string; hint: string }[] = [
    { value: EffectType.Add, label: 'Add (flat)', hint: 'Add or subtract a flat amount, e.g. +1 room or +100 revenue' },
    { value: EffectType.Percent, label: 'Percent (%)', hint: 'Increase/decrease by percentage, e.g. +15% speed' },
    { value: EffectType.Multiply, label: 'Multiply (×)', hint: 'Multiply the value, e.g. ×1.5 for 50% boost' },
    { value: EffectType.Set, label: 'Set (=)', hint: 'Force a value to a number, overwrites others' },
  ];

  const makeUniqueId = (base: string, existingIds: Set<string>): string => {
    let candidate = base;
    let counter = 2;
    while (existingIds.has(candidate)) {
      candidate = `${base}-${counter++}`;
    }
    return candidate;
  };

  const selectService = (service: IndustryServiceDefinition, resetMessage: boolean = true) => {
    setSelectedServiceId(service.id);
    setIsCreatingService(false);
    setServiceForm({
      id: service.id,
      name: service.name,
      duration: service.duration.toString(),
      price: service.price.toString(),
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
    loadStaffForIndustry(industry.id);
    loadUpgradesForIndustry(industry.id);
    loadMarketingCampaigns();
    loadEventsForIndustry(industry.id);
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
      setRoleForm({ id: first.id, name: first.name, salary: String(first.salary), serviceSpeed: String(first.serviceSpeed), emoji: first.emoji });
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
    setUpgradeForm({ id: '', name: '', description: '', icon: '⚙️', cost: '0', maxLevel: '1' });
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
    setUpgradeForm({ id: upgrade.id, name: upgrade.name, description: upgrade.description, icon: upgrade.icon, cost: String(upgrade.cost), maxLevel: String(upgrade.maxLevel) });
    setEffectsForm(upgrade.effects.map((e) => ({ metric: e.metric, type: e.type, value: String(e.value) })));
    if (resetMsg) setUpgradeStatus(null);
  };

  const handleCreateUpgrade = () => {
    if (!form.id) { setUpgradeStatus('Save the industry first.'); return; }
    setIsCreatingUpgrade(true);
    setSelectedUpgradeId('');
    setUpgradeForm({ id: '', name: '', description: '', icon: '⚙️', cost: '0', maxLevel: '1' });
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
    const effects: UpgradeEffect[] = effectsForm.map((ef) => ({
      metric: ef.metric,
      type: ef.type,
      value: Number(ef.value) || 0,
    }));
    setUpgradeSaving(true);
    const result = await upsertUpgradeForIndustry(form.id, { id, name, description, icon, cost, maxLevel, effects });
    setUpgradeSaving(false);
    if (!result.success) { setUpgradeStatus(result.message ?? 'Failed to save upgrade.'); return; }
    setUpgrades((prev) => {
      const exists = prev.some((u) => u.id === id);
      const nextItem: UpgradeDefinition = { id, name, description, icon, cost, maxLevel, effects } as any;
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
    setUpgradeForm({ id: '', name: '', description: '', icon: '⚙️', cost: '0', maxLevel: '1' });
    setEffectsForm([]);
    setUpgradeStatus('Upgrade deleted.');
  };

  const loadMarketingCampaigns = async () => {
    setCampaignsLoading(true);
    setCampaignStatus(null);
    setCampaigns([]);
    setSelectedCampaignId('');
    setIsCreatingCampaign(false);
    setCampaignForm({ id: '', name: '', description: '', cost: '0', durationSeconds: '10' });
    setCampaignEffectsForm([]);
    const result = await fetchMarketingCampaigns();
    setCampaignsLoading(false);
    if (!result) return;
    setCampaigns(result);
    if (result.length > 0) selectCampaign(result[0], false);
  };

  const selectCampaign = (campaign: MarketingCampaign, resetMsg = true) => {
    setSelectedCampaignId(campaign.id);
    setIsCreatingCampaign(false);
    setCampaignForm({ id: campaign.id, name: campaign.name, description: campaign.description, cost: String(campaign.cost), durationSeconds: String(campaign.durationSeconds) });
    setCampaignEffectsForm(campaign.effects.map((e) => ({ metric: e.metric, type: e.type, value: String(e.value) })));
    if (resetMsg) setCampaignStatus(null);
  };

  const handleCreateCampaign = () => {
    setIsCreatingCampaign(true);
    setSelectedCampaignId('');
    setCampaignForm({ id: '', name: '', description: '', cost: '0', durationSeconds: '10' });
    setCampaignEffectsForm([]);
    setCampaignStatus(null);
  };

  const handleSaveCampaign = async () => {
    const id = campaignForm.id.trim();
    const name = campaignForm.name.trim();
    const description = campaignForm.description.trim();
    const cost = Number(campaignForm.cost);
    const durationSeconds = Number(campaignForm.durationSeconds);
    if (!id || !name) { setCampaignStatus('Campaign id and name are required.'); return; }
    if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(durationSeconds) || durationSeconds < 1) {
      setCampaignStatus('Cost must be >= 0 and Duration >= 1 second.');
      return;
    }
    const effects = campaignEffectsForm.map((ef) => ({ metric: ef.metric, type: ef.type, value: Number(ef.value) || 0 }));
    setCampaignSaving(true);
    const result = await upsertMarketingCampaign({ id, name, description, cost, durationSeconds, effects });
    setCampaignSaving(false);
    if (!result.success) { setCampaignStatus(result.message ?? 'Failed to save campaign.'); return; }
    setCampaigns((prev) => {
      const exists = prev.some((c) => c.id === id);
      const nextItem: MarketingCampaign = { id, name, description, cost, durationSeconds, effects } as any;
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
    const result = await deleteMarketingCampaign(selectedCampaignId);
    setCampaignDeleting(false);
    if (!result.success) { setCampaignStatus(result.message ?? 'Failed to delete campaign.'); return; }
    setCampaigns((prev) => prev.filter((c) => c.id !== selectedCampaignId));
    setSelectedCampaignId('');
    setCampaignForm({ id: '', name: '', description: '', cost: '0', durationSeconds: '10' });
    setCampaignEffectsForm([]);
    setCampaignStatus('Campaign deleted.');
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

  const selectEvent = (event: GameEvent, resetMsg = true) => {
    setSelectedEventId(event.id);
    setIsCreatingEvent(false);
    setEventForm({ id: event.id, title: event.title, category: event.category, summary: event.summary });
    setEventChoices(event.choices);
    setSelectedChoiceId('');
    setIsCreatingChoice(false);
    setChoiceForm({ id: '', label: '', description: '', cost: '' });
    setSelectedConsequenceId('');
    setIsCreatingConsequence(false);
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [], temporaryEffects: [] });
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
    setChoiceForm({ id: '', label: '', description: '', cost: '' });
    setSelectedConsequenceId('');
    setIsCreatingConsequence(false);
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [], temporaryEffects: [] });
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
    setChoiceForm({ id: '', label: '', description: '', cost: '' });
    setSelectedConsequenceId('');
    setIsCreatingConsequence(false);
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [], temporaryEffects: [] });
    setEventStatus('Event deleted.');
  };

  const selectChoice = (choice: GameEventChoice) => {
    setIsCreatingChoice(false);
    setSelectedChoiceId(choice.id);
    setChoiceForm({ id: choice.id, label: choice.label, description: choice.description ?? '', cost: choice.cost !== undefined ? String(choice.cost) : '' });
    setSelectedConsequenceId('');
    setIsCreatingConsequence(false);
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [], temporaryEffects: [] });
  };

  const handleCreateChoice = () => {
    if (!selectedEventId && !isCreatingEvent) { setEventStatus('Create or select an event first.'); return; }
    setIsCreatingChoice(true);
    setSelectedChoiceId('');
    setChoiceForm({ id: '', label: '', description: '', cost: '' });
    setSelectedConsequenceId('');
    setIsCreatingConsequence(false);
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [], temporaryEffects: [] });
  };

  const handleSaveChoice = () => {
    const id = choiceForm.id.trim();
    const label = choiceForm.label.trim();
    const description = choiceForm.description.trim();
    const cost = choiceForm.cost.trim() === '' ? undefined : Number(choiceForm.cost);
    if (!id || !label) { setEventStatus('Choice id and label are required.'); return; }
    if (cost !== undefined && (!Number.isFinite(cost) || cost < 0)) { setEventStatus('Choice cost must be a non-negative number.'); return; }

    const exists = eventChoices.some((c) => c.id === id);
    const nextItem: GameEventChoice = { id, label, description: description || undefined, cost, consequences: exists ? eventChoices.find(c => c.id === id)!.consequences : [] };
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
    setChoiceForm({ id: '', label: '', description: '', cost: '' });
    setSelectedConsequenceId('');
    setIsCreatingConsequence(false);
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [], temporaryEffects: [] });
    void persistEventWithChoices(next, 'Choice deleted.');
  };

  const selectConsequence = (consequence: GameEventConsequence) => {
    setIsCreatingConsequence(false);
    setSelectedConsequenceId(consequence.id);
    setConsequenceForm({
      id: consequence.id,
      label: consequence.label ?? '',
      description: consequence.description ?? '',
      weight: String(consequence.weight),
      effects: consequence.effects.map((ef: GameEventEffect) =>
        ef.type === 'cash'
          ? { type: 'cash', amount: String(ef.amount), label: ef.label }
          : { type: 'reputation', amount: String(ef.amount) }
      ),
      temporaryEffects: (consequence.temporaryEffects ?? []).map((t: GameEventTemporaryEffect) => ({
        metric: t.metric,
        type: t.type,
        value: String(t.value),
        durationSeconds: String(t.durationSeconds),
        priority: t.priority !== undefined ? String(t.priority) : undefined,
      })),
    });
  };

  const handleCreateConsequence = () => {
    if (!selectedChoiceId && !isCreatingChoice) { setEventStatus('Create or select a choice first.'); return; }
    setIsCreatingConsequence(true);
    setSelectedConsequenceId('');
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [], temporaryEffects: [] });
  };

  const handleSaveConsequence = () => {
    if (!selectedChoiceId && !isCreatingChoice) { setEventStatus('Create or select a choice first.'); return; }
    const id = consequenceForm.id.trim();
    const label = consequenceForm.label.trim();
    const description = consequenceForm.description.trim();
    const weightNum = Number(consequenceForm.weight);
    if (!id || !Number.isInteger(weightNum) || weightNum <= 0) { setEventStatus('Consequence id and positive integer weight are required.'); return; }

    const normalizedEffects = consequenceForm.effects.map((ef) => ({
      type: ef.type,
      amount: Number(ef.amount) || 0,
      ...(ef.type === 'cash' && ef.label ? { label: ef.label } : {}),
    })) as GameEventEffect[];

    const normalizedTemps = consequenceForm.temporaryEffects.map((t) => ({
      metric: t.metric,
      type: t.type,
      value: Number(t.value) || 0,
      durationSeconds: Number(t.durationSeconds) || 0,
      priority: t.priority !== undefined && t.priority !== '' ? Number(t.priority) : undefined,
    }));

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
      temporaryEffects: normalizedTemps.length ? normalizedTemps : undefined,
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
    setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [], temporaryEffects: [] });
    void persistEventWithChoices(next, 'Consequence deleted.');
  };

  const selectRole = (role: StaffRoleConfig) => {
    setIsCreatingRole(false);
    setSelectedRoleId(role.id);
    setRoleForm({ id: role.id, name: role.name, salary: String(role.salary), serviceSpeed: String(role.serviceSpeed), emoji: role.emoji });
    setStaffStatus(null);
  };

  const handleCreateRole = () => {
    if (!form.id) {
      setStaffStatus('Save the industry first.');
      return;
    }
    setIsCreatingRole(true);
    setSelectedRoleId('');
    setRoleForm({ id: '', name: '', salary: '0', serviceSpeed: '0', emoji: '🧑‍💼' });
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
    const serviceSpeed = Number(roleForm.serviceSpeed);
    if (!id || !name) {
      setStaffStatus('Role id and name are required.');
      return;
    }
    if (!Number.isFinite(salary) || salary < 0 || !Number.isFinite(serviceSpeed) || serviceSpeed < 0) {
      setStaffStatus('Salary and service speed must be non-negative.');
      return;
    }
    setRoleSaving(true);
    const result = await upsertStaffRole({ id, industryId: form.id, name, salary, serviceSpeed, emoji: roleForm.emoji.trim() || undefined });
    setRoleSaving(false);
    if (!result.success) {
      setStaffStatus(result.message ?? 'Failed to save role.');
      return;
    }
    setStaffRoles((prev) => {
      const exists = prev.some((r) => r.id === id);
      const next = exists ? prev.map((r) => (r.id === id ? { id, name, salary, serviceSpeed, emoji: roleForm.emoji.trim() || '🧑‍💼' } : r)) : [...prev, { id, name, salary, serviceSpeed, emoji: roleForm.emoji.trim() || '🧑‍💼' }];
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
    setRoleForm({ id: '', name: '', salary: '0', serviceSpeed: '0', emoji: '🧑‍💼' });
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
    });
    setGlobalSaving(false);

    if (!result.success) {
      setGlobalStatus(result.message ?? 'Failed to save global config.');
      return;
    }

    setGlobalSimulationConfigValues({
      businessMetrics,
      businessStats,
      movement,
    });
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
    setServiceForm({ ...emptyServiceForm });
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

    if (!Number.isFinite(durationValue) || durationValue < 0) {
      setServiceStatus('Duration must be a non-negative number.');
      return;
    }

    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setServiceStatus('Price must be a non-negative number.');
      return;
    }

    setServiceSaving(true);
    setServiceStatus(null);

    const payload: IndustryServiceDefinition = {
      id: serviceId,
      industryId: form.id,
      name,
      duration: durationValue,
      price: priceValue,
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
    setServiceForm(emptyServiceForm);
    setSelectedServiceId('');
    setIsCreatingService(false);
    setServiceStatus('Service deleted.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-sm text-slate-400">Edit base game content directly</p>
        </header>

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
                  <button
                    onClick={handleCreateEvent}
                    className="px-3 py-2 text-sm font-medium rounded-lg border border-fuchsia-500 text-fuchsia-200 hover:bg-fuchsia-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isCreating || !form.id}
                  >
                    + New Event
                  </button>
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
                                          setChoiceForm({ id: '', label: '', description: '', cost: '' });
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
                                          <div className="flex gap-2">
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
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          {consequenceForm.effects.map((ef, idx) => (
                                            <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                                              <div>
                                                <label className="block text-xs text-slate-400 mb-1">Type</label>
                                                <select
                                                  value={ef.type}
                                                  onChange={(e) => setConsequenceForm((p) => ({
                                                    ...p,
                                                    effects: p.effects.map((row, i) => i === idx ? { ...row, type: e.target.value as 'cash' | 'reputation' } : row),
                                                  }))}
                                                  className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                >
                                                  <option value="cash">Cash</option>
                                                  <option value="reputation">Reputation</option>
                                                </select>
                                              </div>
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
                                              <div className="sm:col-span-3">
                                                <button
                                                  type="button"
                                                  onClick={() => setConsequenceForm((p) => ({
                                                    ...p,
                                                    effects: p.effects.filter((_, i) => i !== idx),
                                                  }))}
                                                  className="text-xs text-rose-300 hover:text-rose-200"
                                                >
                                                  Remove
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Temporary Effects editor */}
                                      <div className="md:col-span-2">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-sm font-semibold text-slate-300">Temporary Effects</span>
                                          <button
                                            type="button"
                                            onClick={() => setConsequenceForm((p) => ({ ...p, temporaryEffects: [...p.temporaryEffects, { metric: METRIC_OPTIONS[0].value, type: EFFECT_TYPE_OPTIONS[0].value, value: '0', durationSeconds: '10' }] }))}
                                            className="px-2 py-1 text-xs rounded border border-indigo-500 text-indigo-200 hover:bg-indigo-500/10"
                                          >
                                            + Add Temporary Effect
                                          </button>
                                        </div>
                                        <div className="space-y-2">
                                          {consequenceForm.temporaryEffects.map((t, idx) => (
                                            <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                                              <div>
                                                <label className="block text-xs text-slate-400 mb-1">Metric</label>
                                                <select
                                                  value={t.metric}
                                                  onChange={(e) => setConsequenceForm((p) => ({
                                                    ...p,
                                                    temporaryEffects: p.temporaryEffects.map((row, i) => i === idx ? { ...row, metric: e.target.value as GameMetric } : row),
                                                  }))}
                                                  className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                >
                                                  {METRIC_OPTIONS.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                  ))}
                                                </select>
                                              </div>
                                              <div>
                                                <label className="block text-xs text-slate-400 mb-1">Type</label>
                                                <select
                                                  value={t.type}
                                                  onChange={(e) => setConsequenceForm((p) => ({
                                                    ...p,
                                                    temporaryEffects: p.temporaryEffects.map((row, i) => i === idx ? { ...row, type: e.target.value as EffectType } : row),
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
                                                  value={t.value}
                                                  onChange={(e) => setConsequenceForm((p) => ({
                                                    ...p,
                                                    temporaryEffects: p.temporaryEffects.map((row, i) => i === idx ? { ...row, value: e.target.value } : row),
                                                  }))}
                                                  className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-xs text-slate-400 mb-1">Duration (s)</label>
                                                <input
                                                  type="number"
                                                  min="1"
                                                  value={t.durationSeconds}
                                                  onChange={(e) => setConsequenceForm((p) => ({
                                                    ...p,
                                                    temporaryEffects: p.temporaryEffects.map((row, i) => i === idx ? { ...row, durationSeconds: e.target.value } : row),
                                                  }))}
                                                  className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-xs text-slate-400 mb-1">Priority (opt)</label>
                                                <input
                                                  type="number"
                                                  value={t.priority ?? ''}
                                                  onChange={(e) => setConsequenceForm((p) => ({
                                                    ...p,
                                                    temporaryEffects: p.temporaryEffects.map((row, i) => i === idx ? { ...row, priority: e.target.value } : row),
                                                  }))}
                                                  className="w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-slate-200 text-sm"
                                                />
                                              </div>
                                              <div className="sm:col-span-5">
                                                <button
                                                  type="button"
                                                  onClick={() => setConsequenceForm((p) => ({
                                                    ...p,
                                                    temporaryEffects: p.temporaryEffects.filter((_, i) => i !== idx),
                                                  }))}
                                                  className="text-xs text-rose-300 hover:text-rose-200"
                                                >
                                                  Remove Temporary Effect
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
                                              setConsequenceForm({ id: '', label: '', description: '', weight: '1', effects: [], temporaryEffects: [] });
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
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Duration (seconds)</label>
                      <input
                        type="number"
                        min="1"
                        value={campaignForm.durationSeconds}
                        onChange={(e) => setCampaignForm((p) => ({ ...p, durationSeconds: e.target.value }))}
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
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
                          onClick={() => setCampaignEffectsForm((prev) => [...prev, { metric: GameMetric.SpawnIntervalSeconds, type: EffectType.Add, value: '0' }])}
                          className="px-2 py-1 text-xs rounded-md border border-slate-600 text-slate-200 hover:bg-slate-800"
                        >
                          + Add Effect
                        </button>
                      </div>
                      <div className="space-y-2">
                        {campaignEffectsForm.map((ef, idx) => (
                          <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
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
                            setCampaignForm({ id: '', name: '', description: '', cost: '0', durationSeconds: '10' });
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
                                setUpgradeForm({ id: '', name: '', description: '', icon: '⚙️', cost: '0', maxLevel: '1' });
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

        <section className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-2xl font-semibold">Staff</h2>
            <p className="text-sm text-slate-400 mt-1">Manage staff roles and initial presets for this industry.</p>
          </div>
          <div className="p-6 space-y-6">
            {!form.id ? (
              <div className="text-sm text-slate-400">Select or create an industry first.</div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={handleCreateRole}
                    className="px-3 py-2 text-sm font-medium rounded-lg border border-indigo-500 text-indigo-200 hover:bg-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isCreating || !form.id}
                  >
                    + New Role
                  </button>
                  {staffStatus && <span className="text-sm text-slate-300">{staffStatus}</span>}
                </div>

                {staffLoading ? (
                  <div className="text-sm text-slate-400">Loading staff…</div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Roles</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {staffRoles.map((role) => (
                          <button
                            key={role.id}
                            onClick={() => selectRole(role)}
                            className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                              selectedRoleId === role.id && !isCreatingRole
                                ? 'border-indigo-400 bg-indigo-500/10 text-indigo-200'
                                : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                            }`}
                          >
                            {role.emoji} {role.name}
                          </button>
                        ))}
                      </div>

                      {(selectedRoleId || isCreatingRole) && (
                        <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1">Role ID</label>
                            <input
                              value={roleForm.id}
                              onChange={(e) => setRoleForm((p) => ({ ...p, id: e.target.value }))}
                              disabled={!isCreatingRole && !!selectedRoleId}
                              className={`w-full rounded-lg border px-3 py-2 text-slate-200 ${
                                isCreatingRole || !selectedRoleId ? 'bg-slate-900 border-slate-600' : 'bg-slate-800 border-slate-700 cursor-not-allowed'
                              }`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1">Name</label>
                          <input
                            value={roleForm.name}
                            onChange={(e) => setRoleForm((p) => ({ ...p, name: e.target.value }))}
                            onBlur={() => {
                              if (!roleForm.id && roleForm.name.trim()) {
                                const base = slugify(roleForm.name.trim());
                                const unique = makeUniqueId(base, new Set(staffRoles.map((r) => r.id)));
                                setRoleForm((prev) => ({ ...prev, id: unique }));
                              }
                            }}
                            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                          />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1">Salary</label>
                            <input
                              type="number"
                              min="0"
                              value={roleForm.salary}
                              onChange={(e) => setRoleForm((p) => ({ ...p, salary: e.target.value }))}
                              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1">Service Speed</label>
                            <input
                              type="number"
                              min="0"
                              value={roleForm.serviceSpeed}
                              onChange={(e) => setRoleForm((p) => ({ ...p, serviceSpeed: e.target.value }))}
                              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-300 mb-1">Emoji</label>
                            <input
                              value={roleForm.emoji}
                              onChange={(e) => setRoleForm((p) => ({ ...p, emoji: e.target.value }))}
                              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                            />
                          </div>
                          <div className="md:col-span-2 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={handleSaveRole}
                              disabled={roleSaving || roleDeleting}
                              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                roleSaving ? 'bg-indigo-900 text-indigo-200 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                              }`}
                            >
                              {roleSaving ? 'Saving…' : 'Save Role'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedRoleId && !isCreatingRole) {
                                  const existing = staffRoles.find((r) => r.id === selectedRoleId);
                                  if (existing) selectRole(existing);
                                } else {
                                  setIsCreatingRole(false);
                                  setSelectedRoleId('');
                                  setRoleForm({ id: '', name: '', salary: '0', serviceSpeed: '0', emoji: '🧑‍💼' });
                                }
                                setStaffStatus(null);
                              }}
                              disabled={roleSaving || roleDeleting}
                              className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                            >
                              {isCreatingRole ? 'Cancel' : 'Reset'}
                            </button>
                            {!isCreatingRole && selectedRoleId && (
                              <button
                                type="button"
                                onClick={handleDeleteRole}
                                disabled={roleDeleting || roleSaving}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                  roleDeleting ? 'bg-rose-900 text-rose-200 cursor-wait' : 'bg-rose-600 hover:bg-rose-500 text-white'
                                }`}
                              >
                                {roleDeleting ? 'Deleting…' : 'Delete'}
                              </button>
                            )}
                          </div>
                        </form>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">Initial Presets</h3>
                        <button
                          onClick={handleCreatePreset}
                          className="px-3 py-2 text-sm font-medium rounded-lg border border-emerald-500 text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!form.id}
                        >
                          + New Preset
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {staffPresets.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => selectPreset(preset)}
                            className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
                              selectedPresetId === preset.id && !isCreatingPreset
                                ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200'
                                : 'border-slate-700 bg-slate-800 hover:bg-slate-700/60'
                            }`}
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>

                      {(selectedPresetId || isCreatingPreset) && (
                        <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1">Preset ID</label>
                            <input
                              value={presetForm.id}
                              onChange={(e) => setPresetForm((p) => ({ ...p, id: e.target.value }))}
                              disabled={!isCreatingPreset && !!selectedPresetId}
                              className={`w-full rounded-lg border px-3 py-2 text-slate-200 ${
                                isCreatingPreset || !selectedPresetId ? 'bg-slate-900 border-slate-600' : 'bg-slate-800 border-slate-700 cursor-not-allowed'
                              }`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1">Name (optional)</label>
                          <input
                            value={presetForm.name}
                            onChange={(e) => setPresetForm((p) => ({ ...p, name: e.target.value }))}
                            onBlur={() => {
                              if (!presetForm.id && presetForm.name.trim()) {
                                const base = slugify(presetForm.name.trim());
                                const unique = makeUniqueId(base, new Set(staffPresets.map((p) => p.id)));
                                setPresetForm((prev) => ({ ...prev, id: unique }));
                              }
                            }}
                            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                          />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1">Role</label>
                            <select
                              value={presetForm.roleId}
                              onChange={(e) => setPresetForm((p) => ({ ...p, roleId: e.target.value }))}
                              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                            >
                              {staffRoles.map((role) => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1">Salary Override</label>
                            <input
                              type="number"
                              min="0"
                              value={presetForm.salary ?? ''}
                              onChange={(e) => setPresetForm((p) => ({ ...p, salary: e.target.value }))}
                              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1">Service Speed Override</label>
                            <input
                              type="number"
                              min="0"
                              value={presetForm.serviceSpeed ?? ''}
                              onChange={(e) => setPresetForm((p) => ({ ...p, serviceSpeed: e.target.value }))}
                              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-300 mb-1">Emoji (optional)</label>
                            <input
                              value={presetForm.emoji ?? ''}
                              onChange={(e) => setPresetForm((p) => ({ ...p, emoji: e.target.value }))}
                              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-200"
                            />
                          </div>
                          <div className="md:col-span-2 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={handleSavePreset}
                              disabled={presetSaving || presetDeleting}
                              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                presetSaving ? 'bg-emerald-900 text-emerald-200 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              }`}
                            >
                              {presetSaving ? 'Saving…' : 'Save Preset'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
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
                              disabled={presetSaving || presetDeleting}
                              className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800"
                            >
                              {isCreatingPreset ? 'Cancel' : 'Reset'}
                            </button>
                            {!isCreatingPreset && selectedPresetId && (
                              <button
                                type="button"
                                onClick={handleDeletePreset}
                                disabled={presetDeleting || presetSaving}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                  presetDeleting ? 'bg-rose-900 text-rose-200 cursor-wait' : 'bg-rose-600 hover:bg-rose-500 text-white'
                                }`}
                              >
                                {presetDeleting ? 'Deleting…' : 'Delete'}
                              </button>
                            )}
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
