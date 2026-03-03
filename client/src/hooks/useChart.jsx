import { useEffect, useState, useRef } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";
import { useTheme } from "./useTheme";
import { useChartTheme } from "./useChartTheme";

export const useChart = (chartContainerRef) => {
  const [chart, setChart] = useState(null);
  const { theme } = useTheme();
  const { chartTheme, updateCanvasColors, updateCandleColors } =
    useChartTheme();

  // Extract primitive values for dependency tracking
  const backgroundColor = chartTheme.canvas.backgroundColor;
  const textColor = chartTheme.scales.textColor;
  const gridColor = chartTheme.canvas.gridColor;
  const crosshairColor = chartTheme.canvas.crosshairColor;

  // Update theme defaults when theme toggle changes
  useEffect(() => {
    if (theme === "dark") {
      updateCanvasColors({ backgroundColor: "#000000" });
      queueMicrotask(() => {
        updateCandleColors({
          bodyUpColor: "#26a69a",
          bodyDownColor: "#ef5350",
          borderUpColor: "#26a69a",
          borderDownColor: "#ef5350",
          wickUpColor: "#26a69a",
          wickDownColor: "#ef5350",
        });
      });
    } else {
      updateCanvasColors({ backgroundColor: "#ffffff" });
      queueMicrotask(() => {
        updateCandleColors({
          bodyUpColor: "#22c55e",
          bodyDownColor: "#ef4444",
          borderUpColor: "#22c55e",
          borderDownColor: "#ef4444",
          wickUpColor: "#22c55e",
          wickDownColor: "#ef4444",
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  useEffect(() => {
    if (!chartContainerRef.current) {
      return;
    }

    const chartInstance = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: backgroundColor },
        textColor: textColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: crosshairColor,
        },
        horzLine: {
          color: crosshairColor,
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    setChart(chartInstance);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chartInstance.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    // Use ResizeObserver to watch container size changes
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    resizeObserver.observe(chartContainerRef.current);

    chartInstance.applyOptions({
      localization: {
        timeFormatter: (timestamp) => {
          // timestamp is in seconds
          const date = new Date(timestamp * 1000);
          const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          const day = days[date.getUTCDay()];
          const dayNum = date.getUTCDate().toString().padStart(2, "0");
          const month = months[date.getUTCMonth()];
          const year = `'${date.getUTCFullYear().toString().slice(-2)}`;
          const hours = date.getUTCHours().toString().padStart(2, "0");
          const minutes = date.getUTCMinutes().toString().padStart(2, "0");
          const timeStr = `${hours}:${minutes}`;
          return `${day} ${dayNum} ${month} ${year}  ${timeStr}`;
        },
      },
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      chartInstance.remove();
      setChart(null);
    };
  }, [chartContainerRef]);

  // Update chart colors when color values change
  useEffect(() => {
    if (!chart) {
      console.log("No chart yet, skipping");
      return;
    }

    try {
      chart.applyOptions({
        layout: {
          background: { color: backgroundColor },
          textColor: textColor,
        },
        grid: {
          vertLines: { color: gridColor },
          horzLines: { color: gridColor },
        },
        crosshair: {
          vertLine: {
            color: crosshairColor,
          },
          horzLine: {
            color: crosshairColor,
          },
        },
      });
    } catch (error) {
      console.error("Error applying chart options:", error);
    }
  }, [chart, backgroundColor, textColor, gridColor, crosshairColor]);

  return chart;
};
