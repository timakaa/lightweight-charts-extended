import { useEffect } from "react";
import { useDrawingsStore } from "../store/drawings";

export const useUndeliveredDrawings = () => {
  const { addDrawing, updateDrawing, removeDrawing } = useDrawingsStore();

  useEffect(() => {
    const fetchUndeliveredDrawings = async () => {
      try {
        const response = await fetch("/api/v1/drawings/undelivered");
        const drawings = await response.json();

        drawings.forEach((drawing) => {
          switch (drawing.action) {
            case "create":
              addDrawing(drawing.symbol, drawing.drawing_data);
              break;
            case "update":
              updateDrawing(
                drawing.symbol,
                drawing.drawing_id,
                drawing.drawing_data,
              );
              break;
            case "delete":
              removeDrawing(drawing.symbol, drawing.drawing_id);
              break;
            default:
              console.warn("Unknown drawing action:", drawing.action);
          }
        });
      } catch (error) {
        console.error("Failed to fetch undelivered drawings:", error);
      }
    };

    fetchUndeliveredDrawings();
  }, [addDrawing, updateDrawing, removeDrawing]);
};
