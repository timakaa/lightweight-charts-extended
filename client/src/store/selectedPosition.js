import { create } from "zustand";

export const useSelectedPositionStore = create((set) => ({
  selectedLongPositionId: null,
  setSelectedLongPositionId: (id) => set({ selectedLongPositionId: id }),
  clearSelectedLongPositionId: () => set({ selectedLongPositionId: null }),
  hoveredLongPositionId: null,
  setHoveredLongPositionId: (id) => set({ hoveredLongPositionId: id }),
  clearHoveredLongPositionId: () => set({ hoveredLongPositionId: null }),

  selectedShortPositionId: null,
  setSelectedShortPositionId: (id) => set({ selectedShortPositionId: id }),
  clearSelectedShortPositionId: () => set({ selectedShortPositionId: null }),
  hoveredShortPositionId: null,
  setHoveredShortPositionId: (id) => set({ hoveredShortPositionId: id }),
  clearHoveredShortPositionId: () => set({ hoveredShortPositionId: null }),
}));
