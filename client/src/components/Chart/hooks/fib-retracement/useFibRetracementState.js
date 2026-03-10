import { useState } from "react";
import { useSelectedFibRetracementStore } from "@store/selectedFibRetracement";

function useFibRetracementState() {
  const [retracementsData, setRetracementsData] = useState([]);
  const {
    selectedFibRetracementId,
    setSelectedFibRetracementId,
    clearSelectedFibRetracementId,
    hoveredFibRetracementId,
    setHoveredFibRetracementId,
    clearHoveredFibRetracementId,
  } = useSelectedFibRetracementStore();
  return {
    retracementsData,
    setRetracementsData,
    selectedFibRetracementId,
    setSelectedFibRetracementId,
    clearSelectedFibRetracementId,
    hoveredFibRetracementId,
    setHoveredFibRetracementId,
    clearHoveredFibRetracementId,
  };
}

export default useFibRetracementState;
