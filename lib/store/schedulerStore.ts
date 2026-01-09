import { create } from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import {SchedulerData} from "@/lib/types/scheduler.types";

interface SchedulerState {
  schedulerData: SchedulerData | null;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setSchedulerData: (data: SchedulerData) => void;
  updateSchedulerData: (partial: Partial<SchedulerData>) => void;
  clearSchedulerData: () => void;
}

export const useSchedulerStore = create<SchedulerState>()(
  persist(
    (set) => ({
      schedulerData: null,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setSchedulerData: (schedulerData) => set({ schedulerData }),
      updateSchedulerData: (partial) =>
        set((state) => ({
          schedulerData: state.schedulerData
            ? { ...state.schedulerData, ...partial }
            : partial as SchedulerData,
        })),
      clearSchedulerData: () => set({ schedulerData: null }),
    }),
    {
      name: 'scheduler-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        schedulerData: state.schedulerData,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);