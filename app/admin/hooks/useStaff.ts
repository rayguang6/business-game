import { useState, useCallback } from 'react';
import { fetchStaffDataForIndustry, upsertStaffRole, deleteStaffRole, upsertStaffPreset, deleteStaffPreset } from '@/lib/data/staffRepository';
import type { StaffRoleConfig, StaffPreset } from '@/lib/game/staffConfig';
import type { Requirement } from '@/lib/game/types';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import type { Operation } from './types';

interface RoleForm {
  id: string;
  name: string;
  salary: string;
  effects: Array<{ metric: GameMetric; type: EffectType; value: string }>;
  emoji: string;
  setsFlag?: string;
  requirements: Requirement[];
}

interface PresetForm {
  id: string;
  roleId: string;
  name: string;
  salary?: string;
  serviceSpeed?: string;
  emoji?: string;
}

export function useStaff(industryId: string) {
  const [roles, setRoles] = useState<StaffRoleConfig[]>([]);
  const [presets, setPresets] = useState<StaffPreset[]>([]);
  const [operation, setOperation] = useState<Operation>('idle');
  const [status, setStatus] = useState<string | null>(null);
  
  // Role state
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [roleOperation, setRoleOperation] = useState<Operation>('idle');
  const [roleForm, setRoleForm] = useState<RoleForm>({
    id: '',
    name: '',
    salary: '0',
    effects: [],
    emoji: '🧑‍💼',
    requirements: [],
  });

  // Preset state
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  const [presetOperation, setPresetOperation] = useState<Operation>('idle');
  const [presetForm, setPresetForm] = useState<PresetForm>({
    id: '',
    roleId: '',
    name: '',
  });

  const load = useCallback(async () => {
    if (!industryId) return;
    setOperation('loading');
    setStatus(null);
    const data = await fetchStaffDataForIndustry(industryId);
    setOperation('idle');
    if (!data) {
      setRoles([]);
      setPresets([]);
      return;
    }
    const rolesSorted = data.roles.slice().sort((a, b) => a.name.localeCompare(b.name));
    const presetsSorted = data.initialStaff.slice().sort((a, b) => a.name.localeCompare(b.name));
    setRoles(rolesSorted);
    setPresets(presetsSorted);
    if (rolesSorted.length > 0) {
      selectRole(rolesSorted[0], false);
    }
    if (presetsSorted.length > 0) {
      selectPreset(presetsSorted[0], false);
    }
  }, [industryId]);

  const selectRole = useCallback((role: StaffRoleConfig, resetMsg = true) => {
    setSelectedRoleId(role.id);
    setIsCreatingRole(false);
    const effects = role.effects || [];
    // Handle legacy format
    if (effects.length === 0 && ('serviceSpeed' in role || 'workloadReduction' in role)) {
      const legacyEffects: Array<{ metric: GameMetric; type: EffectType; value: string }> = [];
      if ('serviceSpeed' in role && (role as any).serviceSpeed > 0) {
        legacyEffects.push({
          metric: GameMetric.ServiceSpeedMultiplier,
          type: EffectType.Percent,
          value: String((role as any).serviceSpeed),
        });
      }
      if ('workloadReduction' in role && (role as any).workloadReduction > 0) {
        legacyEffects.push({
          metric: GameMetric.FounderWorkingHours,
          type: EffectType.Add,
          value: String(-(role as any).workloadReduction),
        });
      }
      setRoleForm({
        id: role.id,
        name: role.name,
        salary: String(role.salary),
        effects: legacyEffects,
        emoji: role.emoji,
        setsFlag: role.setsFlag,
        requirements: role.requirements || [],
      });
    } else {
      setRoleForm({
        id: role.id,
        name: role.name,
        salary: String(role.salary),
        effects: effects.map(e => ({ metric: e.metric, type: e.type, value: String(e.value) })),
        emoji: role.emoji,
        setsFlag: role.setsFlag,
        requirements: role.requirements || [],
      });
    }
    if (resetMsg) setStatus(null);
  }, []);

  const createRole = useCallback(() => {
    if (!industryId) {
      setStatus('Save the industry first.');
      return;
    }
    setIsCreatingRole(true);
    setSelectedRoleId('');
    setRoleForm({
      id: '',
      name: '',
      salary: '0',
      effects: [],
      emoji: '🧑‍💼',
      requirements: [],
    });
    setStatus(null);
  }, [industryId]);

  const saveRole = useCallback(async () => {
    if (!industryId) {
      setStatus('Save the industry first.');
      return;
    }
    const id = roleForm.id.trim();
    const name = roleForm.name.trim();
    const salary = Number(roleForm.salary);
    if (!id || !name) {
      setStatus('Role id and name are required.');
      return;
    }
    if (!Number.isFinite(salary) || salary < 0) {
      setStatus('Salary must be non-negative.');
      return;
    }
    const effects = roleForm.effects.map(e => ({
      metric: e.metric,
      type: e.type,
      value: Number(e.value) || 0,
    }));
    const setsFlag = roleForm.setsFlag?.trim() || undefined;
    const requirements = roleForm.requirements;
    setRoleOperation('saving');
    const result = await upsertStaffRole({
      id,
      industryId,
      name,
      salary,
      effects,
      emoji: roleForm.emoji.trim() || undefined,
      setsFlag,
      requirements,
    });
    setRoleOperation('idle');
    if (!result.success) {
      setStatus(result.message ?? 'Failed to save role.');
      return;
    }
    setRoles((prev) => {
      const exists = prev.some((r) => r.id === id);
      const nextItem: StaffRoleConfig = {
        id,
        name,
        salary,
        effects,
        emoji: roleForm.emoji.trim() || '🧑‍💼',
        setsFlag,
        requirements,
      };
      const next = exists ? prev.map((r) => (r.id === id ? nextItem : r)) : [...prev, nextItem];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    setStatus('Role saved.');
    setIsCreatingRole(false);
    setSelectedRoleId(id);
  }, [industryId, roleForm]);

  const deleteRole = useCallback(async () => {
    if (isCreatingRole || !selectedRoleId) return;
    const hasPresets = presets.some((p) => p.roleId === selectedRoleId);
    if (hasPresets) {
      setStatus('Delete presets using this role first.');
      return;
    }
    const role = roles.find(r => r.id === selectedRoleId);
    if (!window.confirm(`Delete role "${role?.name || selectedRoleId}"?`)) return;
    setRoleOperation('deleting');
    const result = await deleteStaffRole(selectedRoleId);
    setRoleOperation('idle');
    if (!result.success) {
      setStatus(result.message ?? 'Failed to delete role.');
      return;
    }
    setRoles((prev) => prev.filter((r) => r.id !== selectedRoleId));
    setSelectedRoleId('');
    setRoleForm({
      id: '',
      name: '',
      salary: '0',
      effects: [],
      emoji: '🧑‍💼',
      requirements: [],
    });
    setStatus('Role deleted.');
  }, [selectedRoleId, isCreatingRole, presets, roles]);

  const selectPreset = useCallback((preset: StaffPreset, resetMsg = true) => {
    setSelectedPresetId(preset.id);
    setIsCreatingPreset(false);
    setPresetForm({
      id: preset.id,
      roleId: preset.roleId,
      name: preset.name,
      salary: preset.salary !== undefined ? String(preset.salary) : undefined,
      serviceSpeed: preset.serviceSpeed !== undefined ? String(preset.serviceSpeed) : undefined,
      emoji: preset.emoji,
    });
    if (resetMsg) setStatus(null);
  }, []);

  const createPreset = useCallback(() => {
    if (!industryId) {
      setStatus('Save the industry first.');
      return;
    }
    setIsCreatingPreset(true);
    setSelectedPresetId('');
    setPresetForm({
      id: '',
      roleId: roles[0]?.id ?? '',
      name: '',
    });
    setStatus(null);
  }, [industryId, roles]);

  const savePreset = useCallback(async () => {
    if (!industryId) {
      setStatus('Save the industry first.');
      return;
    }
    const id = presetForm.id.trim();
    const roleId = presetForm.roleId.trim();
    const name = presetForm.name.trim();
    if (!id || !roleId) {
      setStatus('Preset id and role are required.');
      return;
    }
    const salary = presetForm.salary !== undefined && presetForm.salary !== '' ? Number(presetForm.salary) : undefined;
    const serviceSpeed = presetForm.serviceSpeed !== undefined && presetForm.serviceSpeed !== '' ? Number(presetForm.serviceSpeed) : undefined;
    if ((salary !== undefined && (!Number.isFinite(salary) || salary < 0)) || (serviceSpeed !== undefined && (!Number.isFinite(serviceSpeed) || serviceSpeed < 0))) {
      setStatus('Overrides must be non-negative numbers.');
      return;
    }
    setPresetOperation('saving');
    const result = await upsertStaffPreset({
      id,
      industryId,
      roleId,
      name: name || undefined,
      salary,
      serviceSpeed,
      emoji: presetForm.emoji?.trim() || undefined,
    });
    setPresetOperation('idle');
    if (!result.success) {
      setStatus(result.message ?? 'Failed to save preset.');
      return;
    }
    setPresets((prev) => {
      const exists = prev.some((p) => p.id === id);
      const nextItem: StaffPreset = { id, roleId, name: name || 'Staff' };
      if (salary !== undefined) (nextItem as any).salary = salary;
      if (serviceSpeed !== undefined) (nextItem as any).serviceSpeed = serviceSpeed;
      if (presetForm.emoji?.trim()) (nextItem as any).emoji = presetForm.emoji.trim();
      const next = exists ? prev.map((p) => (p.id === id ? nextItem : p)) : [...prev, nextItem];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    setStatus('Preset saved.');
    setIsCreatingPreset(false);
    setSelectedPresetId(id);
  }, [industryId, presetForm]);

  const deletePreset = useCallback(async () => {
    if (isCreatingPreset || !selectedPresetId) return;
    const preset = presets.find(p => p.id === selectedPresetId);
    if (!window.confirm(`Delete preset "${preset?.name || selectedPresetId}"?`)) return;
    setPresetOperation('deleting');
    const result = await deleteStaffPreset(selectedPresetId);
    setPresetOperation('idle');
    if (!result.success) {
      setStatus(result.message ?? 'Failed to delete preset.');
      return;
    }
    setPresets((prev) => prev.filter((p) => p.id !== selectedPresetId));
    setSelectedPresetId('');
    setPresetForm({
      id: '',
      roleId: roles[0]?.id ?? '',
      name: '',
    });
    setStatus('Preset deleted.');
  }, [selectedPresetId, isCreatingPreset, presets, roles]);

  const resetRole = useCallback(() => {
    if (selectedRoleId && !isCreatingRole) {
      const existing = roles.find(r => r.id === selectedRoleId);
      if (existing) selectRole(existing);
    } else {
      setIsCreatingRole(false);
      setSelectedRoleId('');
      setRoleForm({
        id: '',
        name: '',
        salary: '0',
        effects: [],
        emoji: '🧑‍💼',
        requirements: [],
      });
    }
    setStatus(null);
  }, [selectedRoleId, isCreatingRole, roles, selectRole]);

  const resetPreset = useCallback(() => {
    if (selectedPresetId && !isCreatingPreset) {
      const existing = presets.find(p => p.id === selectedPresetId);
      if (existing) selectPreset(existing);
    } else {
      setIsCreatingPreset(false);
      setSelectedPresetId('');
      setPresetForm({
        id: '',
        roleId: roles[0]?.id ?? '',
        name: '',
      });
    }
    setStatus(null);
  }, [selectedPresetId, isCreatingPreset, presets, selectPreset, roles]);

  const updateRoleForm = useCallback((updates: Partial<RoleForm>) => {
    setRoleForm(prev => ({ ...prev, ...updates }));
  }, []);

  const updatePresetForm = useCallback((updates: Partial<PresetForm>) => {
    setPresetForm(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    roles,
    presets,
    loading: operation === 'loading',
    status,
    selectedRoleId,
    isCreatingRole,
    roleSaving: roleOperation === 'saving',
    roleDeleting: roleOperation === 'deleting',
    roleForm,
    selectedPresetId,
    isCreatingPreset,
    presetSaving: presetOperation === 'saving',
    presetDeleting: presetOperation === 'deleting',
    presetForm,
    operation,
    roleOperation,
    presetOperation,
    load,
    selectRole,
    createRole,
    saveRole,
    deleteRole,
    resetRole,
    updateRoleForm,
    selectPreset,
    createPreset,
    savePreset,
    deletePreset,
    resetPreset,
    updatePresetForm,
  };
}

