import { useEffect } from "react";

export const usePriceAxisScroll = (chart, candlestickSeries) => {
  useEffect(() => {
    if (!chart || !candlestickSeries) return;

    const handleWheel = (event) => {
      const chartElement = chart.chartElement();
      if (!chartElement) return;

      const rect = chartElement.getBoundingClientRect();
      const x = event.clientX - rect.left;

      // Get the actual price scale width from the chart
      const priceScale = candlestickSeries.priceScale();

      // Get the chart pane size and price scale width
      const chartWidth = rect.width;
      let priceScaleWidth = 60; // fallback default

      try {
        // Try to get actual price scale width
        const priceAxisElement = chartElement.querySelector(
          ".tv-lightweight-charts table tr td:last-child",
        );
        if (priceAxisElement) {
          priceScaleWidth = priceAxisElement.offsetWidth;
        }
      } catch {
        // Fallback to estimated width based on price range
        const visibleRange = priceScale.getVisibleRange();
        if (visibleRange) {
          const maxPrice = Math.max(visibleRange.from, visibleRange.to);
          const priceStr = maxPrice.toFixed(2);
          // Estimate width: ~8px per character + 20px padding
          priceScaleWidth = Math.max(50, priceStr.length * 8 + 20);
        }
      }

      const isOverPriceAxis = x > chartWidth - priceScaleWidth;

      if (isOverPriceAxis) {
        // Always prevent default behavior when over price axis
        event.preventDefault();
        event.stopPropagation();

        try {
          const priceScale = candlestickSeries.priceScale();

          // Disable autoscale to allow manual price range setting
          priceScale.applyOptions({ autoScale: false });

          const visibleRange = priceScale.getVisibleRange();

          if (visibleRange) {
            const { from, to } = visibleRange;
            const range = to - from;
            const center = (from + to) / 2;

            // Zoom factor - scroll up to zoom in (smaller range), scroll down to zoom out (larger range)
            const zoomFactor = event.deltaY < 0 ? 0.97 : 1.03;
            const newRange = range * zoomFactor;

            const newFrom = center - newRange / 2;
            const newTo = center + newRange / 2;

            // Apply the new visible range to the price scale only
            priceScale.setVisibleRange({
              from: newFrom,
              to: newTo,
            });
          }
        } catch (error) {
          console.warn("Error adjusting price scale:", error);
        }
      } else {
        // Over the main chart area - allow default time axis behavior
        // Don't prevent default, let the chart handle time axis scrolling
        return;
      }
    };

    const chartElement = chart.chartElement();
    if (chartElement) {
      // Add event listener with capture: true to handle it early
      chartElement.addEventListener("wheel", handleWheel, {
        passive: false,
        capture: true,
      });

      return () => {
        chartElement.removeEventListener("wheel", handleWheel, {
          capture: true,
        });
      };
    }
  }, [chart, candlestickSeries]);
};
