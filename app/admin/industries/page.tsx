'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarContentLayout } from '../components/SidebarContentLayout';
import { IndustriesTab } from '../components/IndustriesTab';
import { useIndustries } from '../hooks/useIndustries';
import { buildIndustryDetailUrl } from '../utils/routing';

export default function IndustriesPage() {
  const router = useRouter();
  const industries = useIndustries();

  // Auto-redirect to first industry if industries are loaded and not creating
  useEffect(() => {
    if (!industries.loading && industries.industries.length > 0 && !industries.isCreating) {
      const firstIndustry = industries.industries[0];
      router.replace(buildIndustryDetailUrl(firstIndustry.id));
    }
  }, [industries.loading, industries.industries, industries.isCreating, router]);

  // Handle industry selection - navigate to detail page
  const handleSelectIndustry = (industryId: string) => {
    router.push(buildIndustryDetailUrl(industryId));
  };

  // Handle create new - show form inline
  const handleCreateNew = () => {
    industries.createNew();
  };

  // Handle save - navigate to detail page after creating
  const handleSave = async () => {
    const wasCreating = industries.isCreating;
    await industries.save();
    
    // After save, if we created a new industry, navigate to its detail page
    if (wasCreating && industries.form.id) {
      router.push(buildIndustryDetailUrl(industries.form.id));
    }
  };

  // Handle delete - stay on list page
  const handleDelete = async () => {
    await industries.deleteIndustry();
    // Stay on list page after delete
  };

  const sidebarItems = industries.industries.map((industry) => ({
    id: industry.id,
    label: industry.name,
    icon: industry.icon,
    disabled: false,
    metadata: !industry.isAvailable ? '(locked)' : undefined,
  }));

  // Show loading or redirecting state
  if (industries.loading || (industries.industries.length > 0 && !industries.isCreating)) {
    return (
      <SidebarContentLayout
        title="Industries"
        description="Select an industry to edit"
        sidebarItems={sidebarItems}
        selectedId=""
        onSelect={handleSelectIndustry}
        loading={industries.loading}
        error={industries.error}
        actionButton={{
          label: '+ New Industry',
          onClick: handleCreateNew,
          variant: 'primary',
        }}
        emptyState={{
          icon: '🏭',
          title: 'Loading Industries',
          description: 'Redirecting to first industry...',
        }}
      >
        <div className="text-sm text-slate-400">Redirecting...</div>
      </SidebarContentLayout>
    );
  }

  // Show list with create form or empty state
  return (
    <SidebarContentLayout
      title="Industries"
      description={industries.industries.length === 0 ? "Create your first industry" : "Select an industry to edit"}
      sidebarItems={sidebarItems}
      selectedId=""
      onSelect={handleSelectIndustry}
      loading={industries.loading}
      error={industries.error}
      actionButton={{
        label: '+ New Industry',
        onClick: handleCreateNew,
        variant: 'primary',
      }}
      emptyState={{
        icon: '🏭',
        title: industries.industries.length === 0 ? 'No Industries Yet' : 'Select an Industry',
        description: industries.industries.length === 0 
          ? 'Create your first industry to get started'
          : 'Choose an industry from the sidebar to edit its configuration',
      }}
    >
      {industries.isCreating ? (
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
          onCreateNew={handleCreateNew}
          onSave={handleSave}
          onDelete={handleDelete}
          onReset={industries.reset}
          onUpdateForm={industries.updateForm}
        />
      ) : (
        <div className="text-sm text-slate-400">
          {industries.industries.length === 0 
            ? 'Click "+ New Industry" to create your first industry.'
            : 'Select an industry from the sidebar to edit.'}
        </div>
      )}
    </SidebarContentLayout>
  );
}
