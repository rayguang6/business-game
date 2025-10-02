import { StateCreator } from 'zustand';
import { Industry } from '@/lib/features/industries';
import { GameState } from '../types';

export interface IndustrySlice {
  selectedIndustry: Industry | null;
  setSelectedIndustry: (industry: Industry) => void;
}

export const createIndustrySlice: StateCreator<GameState, [], [], IndustrySlice> = (set) => ({
  selectedIndustry: null,
  
  setSelectedIndustry: (industry: Industry) => {
    set({ selectedIndustry: industry });
  },
});
