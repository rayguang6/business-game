import { StateCreator } from 'zustand';
import { GameStore } from '../gameStore';
import { Staff, StaffApplicant, generateRandomStaff, addStaffEffects } from '@/lib/features/staff';
import { effectManager } from '@/lib/game/effectManager';

const JOB_BOARD_APPLICANT_COUNT = 3;
export const JOB_POST_COST = 1000;

export const createInitialHiredStaff = (): Staff[] => [
  {
    id: 'staff-initial-1',
    name: 'Alice',
    salary: 500,
    increaseServiceSpeed: 10,  // 10% speed boost
    emoji: '👩‍⚕️',
    rank: 'blue',
    role: 'Assistant',
    level: 1,
    hireCost: 1000,
  },
  {
    id: 'staff-initial-2',
    name: 'Bob',
    salary: 600,
    increaseServiceSpeed: 5,  // 5% speed boost
    emoji: '👨‍🔬',
    rank: 'purple',
    role: 'Specialist',
    level: 3,
    hireCost: 1500,
  },
];

const createJobBoardApplicants = (): StaffApplicant[] => {
  const applicants: StaffApplicant[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < JOB_BOARD_APPLICANT_COUNT; i += 1) {
    let candidate: Staff;
    let tries = 0;
    do {
      const uniqueId = `job-applicant-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`;
      candidate = generateRandomStaff(uniqueId);
      tries += 1;
    } while (usedNames.has(candidate.name) && tries < 10);

    usedNames.add(candidate.name);
    applicants.push({ ...candidate, isHired: false });
  }

  return applicants;
};

export interface StaffSlice {
  hiredStaff: Staff[];
  jobBoardApplicants: StaffApplicant[];
  hireStaff: (staff: Staff) => void;
  ensureJobBoardApplicants: () => void;
  repostJobBoardApplicants: () => { success: boolean; message: string };
  resetStaff: () => void;
}

export const createStaffSlice: StateCreator<GameStore, [], [], StaffSlice> = (set, get) => {
  // Register initial staff effects
  const initialStaff = createInitialHiredStaff();
  initialStaff.forEach(staff => addStaffEffects(staff));

  return {
  hiredStaff: initialStaff,
  jobBoardApplicants: [],
  hireStaff: (staff: Staff) =>
    set((state) => {
      const alreadyHired = state.hiredStaff.some((member) => member.id === staff.id);
      const applicantMatch = state.jobBoardApplicants.find((applicant) => applicant.id === staff.id);

      if (alreadyHired || (applicantMatch?.isHired ?? false)) {
        return {};
      }

      // Deduct hire cost from money
      state.applyCashChange(-staff.hireCost);

      const { isHired: _ignored, ...rest } = (staff as StaffApplicant & { isHired?: boolean });
      const cleanStaff = rest as Staff;
      
      // Add staff effects to the effect manager
      addStaffEffects(cleanStaff);
      
      const newHiredStaff = [...state.hiredStaff, cleanStaff];
      const updatedApplicants =
        applicantMatch != null
          ? state.jobBoardApplicants.map((applicant) =>
              applicant.id === staff.id ? { ...applicant, isHired: true } : applicant,
            )
          : state.jobBoardApplicants;

      return { hiredStaff: newHiredStaff, jobBoardApplicants: updatedApplicants };
    }),
  ensureJobBoardApplicants: () => {
    if (get().jobBoardApplicants.length > 0) {
      return;
    }
    set({ jobBoardApplicants: createJobBoardApplicants() });
  },
  repostJobBoardApplicants: () => {
    const { metrics, applyCashChange } = get();
    if (metrics.cash < JOB_POST_COST) {
      return { success: false, message: `Need $${JOB_POST_COST} to repost the job board.` };
    }

    if (applyCashChange) {
      applyCashChange(-JOB_POST_COST);
    }

    set({ jobBoardApplicants: createJobBoardApplicants() });
    return { success: true, message: 'Job board refreshed with new applicants.' };
  },
  resetStaff: () => {
    // Clear all staff effects
    get().hiredStaff.forEach(staff => {
      effectManager.removeBySource('staff', staff.id);
    });
    
    // Reset to initial staff and add their effects
    const initialStaff = createInitialHiredStaff();
    initialStaff.forEach(staff => addStaffEffects(staff));
    
    set({
      hiredStaff: initialStaff,
      jobBoardApplicants: [],
    });
  },
};
};
