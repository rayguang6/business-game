import { StateCreator } from 'zustand';
import { GameStore } from '../gameStore';
import { Staff, addStaffEffects, removeStaffEffects, calculateSeveranceCost, initializeStaffPositions } from '@/lib/features/staff';
import {
  createInitialAvailableStaff,
  createRandomStaffForIndustry,
  getInitialStaffForIndustry,
  resetUsedStaffNames,
} from '@/lib/game/staffConfig';
import { DEFAULT_INDUSTRY_ID, type IndustryId } from '@/lib/game/types';
import { effectManager } from '@/lib/game/effectManager';
import { checkRequirements } from '@/lib/game/requirementChecker';
import { OneTimeCostCategory } from '../types';
import { SourceHelpers } from '@/lib/utils/financialTracking';
import { getStaffPositions } from '@/lib/game/positioning';

export interface StaffSlice {
  hiredStaff: Staff[];
  availableStaff: Staff[];
  hireStaff: (staff: Staff) => void;
  fireStaff: (staffId: string) => { success: boolean; message: string } | void;
  resetStaff: () => void;
  initializeStaffForIndustry: (industryId: IndustryId) => void;
  updateStaff: (staffId: string, updates: Partial<Staff>) => void;
  updateAllStaff: (updates: Staff[]) => void;
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
        applyExpChange: store.applyExpChange,
        applyFreedomScoreChange: store.applyFreedomScoreChange,
        recordEventRevenue: store.recordEventRevenue,
        recordEventExpense: store.recordEventExpense,
      });

      // Set flag if staff role sets one
      if (candidate.setsFlag) {
        store.setFlag(candidate.setsFlag, true);
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
    fireStaff: (staffId: string) => {
      const store = get();
      const industryId = (store.selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
      const staffToFire = store.hiredStaff.find((member) => member.id === staffId);

      if (!staffToFire) {
        return { success: false, message: 'Staff member not found.' };
      }

      // Calculate severance cost
      const severanceCost = calculateSeveranceCost(staffToFire);

      // Check if player can afford severance
      if (store.metrics.cash < severanceCost) {
        return { 
          success: false, 
          message: `Need $${severanceCost.toLocaleString()} to pay severance for ${staffToFire.name}.` 
        };
      }

      // Remove staff effects (including salary expense)
      removeStaffEffects(staffId);

      // Record severance as one-time cost for P&L tracking
      if (store.addOneTimeCost) {
        const sourceInfo = SourceHelpers.fromStaff(staffToFire.id, staffToFire.name, { action: 'Severance' });
        store.addOneTimeCost(
          {
            label: `Severance: ${staffToFire.name}`,
            amount: severanceCost,
            category: OneTimeCostCategory.Staff,
            sourceId: sourceInfo.id,
            sourceType: sourceInfo.type,
            sourceName: sourceInfo.name,
          },
          { deductNow: true }, // Deduct cash immediately
        );
      }

      // Unset flag if staff role sets one
      if (staffToFire.setsFlag) {
        store.setFlag(staffToFire.setsFlag, false);
      }

      // Create a replacement candidate and add to available staff
      const replacement = createRandomStaffForIndustry(industryId, staffToFire.roleId);

      set((state) => ({
        hiredStaff: state.hiredStaff.filter((member) => member.id !== staffId),
        availableStaff: [...state.availableStaff, replacement],
      }));

      return { success: true, message: `${staffToFire.name} has been fired. Severance paid: $${severanceCost.toLocaleString()}.` };
    },
    resetStaff: () => {
      const store = get();
      const industryId = (store.selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;

      store.hiredStaff.forEach((staff) => {
        effectManager.removeBySource('staff', staff.id);
      });

      // Reset used staff names when resetting staff
      resetUsedStaffNames(industryId);

      const resetHired = getInitialStaffForIndustry(industryId);
      const currentStore = get();
      resetHired.forEach((staff) => addStaffEffects(staff, {
        applyCashChange: currentStore.applyCashChange,
        applyTimeChange: currentStore.applyTimeChange,
        applyExpChange: currentStore.applyExpChange,
        applyFreedomScoreChange: currentStore.applyFreedomScoreChange,
        recordEventRevenue: currentStore.recordEventRevenue,
        recordEventExpense: currentStore.recordEventExpense,
      }));

      // Initialize staff positions from layout config
      const staffPositions = getStaffPositions(industryId);
      const staffWithPositions = initializeStaffPositions(resetHired, staffPositions);

      set({
        hiredStaff: staffWithPositions,
        availableStaff: createInitialAvailableStaff(industryId),
      });
    },
    initializeStaffForIndustry: (industryId: IndustryId) => {
      const store = get();

      store.hiredStaff.forEach((staff) => {
        effectManager.removeBySource('staff', staff.id);
      });

      // Reset used staff names when switching industries
      resetUsedStaffNames(industryId);

      const initialHired = getInitialStaffForIndustry(industryId);
      const currentStore = get();
      initialHired.forEach((staff) => addStaffEffects(staff, {
        applyCashChange: currentStore.applyCashChange,
        applyTimeChange: currentStore.applyTimeChange,
        applyExpChange: currentStore.applyExpChange,
        applyFreedomScoreChange: currentStore.applyFreedomScoreChange,
        recordEventRevenue: currentStore.recordEventRevenue,
        recordEventExpense: currentStore.recordEventExpense,
      }));

      // Initialize staff positions from layout config
      const staffPositions = getStaffPositions(industryId);
      const staffWithPositions = initializeStaffPositions(initialHired, staffPositions);

      set({
        hiredStaff: staffWithPositions,
        availableStaff: createInitialAvailableStaff(industryId),
      });
    },
    updateStaff: (staffId: string, updates: Partial<Staff>) => {
      set((state) => ({
        hiredStaff: state.hiredStaff.map((staff) =>
          staff.id === staffId ? { ...staff, ...updates } : staff
        ),
      }));
    },
    updateAllStaff: (updates: Staff[]) => {
      set({ hiredStaff: updates });
    },
  };
};
