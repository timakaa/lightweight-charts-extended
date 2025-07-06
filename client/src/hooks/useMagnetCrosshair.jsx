import { useEffect } from "react";
import { CrosshairMode } from "lightweight-charts";

export function useMagnetCrosshair(chart) {
  useEffect(() => {
    if (!chart) return;

    const handleKeyDown = (e) => {
      if (e.key === "Meta" || e.key === "Control") {
        chart.applyOptions({ crosshair: { mode: CrosshairMode.MagnetOHLC } });
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === "Meta" || e.key === "Control") {
        chart.applyOptions({ crosshair: { mode: CrosshairMode.Normal } });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [chart]);
}
