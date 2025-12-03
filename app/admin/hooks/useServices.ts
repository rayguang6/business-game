import { useState, useCallback } from 'react';
import { fetchServicesForIndustry, upsertServiceForIndustry, deleteServiceById } from '@/lib/data/serviceRepository';
import type { IndustryServiceDefinition, Requirement, ServicePricingCategory } from '@/lib/game/types';
import type { Operation } from './types';

interface ServiceForm {
  id: string;
  name: string;
  duration: string;
  price: string;
  requirements: Requirement[];
  pricingCategory: string;
  weightage: string;
  requiredStaffRoleIds: string[]; // Array of staff role IDs
  timeCost: string;
}

export function useServices(industryId: string) {
  const [services, setServices] = useState<IndustryServiceDefinition[]>([]);
  const [operation, setOperation] = useState<Operation>('idle');
  const [status, setStatus] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<ServiceForm>({
    id: '',
    name: '',
    duration: '0',
    price: '0',
    requirements: [],
    pricingCategory: '',
    weightage: '1',
    requiredStaffRoleIds: [],
    timeCost: '0',
  });

  const load = useCallback(async () => {
    if (!industryId) return;
    setOperation('loading');
    setStatus(null);
    const result = await fetchServicesForIndustry(industryId);
    setOperation('idle');
    if (!result || result.length === 0) {
      setServices([]);
      return;
    }
    const sorted = result.slice().sort((a, b) => a.name.localeCompare(b.name));
    setServices(sorted);
    selectService(sorted[0], false);
  }, [industryId]);

  const selectService = useCallback((service: IndustryServiceDefinition, resetMsg = true) => {
    setSelectedId(service.id);
    setIsCreating(false);
    setForm({
      id: service.id,
      name: service.name,
      duration: service.duration.toString(),
      price: service.price.toString(),
      requirements: service.requirements || [],
      pricingCategory: service.pricingCategory || '',
      weightage: service.weightage?.toString() || '1',
      requiredStaffRoleIds: service.requiredStaffRoleIds || [],
      timeCost: service.timeCost?.toString() || '0',
    });
    if (resetMsg) setStatus(null);
  }, []);

  const createService = useCallback(() => {
    if (!industryId) {
      setStatus('Save the industry first.');
      return;
    }
    setIsCreating(true);
    setSelectedId('');
    setForm({
      id: '',
      name: '',
      duration: '0',
      price: '0',
      requirements: [],
      pricingCategory: '',
      weightage: '1',
      requiredStaffRoleIds: [],
      timeCost: '0',
    });
    setStatus(null);
  }, [industryId]);

  const saveService = useCallback(async () => {
    if (!industryId) {
      setStatus('Save the industry first.');
      return;
    }
    const id = form.id.trim();
    const name = form.name.trim();
    const duration = Number(form.duration);
    const price = Number(form.price);
    const weightage = Number(form.weightage);
    const timeCost = Number(form.timeCost);
    if (!id || !name) {
      setStatus('Service id and name are required.');
      return;
    }
    if (!Number.isFinite(duration) || duration < 0 || !Number.isFinite(price) || price < 0) {
      setStatus('Duration and price must be non-negative numbers.');
      return;
    }
    if (!Number.isFinite(weightage) || weightage <= 0) {
      setStatus('Weightage must be a positive number.');
      return;
    }
    if (!Number.isFinite(timeCost) || timeCost < 0) {
      setStatus('Time cost must be a non-negative number.');
      return;
    }
    setOperation('saving');
    const payload: IndustryServiceDefinition = {
      id,
      industryId,
      name,
      duration,
      price,
      requirements: form.requirements,
      pricingCategory: (form.pricingCategory as ServicePricingCategory) || undefined,
      weightage,
      requiredStaffRoleIds: form.requiredStaffRoleIds.length > 0 ? form.requiredStaffRoleIds : undefined,
      timeCost: timeCost > 0 ? timeCost : undefined,
    };
    const result = await upsertServiceForIndustry(payload);
    setOperation('idle');
    if (!result.success) {
      setStatus(result.message ?? 'Failed to save service.');
      return;
    }
    setServices((prev) => {
      const exists = prev.some((s) => s.id === id);
      const next = exists ? prev.map((s) => (s.id === id ? payload : s)) : [...prev, payload];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    setStatus('Service saved.');
    setIsCreating(false);
    setSelectedId(id);
  }, [industryId, form]);

  const deleteService = useCallback(async () => {
    if (isCreating || !selectedId) return;
    const service = services.find(s => s.id === selectedId);
    if (!window.confirm(`Delete service "${service?.name || selectedId}"?`)) return;
    setOperation('deleting');
    const result = await deleteServiceById(selectedId);
    setOperation('idle');
    if (!result.success) {
      setStatus(result.message ?? 'Failed to delete service.');
      return;
    }
    setServices((prev) => prev.filter((s) => s.id !== selectedId));
    if (services.length > 1) {
      const remaining = services.filter(s => s.id !== selectedId);
      selectService(remaining[0], false);
    } else {
      setSelectedId('');
      setForm({
        id: '',
        name: '',
        duration: '0',
        price: '0',
        requirements: [],
        pricingCategory: '',
        weightage: '1',
        requiredStaffRoleIds: [],
      });
      setIsCreating(false);
    }
    setStatus('Service deleted.');
  }, [industryId, selectedId, isCreating, services, selectService]);

  const reset = useCallback(() => {
    if (selectedId && !isCreating) {
      const existing = services.find(s => s.id === selectedId);
      if (existing) selectService(existing);
    } else {
      setForm({
        id: '',
        name: '',
        duration: '0',
        price: '0',
        requirements: [],
        pricingCategory: '',
        weightage: '1',
        requiredStaffRoleIds: [],
      });
      setIsCreating(false);
      setSelectedId('');
    }
    setStatus(null);
  }, [selectedId, isCreating, services, selectService]);

  const updateForm = useCallback((updates: Partial<ServiceForm>) => {
    setForm(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    services,
    loading: operation === 'loading',
    status,
    selectedId,
    isCreating,
    saving: operation === 'saving',
    deleting: operation === 'deleting',
    operation,
    form,
    load,
    selectService,
    createService,
    saveService,
    deleteService,
    reset,
    updateForm,
  };
}

