'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UpgradesTab } from '../../components/UpgradesTab';
import { SidebarContentLayout } from '../../components/SidebarContentLayout';
import { useUpgrades, useAllUpgrades } from '../../hooks/useUpgrades';
import { useFlags } from '../../hooks/useFlags';
import { useRoles } from '../../hooks/useRoles';
import { useCategories } from '../../hooks/useCategories';
import { METRIC_OPTIONS, EFFECT_TYPE_OPTIONS } from '../../utils/constants';
import { buildUpgradeDetailUrl } from '../../utils/routing';

export default function UpgradesPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const { industry } = use(params);
  const router = useRouter();
  const upgrades = useUpgrades(industry);
  const allUpgrades = useAllUpgrades();
  const flags = useFlags(industry);
  const roles = useRoles(industry);
  const categories = useCategories(industry);

  // Auto-redirect to first upgrade if upgrades are loaded and not creating
  useEffect(() => {
    if (!upgrades.loading && upgrades.upgrades.length > 0 && !upgrades.isCreating) {
      const firstUpgrade = upgrades.upgrades[0];
      router.replace(buildUpgradeDetailUrl(industry, firstUpgrade.id));
    }
  }, [upgrades.loading, upgrades.upgrades, upgrades.isCreating, industry, router]);

  // Handle upgrade selection - navigate to detail page
  const handleSelectUpgrade = (upgrade: import('@/lib/game/types').UpgradeDefinition) => {
    router.push(buildUpgradeDetailUrl(industry, upgrade.id));
  };

  // Handle create new - show form inline
  const handleCreateNew = () => {
    upgrades.createUpgrade();
  };

  // Handle save - navigate to detail page after creating
  const handleSave = async () => {
    const wasCreating = upgrades.isCreating;
    await upgrades.saveUpgrade();
    
    if (wasCreating && upgrades.form.id) {
      router.push(buildUpgradeDetailUrl(industry, upgrades.form.id));
    }
  };

  // Handle delete - stay on list page
  const handleDelete = async () => {
    await upgrades.deleteUpgrade();
  };

  const sidebarItems = upgrades.upgrades.map((upgrade) => {
    const category = categories.categories.find(c => c.id === upgrade.categoryId);
    return {
      id: upgrade.id,
      label: upgrade.name,
      icon: upgrade.icon || '⚙️',
      disabled: false,
      category: category?.name,
    };
  });

  // Show loading or redirecting state
  if (upgrades.loading || (upgrades.upgrades.length > 0 && !upgrades.isCreating)) {
    return (
      <SidebarContentLayout
        title="Upgrades"
        description="Manage upgrades for this industry"
        sidebarItems={sidebarItems}
        selectedId=""
        onSelect={(id) => {
          const upgrade = upgrades.upgrades.find(u => u.id === id);
          if (upgrade) handleSelectUpgrade(upgrade);
        }}
        loading={upgrades.loading}
        actionButton={{
          label: '+ New Upgrade',
          onClick: handleCreateNew,
          variant: 'primary',
        }}
        emptyState={{
          icon: '⚙️',
          title: 'Loading Upgrades',
          description: 'Redirecting to first upgrade...',
        }}
      >
        <div className="text-sm text-slate-400">Redirecting...</div>
      </SidebarContentLayout>
    );
  }

  // Show list with create form or empty state
  return (
    <SidebarContentLayout
      title="Upgrades"
      description={upgrades.upgrades.length === 0 ? "Create your first upgrade" : "Select an upgrade to edit"}
      sidebarItems={sidebarItems}
      selectedId=""
      onSelect={(id) => {
        const upgrade = upgrades.upgrades.find(u => u.id === id);
        if (upgrade) handleSelectUpgrade(upgrade);
      }}
      loading={upgrades.loading}
      actionButton={{
        label: '+ New Upgrade',
        onClick: handleCreateNew,
        variant: 'primary',
      }}
      emptyState={{
        icon: '⚙️',
        title: upgrades.upgrades.length === 0 ? 'No Upgrades Yet' : 'Select an Upgrade',
        description: upgrades.upgrades.length === 0 
          ? 'Create your first upgrade to get started'
          : 'Choose an upgrade from the sidebar to edit',
      }}
      forceShowContent={upgrades.isCreating}
    >
      {upgrades.isCreating ? (
        <UpgradesTab
          industryId={industry}
          upgrades={upgrades.upgrades}
          upgradesLoading={upgrades.loading}
          selectedUpgradeId={upgrades.selectedId}
          isCreatingUpgrade={upgrades.isCreating}
          upgradeForm={upgrades.form}
          levelsForm={upgrades.levelsForm}
          upgradeSaving={upgrades.saving}
          upgradeDeleting={upgrades.deleting}
          flags={flags.flags}
          flagsLoading={flags.loading}
          categories={categories.categories}
          categoriesLoading={categories.loading}
          allUpgrades={allUpgrades.data}
          staffRoles={roles.roles}
          metricOptions={METRIC_OPTIONS}
          effectTypeOptions={EFFECT_TYPE_OPTIONS}
          onSelectUpgrade={handleSelectUpgrade}
          onCreateUpgrade={handleCreateNew}
          onSaveUpgrade={handleSave}
          onDeleteUpgrade={handleDelete}
          onReset={upgrades.reset}
          onUpdateForm={upgrades.updateForm}
          onAddLevel={upgrades.addLevel}
          onRemoveLevel={upgrades.removeLevel}
          onUpdateLevel={upgrades.updateLevel}
        />
      ) : (
        <div className="text-sm text-slate-400">
          {upgrades.upgrades.length === 0 
            ? 'Click "+ New Upgrade" to create your first upgrade.'
            : 'Select an upgrade from the sidebar to edit.'}
        </div>
      )}
    </SidebarContentLayout>
  );
}
