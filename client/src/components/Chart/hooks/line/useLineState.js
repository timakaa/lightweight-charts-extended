import { useState } from "react";
import { useSelectedLineStore } from "@store/selectedLine";

function useLineState() {
  const [linesData, setLinesData] = useState([]);
  const {
    selectedLineId,
    setSelectedLineId,
    clearSelectedLineId,
    hoveredLineId,
    setHoveredLineId,
    clearHoveredLineId,
  } = useSelectedLineStore();
  return {
    linesData,
    setLinesData,
    selectedLineId,
    setSelectedLineId,
    clearSelectedLineId,
    hoveredLineId,
    setHoveredLineId,
    clearHoveredLineId,
  };
}

export default useLineState;
