// useShortPositionState.js - React hook for managing short position state (data, selection, hover)
import { useState } from "react";
import { useSelectedPositionStore } from "../../store/selectedPosition";

// Handles short positions data, selection, and hover state
function useShortPositionState() {
  const [positionsData, setPositionsData] = useState([]);
  const store = useSelectedPositionStore();
  return {
    positionsData,
    setPositionsData,
    selectedPositionId: store.selectedShortPositionId,
    setSelectedPositionId: store.setSelectedShortPositionId,
    clearSelectedPositionId: store.clearSelectedShortPositionId,
    hoveredPositionId: store.hoveredShortPositionId,
    setHoveredPositionId: store.setHoveredShortPositionId,
    clearHoveredPositionId: store.clearHoveredShortPositionId,
  };
}

export default useShortPositionState;
