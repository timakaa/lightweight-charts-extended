import { create } from "zustand";

export const useSelectedLineStore = create((set) => ({
  selectedLineId: null,
  setSelectedLineId: (id) => set({ selectedLineId: id }),
  clearSelectedLineId: () => set({ selectedLineId: null }),
  hoveredLineId: null,
  setHoveredLineId: (id) => set({ hoveredLineId: id }),
  clearHoveredLineId: () => set({ hoveredLineId: null }),
}));
