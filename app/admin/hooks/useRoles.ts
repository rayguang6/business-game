import { useState, useCallback, useEffect } from 'react';
import { fetchStaffData, upsertStaffRoleAction, deleteStaffRoleAction } from '@/lib/server/actions/adminActions';
import type { StaffRoleConfig } from '@/lib/game/staffConfig';
import type { Requirement } from '@/lib/game/types';
import { GameMetric, EffectType } from '@/lib/game/effectManager';
import type { Operation } from './types';
import { useToastFunctions } from '../components/ui/ToastContext';

interface RoleForm {
  id: string;
  name: string;
  salary: string;
  effects: Array<{ metric: GameMetric; type: EffectType; value: string }>;
  spriteImage?: string;
  setsFlag?: string;
  requirements: Requirement[];
  order: string;
}

export function useRoles(industryId: string, roleId?: string) {
  const [roles, setRoles] = useState<StaffRoleConfig[]>([]);
  const [operation, setOperation] = useState<Operation>('idle');
  const { success, error } = useToastFunctions();
  const [selectedId, setSelectedId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<RoleForm>({
    id: '',
    name: '',
    salary: '0',
    effects: [],
    spriteImage: '',
    requirements: [],
    order: '',
  });

  const load = useCallback(async () => {
    if (!industryId) return;
    setOperation('loading');
    const data = await fetchStaffData(industryId);
    setOperation('idle');
    if (!data) {
      setRoles([]);
      return;
    }
    const rolesSorted = data.roles.slice().sort((a, b) => {
      // Null/undefined orders go to the end
      const aOrderNull = a.order == null;
      const bOrderNull = b.order == null;
      if (aOrderNull && bOrderNull) return a.name.localeCompare(b.name);
      if (aOrderNull) return 1;
      if (bOrderNull) return -1;
      if (a.order !== b.order) return (a.order ?? 0) - (b.order ?? 0);
      return a.name.localeCompare(b.name);
    });
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
      order: '',
    });
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
      order: role.order != null ? String(role.order) : '',
    });
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
          order: role.order != null ? String(role.order) : '',
        });
      }
    }
  }, [roleId, roles]);

  const createRole = useCallback(() => {
    if (!industryId) {
      error('Save the industry first.');
      return;
    }
    setIsCreating(true);
    setSelectedId('');
    setForm({
      id: '',
      name: '',
      salary: '0',
      effects: [],
      spriteImage: '',
      requirements: [],
      order: '',
    });
  }, [industryId, error]);

  const saveRole = useCallback(async () => {
    if (!industryId) {
      error('Save the industry first.');
      return;
    }
    const id = form.id.trim();
    const name = form.name.trim();
    const salary = Number(form.salary);
    if (!id || !name) {
      error('Role id and name are required.');
      return;
    }
    if (!Number.isFinite(salary) || salary < 0) {
      error('Salary must be non-negative.');
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
    const order = form.order?.trim() ? Number(form.order.trim()) : undefined;

    const result = await upsertStaffRoleAction({
      id,
      industryId,
      name,
      salary,
      effects,
      spriteImage: form.spriteImage?.trim() || undefined,
      setsFlag,
      requirements,
      order,
    });
    setOperation('idle');
    if (!result.success) {
      error(result.message ?? 'Failed to save role.');
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
        order,
      };
      const next = exists ? prev.map((r) => (r.id === id ? nextItem : r)) : [...prev, nextItem];
      return next.sort((a, b) => {
        // Null/undefined orders go to the end
        const aOrderNull = a.order == null;
        const bOrderNull = b.order == null;
        if (aOrderNull && bOrderNull) return a.name.localeCompare(b.name);
        if (aOrderNull) return 1;
        if (bOrderNull) return -1;
        if (a.order !== b.order) return (a.order ?? 0) - (b.order ?? 0);
        return a.name.localeCompare(b.name);
      });
    });
    success('Role saved.');
    setIsCreating(false);
    setSelectedId(id);
  }, [industryId, form, error, success]);

  const deleteRole = useCallback(async () => {
    if (isCreating || !selectedId) return;
    const role = roles.find(r => r.id === selectedId);
    if (!window.confirm(`Delete role "${role?.name || selectedId}"?`)) return;
    setOperation('deleting');
    const result = await deleteStaffRoleAction(selectedId, industryId as any);
    setOperation('idle');
    if (!result.success) {
      error(result.message ?? 'Failed to delete role.');
      return;
    }
    setRoles((prev) => prev.filter((r) => r.id !== selectedId));
    setSelectedId('');
    setForm({
      id: '',
      name: '',
      salary: '0',
      effects: [],
      spriteImage: '',
      requirements: [],
      order: '',
    });
    success('Role deleted.');
  }, [selectedId, isCreating, roles, industryId, error, success]);

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
        order: '',
      });
    }
  }, [selectedId, isCreating, roles, selectRole]);

  const updateForm = useCallback((updates: Partial<RoleForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    roles,
    loading: operation === 'loading',
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
