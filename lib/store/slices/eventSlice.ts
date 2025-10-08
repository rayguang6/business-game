import { StateCreator } from "zustand";
import { GameEvent } from "../../types/gameEvents";

export interface EventSlice {
  currentEvent: GameEvent | null;
  setCurrentEvent: (event: GameEvent | null) => void;
}

export const createEventSlice: StateCreator<EventSlice> = (set) => ({
  currentEvent: null,
  setCurrentEvent: (event) => set({ currentEvent: event }),
});
