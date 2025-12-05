import { useState, useCallback, useEffect } from 'react';
import { fetchStaffDataForIndustry, upsertStaffRole, deleteStaffRole } from '@/lib/data/staffRepository';
import type { StaffRoleConfig } from '@/lib/game/staffConfig';
import type { Requirement } from '@/lib/game/types';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import type { Operation } from './types';

interface RoleForm {
  id: string;
  name: string;
  salary: string;
  effects: Array<{ metric: GameMetric; type: EffectType; value: string }>;
  spriteImage?: string;
  setsFlag?: string;
  requirements: Requirement[];
}

export function useRoles(industryId: string, roleId?: string) {
  const [roles, setRoles] = useState<StaffRoleConfig[]>([]);
  const [operation, setOperation] = useState<Operation>('idle');
  const [status, setStatus] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<RoleForm>({
    id: '',
    name: '',
    salary: '0',
    effects: [],
    spriteImage: '',
    requirements: [],
  });

  const load = useCallback(async () => {
    if (!industryId) return;
    setOperation('loading');
    setStatus(null);
    const data = await fetchStaffDataForIndustry(industryId);
    setOperation('idle');
    if (!data) {
      setRoles([]);
      return;
    }
    const rolesSorted = data.roles.slice().sort((a, b) => a.name.localeCompare(b.name));
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
      name: '',
      salary: '0',
      effects: [],
      spriteImage: '',
      requirements: [],
    });
    setStatus(null);
  }, [industryId]);

  const selectRole = useCallback((role: StaffRoleConfig, resetMsg = true) => {
    setSelectedId(role.id);
    setIsCreating(false);
    const effects = role.effects || [];
    setForm({
      id: role.id,
      name: role.name,
      salary: String(role.salary),
      effects: effects.map(e => ({ metric: e.metric, type: e.type, value: String(e.value) })),
      spriteImage: role.spriteImage || '',
      setsFlag: role.setsFlag,
      requirements: role.requirements || [],
    });
    if (resetMsg) setStatus(null);
  }, []);

  // Select role when roleId changes or roles are loaded
  useEffect(() => {
    if (roleId && roles.length > 0) {
      const role = roles.find(r => r.id === roleId);
      if (role) {
        setSelectedId(role.id);
        setIsCreating(false);
        const effects = role.effects || [];
        setForm({
          id: role.id,
          name: role.name,
          salary: String(role.salary),
          effects: effects.map(e => ({ metric: e.metric, type: e.type, value: String(e.value) })),
          spriteImage: role.spriteImage || '',
          setsFlag: role.setsFlag,
          requirements: role.requirements || [],
        });
        setStatus(null);
      }
    }
  }, [roleId, roles]);

  const createRole = useCallback(() => {
    if (!industryId) {
      setStatus('Save the industry first.');
      return;
    }
    setIsCreating(true);
    setSelectedId('');
    setForm({
      id: '',
      name: '',
      salary: '0',
      effects: [],
      requirements: [],
    });
    setStatus(null);
  }, [industryId]);

  const saveRole = useCallback(async () => {
    if (!industryId) {
      setStatus('Save the industry first.');
      return;
    }
    const id = form.id.trim();
    const name = form.name.trim();
    const salary = Number(form.salary);
    if (!id || !name) {
      setStatus('Role id and name are required.');
      return;
    }
    if (!Number.isFinite(salary) || salary < 0) {
      setStatus('Salary must be non-negative.');
      return;
    }
    const effects = form.effects.map(e => ({
      metric: e.metric,
      type: e.type,
      value: Number(e.value) || 0,
    }));
    const setsFlag = form.setsFlag?.trim() || undefined;
    const requirements = form.requirements;
    setOperation('saving');
    const result = await upsertStaffRole({
      id,
      industryId,
      name,
      salary,
      effects,
      spriteImage: form.spriteImage?.trim() || undefined,
      setsFlag,
      requirements,
    });
    setOperation('idle');
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
        setsFlag,
        requirements,
      };
      const next = exists ? prev.map((r) => (r.id === id ? nextItem : r)) : [...prev, nextItem];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    setStatus('Role saved.');
    setIsCreating(false);
    setSelectedId(id);
  }, [industryId, form]);

  const deleteRole = useCallback(async () => {
    if (isCreating || !selectedId) return;
    const role = roles.find(r => r.id === selectedId);
    if (!window.confirm(`Delete role "${role?.name || selectedId}"?`)) return;
    setOperation('deleting');
    const result = await deleteStaffRole(selectedId, industryId);
    setOperation('idle');
    if (!result.success) {
      setStatus(result.message ?? 'Failed to delete role.');
      return;
    }
    setRoles((prev) => prev.filter((r) => r.id !== selectedId));
    setSelectedId('');
    setForm({
      id: '',
      name: '',
      salary: '0',
      effects: [],
      requirements: [],
    });
    setStatus('Role deleted.');
  }, [selectedId, isCreating, roles, industryId]);

  const reset = useCallback(() => {
    if (selectedId && !isCreating) {
      const existing = roles.find(r => r.id === selectedId);
      if (existing) selectRole(existing);
    } else {
      setIsCreating(false);
      setSelectedId('');
      setForm({
        id: '',
        name: '',
        salary: '0',
        effects: [],
        requirements: [],
      });
    }
    setStatus(null);
  }, [selectedId, isCreating, roles, selectRole]);

  const updateForm = useCallback((updates: Partial<RoleForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  }, []);

  return {
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
    selectRole,
    createRole,
    saveRole,
    deleteRole,
    reset,
    updateForm,
  };
}
