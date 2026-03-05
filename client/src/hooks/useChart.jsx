import { useEffect, useState, useRef } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";
import { useTheme } from "./useTheme";
import { useChartTheme } from "./useChartTheme";
import { hexToRgba } from "@/utils/colorUtils";

export const useChart = (chartContainerRef, precision = 2) => {
  const [chart, setChart] = useState(null);
  const { theme } = useTheme();
  const { chartTheme, applyDefaults } = useChartTheme();
  const prevThemeRef = useRef(theme);

  // Extract primitive values for dependency tracking
  const { canvas } = chartTheme;
  const backgroundColor = canvas.backgroundColor;
  const backgroundOpacity = canvas.backgroundOpacity ?? 100;
  const gridColor = canvas.gridColor;
  const gridOpacity = canvas.gridOpacity ?? 100;
  const crosshairColor = canvas.crosshairColor;
  const crosshairOpacity = canvas.crosshairOpacity ?? 100;
  const textColor = chartTheme.scales.textColor;

  // Convert hex + opacity to rgba
  const backgroundColorRgba = hexToRgba(backgroundColor, backgroundOpacity);
  const gridColorRgba = hexToRgba(gridColor, gridOpacity);
  const crosshairColorRgba = hexToRgba(crosshairColor, crosshairOpacity);

  useEffect(() => {
    if (!chartContainerRef.current) {
      return;
    }

    const chartInstance = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: backgroundColorRgba },
        textColor: textColor,
      },
      grid: {
        vertLines: { color: gridColorRgba },
        horzLines: { color: gridColorRgba },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: crosshairColorRgba,
        },
        horzLine: {
          color: crosshairColorRgba,
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      localization: {
        priceFormatter: (price) => price.toFixed(precision),
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
          background: { color: backgroundColorRgba },
          textColor: textColor,
        },
        grid: {
          vertLines: { color: gridColorRgba },
          horzLines: { color: gridColorRgba },
        },
        crosshair: {
          vertLine: {
            color: crosshairColorRgba,
          },
          horzLine: {
            color: crosshairColorRgba,
          },
        },
      });
    } catch (error) {
      console.error("Error applying chart options:", error);
    }
  }, [
    chart,
    backgroundColorRgba,
    textColor,
    gridColorRgba,
    crosshairColorRgba,
  ]);

  // Update theme defaults ONLY when theme actually changes
  useEffect(() => {
    if (prevThemeRef.current === theme) {
      return;
    }

    prevThemeRef.current = theme;

    applyDefaults();
  }, [theme, applyDefaults]);

  // Update price formatter when precision changes
  useEffect(() => {
    if (!chart) {
      return;
    }

    try {
      chart.applyOptions({
        localization: {
          priceFormatter: (price) => price.toFixed(precision),
        },
      });
    } catch (error) {
      console.error("Error applying price formatter:", error);
    }
  }, [chart, precision]);

  return chart;
};
