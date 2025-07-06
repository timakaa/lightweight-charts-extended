import { create } from "zustand";

export const useChartStore = create((set) => ({
  ticker: null,
  timeframe: "1h",
  setTicker: (ticker) => set({ ticker }),
  setTimeframe: (timeframe) => set({ timeframe }),
}));
