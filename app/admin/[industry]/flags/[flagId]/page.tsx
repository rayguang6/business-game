'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FlagsTab } from '../../../components/FlagsTab';
import { SidebarContentLayout } from '../../../components/SidebarContentLayout';
import { useFlags } from '../../../hooks/useFlags';
import { buildFlagDetailUrl } from '../../../utils/routing';

export default function FlagDetailPage({
  params,
}: {
  params: Promise<{ industry: string; flagId: string }>;
}) {
  const { industry, flagId } = use(params);
  const router = useRouter();
  const flags = useFlags(industry, flagId);

  // Redirect to list if flag not found (404 handling)
  useEffect(() => {
    if (!flags.loading && !flags.isCreating && flags.flags.length > 0) {
      const flag = flags.flags.find(f => f.id === flagId);
      if (!flag) {
        router.replace(`/admin/${industry}/flags`);
      }
    }
  }, [flags.loading, flags.isCreating, flags.flags, flagId, industry, router]);

  // Handle flag selection from sidebar - navigate to URL
  const handleSelectFlag = (flag: import('@/lib/data/flagRepository').GameFlag) => {
    router.push(buildFlagDetailUrl(industry, flag.id));
  };

  // Handle save - navigate to detail page after creating new flag
  const handleSave = async () => {
    const wasCreating = flags.isCreating;
    await flags.saveFlag();
    
    if (wasCreating && flags.form.id) {
      router.push(buildFlagDetailUrl(industry, flags.form.id));
    }
  };

  // Handle delete - redirect to list
  const handleDelete = async () => {
    await flags.deleteFlag();
    router.push(`/admin/${industry}/flags`);
  };

  const sidebarItems = flags.flags.map((flag) => ({
    id: flag.id,
    label: flag.name,
    icon: '🏁',
    disabled: false,
  }));

  return (
    <SidebarContentLayout
      title="Flags"
      description="Manage flags for this industry"
      sidebarItems={sidebarItems}
      selectedId={flagId}
      onSelect={(id) => {
        const flag = flags.flags.find(f => f.id === id);
        if (flag) handleSelectFlag(flag);
      }}
      loading={flags.loading}
      actionButton={{
        label: '+ New Flag',
        onClick: flags.createFlag,
        variant: 'primary',
      }}
      emptyState={{
        icon: '🏁',
        title: 'No Flags Yet',
        description: 'Create your first flag to get started',
      }}
    >
      <FlagsTab
        industryId={industry}
        flags={flags.flags}
        flagsLoading={flags.loading}
        selectedFlagId={flags.selectedId}
        isCreatingFlag={flags.isCreating}
        flagForm={flags.form}
        flagSaving={flags.saving}
        flagDeleting={flags.deleting}
        onSelectFlag={handleSelectFlag}
        onCreateFlag={flags.createFlag}
        onSaveFlag={handleSave}
        onDeleteFlag={handleDelete}
        onReset={flags.reset}
        onUpdateForm={flags.updateForm}
      />
    </SidebarContentLayout>
  );
}
