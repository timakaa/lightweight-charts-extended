import { useState } from "react";
import { useSelectedPositionStore } from "@store/selectedPosition";

function useLongPositionState() {
  const [positionsData, setPositionsData] = useState([]);
  const store = useSelectedPositionStore();
  return {
    positionsData,
    setPositionsData,
    selectedPositionId: store.selectedLongPositionId,
    setSelectedPositionId: store.setSelectedLongPositionId,
    clearSelectedPositionId: store.clearSelectedLongPositionId,
    hoveredPositionId: store.hoveredLongPositionId,
    setHoveredPositionId: store.setHoveredLongPositionId,
    clearHoveredPositionId: store.clearHoveredLongPositionId,
  };
}

export default useLongPositionState;
