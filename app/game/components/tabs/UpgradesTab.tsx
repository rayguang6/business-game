'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useConfigStore, selectUpgradesForIndustry } from '@/lib/store/configStore';
import { SectionHeading } from '@/app/components/ui/SectionHeading';
import { UpgradeCard } from '../ui/UpgradeCard';
import { StaffCandidateCard } from '../ui/StaffCandidateCard';
import { HiredStaffCard } from '../ui/HiredStaffCard';
import type { Staff } from '@/lib/features/staff';
import { useCategories } from '../../hooks/useCategories';
import { useGameStore } from '@/lib/store/gameStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import type { IndustryId } from '@/lib/game/types';
    
// METRIC_LABELS removed - now using merged definitions from registry + database

const formatMagnitude = (value: number): string => {
  return Number.isInteger(value) ? Math.abs(value).toString() : Math.abs(value).toFixed(2);
};

// UpgradeCard component moved to separate file

// Helper to compare effects and show differences
// function compareEffects(
//   currentEffects: UpgradeEffect[],
//   nextEffects: UpgradeEffect[],
//   formatEffect: (effect: UpgradeEffect) => string,
// ): Array<{ effect: string; isNew: boolean; isImproved: boolean }> {
//   // Create a map of current effects by metric+type
//   const currentMap = new Map<string, UpgradeEffect>();
//   currentEffects.forEach((e) => {
//     const key = `${e.metric}_${e.type}`;
//     currentMap.set(key, e);
//   });

//   const result: Array<{ effect: string; isNew: boolean; isImproved: boolean }> = [];
//   nextEffects.forEach((e) => {
//     const key = `${e.metric}_${e.type}`;
//     const formatted = formatEffect(e);
//     const currentEffect = currentMap.get(key);
    
//     if (!currentEffect) {
//       // This effect doesn't exist in current level - it's new
//       result.push({ effect: formatted, isNew: true, isImproved: false });
//     } else if (currentEffect.value !== e.value) {
//       // Value changed - check if it's an improvement (higher is better for most metrics)
//       // For Add/Percent types, positive values increasing is improvement
//       // For Multiply, >1 increasing is improvement, <1 decreasing is improvement
//       // For Set, we'll just mark as changed
//       const isImprovement = 
//         (e.type === EffectType.Add && e.value > currentEffect.value) ||
//         (e.type === EffectType.Percent && e.value > currentEffect.value) ||
//         (e.type === EffectType.Multiply && e.value > currentEffect.value && e.value >= 1) ||
//         (e.type === EffectType.Multiply && e.value < currentEffect.value && e.value < 1) ||
//         (e.type === EffectType.Set);
      
//       result.push({ effect: formatted, isNew: false, isImproved: isImprovement });
//     } else {
//       // Same effect value
//       result.push({ effect: formatted, isNew: false, isImproved: false });
//     }
//   });

//   return result;
// }


// Staff components moved to separate files

// Use centralized metric icons from registry
// const getEffectIcon = (metric: GameMetric) => getMetricIcon(metric);



export function UpgradesTab() {
  const { selectedIndustry } = useGameStore();
  const industryId = (selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
  const upgradesSelector = useMemo(
    () => selectUpgradesForIndustry(industryId),
    [industryId],
  );
  const availableUpgrades = useConfigStore(upgradesSelector);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(industryId);

  // Staff-related state
  const hiredStaff = useGameStore((state) => state.hiredStaff);
  const availableStaff = useGameStore((state) => state.availableStaff);
  const hireStaff = useGameStore((state) => state.hireStaff);
  const fireStaff = useGameStore((state) => state.fireStaff);

  // Sound effects
  const { playRandomHireSound } = useSoundEffects();

  const handleHireStaff = (staffToHire: Staff) => {
    hireStaff(staffToHire);
    playRandomHireSound();
  };

  const handleFireStaff = (staffId: string) => {
    const result = fireStaff(staffId);
    if (result && !result.success) {
      // Could show error message here if needed
      console.warn(result.message);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 pb-safe pb-8">
      {/* Upgrades Section */}
      <section>
        <SectionHeading>Available Upgrades</SectionHeading>
        {(() => {
          // Group upgrades by category and sort
          const sortedCategories = categories
            .sort((a, b) => a.orderIndex - b.orderIndex);

          const upgradesByCategory = new Map<string | undefined, typeof availableUpgrades>();

          // Group upgrades by category first
          sortedCategories.forEach(category => {
            const categoryUpgrades = availableUpgrades.filter(u => u.categoryId === category.id);
            if (categoryUpgrades.length > 0) {
              upgradesByCategory.set(category.id, categoryUpgrades);
            }
          });

          // Add uncategorized upgrades (others) at the end
          const uncategorizedUpgrades = availableUpgrades.filter(u => !u.categoryId);
          if (uncategorizedUpgrades.length > 0) {
            upgradesByCategory.set(undefined, uncategorizedUpgrades);
          }

          return (
            <div className="space-y-3 sm:space-y-5 md:space-y-6">
              {Array.from(upgradesByCategory.entries()).map(([categoryId, categoryUpgrades]) => {
                const category = categoryId ? categories.find(c => c.id === categoryId) : null;
                const sortedUpgrades = categoryUpgrades.sort((a, b) => (a.order || 0) - (b.order || 0));

                return (
                  <div key={categoryId || 'others'} className="bg-slate-800/50 border border-slate-700 rounded-xl p-2 sm:p-4 md:p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-heading text-primary">
                        {category ? category.name : 'Others'}
                      </h3>
                      {category?.description && (
                        <span className="text-caption text-secondary">• {category.description}</span>
                      )}
                    </div>
                    <div className="max-w-5xl mx-auto grid grid-cols-3 gap-4">
                      {sortedUpgrades.map((upgrade) => (
                        <UpgradeCard key={upgrade.id} upgrade={upgrade} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </section>

      {/* Staff Section */}
      <section className="space-y-3 sm:space-y-4 md:space-y-6">

        {/* Current Staff - Commented out */}
        {/* {hiredStaff.length > 0 && (
          <div className="space-y-2 sm:space-y-3 md:space-y-4">
            <div className="text-center">
              <h4 className="text-heading text-primary mb-1 sm:mb-2">Current Team</h4>
            </div>
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 px-1 sm:px-1.5 md:px-2 lg:px-3">
                {hiredStaff.map((member) => (
                  <div key={member.id} className="w-full">
                    <HiredStaffCard member={member} onFire={handleFireStaff} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )} */}

        {/* Available Staff */}
        <div className="space-y-2 sm:space-y-3 md:space-y-4">
          <div className="text-center">
            <h4 className="text-heading text-primary mb-2 sm:mb-3">Hire Staff</h4>
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-3 gap-4">
              {availableStaff.map((candidate) => (
                <StaffCandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onHire={handleHireStaff}
                />
              ))}
            </div>
            {availableStaff.length === 0 && (
              <div className="text-center text-secondary text-body py-6 sm:py-8 md:py-10 w-full">
                All available staff have joined your team. Check back later!
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
