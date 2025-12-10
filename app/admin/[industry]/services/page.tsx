'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ServicesTab } from '../../components/ServicesTab';
import { SidebarContentLayout } from '../../components/SidebarContentLayout';
import { useServices } from '../../hooks/useServices';
import { useFlags } from '../../hooks/useFlags';
import { useUpgrades, useAllUpgrades } from '../../hooks/useUpgrades';
import { useRoles } from '../../hooks/useRoles';
import { buildServiceDetailUrl } from '../../utils/routing';

export default function ServicesPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const { industry } = use(params);
  const router = useRouter();
  const services = useServices(industry);
  const flags = useFlags(industry);
  const upgrades = useUpgrades(industry);
  const allUpgrades = useAllUpgrades();
  const roles = useRoles(industry);

  // Auto-redirect to first service if services are loaded and not creating
  useEffect(() => {
    if (!services.loading && services.services.length > 0 && !services.isCreating) {
      const firstService = services.services[0];
      router.replace(buildServiceDetailUrl(industry, firstService.id));
    }
  }, [services.loading, services.services, services.isCreating, industry, router]);

  // Handle service selection - navigate to detail page
  const handleSelectService = (service: import('@/lib/game/types').IndustryServiceDefinition) => {
    router.push(buildServiceDetailUrl(industry, service.id));
  };

  // Handle create new - show form inline
  const handleCreateNew = () => {
    services.createService();
  };

  // Handle save - navigate to detail page after creating
  const handleSave = async () => {
    const wasCreating = services.isCreating;
    await services.saveService();
    
    // After save, if we created a new service, navigate to its detail page
    if (wasCreating && services.form.id) {
      router.push(buildServiceDetailUrl(industry, services.form.id));
    }
  };

  // Handle delete - stay on list page
  const handleDelete = async () => {
    await services.deleteService();
    // Stay on list page after delete
  };

  const sidebarItems = services.services.map((service) => ({
    id: service.id,
    label: service.name,
    icon: '🛎️',
    disabled: false,
  }));

  // Show loading or redirecting state
  if (services.loading || (services.services.length > 0 && !services.isCreating)) {
    return (
      <SidebarContentLayout
        title="Services"
        description="Manage services for this industry"
        sidebarItems={sidebarItems}
        selectedId=""
        onSelect={(id) => {
          const service = services.services.find(s => s.id === id);
          if (service) handleSelectService(service);
        }}
        loading={services.loading}
        actionButton={{
          label: '+ New Service',
          onClick: handleCreateNew,
          variant: 'success',
        }}
        emptyState={{
          icon: '🛎️',
          title: 'Loading Services',
          description: 'Redirecting to first service...',
        }}
      >
        <div className="text-sm text-slate-400">Redirecting...</div>
      </SidebarContentLayout>
    );
  }

  // Show list with create form or empty state
  return (
    <SidebarContentLayout
      title="Services"
      description={services.services.length === 0 ? "Create your first service" : "Select a service to edit"}
      sidebarItems={sidebarItems}
      selectedId=""
      onSelect={(id) => {
        const service = services.services.find(s => s.id === id);
        if (service) handleSelectService(service);
      }}
      loading={services.loading}
      actionButton={{
        label: '+ New Service',
        onClick: handleCreateNew,
        variant: 'success',
      }}
      emptyState={{
        icon: '🛎️',
        title: services.services.length === 0 ? 'No Services Yet' : 'Select a Service',
        description: services.services.length === 0 
          ? 'Create your first service to get started'
          : 'Choose a service from the sidebar to edit',
      }}
      forceShowContent={services.isCreating}
    >
      {services.isCreating ? (
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
          onCreateService={handleCreateNew}
          onSaveService={handleSave}
          onDeleteService={handleDelete}
          onReset={services.reset}
          onUpdateForm={services.updateForm}
        />
      ) : (
        <div className="text-sm text-slate-400">
          {services.services.length === 0 
            ? 'Click "+ New Service" to create your first service.'
            : 'Select a service from the sidebar to edit.'}
        </div>
      )}
    </SidebarContentLayout>
  );
}
