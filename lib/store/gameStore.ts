import { create } from 'zustand';
import { createIndustrySlice, IndustrySlice } from './slices/industrySlice';
import { createGameSlice, GameSlice } from './slices/gameSlice';
import { createMetricsSlice, MetricsSlice } from './slices/metricsSlice';
import { createMonthlySlice, MonthlySlice } from './slices/monthlySlice';
import { createCustomerSlice, CustomerSlice } from './slices/customerSlice';
import { createLeadSlice, LeadSlice } from './slices/leadSlice';
import { createUpgradesSlice, UpgradesSlice } from './slices/upgradesSlice';
import { EventSlice, createEventSlice } from './slices/eventSlice';
import { createStaffSlice, StaffSlice } from './slices/staffSlice';
import { createMarketingSlice, MarketingSlice } from './slices/marketingSlice';
import { createActionNotificationsSlice, ActionNotificationsSlice } from './slices/actionNotificationsSlice';
import { createConditionSlice, ConditionSlice } from './slices/conditionSlice';
import { createFlagSlice, FlagSlice } from './slices/flagSlice';

// Combine all slices into the main store
export type GameStore = IndustrySlice &
  GameSlice &
  MetricsSlice &
  MonthlySlice &
  CustomerSlice &
  LeadSlice &
  UpgradesSlice &
  EventSlice &
  StaffSlice &
  MarketingSlice &
  ActionNotificationsSlice &
  ConditionSlice &
  FlagSlice;

export const useGameStore = create<GameStore>()((...args) => ({
  ...createIndustrySlice(...args),
  ...createGameSlice(...args),
  ...createMetricsSlice(...args),
  ...createMonthlySlice(...args),
  ...createCustomerSlice(...args),
  ...createLeadSlice(...args),
  ...createUpgradesSlice(...args),
  ...createEventSlice(...args),
  ...createStaffSlice(...args),
  ...createMarketingSlice(...args),
  ...createActionNotificationsSlice(...args),
  ...createConditionSlice(...args),
  ...createFlagSlice(...args),
}));
