import { useEffect, useState } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";

export const useChart = (chartContainerRef) => {
  const [chart, setChart] = useState(null);

  useEffect(() => {
    if (!chartContainerRef.current) {
      return;
    }

    const chartInstance = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: "#000" },
        textColor: "rgba(255, 255, 255, 0.9)",
      },
      grid: {
        vertLines: { color: "#33415800" },
        horzLines: { color: "#33415800" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 100,
      },
    });

    setChart(chartInstance);

    const handleResize = () => {
      chartInstance.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
    };

    window.addEventListener("resize", handleResize);

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
      chartInstance.remove();
      setChart(null);
    };
  }, [chartContainerRef]);

  return chart;
};
