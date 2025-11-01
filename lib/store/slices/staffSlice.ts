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
  initialStaff.forEach((staff) => addStaffEffects(staff));
  const initialAvailable = createInitialAvailableStaff(defaultIndustryId);

  return {
    hiredStaff: initialStaff,
    availableStaff: initialAvailable,
    hireStaff: (staff: Staff) =>
      set((state) => {
        const industryId = (state.selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
        const alreadyHired = state.hiredStaff.some((member) => member.id === staff.id);
        const candidate = state.availableStaff.find((member) => member.id === staff.id);

        if (alreadyHired || !candidate) {
          return {};
        }

        addStaffEffects(candidate);

        // Set flag if staff role sets one
        if (candidate.setsFlag) {
          get().setFlag(candidate.setsFlag, true);
          console.log(`[Flag System] Flag "${candidate.setsFlag}" set to true by hiring staff "${candidate.name}" (${candidate.role})`);
        }

        const replacement = createRandomStaffForIndustry(industryId, candidate.roleId);

        const updatedAvailable = state.availableStaff.map((member) =>
          member.id === staff.id ? replacement : member,
        );

        return {
          hiredStaff: [...state.hiredStaff, candidate],
          availableStaff: updatedAvailable,
        };
      }),
    resetStaff: () => {
      const store = get();
      const industryId = (store.selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;

      store.hiredStaff.forEach((staff) => {
        effectManager.removeBySource('staff', staff.id);
      });

      const resetHired = getInitialStaffForIndustry(industryId);
      resetHired.forEach((staff) => addStaffEffects(staff));

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
      initialHired.forEach((staff) => addStaffEffects(staff));

      set({
        hiredStaff: initialHired,
        availableStaff: createInitialAvailableStaff(industryId),
      });
    },
  };
};
