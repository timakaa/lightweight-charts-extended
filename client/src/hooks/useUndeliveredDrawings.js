import { useEffect } from "react";
import { useDrawingsStore } from "../store/drawings";
import { getSymbol } from "../helpers/symbol";
import { API_BASE_URL } from "../config/api";

export const useUndeliveredDrawings = () => {
  const { addDrawing, updateDrawing, removeDrawing } = useDrawingsStore();

  useEffect(() => {
    const fetchUndeliveredDrawings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/drawings/undelivered`);
        const drawings = await response.json();

        drawings.forEach((drawing) => {
          const { drawing_id, drawing_data, action } = drawing;

          switch (action) {
            case "create":
              if (drawing_data) {
                const drawingWithSymbol = {
                  ...drawing_data,
                  ticker: getSymbol(drawing_data.ticker),
                };
                addDrawing(drawingWithSymbol);
              }
              break;
            case "update":
              if (drawing_id && drawing_data) {
                updateDrawing(drawing_id, {
                  ...drawing_data,
                  ticker: getSymbol(drawing_data.ticker),
                });
              }
              break;
            case "delete":
              if (drawing_id) {
                removeDrawing(drawing_id);
              }
              break;
            default:
              console.warn("Unknown drawing action:", action);
          }
        });
      } catch (error) {
        console.error("Failed to fetch undelivered drawings:", error);
      }
    };

    fetchUndeliveredDrawings();
  }, [addDrawing, updateDrawing, removeDrawing]);
};
