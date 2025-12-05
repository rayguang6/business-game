import { useState, useCallback, useEffect } from 'react';
import { fetchStaffData, upsertStaffPresetAction, deleteStaffPresetAction } from '@/lib/server/actions/adminActions';
import type { StaffPreset, StaffRoleConfig } from '@/lib/game/staffConfig';
import type { Operation } from './types';

interface PresetForm {
  id: string;
  roleId: string;
  name: string;
  salary?: string;
  serviceSpeed?: string;
}

export function usePresets(industryId: string, presetId?: string) {
  const [presets, setPresets] = useState<StaffPreset[]>([]);
  const [roles, setRoles] = useState<StaffRoleConfig[]>([]);
  const [operation, setOperation] = useState<Operation>('idle');
  const [status, setStatus] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<PresetForm>({
    id: '',
    roleId: '',
    name: '',
  });

  const load = useCallback(async () => {
    if (!industryId) return;
    setOperation('loading');
    setStatus(null);
    const data = await fetchStaffData(industryId);
    setOperation('idle');
    if (!data) {
      setPresets([]);
      setRoles([]);
      return;
    }
    const presetsSorted = data.initialStaff.slice().sort((a, b) => a.name.localeCompare(b.name));
    const rolesSorted = data.roles.slice().sort((a, b) => a.name.localeCompare(b.name));
    setPresets(presetsSorted);
    setRoles(rolesSorted);
  }, [industryId]);

  // Auto-load when industryId changes
  useEffect(() => {
    load();
  }, [load]);

  // Reset form state when industry changes
  useEffect(() => {
    setSelectedId('');
    setIsCreating(false);
    setForm({
      id: '',
      roleId: '',
      name: '',
    });
    setStatus(null);
  }, [industryId]);

  const selectPreset = useCallback((preset: StaffPreset, resetMsg = true) => {
    setSelectedId(preset.id);
    setIsCreating(false);
    setForm({
      id: preset.id,
      roleId: preset.roleId,
      name: preset.name,
      salary: preset.salary !== undefined ? String(preset.salary) : undefined,
      serviceSpeed: preset.serviceSpeed !== undefined ? String(preset.serviceSpeed) : undefined,
    });
    if (resetMsg) setStatus(null);
  }, []);

  // Select preset when presetId changes or presets are loaded
  useEffect(() => {
    if (presetId && presets.length > 0) {
      const preset = presets.find(p => p.id === presetId);
      if (preset) {
        setSelectedId(preset.id);
        setIsCreating(false);
        setForm({
          id: preset.id,
          roleId: preset.roleId,
          name: preset.name,
          salary: preset.salary !== undefined ? String(preset.salary) : undefined,
          serviceSpeed: preset.serviceSpeed !== undefined ? String(preset.serviceSpeed) : undefined,
        });
        setStatus(null);
      }
    }
  }, [presetId, presets]);

  const createPreset = useCallback(() => {
    if (!industryId) {
      setStatus('Save the industry first.');
      return;
    }
    setIsCreating(true);
    setSelectedId('');
    setForm({
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
    const id = form.id.trim();
    const roleId = form.roleId.trim();
    const name = form.name.trim();
    if (!id || !roleId || !name) {
      setStatus('Preset id, role, and name are required.');
      return;
    }

    // Validate that the selected role exists for this industry
    const roleExists = roles.some(role => role.id === roleId);
    if (!roleExists) {
      setStatus('Selected role does not exist for this industry.');
      return;
    }
    const salary = form.salary !== undefined && form.salary !== '' ? Number(form.salary) : undefined;
    const serviceSpeed = form.serviceSpeed !== undefined && form.serviceSpeed !== '' ? Number(form.serviceSpeed) : undefined;
    if ((salary !== undefined && (!Number.isFinite(salary) || salary < 0)) || (serviceSpeed !== undefined && (!Number.isFinite(serviceSpeed) || serviceSpeed < 0))) {
      setStatus('Overrides must be non-negative numbers.');
      return;
    }

    const presetData = {
      id,
      industryId,
      roleId,
      name,
      salary,
      serviceSpeed,
    };

    setOperation('saving');
    const result = await upsertStaffPresetAction(presetData);
    setOperation('idle');
    if (!result.success) {
      setStatus(result.message ?? 'Failed to save preset.');
      return;
    }
    setPresets((prev) => {
      const exists = prev.some((p) => p.id === id);
      const nextItem: StaffPreset = { id, roleId, name };
      if (salary !== undefined) (nextItem as any).salary = salary;
      if (serviceSpeed !== undefined) (nextItem as any).serviceSpeed = serviceSpeed;
      const next = exists ? prev.map((p) => (p.id === id ? nextItem : p)) : [...prev, nextItem];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    setStatus('Preset saved.');
    // Stay in create mode to allow creating another preset
    setSelectedId('');
    setForm({
      id: '',
      roleId: roles[0]?.id ?? '',
      name: '',
    });
  }, [industryId, form, roles]);

  const deletePreset = useCallback(async () => {
    if (isCreating || !selectedId) return;
    const preset = presets.find(p => p.id === selectedId);
    if (!window.confirm(`Delete preset "${preset?.name || selectedId}"?`)) return;
    setOperation('deleting');
    const result = await deleteStaffPresetAction(selectedId, industryId as any);
    setOperation('idle');
    if (!result.success) {
      setStatus(result.message ?? 'Failed to delete preset.');
      return;
    }
    setPresets((prev) => prev.filter((p) => p.id !== selectedId));
    setSelectedId('');
    setForm({
      id: '',
      roleId: roles[0]?.id ?? '',
      name: '',
    });
    setStatus('Preset deleted.');
  }, [selectedId, isCreating, presets, roles, industryId]);

  const reset = useCallback(() => {
    if (selectedId && !isCreating) {
      const existing = presets.find(p => p.id === selectedId);
      if (existing) selectPreset(existing);
    } else {
      setIsCreating(false);
      setSelectedId('');
      setForm({
        id: '',
        roleId: roles[0]?.id ?? '',
        name: '',
      });
    }
    setStatus(null);
  }, [selectedId, isCreating, presets, selectPreset, roles]);

  const updateForm = useCallback((updates: Partial<PresetForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    presets,
    roles,
    loading: operation === 'loading',
    status,
    selectedId,
    isCreating,
    saving: operation === 'saving',
    deleting: operation === 'deleting',
    operation,
    form,
    load,
    selectPreset,
    createPreset,
    savePreset,
    deletePreset,
    reset,
    updateForm,
  };
}
