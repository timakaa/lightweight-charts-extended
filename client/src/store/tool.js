import { create } from "zustand";

export const TOOL_CROSSHAIR = "crosshair";
export const TOOL_LINE = "line";
export const TOOL_BOX = "box";
export const TOOL_RULER = "ruler";
export const TOOL_LONG_POSITION = "long_position";
export const TOOL_SHORT_POSITION = "short_position";
export const TOOL_FIB_RETRACEMENT = "fib_retracement";

const useToolStore = create((set) => ({
  currentTool: TOOL_CROSSHAIR,
  setCurrentTool: (tool) => set({ currentTool: tool }),
  resetCurrentTool: () => set({ currentTool: TOOL_CROSSHAIR }),
}));
export default useToolStore;
export { useToolStore };
