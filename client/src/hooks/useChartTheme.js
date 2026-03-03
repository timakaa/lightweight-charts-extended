import { useLocalStorage } from "./useLocalStorage";
import { useRef, useEffect } from "react";

const DEFAULT_CHART_THEME = {
  // Candle colors
  candles: {
    bodyEnabled: true,
    bodyUpColor: "#26a69a",
    bodyUpOpacity: 100,
    bodyDownColor: "#ef5350",
    bodyDownOpacity: 100,
    borderEnabled: true,
    borderUpColor: "#26a69a",
    borderUpOpacity: 100,
    borderDownColor: "#ef5350",
    borderDownOpacity: 100,
    wickEnabled: true,
    wickUpColor: "#26a69a",
    wickUpOpacity: 100,
    wickDownColor: "#ef5350",
    wickDownOpacity: 100,
  },
  // Canvas colors
  canvas: {
    backgroundEnabled: true,
    backgroundColor: "#000000",
    backgroundOpacity: 100,
    gridEnabled: true,
    gridColor: "#363c4e",
    gridOpacity: 100,
    crosshairEnabled: true,
    crosshairColor: "#9598a1",
    crosshairOpacity: 100,
    watermarkEnabled: true,
    watermarkColor: "#ffffff",
    watermarkOpacity: 100,
  },
  // Scales colors
  scales: {
    textEnabled: true,
    textColor: "#b2b5be",
    textSize: "12",
    linesEnabled: true,
    linesColor: "#2b2b43",
  },
  // Buttons visibility
  buttons: {
    navigationEnabled: true,
    paneEnabled: true,
  },
  // Margins
  margins: {
    top: 0,
    bottom: 0,
    right: 0,
  },
  // Data modification
  data: {
    precision: "default",
    timezone: "utc0",
    colorBarsBasedOnPrevClose: false,
  },
};

export function useChartTheme() {
  const [chartTheme, setChartTheme] = useLocalStorage(
    "chartTheme",
    DEFAULT_CHART_THEME,
  );

  // Batch multiple updates together
  const pendingUpdates = useRef(null);
  const timeoutRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const batchUpdate = (updateFn) => {
    if (!pendingUpdates.current) {
      pendingUpdates.current = updateFn;
    } else {
      const prevUpdate = pendingUpdates.current;
      pendingUpdates.current = (prev) => updateFn(prevUpdate(prev));
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (pendingUpdates.current) {
        setChartTheme(pendingUpdates.current);
        pendingUpdates.current = null;
      }
    }, 0);
  };

  const updateCandleColors = (updates) => {
    batchUpdate((prev) => ({
      ...prev,
      candles: { ...prev.candles, ...updates },
    }));
  };

  const updateCanvasColors = (updates) => {
    batchUpdate((prev) => ({
      ...prev,
      canvas: { ...prev.canvas, ...updates },
    }));
  };

  const updateScalesColors = (updates) => {
    setChartTheme((prev) => ({
      ...prev,
      scales: { ...prev.scales, ...updates },
    }));
  };

  const updateButtons = (updates) => {
    setChartTheme((prev) => ({
      ...prev,
      buttons: { ...prev.buttons, ...updates },
    }));
  };

  const updateMargins = (updates) => {
    setChartTheme((prev) => ({
      ...prev,
      margins: { ...prev.margins, ...updates },
    }));
  };

  const updateData = (updates) => {
    setChartTheme((prev) => ({
      ...prev,
      data: { ...prev.data, ...updates },
    }));
  };

  const applyDefaults = () => {
    setChartTheme(DEFAULT_CHART_THEME);
  };

  return {
    chartTheme,
    updateCandleColors,
    updateCanvasColors,
    updateScalesColors,
    updateButtons,
    updateMargins,
    updateData,
    applyDefaults,
  };
}
