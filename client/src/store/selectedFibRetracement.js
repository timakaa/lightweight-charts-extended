import { create } from "zustand";

export const useSelectedFibRetracementStore = create((set) => ({
  selectedFibRetracementId: null,
  setSelectedFibRetracementId: (id) => set({ selectedFibRetracementId: id }),
  clearSelectedFibRetracementId: () => set({ selectedFibRetracementId: null }),
  hoveredFibRetracementId: null,
  setHoveredFibRetracementId: (id) => set({ hoveredFibRetracementId: id }),
  clearHoveredFibRetracementId: () => set({ hoveredFibRetracementId: null }),
}));
