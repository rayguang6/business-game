'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FlagsTab } from '../../components/FlagsTab';
import { SidebarContentLayout } from '../../components/SidebarContentLayout';
import { useFlags } from '../../hooks/useFlags';
import { buildFlagDetailUrl } from '../../utils/routing';

export default function FlagsPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const { industry } = use(params);
  const router = useRouter();
  const flags = useFlags(industry);

  // Auto-redirect to first flag if flags are loaded and not creating
  useEffect(() => {
    if (!flags.loading && flags.flags.length > 0 && !flags.isCreating) {
      const firstFlag = flags.flags[0];
      router.replace(buildFlagDetailUrl(industry, firstFlag.id));
    }
  }, [flags.loading, flags.flags, flags.isCreating, industry, router]);

  // Handle flag selection - navigate to detail page
  const handleSelectFlag = (flag: import('@/lib/data/flagRepository').GameFlag) => {
    router.push(buildFlagDetailUrl(industry, flag.id));
  };

  // Handle create new - show form inline
  const handleCreateNew = () => {
    flags.createFlag();
  };

  // Handle save - navigate to detail page after creating
  const handleSave = async () => {
    const wasCreating = flags.isCreating;
    await flags.saveFlag();
    
    if (wasCreating && flags.form.id) {
      router.push(buildFlagDetailUrl(industry, flags.form.id));
    }
  };

  // Handle delete - stay on list page
  const handleDelete = async () => {
    await flags.deleteFlag();
  };

  const sidebarItems = flags.flags.map((flag) => ({
    id: flag.id,
    label: flag.name,
    icon: '🏁',
    disabled: false,
  }));

  // Show loading or redirecting state
  if (flags.loading || (flags.flags.length > 0 && !flags.isCreating)) {
    return (
      <SidebarContentLayout
        title="Flags"
        description="Manage flags for this industry"
        sidebarItems={sidebarItems}
        selectedId=""
        onSelect={(id) => {
          const flag = flags.flags.find(f => f.id === id);
          if (flag) handleSelectFlag(flag);
        }}
        loading={flags.loading}
        error={flags.status}
        actionButton={{
          label: '+ New Flag',
          onClick: handleCreateNew,
          variant: 'primary',
        }}
        emptyState={{
          icon: '🏁',
          title: 'Loading Flags',
          description: 'Redirecting to first flag...',
        }}
      >
        <div className="text-sm text-slate-400">Redirecting...</div>
      </SidebarContentLayout>
    );
  }

  // Show list with create form or empty state
  return (
    <SidebarContentLayout
      title="Flags"
      description={flags.flags.length === 0 ? "Create your first flag" : "Select a flag to edit"}
      sidebarItems={sidebarItems}
      selectedId=""
      onSelect={(id) => {
        const flag = flags.flags.find(f => f.id === id);
        if (flag) handleSelectFlag(flag);
      }}
      loading={flags.loading}
      error={flags.status}
      actionButton={{
        label: '+ New Flag',
        onClick: handleCreateNew,
        variant: 'primary',
      }}
      emptyState={{
        icon: '🏁',
        title: flags.flags.length === 0 ? 'No Flags Yet' : 'Select a Flag',
        description: flags.flags.length === 0 
          ? 'Create your first flag to get started'
          : 'Choose a flag from the sidebar to edit',
      }}
      forceShowContent={flags.isCreating}
    >
      {flags.isCreating ? (
        <FlagsTab
          industryId={industry}
          flags={flags.flags}
          flagsLoading={flags.loading}
          flagStatus={flags.status}
          selectedFlagId={flags.selectedId}
          isCreatingFlag={flags.isCreating}
          flagForm={flags.form}
          flagSaving={flags.saving}
          flagDeleting={flags.deleting}
          onSelectFlag={handleSelectFlag}
          onCreateFlag={handleCreateNew}
          onSaveFlag={handleSave}
          onDeleteFlag={handleDelete}
          onReset={flags.reset}
          onUpdateForm={flags.updateForm}
        />
      ) : (
        <div className="text-sm text-slate-400">
          {flags.flags.length === 0 
            ? 'Click "+ New Flag" to create your first flag.'
            : 'Select a flag from the sidebar to edit.'}
        </div>
      )}
    </SidebarContentLayout>
  );
}
