import { StateCreator } from 'zustand';
import { GameStore } from '../gameStore';
import { Staff, addStaffEffects } from '@/lib/features/staff';
import {
  INITIAL_STAFF_CONFIG,
  createInitialAvailableStaff,
  createRandomStaff,
  getRoleKeyByRoleName,
} from '@/lib/game/staffConfig';
import { effectManager } from '@/lib/game/effectManager';

export const createInitialHiredStaff = (): Staff[] =>
  INITIAL_STAFF_CONFIG.map((entry) => ({ ...entry }));

export interface StaffSlice {
  hiredStaff: Staff[];
  availableStaff: Staff[];
  hireStaff: (staff: Staff) => void;
  resetStaff: () => void;
}

export const createStaffSlice: StateCreator<GameStore, [], [], StaffSlice> = (set, get) => {
  // Register initial staff effects
  const initialStaff = createInitialHiredStaff();
  initialStaff.forEach(staff => addStaffEffects(staff));
  const initialAvailable = createInitialAvailableStaff();

  return {
    hiredStaff: initialStaff,
    availableStaff: initialAvailable,
    hireStaff: (staff: Staff) =>
      set((state) => {
        const alreadyHired = state.hiredStaff.some((member) => member.id === staff.id);
        const candidate = state.availableStaff.find((member) => member.id === staff.id);

        if (alreadyHired || !candidate) {
          return {};
        }

        addStaffEffects(candidate);

        const roleKey = getRoleKeyByRoleName(candidate.role);
        const replacement = createRandomStaff(roleKey);

        const updatedAvailable = state.availableStaff.map((member) =>
          member.id === staff.id ? replacement : member,
        );

        return {
          hiredStaff: [...state.hiredStaff, candidate],
          availableStaff: updatedAvailable,
        };
      }),
    resetStaff: () => {
      // Clear all staff effects
      get().hiredStaff.forEach(staff => {
        effectManager.removeBySource('staff', staff.id);
      });
      
      // Reset to initial staff and add their effects
      const resetHired = createInitialHiredStaff();
      resetHired.forEach(staff => addStaffEffects(staff));
      
      set({
        hiredStaff: resetHired,
        availableStaff: createInitialAvailableStaff(),
      });
    },
  };
};
