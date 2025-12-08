'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PresetsTab } from '../../components/PresetsTab';
import { SidebarContentLayout } from '../../components/SidebarContentLayout';
import { usePresets } from '../../hooks/usePresets';
import { buildPresetDetailUrl } from '../../utils/routing';

export default function PresetsPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const { industry } = use(params);
  const router = useRouter();
  const presets = usePresets(industry);

  // Auto-redirect to first preset if presets are loaded and not creating
  useEffect(() => {
    if (!presets.loading && presets.presets.length > 0 && !presets.isCreating && !presets.selectedId) {
      const firstPreset = presets.presets[0];
      router.replace(buildPresetDetailUrl(industry, firstPreset.id));
    }
  }, [presets.loading, presets.presets, presets.isCreating, presets.selectedId, industry, router]);

  // Handle preset selection - navigate to detail page
  const handleSelectPreset = (preset: import('@/lib/game/staffConfig').StaffPreset) => {
    router.push(buildPresetDetailUrl(industry, preset.id));
  };

  // Handle create new - show form inline
  const handleCreateNew = () => {
    if (presets.roles.length === 0) {
      alert('Please create at least one role first before creating presets.');
      return;
    }
    // Call createPreset which sets isCreating to true
    presets.createPreset();
    // Force a re-render by ensuring state update
  };

  // Handle save - stay on page after creating to allow creating more
  const handleSave = async () => {
    const wasCreating = presets.isCreating;
    await presets.savePreset();

    // Stay on the page after creating - don't navigate away
    // User can create another preset immediately
  };

  // Handle delete - stay on list page
  const handleDelete = async () => {
    await presets.deletePreset();
  };

  const sidebarItems = presets.presets.map((preset) => ({
    id: preset.id,
    label: preset.name,
    icon: '👤',
    disabled: false,
  }));

  // Show loading or redirecting state (but not when creating)
  if (presets.loading || (presets.presets.length > 0 && !presets.isCreating && !presets.selectedId)) {
    return (
      <SidebarContentLayout
        title="Staff Presets"
        description="Manage initial staff presets for this industry"
        sidebarItems={sidebarItems}
        selectedId=""
        onSelect={(id) => {
          const preset = presets.presets.find(p => p.id === id);
          if (preset) handleSelectPreset(preset);
        }}
        loading={presets.loading}
        actionButton={{
          label: '+ New Preset',
          onClick: handleCreateNew,
          variant: 'success',
        }}
        emptyState={{
          icon: '👤',
          title: 'Loading Presets',
          description: 'Redirecting to first preset...',
        }}
      >
        <div className="text-sm text-slate-400">Redirecting...</div>
      </SidebarContentLayout>
    );
  }

  // Show list with create form or empty state
  return (
    <SidebarContentLayout
      title="Staff Presets"
      description={presets.presets.length === 0 ? "Create your first preset" : "Select a preset to edit"}
      sidebarItems={sidebarItems}
      selectedId=""
      onSelect={(id) => {
        const preset = presets.presets.find(p => p.id === id);
        if (preset) handleSelectPreset(preset);
      }}
      loading={presets.loading}
      actionButton={{
        label: '+ New Preset',
        onClick: handleCreateNew,
        variant: 'success',
      }}
      emptyState={{
        icon: '👤',
        title: presets.presets.length === 0 ? 'No Presets Yet' : 'Select a Preset',
        description: presets.presets.length === 0 
          ? 'Create your first preset to get started'
          : 'Choose a preset from the sidebar to edit',
      }}
      forceShowContent={presets.isCreating}
    >
      {presets.isCreating ? (
        presets.roles.length > 0 ? (
          <PresetsTab
            industryId={industry}
            presets={presets.presets}
            roles={presets.roles}
            loading={presets.loading}
            selectedId={presets.selectedId}
            isCreating={presets.isCreating}
            form={presets.form}
            saving={presets.saving}
            deleting={presets.deleting}
            onSelectPreset={handleSelectPreset}
            onCreatePreset={handleCreateNew}
            onSavePreset={handleSave}
            onDeletePreset={handleDelete}
            onReset={presets.reset}
            onUpdateForm={presets.updateForm}
          />
        ) : (
          <div className="text-sm text-rose-400">
            Please create at least one role first before creating presets.
          </div>
        )
      ) : (
        <div className="text-sm text-slate-400">
          {presets.presets.length === 0 
            ? presets.roles.length === 0
              ? 'Please create at least one role first before creating presets.'
              : 'Click "+ New Preset" to create your first preset.'
            : 'Select a preset from the sidebar to edit.'}
        </div>
      )}
    </SidebarContentLayout>
  );
}
