import { create } from "zustand";

export const useSelectedBoxStore = create((set) => ({
  selectedBoxId: null,
  setSelectedBoxId: (id) => set({ selectedBoxId: id }),
  clearSelectedBoxId: () => set({ selectedBoxId: null }),
  hoveredBoxId: null,
  setHoveredBoxId: (id) => set({ hoveredBoxId: id }),
  clearHoveredBoxId: () => set({ hoveredBoxId: null }),
}));
