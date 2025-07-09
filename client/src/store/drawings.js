import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateId } from "../helpers/generateId";

export const useDrawingsStore = create(
  persist(
    (set, get) => ({
      drawings: [],

      // Add a new drawing
      addDrawing: (drawingData) => {
        const newDrawing = {
          ...drawingData,
          id: drawingData.id || generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          drawings: [...state.drawings, newDrawing],
        }));
        return newDrawing;
      },

      // Remove a drawing by ID
      removeDrawing: (drawingId) => {
        set((state) => ({
          drawings: state.drawings.filter(
            (drawing) => drawing.id !== drawingId,
          ),
        }));
      },

      // Update a drawing
      updateDrawing: (drawingId, updateData) => {
        set((state) => ({
          drawings: state.drawings.map((drawing) =>
            drawing.id === drawingId
              ? {
                  ...drawing,
                  ...updateData,
                  updatedAt: new Date().toISOString(),
                }
              : drawing,
          ),
        }));
      },

      // Clear all drawings
      clearAllDrawings: () => {
        set({ drawings: [] });
      },

      // Clear drawings for specific ticker
      clearTickerDrawings: (ticker) => {
        set((state) => ({
          drawings: state.drawings.filter(
            (drawing) => drawing.ticker !== ticker,
          ),
        }));
      },

      // Get drawings for specific ticker
      getDrawingsByTicker: (ticker) => {
        const normalizedTicker = ticker.replace("/", "");
        return get().drawings.filter(
          (drawing) => drawing.ticker === normalizedTicker,
        );
      },

      // Get drawings by type
      getDrawingsByType: (type) => {
        return get().drawings.filter((drawing) => drawing.type === type);
      },

      // Get drawings by ticker and type
      getDrawingsByTickerAndType: (ticker, type) => {
        const normalizedTicker = ticker.replace("/", "");
        return get().drawings.filter(
          (drawing) =>
            drawing.ticker === normalizedTicker && drawing.type === type,
        );
      },

      // Get drawing by ID
      getDrawingById: (drawingId) => {
        return get().drawings.find((drawing) => drawing.id === drawingId);
      },

      // Update drawing position by primitive ID (for drag/resize operations)
      updateDrawingByPrimitiveId: (primitiveId, updates) => {
        set((state) => ({
          drawings: state.drawings.map((drawing) =>
            drawing.primitiveId === primitiveId
              ? {
                  ...drawing,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : drawing,
          ),
        }));
      },
    }),
    {
      name: "drawings-storage", // localStorage key
      version: 1,
    },
  ),
);
