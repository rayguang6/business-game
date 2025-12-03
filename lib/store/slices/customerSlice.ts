import { StateCreator } from 'zustand';
import { Customer, spawnCustomer as createCustomer, startService } from '@/lib/features/customers';
import { GameState } from '../types';
import { DEFAULT_INDUSTRY_ID, getServicesForIndustry } from '@/lib/game/config';
import type { IndustryId } from '@/lib/game/types';
import { GameStore } from '../gameStore';
import { checkRequirements } from '@/lib/game/requirementChecker';
import { getWeightedRandomService } from '@/lib/features/services';
import { getServicesFromStore } from '@/lib/store/configStore';
import { effectManager, GameMetric } from '@/lib/game/effectManager';
import { SourceType } from '@/lib/config/sourceTypes';

export interface CustomerSlice {
  customers: Customer[];
  
  spawnCustomer: () => Customer;
  addCustomers: (customers: Customer[]) => void;
  removeCustomer: (customerId: string) => void;
  startService: (customerId: string) => void;
  updateCustomers: (customers: Customer[]) => void;
  clearCustomers: () => void;
}

export const createCustomerSlice: StateCreator<GameState, [], [], CustomerSlice> = (set, get) => ({
  customers: [],
  
  spawnCustomer: () => {
    const industryId = (get().selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
    
    // Get all services and filter by requirements (same pattern as upgrades/marketing)
    const servicesFromStore = getServicesFromStore(industryId);
    const allServices =
      servicesFromStore.length > 0 ? servicesFromStore : getServicesForIndustry(industryId);
    const store = get() as GameStore;

    // Filter services that meet requirements
    const availableServices = allServices.filter((service) => {
      if (!service.requirements || service.requirements.length === 0) {
        return true; // No requirements means always available
      }
      return checkRequirements(service.requirements, store);
    });

    // If no services available, fall back to all services (shouldn't happen, but safety check)
    const servicesToUse = availableServices.length > 0 ? availableServices : allServices;

    // Find the highest available tier among accessible services
    const tierPriority = { 'small': 1, 'medium': 2, 'big': 3 };
    const highestTier = Math.max(...servicesToUse.map(s => tierPriority[s.tier || 'small']));

    // Only use services from the highest available tier
    const highestTierServices = servicesToUse.filter(s =>
      tierPriority[s.tier || 'small'] === highestTier
    );

    // Pick a weighted random service from the highest tier
    const selectedService = getWeightedRandomService(highestTierServices.length > 0 ? highestTierServices : servicesToUse);
    
    // Create customer with a manually constructed customer object to use our filtered service
    const customer = createCustomer(1, industryId);
    // Override the service that was randomly selected without requirements
    const customerWithService = {
      ...customer,
      service: selectedService,
    };
    
    // Track customer generation in metrics (for all sources: lead conversion, marketing, events, etc.)
    set((state) => ({
      metrics: {
        ...state.metrics,
        totalCustomersGenerated: (state.metrics.totalCustomersGenerated || 0) + 1,
      },
      // Also track monthly customers for history
      monthlyCustomersGenerated: (state.monthlyCustomersGenerated || 0) + 1,
    }));
    
    return customerWithService;
  },
  
  addCustomers: (customers: Customer[]) => {
    // Add customers to the array (metrics tracking is handled by spawnCustomer when called)
    set((state) => ({
      customers: [...state.customers, ...customers],
    }));
  },
  
  removeCustomer: (customerId: string) => {
    set((state) => ({
      customers: state.customers.filter(c => c.id !== customerId)
    }));
  },
  
  startService: (customerId: string) => {
    set((state) => {
      const industryId = (state.selectedIndustry?.id ?? DEFAULT_INDUSTRY_ID) as IndustryId;
      const serviceSpeedMultiplier = effectManager.calculate(GameMetric.ServiceSpeedMultiplier, 1.0);

      // Find the customer to start service for
      const customer = state.customers.find(c => c.id === customerId);
      if (!customer) return state; // Customer not found

      // Check if there's enough time available for this service
      const serviceTimeCost = customer.service.timeCost || 0;
      if (serviceTimeCost > 0 && state.metrics.time < serviceTimeCost) {
        // Not enough time available - don't start service
        console.warn(`Not enough time available for service ${customer.service.name}. Required: ${serviceTimeCost}, Available: ${state.metrics.time}`);
        return state;
      }

      // Start the service
      const updatedCustomer = startService(customer, 1, serviceSpeedMultiplier, industryId);

      // Update state with new customer and time deduction
      const updatedCustomers = state.customers.map(c =>
        c.id === customerId ? updatedCustomer : c
      );

      if (serviceTimeCost > 0) {
        // Deduct time cost
        const newTime = Math.max(0, state.metrics.time - serviceTimeCost);
        return {
          ...state,
          customers: updatedCustomers,
          metrics: {
            ...state.metrics,
            time: newTime,
            totalTimeSpent: state.metrics.totalTimeSpent + serviceTimeCost,
          },
          monthlyTimeSpent: state.monthlyTimeSpent + serviceTimeCost,
          monthlyTimeSpentDetails: [
            ...state.monthlyTimeSpentDetails,
            {
              amount: serviceTimeCost,
              label: `Service: ${customer.service.name}`,
              sourceId: customer.service.id,
              sourceType: SourceType.Other,
              sourceName: customer.service.name,
            },
          ],
        };
      }

      return {
        ...state,
        customers: updatedCustomers,
      };
    });
  },
  
  updateCustomers: (customers: Customer[]) => {
    set({ customers });
  },
  
  clearCustomers: () => {
    set({ customers: [] });
  },
});
