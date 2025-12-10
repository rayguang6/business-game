'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ServicesTab } from '../../../components/ServicesTab';
import { SidebarContentLayout } from '../../../components/SidebarContentLayout';
import { useServices } from '../../../hooks/useServices';
import { useFlags } from '../../../hooks/useFlags';
import { useUpgrades, useAllUpgrades } from '../../../hooks/useUpgrades';
import { useRoles } from '../../../hooks/useRoles';
import { buildServiceDetailUrl } from '../../../utils/routing';

export default function ServiceDetailPage({
  params,
}: {
  params: Promise<{ industry: string; serviceId: string }>;
}) {
  const { industry, serviceId } = use(params);
  const router = useRouter();
  const services = useServices(industry, serviceId);
  const flags = useFlags(industry);
  const upgrades = useUpgrades(industry);
  const allUpgrades = useAllUpgrades();
  const roles = useRoles(industry);

  // Redirect to list if service not found (404 handling)
  useEffect(() => {
    if (!services.loading && !services.isCreating && services.services.length > 0) {
      const service = services.services.find(s => s.id === serviceId);
      if (!service) {
        // Service not found - redirect to list
        router.replace(`/admin/${industry}/services`);
      }
    }
  }, [services.loading, services.isCreating, services.services, serviceId, industry, router]);

  // Handle service selection from sidebar - navigate to URL
  const handleSelectService = (service: import('@/lib/game/types').IndustryServiceDefinition) => {
    router.push(buildServiceDetailUrl(industry, service.id));
  };

  // Handle save - navigate to detail page after creating new service
  const handleSave = async () => {
    const wasCreating = services.isCreating;
    await services.saveService();
    
    // After save, if we created a new service, navigate to its detail page
    if (wasCreating && services.form.id) {
      router.push(buildServiceDetailUrl(industry, services.form.id));
    }
  };

  // Handle delete - redirect to list
  const handleDelete = async () => {
    await services.deleteService();
    router.push(`/admin/${industry}/services`);
  };

  const sidebarItems = services.services.map((service) => ({
    id: service.id,
    label: service.name,
    icon: '🛎️',
    disabled: false,
  }));

  return (
    <SidebarContentLayout
      title="Services"
      description="Manage services for this industry"
      sidebarItems={sidebarItems}
      selectedId={serviceId}
      onSelect={(id) => {
        const service = services.services.find(s => s.id === id);
        if (service) handleSelectService(service);
      }}
      loading={services.loading}
      actionButton={{
        label: '+ New Service',
        onClick: services.createService,
        variant: 'success',
      }}
      emptyState={{
        icon: '🛎️',
        title: 'No Services Yet',
        description: 'Create your first service to get started',
      }}
    >
      <ServicesTab
        industryId={industry}
        services={services.services}
        serviceLoading={services.loading}
        selectedServiceId={services.selectedId}
        isCreatingService={services.isCreating}
        serviceForm={services.form}
        serviceSaving={services.saving}
        serviceDeleting={services.deleting}
        flags={flags.flags}
        flagsLoading={flags.loading}
        upgrades={allUpgrades.data}
        staffRoles={roles.roles}
        onSelectService={handleSelectService}
        onCreateService={services.createService}
        onSaveService={handleSave}
        onDeleteService={handleDelete}
        onReset={services.reset}
        onUpdateForm={services.updateForm}
      />
    </SidebarContentLayout>
  );
}
