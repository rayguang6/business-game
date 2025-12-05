'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PresetsTab } from '../../../components/PresetsTab';
import { SidebarContentLayout } from '../../../components/SidebarContentLayout';
import { usePresets } from '../../../hooks/usePresets';
import { buildPresetDetailUrl } from '../../../utils/routing';

export default function PresetDetailPage({
  params,
}: {
  params: Promise<{ industry: string; presetId: string }>;
}) {
  const { industry, presetId } = use(params);
  const router = useRouter();
  const presets = usePresets(industry, presetId);

  // Redirect to list if preset not found (404 handling)
  useEffect(() => {
    if (!presets.loading && !presets.isCreating && presets.presets.length > 0) {
      const preset = presets.presets.find(p => p.id === presetId);
      if (!preset) {
        router.replace(`/admin/${industry}/presets`);
      }
    }
  }, [presets.loading, presets.isCreating, presets.presets, presetId, industry, router]);

  // Handle preset selection from sidebar - navigate to URL
  const handleSelectPreset = (preset: import('@/lib/game/staffConfig').StaffPreset) => {
    router.push(buildPresetDetailUrl(industry, preset.id));
  };

  // Handle save - navigate to detail page after creating new preset
  const handleSave = async () => {
    const wasCreating = presets.isCreating;
    await presets.savePreset();
    
    if (wasCreating && presets.form.id) {
      router.push(buildPresetDetailUrl(industry, presets.form.id));
    }
  };

  // Handle delete - redirect to list
  const handleDelete = async () => {
    await presets.deletePreset();
    router.push(`/admin/${industry}/presets`);
  };

  const sidebarItems = presets.presets.map((preset) => ({
    id: preset.id,
    label: preset.name,
    icon: '👤',
    disabled: false,
  }));

  return (
    <SidebarContentLayout
      title="Staff Presets"
      description="Manage initial staff presets for this industry"
      sidebarItems={sidebarItems}
      selectedId={presetId}
      onSelect={(id) => {
        const preset = presets.presets.find(p => p.id === id);
        if (preset) handleSelectPreset(preset);
      }}
      loading={presets.loading}
      error={presets.status}
      actionButton={{
        label: '+ New Preset',
        onClick: presets.createPreset,
        variant: 'success',
      }}
      emptyState={{
        icon: '👤',
        title: 'No Presets Yet',
        description: 'Create your first preset to get started',
      }}
    >
      <PresetsTab
        industryId={industry}
        presets={presets.presets}
        roles={presets.roles}
        loading={presets.loading}
        status={presets.status}
        selectedId={presets.selectedId}
        isCreating={presets.isCreating}
        form={presets.form}
        saving={presets.saving}
        deleting={presets.deleting}
        onSelectPreset={handleSelectPreset}
        onCreatePreset={presets.createPreset}
        onSavePreset={handleSave}
        onDeletePreset={handleDelete}
        onReset={presets.reset}
        onUpdateForm={presets.updateForm}
      />
    </SidebarContentLayout>
  );
}
