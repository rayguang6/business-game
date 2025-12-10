'use client';

import { StateCreator } from 'zustand';

export interface ActionNotification {
  id: string;
  type: 'upgrade' | 'marketing';
  title: string;
  description?: string;
  timestamp: number;
  duration: number; // in milliseconds
}

export interface ActionNotificationsSlice {
  notifications: ActionNotification[];

  // Actions
  addNotification: (notification: Omit<ActionNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearExpiredNotifications: () => void;
  resetNotifications: () => void;
}

export const createActionNotificationsSlice: StateCreator<
  ActionNotificationsSlice,
  [],
  [],
  ActionNotificationsSlice
> = (set, get) => ({
  notifications: [],

  addNotification: (notificationData) => {
    const notification: ActionNotification = {
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...notificationData,
    };

    set((state) => ({
      notifications: [
        notification,
        ...state.notifications.slice(0, 2), // Keep only latest 3 notifications
      ],
    }));
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearExpiredNotifications: () => {
    const now = Date.now();
    set((state) => ({
      notifications: state.notifications.filter((n) => {
        const age = now - n.timestamp;
        return age < n.duration;
      }),
    }));
  },

  resetNotifications: () => {
    set({
      notifications: [],
    });
  },
});