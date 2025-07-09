import { useEffect } from "react";
import { useDrawingsStore } from "../store/drawings";
import { getSymbol } from "../helpers/symbol";

export const useUndeliveredDrawings = () => {
  const { addDrawing, updateDrawing, removeDrawing } = useDrawingsStore();

  useEffect(() => {
    const fetchUndeliveredDrawings = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/v1/drawings/undelivered`,
        );
        const drawings = await response.json();

        drawings.forEach((drawing) => {
          const { symbol, drawing_id, drawing_data, action } = drawing;

          switch (action) {
            case "create":
              if (drawing_data) {
                console.log("drawing_data", drawing_data);
                const drawingWithSymbol = {
                  ...drawing_data,
                  ticker: getSymbol(symbol),
                };
                addDrawing(drawingWithSymbol);
              }
              break;
            case "update":
              if (drawing_id && drawing_data) {
                updateDrawing(drawing_id, {
                  ...drawing_data,
                  ticker: getSymbol(symbol),
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
