'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MarketingTab } from '../../components/MarketingTab';
import { SidebarContentLayout } from '../../components/SidebarContentLayout';
import { useMarketing } from '../../hooks/useMarketing';
import { useUpgrades, useAllUpgrades } from '../../hooks/useUpgrades';
import { useCategories } from '../../hooks/useCategories';
import { METRIC_OPTIONS, EFFECT_TYPE_OPTIONS } from '../../utils/constants';
import { buildMarketingDetailUrl } from '../../utils/routing';

export default function MarketingPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const { industry } = use(params);
  const router = useRouter();
  const marketing = useMarketing(industry);
  const allUpgrades = useAllUpgrades();
  const categories = useCategories(industry);

  // Auto-redirect to first campaign if campaigns are loaded and not creating
  useEffect(() => {
    if (!marketing.loading && marketing.campaigns.length > 0 && !marketing.isCreating) {
      const firstCampaign = marketing.campaigns[0];
      router.replace(buildMarketingDetailUrl(industry, firstCampaign.id));
    }
  }, [marketing.loading, marketing.campaigns, marketing.isCreating, industry, router]);

  // Handle campaign selection - navigate to detail page
  const handleSelectCampaign = (campaign: import('@/lib/store/slices/marketingSlice').MarketingCampaign) => {
    router.push(buildMarketingDetailUrl(industry, campaign.id));
  };

  // Handle create new - show form inline
  const handleCreateNew = () => {
    marketing.createCampaign();
  };

  // Handle save - navigate to detail page after creating
  const handleSave = async () => {
    const wasCreating = marketing.isCreating;
    await marketing.saveCampaign();
    
    if (wasCreating && marketing.form.id) {
      router.push(buildMarketingDetailUrl(industry, marketing.form.id));
    }
  };

  // Handle delete - stay on list page
  const handleDelete = async () => {
    await marketing.deleteCampaign();
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

  // Show loading or redirecting state
  if (marketing.loading || (marketing.campaigns.length > 0 && !marketing.isCreating)) {
    return (
      <SidebarContentLayout
        title="Marketing"
        description="Manage marketing campaigns for this industry"
        sidebarItems={sidebarItems}
        selectedId=""
        onSelect={(id) => {
          const campaign = marketing.campaigns.find(c => c.id === id);
          if (campaign) handleSelectCampaign(campaign);
        }}
        loading={marketing.loading}
        actionButton={{
          label: '+ New Campaign',
          onClick: handleCreateNew,
          variant: 'primary',
        }}
        emptyState={{
          icon: '📢',
          title: 'Loading Campaigns',
          description: 'Redirecting to first campaign...',
        }}
      >
        <div className="text-sm text-slate-400">Redirecting...</div>
      </SidebarContentLayout>
    );
  }

  // Show list with create form or empty state
  return (
    <SidebarContentLayout
      title="Marketing"
      description={marketing.campaigns.length === 0 ? "Create your first campaign" : "Select a campaign to edit"}
      sidebarItems={sidebarItems}
      selectedId=""
      onSelect={(id) => {
        const campaign = marketing.campaigns.find(c => c.id === id);
        if (campaign) handleSelectCampaign(campaign);
      }}
      loading={marketing.loading}
      actionButton={{
        label: '+ New Campaign',
        onClick: handleCreateNew,
        variant: 'primary',
      }}
      emptyState={{
        icon: '📢',
        title: marketing.campaigns.length === 0 ? 'No Campaigns Yet' : 'Select a Campaign',
        description: marketing.campaigns.length === 0 
          ? 'Create your first campaign to get started'
          : 'Choose a campaign from the sidebar to edit',
      }}
      forceShowContent={marketing.isCreating}
    >
      {marketing.isCreating ? (
        <MarketingTab
          industryId={industry}
          campaigns={marketing.campaigns}
          campaignsLoading={marketing.loading}
          selectedCampaignId={marketing.selectedId}
          isCreatingCampaign={marketing.isCreating}
          campaignForm={marketing.form}
          campaignEffectsForm={marketing.effectsForm}
          campaignLevelsForm={marketing.levelsForm}
          campaignSaving={marketing.saving}
          campaignDeleting={marketing.deleting}
          categories={categories.categories}
          categoriesLoading={categories.loading}
          metricOptions={METRIC_OPTIONS}
          effectTypeOptions={EFFECT_TYPE_OPTIONS}
          onSelectCampaign={handleSelectCampaign}
          onCreateCampaign={handleCreateNew}
          onSaveCampaign={handleSave}
          onDeleteCampaign={handleDelete}
          onReset={marketing.reset}
          onUpdateForm={marketing.updateForm}
          onUpdateEffects={marketing.updateEffects}
          onAddLevel={marketing.addLevel}
          onRemoveLevel={marketing.removeLevel}
          onUpdateLevel={marketing.updateLevel}
        />
      ) : (
        <div className="text-sm text-slate-400">
          {marketing.campaigns.length === 0 
            ? 'Click "+ New Campaign" to create your first campaign.'
            : 'Select a campaign from the sidebar to edit.'}
        </div>
      )}
    </SidebarContentLayout>
  );
}
