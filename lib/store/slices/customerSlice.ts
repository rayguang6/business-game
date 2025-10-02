import { StateCreator } from 'zustand';
import { Customer } from '@/lib/game/customers/types';
import { spawnCustomer as createCustomer, startService } from '@/lib/game/customers/mechanics';
import { GameState } from '../types';

export interface CustomerSlice {
  customers: Customer[];
  
  spawnCustomer: () => Customer;
  removeCustomer: (customerId: string) => void;
  startService: (customerId: string) => void;
  updateCustomers: (customers: Customer[]) => void;
  clearCustomers: () => void;
}

export const createCustomerSlice: StateCreator<GameState, [], [], CustomerSlice> = (set) => ({
  customers: [],
  
  spawnCustomer: () => {
    return createCustomer();
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
          ? startService(customer)
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
