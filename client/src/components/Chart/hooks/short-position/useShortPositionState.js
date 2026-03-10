import { useState } from "react";
import { useSelectedPositionStore } from "@store/selectedPosition";

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
