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
