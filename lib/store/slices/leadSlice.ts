import { StateCreator } from 'zustand';
import { Lead, spawnLead as createLead } from '@/lib/features/leads';
import { GameState } from '../types';
import { DEFAULT_INDUSTRY_ID } from '@/lib/game/config';
import type { IndustryId } from '@/lib/game/types';

export interface LeadSlice {
  spawnLead: () => Lead;
  removeLead: (leadId: string) => void;
  updateLeads: (leads: Lead[]) => void;
  clearLeads: () => void;
}

export const createLeadSlice: StateCreator<GameState, [], [], LeadSlice> = (set, get) => ({
  
  spawnLead: () => {
    const industryId = (get().selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
    const lead = createLead(industryId);
    
    // Track lead spawn in metrics (for all sources: auto-spawn, marketing, events, etc.)
    set((state) => ({
      metrics: {
        ...state.metrics,
        totalLeadsSpawned: (state.metrics.totalLeadsSpawned || 0) + 1,
      },
      // Also track monthly leads for history
      monthlyLeadsSpawned: (state.monthlyLeadsSpawned || 0) + 1,
    }));
    
    return lead;
  },
  
  removeLead: (leadId: string) => {
    set((state) => ({
      leads: state.leads.filter(l => l.id !== leadId)
    }));
  },
  
  updateLeads: (leads: Lead[]) => {
    set({ leads });
  },
  
  clearLeads: () => {
    set({ leads: [] });
  },
});

