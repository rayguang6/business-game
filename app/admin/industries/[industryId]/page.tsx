'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IndustriesTab } from '../../components/IndustriesTab';
import { SidebarContentLayout } from '../../components/SidebarContentLayout';
import { useIndustries } from '../../hooks/useIndustries';
import { buildIndustryDetailUrl } from '../../utils/routing';

export default function IndustryDetailPage({
  params,
}: {
  params: Promise<{ industryId: string }>;
}) {
  const { industryId } = use(params);
  const router = useRouter();
  const industries = useIndustries(industryId);

  // Redirect to list if industry not found (404 handling)
  useEffect(() => {
    if (!industries.loading && !industries.error && industries.industries.length > 0) {
      const industry = industries.industries.find(i => i.id === industryId);
      if (!industry && !industries.isCreating) {
        // Industry not found - redirect to list
        router.replace('/admin/industries');
      }
    }
  }, [industries.loading, industries.error, industries.industries, industryId, industries.isCreating, router]);

  // Handle industry selection from sidebar - navigate to URL
  const handleSelectIndustry = (selectedIndustryId: string) => {
    router.push(buildIndustryDetailUrl(selectedIndustryId));
  };

  // Handle save - navigate to detail page after creating new industry
  const handleSave = async () => {
    const wasCreating = industries.isCreating;
    await industries.save();
    
    // After save, if we created a new industry, navigate to its detail page
    // The save function updates the form with the saved industry data
    if (wasCreating && industries.form.id) {
      router.push(buildIndustryDetailUrl(industries.form.id));
    }
  };

  // Handle delete - redirect to list
  const handleDelete = async () => {
    await industries.deleteIndustry();
    router.push('/admin/industries');
  };

  const sidebarItems = industries.industries.map((industry) => ({
    id: industry.id,
    label: industry.name,
    icon: industry.icon,
    disabled: false,
    metadata: !industry.isAvailable ? '(locked)' : undefined,
  }));

  return (
    <SidebarContentLayout
      title="Industries"
      description="Select an industry to edit"
      sidebarItems={sidebarItems}
      selectedId={industryId}
      onSelect={handleSelectIndustry}
      loading={industries.loading}
      error={industries.error}
      actionButton={{
        label: '+ New Industry',
        onClick: industries.createNew,
        variant: 'primary',
      }}
      emptyState={{
        icon: '🏭',
        title: 'Select an Industry',
        description: 'Choose an industry from the sidebar to edit its configuration',
      }}
    >
      <IndustriesTab
        industries={industries.industries}
        isLoading={industries.loading}
        error={industries.error}
        form={industries.form}
        isSaving={industries.saving}
        isDeleting={industries.deleting}
        statusMessage={industries.status}
        isCreating={industries.isCreating}
        onSelectIndustry={handleSelectIndustry}
        onCreateNew={industries.createNew}
        onSave={handleSave}
        onDelete={handleDelete}
        onReset={industries.reset}
        onUpdateForm={industries.updateForm}
      />
    </SidebarContentLayout>
  );
}
