'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UpgradesTab } from '../../../components/UpgradesTab';
import { SidebarContentLayout } from '../../../components/SidebarContentLayout';
import { useUpgrades } from '../../../hooks/useUpgrades';
import { useFlags } from '../../../hooks/useFlags';
import { useRoles } from '../../../hooks/useRoles';
import { useCategories } from '../../../hooks/useCategories';
import { METRIC_OPTIONS, EFFECT_TYPE_OPTIONS } from '../../../utils/constants';
import { buildUpgradeDetailUrl } from '../../../utils/routing';

export default function UpgradeDetailPage({
  params,
}: {
  params: Promise<{ industry: string; upgradeId: string }>;
}) {
  const { industry, upgradeId } = use(params);
  const router = useRouter();
  const upgrades = useUpgrades(industry, upgradeId);
  const flags = useFlags(industry);
  const roles = useRoles(industry);
  const categories = useCategories(industry);

  // Redirect to list if upgrade not found (404 handling)
  useEffect(() => {
    if (!upgrades.loading && !upgrades.isCreating && upgrades.upgrades.length > 0) {
      const upgrade = upgrades.upgrades.find(u => u.id === upgradeId);
      if (!upgrade) {
        router.replace(`/admin/${industry}/upgrades`);
      }
    }
  }, [upgrades.loading, upgrades.isCreating, upgrades.upgrades, upgradeId, industry, router]);

  // Handle upgrade selection from sidebar - navigate to URL
  const handleSelectUpgrade = (upgrade: import('@/lib/game/types').UpgradeDefinition) => {
    router.push(buildUpgradeDetailUrl(industry, upgrade.id));
  };

  // Handle save - navigate to detail page after creating new upgrade
  const handleSave = async () => {
    const wasCreating = upgrades.isCreating;
    await upgrades.saveUpgrade();
    
    if (wasCreating && upgrades.form.id) {
      router.push(buildUpgradeDetailUrl(industry, upgrades.form.id));
    }
  };

  // Handle delete - redirect to list
  const handleDelete = async () => {
    await upgrades.deleteUpgrade();
    router.push(`/admin/${industry}/upgrades`);
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

  return (
    <SidebarContentLayout
      title="Upgrades"
      description="Manage upgrades for this industry"
      sidebarItems={sidebarItems}
      selectedId={upgradeId}
      onSelect={(id) => {
        const upgrade = upgrades.upgrades.find(u => u.id === id);
        if (upgrade) handleSelectUpgrade(upgrade);
      }}
      loading={upgrades.loading}
      error={upgrades.status}
      actionButton={{
        label: '+ New Upgrade',
        onClick: upgrades.createUpgrade,
        variant: 'primary',
      }}
      emptyState={{
        icon: '⚙️',
        title: 'No Upgrades Yet',
        description: 'Create your first upgrade to get started',
      }}
    >
      <UpgradesTab
        industryId={industry}
        upgrades={upgrades.upgrades}
        upgradesLoading={upgrades.loading}
        upgradeStatus={upgrades.status}
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
        staffRoles={roles.roles}
        metricOptions={METRIC_OPTIONS}
        effectTypeOptions={EFFECT_TYPE_OPTIONS}
        onSelectUpgrade={handleSelectUpgrade}
        onCreateUpgrade={upgrades.createUpgrade}
        onSaveUpgrade={handleSave}
        onDeleteUpgrade={handleDelete}
        onReset={upgrades.reset}
        onUpdateForm={upgrades.updateForm}
        onAddLevel={upgrades.addLevel}
        onRemoveLevel={upgrades.removeLevel}
        onUpdateLevel={upgrades.updateLevel}
      />
    </SidebarContentLayout>
  );
}
