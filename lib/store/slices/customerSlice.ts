import { StateCreator } from 'zustand';
import { Customer, spawnCustomer as createCustomer, startService } from '@/lib/features/customers';
import { GameState } from '../types';

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
    const industryId = get().selectedIndustry?.id ?? 'dental';
    return createCustomer(1, industryId);
  },
  
  removeCustomer: (customerId: string) => {
    set((state) => ({
      customers: state.customers.filter(c => c.id !== customerId)
    }));
  },
  
  startService: (customerId: string) => {
    set((state) => ({
      customers: state.customers.map(customer => 
        customer.id === customerId 
          ? startService(customer, 1) // Default to room 1 for now
          : customer
      )
    }));
  },
  
  updateCustomers: (customers: Customer[]) => {
    set({ customers });
  },
  
  clearCustomers: () => {
    set({ customers: [] });
  },
});
