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

export interface CustomerSlice {
  customers: Customer[];
  
  spawnCustomer: () => Customer;
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

    // Pick a weighted random service from available ones
    const selectedService = getWeightedRandomService(servicesToUse);
    
    // Create customer with a manually constructed customer object to use our filtered service
    const customer = createCustomer(1, industryId);
    // Override the service that was randomly selected without requirements
    return {
      ...customer,
      service: selectedService,
    };
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
      
      return {
        customers: state.customers.map(customer => 
          customer.id === customerId 
            ? startService(customer, 1, serviceSpeedMultiplier, industryId) // Default to room 1 for now
            : customer
        )
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
