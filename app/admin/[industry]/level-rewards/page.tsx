'use client';

import { use } from 'react';
import { LevelRewardsTab } from '../../components/LevelRewardsTab';
import { SidebarContentLayout } from '../../components/SidebarContentLayout';
import { useLevelRewards } from '../../hooks/useLevelRewards';
import { useFlags } from '../../hooks/useFlags';

export default function LevelRewardsPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const { industry } = use(params);
  const levelRewards = useLevelRewards(industry);
  const flags = useFlags(industry);

  const sidebarItems = levelRewards.levelRewards.map((reward) => ({
    id: reward.id,
    label: `Level ${reward.level}: ${reward.title}`,
    icon: '⭐',
    disabled: false,
  }));

  return (
    <SidebarContentLayout
      title="Level Rewards"
      description="Manage level-up rewards for this industry"
      sidebarItems={sidebarItems}
      selectedId={levelRewards.selectedId}
      onSelect={(id) => {
        const reward = levelRewards.levelRewards.find(r => r.id === id);
        if (reward) levelRewards.selectLevelReward(reward);
      }}
      loading={levelRewards.loading}
      actionButton={{
        label: '+ New Level Reward',
        onClick: levelRewards.createLevelReward,
        variant: 'primary',
      }}
      emptyState={{
        icon: '⭐',
        title: levelRewards.levelRewards.length === 0 ? 'No Level Rewards Yet' : 'Select a Level Reward',
        description: levelRewards.levelRewards.length === 0 
          ? 'Create your first level reward to get started'
          : 'Choose a level reward from the sidebar to edit',
      }}
      forceShowContent={levelRewards.isCreating}
    >
      {(levelRewards.isCreating || levelRewards.selectedId) ? (
        <LevelRewardsTab
          industryId={industry}
          levelRewards={levelRewards.levelRewards}
          levelRewardsLoading={levelRewards.loading}
          selectedLevelRewardId={levelRewards.selectedId}
          isCreatingLevelReward={levelRewards.isCreating}
          levelRewardForm={levelRewards.form}
          levelRewardSaving={levelRewards.saving}
          levelRewardDeleting={levelRewards.deleting}
          flags={flags.flags}
          flagsLoading={flags.loading}
          onSelectLevelReward={levelRewards.selectLevelReward}
          onCreateLevelReward={levelRewards.createLevelReward}
          onSaveLevelReward={levelRewards.saveLevelReward}
          onDeleteLevelReward={levelRewards.deleteLevelReward}
          onReset={levelRewards.reset}
          onUpdateForm={levelRewards.updateForm}
          onAddEffect={levelRewards.addEffect}
          onRemoveEffect={levelRewards.removeEffect}
          onUpdateEffect={levelRewards.updateEffect}
          onAddFlag={levelRewards.addFlag}
          onRemoveFlag={levelRewards.removeFlag}
          onUpdateFlag={levelRewards.updateFlag}
        />
      ) : (
        <div className="text-sm text-slate-400">
          {levelRewards.levelRewards.length === 0 
            ? 'Click "+ New Level Reward" to create your first level reward.'
            : 'Select a level reward from the sidebar to edit.'}
        </div>
      )}
    </SidebarContentLayout>
  );
}
