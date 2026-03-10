import { useState } from "react";
import { useSelectedBoxStore } from "@store/selectedBox";

function useBoxState() {
  const [boxesData, setBoxesData] = useState([]);
  const {
    selectedBoxId,
    setSelectedBoxId,
    clearSelectedBoxId,
    hoveredBoxId,
    setHoveredBoxId,
    clearHoveredBoxId,
  } = useSelectedBoxStore();
  return {
    boxesData,
    setBoxesData,
    selectedBoxId,
    setSelectedBoxId,
    clearSelectedBoxId,
    hoveredBoxId,
    setHoveredBoxId,
    clearHoveredBoxId,
  };
}

export default useBoxState;
