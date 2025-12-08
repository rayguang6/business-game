'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MarketingTab } from '../../../components/MarketingTab';
import { SidebarContentLayout } from '../../../components/SidebarContentLayout';
import { useMarketing } from '../../../hooks/useMarketing';
import { useFlags } from '../../../hooks/useFlags';
import { useUpgrades } from '../../../hooks/useUpgrades';
import { useRoles } from '../../../hooks/useRoles';
import { useCategories } from '../../../hooks/useCategories';
import { METRIC_OPTIONS, EFFECT_TYPE_OPTIONS } from '../../../utils/constants';
import { buildMarketingDetailUrl } from '../../../utils/routing';

export default function MarketingDetailPage({
  params,
}: {
  params: Promise<{ industry: string; campaignId: string }>;
}) {
  const { industry, campaignId } = use(params);
  const router = useRouter();
  const marketing = useMarketing(industry, campaignId);
  const flags = useFlags(industry);
  const upgrades = useUpgrades(industry);
  const roles = useRoles(industry);
  const categories = useCategories(industry);

  // Redirect to list if campaign not found (404 handling)
  useEffect(() => {
    if (!marketing.loading && !marketing.isCreating && marketing.campaigns.length > 0) {
      const campaign = marketing.campaigns.find(c => c.id === campaignId);
      if (!campaign) {
        router.replace(`/admin/${industry}/marketing`);
      }
    }
  }, [marketing.loading, marketing.isCreating, marketing.campaigns, campaignId, industry, router]);

  // Handle campaign selection from sidebar - navigate to URL
  const handleSelectCampaign = (campaign: import('@/lib/store/slices/marketingSlice').MarketingCampaign) => {
    router.push(buildMarketingDetailUrl(industry, campaign.id));
  };

  // Handle save - navigate to detail page after creating new campaign
  const handleSave = async () => {
    const wasCreating = marketing.isCreating;
    await marketing.saveCampaign();
    
    if (wasCreating && marketing.form.id) {
      router.push(buildMarketingDetailUrl(industry, marketing.form.id));
    }
  };

  // Handle delete - redirect to list
  const handleDelete = async () => {
    await marketing.deleteCampaign();
    router.push(`/admin/${industry}/marketing`);
  };

  const sidebarItems = marketing.campaigns.map((campaign) => {
    const category = categories.categories.find(c => c.id === campaign.categoryId);
    return {
      id: campaign.id,
      label: campaign.name,
      icon: '📢',
      disabled: false,
      category: category?.name,
    };
  });

  return (
    <SidebarContentLayout
      title="Marketing"
      description="Manage marketing campaigns for this industry"
      sidebarItems={sidebarItems}
      selectedId={campaignId}
      onSelect={(id) => {
        const campaign = marketing.campaigns.find(c => c.id === id);
        if (campaign) handleSelectCampaign(campaign);
      }}
      loading={marketing.loading}
      actionButton={{
        label: '+ New Campaign',
        onClick: marketing.createCampaign,
        variant: 'primary',
      }}
      emptyState={{
        icon: '📢',
        title: 'No Campaigns Yet',
        description: 'Create your first campaign to get started',
      }}
    >
      <MarketingTab
        campaigns={marketing.campaigns}
        campaignsLoading={marketing.loading}
        selectedCampaignId={marketing.selectedId}
        isCreatingCampaign={marketing.isCreating}
        campaignForm={marketing.form}
        campaignEffectsForm={marketing.effectsForm}
        campaignLevelsForm={marketing.levelsForm}
        campaignSaving={marketing.saving}
        campaignDeleting={marketing.deleting}
        flags={flags.flags}
        flagsLoading={flags.loading}
        categories={categories.categories}
        categoriesLoading={categories.loading}
        upgrades={upgrades.upgrades}
        staffRoles={roles.roles}
        metricOptions={METRIC_OPTIONS}
        effectTypeOptions={EFFECT_TYPE_OPTIONS}
        onSelectCampaign={handleSelectCampaign}
        onCreateCampaign={marketing.createCampaign}
        onSaveCampaign={handleSave}
        onDeleteCampaign={handleDelete}
        onReset={marketing.reset}
        onUpdateForm={marketing.updateForm}
        onUpdateEffects={marketing.updateEffects}
        onAddLevel={marketing.addLevel}
        onRemoveLevel={marketing.removeLevel}
        onUpdateLevel={marketing.updateLevel}
      />
    </SidebarContentLayout>
  );
}
