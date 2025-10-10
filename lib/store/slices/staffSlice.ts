import { StateCreator } from 'zustand';
import { GameStore } from '../gameStore';
import { Staff, generateRandomStaff } from '@/lib/features/staff';

export interface StaffSlice {
  hiredStaff: Staff[];
  hireStaff: (staff: Staff) => void;
}

export const createStaffSlice: StateCreator<GameStore, [], [], StaffSlice> = (set, get) => ({
  hiredStaff: [
    {
      id: 'staff-initial-1',
      name: 'Alice',
      salary: 500,
      increaseServiceSpeed: 0.1,
      increaseHappyCustomerProbability: 0.05,
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
      increaseServiceSpeed: 0.15,
      increaseHappyCustomerProbability: 0.08,
      emoji: '👨‍🔬',
      rank: 'purple',
      role: 'Specialist',
      level: 3,
      hireCost: 1500,
    },
  ],
  hireStaff: (staff: Staff) =>
    set((state) => {
      // Deduct hire cost from money
      state.applyCashChange(-staff.hireCost);

      const newHiredStaff = [...state.hiredStaff, staff];

      return { hiredStaff: newHiredStaff };
    }),
});
