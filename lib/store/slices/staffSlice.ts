import { StateCreator } from 'zustand';
import { GameStore } from '../gameStore';
import { Staff, addStaffEffects } from '@/lib/features/staff';
import {
  createInitialAvailableStaff,
  createRandomStaffForIndustry,
  getInitialStaffForIndustry,
} from '@/lib/game/staffConfig';
import { DEFAULT_INDUSTRY_ID, type IndustryId } from '@/lib/game/types';
import { effectManager } from '@/lib/game/effectManager';
import { checkRequirements } from '@/lib/game/requirementChecker';

export interface StaffSlice {
  hiredStaff: Staff[];
  availableStaff: Staff[];
  hireStaff: (staff: Staff) => void;
  resetStaff: () => void;
  initializeStaffForIndustry: (industryId: IndustryId) => void;
}

export const createStaffSlice: StateCreator<GameStore, [], [], StaffSlice> = (set, get) => {
  const defaultIndustryId = DEFAULT_INDUSTRY_ID;
  const initialStaff = getInitialStaffForIndustry(defaultIndustryId);
  // Note: Initial staff effects are applied without store functions (they'll be recalculated on game start)
  initialStaff.forEach((staff) => addStaffEffects(staff));
  const initialAvailable = createInitialAvailableStaff(defaultIndustryId);

  return {
    hiredStaff: initialStaff,
    availableStaff: initialAvailable,
    hireStaff: (staff: Staff) => {
      const store = get();
      const industryId = (store.selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
      const alreadyHired = store.hiredStaff.some((member) => member.id === staff.id);
      const candidate = store.availableStaff.find((member) => member.id === staff.id);

      if (alreadyHired || !candidate) {
        return;
      }

      // Check requirements
      if (candidate.requirements && candidate.requirements.length > 0) {
        const requirementsMet = checkRequirements(candidate.requirements, store);
        if (!requirementsMet) {
          console.warn(`[Requirements] Cannot hire ${candidate.name}: requirements not met`);
          return;
        }
      }

      // Apply staff effects, including direct state metric changes
      addStaffEffects(candidate, {
        applyCashChange: store.applyCashChange,
        applyTimeChange: store.applyTimeChange,
        applySkillLevelChange: store.applySkillLevelChange,
        applyFreedomScoreChange: store.applyFreedomScoreChange,
        recordEventRevenue: store.recordEventRevenue,
        recordEventExpense: store.recordEventExpense,
      });

      // Set flag if staff role sets one
      if (candidate.setsFlag) {
        store.setFlag(candidate.setsFlag, true);
        console.log(`[Flag System] Flag "${candidate.setsFlag}" set to true by hiring staff "${candidate.name}" (${candidate.role})`);
      }

      const replacement = createRandomStaffForIndustry(industryId, candidate.roleId);

      set((state) => {
        const updatedAvailable = state.availableStaff.map((member) =>
          member.id === staff.id ? replacement : member,
        );

        return {
          hiredStaff: [...state.hiredStaff, candidate],
          availableStaff: updatedAvailable,
        };
      });
    },
    resetStaff: () => {
      const store = get();
      const industryId = (store.selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;

      store.hiredStaff.forEach((staff) => {
        effectManager.removeBySource('staff', staff.id);
      });

      const resetHired = getInitialStaffForIndustry(industryId);
      const currentStore = get();
      resetHired.forEach((staff) => addStaffEffects(staff, {
        applyCashChange: currentStore.applyCashChange,
        applyTimeChange: currentStore.applyTimeChange,
        applySkillLevelChange: currentStore.applySkillLevelChange,
        applyFreedomScoreChange: currentStore.applyFreedomScoreChange,
        recordEventRevenue: currentStore.recordEventRevenue,
        recordEventExpense: currentStore.recordEventExpense,
      }));

      set({
        hiredStaff: resetHired,
        availableStaff: createInitialAvailableStaff(industryId),
      });
    },
    initializeStaffForIndustry: (industryId: IndustryId) => {
      const store = get();

      store.hiredStaff.forEach((staff) => {
        effectManager.removeBySource('staff', staff.id);
      });

      const initialHired = getInitialStaffForIndustry(industryId);
      const currentStore = get();
      initialHired.forEach((staff) => addStaffEffects(staff, {
        applyCashChange: currentStore.applyCashChange,
        applyTimeChange: currentStore.applyTimeChange,
        applySkillLevelChange: currentStore.applySkillLevelChange,
        applyFreedomScoreChange: currentStore.applyFreedomScoreChange,
        recordEventRevenue: currentStore.recordEventRevenue,
        recordEventExpense: currentStore.recordEventExpense,
      }));

      set({
        hiredStaff: initialHired,
        availableStaff: createInitialAvailableStaff(industryId),
      });
    },
  };
};
