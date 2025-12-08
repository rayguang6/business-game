import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchServices, upsertService, deleteService } from '@/lib/server/actions/adminActions';
import type { IndustryServiceDefinition, Requirement, ServicePricingCategory, ServiceTier } from '@/lib/game/types';
import type { Operation } from './types';
import { useToastFunctions } from '../components/ui/ToastContext';

interface ServiceForm {
  id: string;
  name: string;
  duration: string;
  price: string;
  tier: string;
  expGained: string;
  requirements: Requirement[];
  pricingCategory: string;
  weightage: string;
  requiredStaffRoleIds: string[];
  timeCost: string;
  order: string;
}

// Query key factory for services
const servicesQueryKey = (industryId: string) => ['services', industryId] as const;

export function useServices(industryId: string, serviceId?: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToastFunctions();
  const [selectedId, setSelectedId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<ServiceForm>({
    id: '',
    name: '',
    duration: '0',
    price: '0',
    tier: '',
    expGained: '0',
    requirements: [],
    pricingCategory: '',
    weightage: '1',
    requiredStaffRoleIds: [],
    timeCost: '0',
    order: '',
  });

  // Fetch services using React Query
  const {
    data: services = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: servicesQueryKey(industryId),
    queryFn: async () => {
      if (!industryId) return [];
      const result = await fetchServices(industryId);
      if (!result || result.length === 0) return [];
      return result.slice().sort((a, b) => {
        // Null/undefined orders go to the end
        const aOrderNull = a.order == null;
        const bOrderNull = b.order == null;
        if (aOrderNull && bOrderNull) return a.name.localeCompare(b.name);
        if (aOrderNull) return 1;
        if (bOrderNull) return -1;
        if (a.order! !== b.order!) return a.order! - b.order!;
        return a.name.localeCompare(b.name);
      });
    },
    enabled: !!industryId,
  });

  // Save service mutation with optimistic update
  const saveMutation = useMutation({
    mutationFn: async (payload: IndustryServiceDefinition) => {
      const result = await upsertService(payload);
      if (!result.success) {
        throw new Error(result.message ?? 'Failed to save service.');
      }
      return payload;
    },
    onMutate: async (newService) => {
      await queryClient.cancelQueries({ queryKey: servicesQueryKey(industryId) });
      const previousServices = queryClient.getQueryData<IndustryServiceDefinition[]>(servicesQueryKey(industryId));

      queryClient.setQueryData<IndustryServiceDefinition[]>(servicesQueryKey(industryId), (old = []) => {
        const exists = old.some((s) => s.id === newService.id);
        const next = exists ? old.map((s) => (s.id === newService.id ? newService : s)) : [...old, newService];
        return next.sort((a, b) => {
          // Null/undefined orders go to the end
          const aOrderNull = a.order == null;
          const bOrderNull = b.order == null;
          if (aOrderNull && bOrderNull) return a.name.localeCompare(b.name);
          if (aOrderNull) return 1;
          if (bOrderNull) return -1;
          if (a.order! !== b.order!) return a.order! - b.order!;
          return a.name.localeCompare(b.name);
        });
      });

      return { previousServices };
    },
    onError: (err, newService, context) => {
      if (context?.previousServices) {
        queryClient.setQueryData(servicesQueryKey(industryId), context.previousServices);
      }
      error(err instanceof Error ? err.message : 'Failed to save service.');
    },
    onSuccess: (savedService) => {
      success('Service saved.');
      setIsCreating(false);
      setSelectedId(savedService.id);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: servicesQueryKey(industryId) });
    },
  });

  // Delete service mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteService(id);
      if (!result.success) {
        throw new Error(result.message ?? 'Failed to delete service.');
      }
      return id;
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: servicesQueryKey(industryId) });
      const previousServices = queryClient.getQueryData<IndustryServiceDefinition[]>(servicesQueryKey(industryId));

      queryClient.setQueryData<IndustryServiceDefinition[]>(servicesQueryKey(industryId), (old = []) =>
        old.filter((s) => s.id !== deletedId)
      );

      return { previousServices };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousServices) {
        queryClient.setQueryData(servicesQueryKey(industryId), context.previousServices);
      }
      error(err instanceof Error ? err.message : 'Failed to delete service.');
    },
    onSuccess: () => {
      const remaining = queryClient.getQueryData<IndustryServiceDefinition[]>(servicesQueryKey(industryId)) || [];
      if (remaining.length > 1) {
        selectService(remaining[0], false);
      } else {
        setSelectedId('');
    setForm({
      id: '',
      name: '',
      duration: '0',
      price: '0',
      tier: '',
      expGained: '0',
      requirements: [],
      pricingCategory: '',
      weightage: '1',
      requiredStaffRoleIds: [],
      timeCost: '0',
      order: '',
    });
        setIsCreating(false);
      }
      success('Service deleted.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: servicesQueryKey(industryId) });
    },
  });

  const selectService = useCallback((service: IndustryServiceDefinition, resetMsg = true) => {
    setSelectedId(service.id);
    setIsCreating(false);
    setForm({
      id: service.id,
      name: service.name,
      duration: service.duration.toString(),
      price: service.price.toString(),
      tier: service.tier || '',
      expGained: service.expGained?.toString() || '0',
      requirements: service.requirements || [],
      pricingCategory: service.pricingCategory || '',
      weightage: service.weightage?.toString() || '1',
      requiredStaffRoleIds: service.requiredStaffRoleIds || [],
      timeCost: service.timeCost?.toString() || '0',
      order: String(service.order ?? 0),
    });
  }, []);

  // Select service when serviceId changes or services are loaded
  useEffect(() => {
    if (serviceId && services.length > 0) {
      const service = services.find((s) => s.id === serviceId);
      if (service) {
        setSelectedId(service.id);
        setIsCreating(false);
        setForm({
          id: service.id,
          name: service.name,
          duration: service.duration.toString(),
          price: service.price.toString(),
          tier: service.tier || '',
          expGained: service.expGained?.toString() || '0',
          requirements: service.requirements || [],
          pricingCategory: service.pricingCategory || '',
          weightage: service.weightage?.toString() || '1',
          requiredStaffRoleIds: service.requiredStaffRoleIds || [],
          timeCost: service.timeCost?.toString() || '0',
          order: String(service.order ?? ''),
        });
      }
    }
  }, [serviceId, services]);

  const createService = useCallback(() => {
    if (!industryId) {
      error('Save the industry first.');
      return;
    }
    setIsCreating(true);
    setSelectedId('');
    setForm({
      id: '',
      name: '',
      duration: '0',
      price: '0',
      tier: '',
      expGained: '0',
      requirements: [],
      pricingCategory: '',
      weightage: '1',
      requiredStaffRoleIds: [],
      timeCost: '0',
      order: '',
    });
  }, [industryId]);

  const saveService = useCallback(async () => {
    if (!industryId) {
      error('Save the industry first.');
      return;
    }
    const id = form.id.trim();
    const name = form.name.trim();
    const duration = Number(form.duration);
    const price = Number(form.price);
    const expGained = Number(form.expGained);
    const weightage = Number(form.weightage);
    const timeCost = Number(form.timeCost);
    if (!id || !name) {
      error('Service id and name are required.');
      return;
    }
    if (!Number.isFinite(duration) || duration < 0 || !Number.isFinite(price) || price < 0) {
      error('Duration and price must be non-negative numbers.');
      return;
    }
    if (!Number.isFinite(expGained) || expGained < 0) {
      error('EXP gained must be a non-negative number.');
      return;
    }
    if (!Number.isFinite(weightage) || weightage <= 0) {
      error('Weightage must be a positive number.');
      return;
    }
    if (!Number.isFinite(timeCost) || timeCost < 0) {
      error('Time cost must be a non-negative number.');
      return;
    }
    const order = form.order.trim() ? Number(form.order.trim()) : undefined;

    const payload: IndustryServiceDefinition = {
      id,
      industryId,
      name,
      duration,
      price,
      tier: (form.tier as ServiceTier) || undefined,
      expGained: expGained > 0 ? expGained : undefined,
      requirements: form.requirements,
      pricingCategory: (form.pricingCategory as ServicePricingCategory) || undefined,
      weightage,
      requiredStaffRoleIds: form.requiredStaffRoleIds.length > 0 ? form.requiredStaffRoleIds : undefined,
      timeCost: timeCost > 0 ? timeCost : undefined,
      order,
    };
    saveMutation.mutate(payload);
  }, [industryId, form, saveMutation]);

  const deleteServiceHandler = useCallback(async () => {
    if (isCreating || !selectedId) return;
    const service = services.find((s) => s.id === selectedId);
    if (!window.confirm(`Delete service "${service?.name || selectedId}"?`)) return;
    deleteMutation.mutate(selectedId);
  }, [selectedId, isCreating, services, deleteMutation]);

  const reset = useCallback(() => {
    if (selectedId && !isCreating) {
      const existing = services.find((s) => s.id === selectedId);
      if (existing) selectService(existing);
    } else {
      setForm({
        id: '',
        name: '',
        duration: '0',
        price: '0',
        tier: '',
        expGained: '0',
        requirements: [],
        pricingCategory: '',
        weightage: '1',
        requiredStaffRoleIds: [],
        timeCost: '0',
        order: '',
      });
      setIsCreating(false);
      setSelectedId('');
    }
  }, [selectedId, isCreating, services, selectService]);

  const updateForm = useCallback((updates: Partial<ServiceForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const operation: Operation = isLoading ? 'loading' : saveMutation.isPending ? 'saving' : deleteMutation.isPending ? 'deleting' : 'idle';

  return {
    services,
    loading: isLoading,
    selectedId,
    isCreating,
    saving: saveMutation.isPending,
    deleting: deleteMutation.isPending,
    operation,
    form,
    load: () => queryClient.invalidateQueries({ queryKey: servicesQueryKey(industryId) }),
    selectService,
    createService,
    saveService,
    deleteService: deleteServiceHandler,
    reset,
    updateForm,
  };
}
