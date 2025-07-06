import { useEffect, useRef } from "react";
import {
  isPointNearRectangleCorner,
  isPointNearRectangleMidpoint,
} from "../../drawing-tools/rectangle/helpers";
import { getSnappedPrice } from "../../drawing-tools/helpers";
import { getXCoordinate } from "../../helpers/coordinateUtils";
import { updateDrawingPosition } from "../../helpers/updateDrawingPosition.js";

/**
 * useBoxResize
 *
 * This React hook enables resizing of rectangles (boxes) on the chart by dragging their corners or midpoints.
 * It manages the state of the current resize operation and updates the box coordinates in response to mouse events.
 *
 * - Handles both corner and midpoint resizing.
 * - Supports magnet (snapping) logic to snap to the nearest candle time/price when Meta/Ctrl is pressed.
 * - Keeps all cursor logic out of this hook (handled in useBoxCursor for separation of concerns).
 * - Uses hybrid coordinate system to support coordinates outside candle range.
 *
 * @param {object} chart - The chart instance (must provide chartElement and timeScale methods)
 * @param {object} candlestickSeries - The candlestick series instance (must provide coordinateToPrice method)
 * @param {string|null} hoveredBoxId - The ID of the currently hovered box, or null if none
 * @param {object} boxesDataRef - React ref object containing the array of all box data
 * @param {object} isResizingRef - React ref object for tracking if a resize is in progress
 * @param {function} setSelectedBoxId - Function to set the selected box ID
 * @param {array} candleData - Array of candle data for magnet snapping and coordinate calculation
 * @param {object} activeResizeHandleRef - React ref object for tracking the active resize handle
 * @param {object} dragOrResizeStateRef - React ref object for tracking the drag or resize state
 */
function useBoxResize(
  chart,
  candlestickSeries,
  hoveredBoxId,
  selectedBoxId,
  boxesDataRef,
  isResizingRef,
  setSelectedBoxId,
  candleData,
  activeResizeHandleRef,
  dragOrResizeStateRef,
) {
  // State: which box and which handle is being resized
  const resizeState = useRef({
    isResizing: false,
    boxId: null,
    corner: null, // 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'
    timePoint: null, // '_p1' or '_p2'
    pricePoint: null, // '_p1' or '_p2'
    axis: null, // 'time' or 'price' for midpoints
    axisPoint: null, // '_p1' or '_p2' for midpoints
    startMouse: null,
    startBox: null, // { p1, p2 }
    handleHidden: false,
  });

  // --- ADDED: keyStateRef and lastMouseEventRef for instant snapping ---
  const keyStateRef = useRef({
    isMagnet: false,
  });
  const lastMouseEventRef = useRef(null);

  useEffect(() => {
    if (!chart) return;
    const container = chart.chartElement ? chart.chartElement() : null;
    if (!container) return;

    // Helper to convert mouse event to logical chart coordinates with hybrid support
    const getMouseLogical = (event) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const timeScale = chart.timeScale();

      // Get logical coordinate (always available)
      const logicalIndex = timeScale.coordinateToLogical(x);

      // Try to get time using coordinateToTime first
      let time = timeScale.coordinateToTime(x);

      // If time is null (outside data range), calculate from logical coordinate
      if (time === null && candleData && candleData.length > 0) {
        time = logicalIndexToTime(logicalIndex, candleData);
      }

      const price = candlestickSeries.coordinateToPrice(y);

      // Return point with both time and logical coordinates
      return {
        time,
        price,
        logicalIndex: logicalIndex,
        x,
        y,
      };
    };

    // Helper to convert logical index to time
    const logicalIndexToTime = (logicalIndex, candleData) => {
      if (
        !candleData ||
        !Array.isArray(candleData) ||
        candleData.length === 0
      ) {
        return null;
      }

      // Handle positive indices (within data range)
      if (logicalIndex >= 0 && logicalIndex < candleData.length) {
        return candleData[Math.floor(logicalIndex)].time;
      }

      // Handle negative indices (before first candle)
      if (logicalIndex < 0 && candleData.length >= 2) {
        const interval = candleData[1].time - candleData[0].time;
        return candleData[0].time + logicalIndex * interval;
      }

      // Handle indices after last candle
      if (logicalIndex >= candleData.length && candleData.length >= 2) {
        const interval =
          candleData[candleData.length - 1].time -
          candleData[candleData.length - 2].time;
        const extraSteps = logicalIndex - (candleData.length - 1);
        return candleData[candleData.length - 1].time + extraSteps * interval;
      }

      return null;
    };

    // Mouse down: check for midpoints first, then corners
    const handleMouseDown = (e) => {
      if (!chart) return;
      const mouse = getMouseLogical(e);
      let targetBox = null;
      const targetId = hoveredBoxId || selectedBoxId;
      if (targetId) {
        targetBox = boxesDataRef.current.find((b) => b.id === targetId);
        if (targetBox) {
          // --- Midpoint logic ---
          // If mouse is near a midpoint, start midpoint resize
          const midpoint = isPointNearRectangleMidpoint(
            mouse,
            targetBox,
            chart,
            candlestickSeries,
          );
          if (midpoint) {
            // Determine which axis and which point to update
            const minTime = Math.min(targetBox._p1.time, targetBox._p2.time);
            const maxTime = Math.max(targetBox._p1.time, targetBox._p2.time);
            const minPrice = Math.min(targetBox._p1.price, targetBox._p2.price);
            const maxPrice = Math.max(targetBox._p1.price, targetBox._p2.price);
            let axis = null,
              axisPoint = null,
              cursorType = "pointer";
            switch (midpoint) {
              case "left":
              case "right":
                axis = "time";
                axisPoint =
                  midpoint === "left"
                    ? targetBox._p1.time === minTime
                      ? "_p1"
                      : "_p2"
                    : targetBox._p1.time === maxTime
                    ? "_p1"
                    : "_p2";
                cursorType = "ew-resize";
                break;
              case "top":
              case "bottom":
                axis = "price";
                axisPoint =
                  midpoint === "top"
                    ? targetBox._p1.price === maxPrice
                      ? "_p1"
                      : "_p2"
                    : targetBox._p1.price === minPrice
                    ? "_p1"
                    : "_p2";
                cursorType = "ns-resize";
                break;
              default:
                break;
            }
            const handleName =
              midpoint.charAt(0).toLowerCase() + midpoint.slice(1);
            resizeState.current = {
              isResizing: true,
              boxId: targetBox.id,
              axis,
              axisPoint,
              corner: handleName,
              timePoint: null,
              pricePoint: null,
              startMouse: mouse,
              startBox: { p1: { ...targetBox._p1 }, p2: { ...targetBox._p2 } },
              handleHidden: false,
            };
            if (isResizingRef) isResizingRef.current = true;
            if (setSelectedBoxId) setSelectedBoxId(targetBox.id);
            chart.applyOptions({ handleScroll: false, handleScale: false });
            if (dragOrResizeStateRef) {
              dragOrResizeStateRef.current = {
                isActive: true,
                cursor: cursorType,
              };
            }
            e.stopPropagation();
            e.preventDefault();
            return;
          }
          // --- Corner logic ---
          // If not midpoint, check for corner
          const cornerObj = isPointNearRectangleCorner(
            mouse,
            targetBox,
            chart,
            candlestickSeries,
          );
          if (cornerObj) {
            // Use screen coordinates for reliable corner determination, especially when outside candle range
            const timeScale = chart.timeScale();
            const candleData = targetBox._candleData;

            const p1X = getXCoordinate(targetBox._p1, timeScale, candleData);
            const p1Y = candlestickSeries.priceToCoordinate(
              targetBox._p1.price,
            );
            const p2X = getXCoordinate(targetBox._p2, timeScale, candleData);
            const p2Y = candlestickSeries.priceToCoordinate(
              targetBox._p2.price,
            );

            // Only proceed if we have valid screen coordinates
            if (p1X !== null && p1Y !== null && p2X !== null && p2Y !== null) {
              const minX = Math.min(p1X, p2X);
              const maxX = Math.max(p1X, p2X);
              const minY = Math.min(p1Y, p2Y); // top (smaller Y)
              const maxY = Math.max(p1Y, p2Y); // bottom (larger Y)

              let update = {};
              let cursorType = "pointer";

              switch (cornerObj.name) {
                case "topLeft":
                  update = {
                    timePoint: p1X === minX ? "_p1" : "_p2", // left point
                    pricePoint: p1Y === minY ? "_p1" : "_p2", // top point
                  };
                  cursorType = "nwse-resize";
                  break;
                case "topRight":
                  update = {
                    timePoint: p1X === maxX ? "_p1" : "_p2", // right point
                    pricePoint: p1Y === minY ? "_p1" : "_p2", // top point
                  };
                  cursorType = "nesw-resize";
                  break;
                case "bottomLeft":
                  update = {
                    timePoint: p1X === minX ? "_p1" : "_p2", // left point
                    pricePoint: p1Y === maxY ? "_p1" : "_p2", // bottom point
                  };
                  cursorType = "nesw-resize";
                  break;
                case "bottomRight":
                  update = {
                    timePoint: p1X === maxX ? "_p1" : "_p2", // right point
                    pricePoint: p1Y === maxY ? "_p1" : "_p2", // bottom point
                  };
                  cursorType = "nwse-resize";
                  break;
                default:
                  break;
              }

              resizeState.current = {
                isResizing: true,
                boxId: targetBox.id,
                corner: cornerObj.name,
                timePoint: update.timePoint,
                pricePoint: update.pricePoint,
                axis: null,
                axisPoint: null,
                startMouse: mouse,
                startBox: {
                  p1: { ...targetBox._p1 },
                  p2: { ...targetBox._p2 },
                },
                handleHidden: false,
                originalCorner: cornerObj.name, // Track the original corner clicked
              };
              if (isResizingRef) isResizingRef.current = true;
              if (setSelectedBoxId) setSelectedBoxId(targetBox.id);
              chart.applyOptions({ handleScroll: false, handleScale: false });
              if (dragOrResizeStateRef) {
                dragOrResizeStateRef.current = {
                  isActive: true,
                  cursor: cursorType,
                };
              }
              e.stopPropagation();
              e.preventDefault();
            }
          }
        }
      }
    };

    // Mouse move: update only the relevant coordinate(s) for the correct point(s)
    const handleMouseMove = (e) => {
      if (!resizeState.current.isResizing) return;
      if (e) lastMouseEventRef.current = e;
      const box = boxesDataRef.current.find(
        (b) => b.id === resizeState.current.boxId,
      );
      if (!box) return;
      const mouse = getMouseLogical(e || lastMouseEventRef.current);

      if (!resizeState.current.handleHidden && resizeState.current.startMouse) {
        const dx = mouse.x - resizeState.current.startMouse.x;
        const dy = mouse.y - resizeState.current.startMouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 3) {
          // threshold in pixels
          if (activeResizeHandleRef) {
            activeResizeHandleRef.current = resizeState.current.corner;
          }
          resizeState.current.handleHidden = true;
        }
      }

      const { timePoint, pricePoint, axis, axisPoint, startBox } =
        resizeState.current;
      // Use keyStateRef for magnet logic
      const isMagnet = keyStateRef.current.isMagnet;
      // --- Midpoint resizing logic ---
      if (axis && axisPoint) {
        const otherPoint = axisPoint === "_p1" ? "_p2" : "_p1";
        let newHandle = null;

        if (axis === "time") {
          let snappedTime = mouse.time;
          let snappedLogicalIndex = mouse.logicalIndex;
          // Only snap time for left/right midpoints, do not snap price
          if (isMagnet && chart && mouse.x !== undefined) {
            const x = mouse.x;
            const mouseTime = chart.timeScale().coordinateToTime(x);
            // Find the closest candle in your series data
            const data = candleData || [];
            let closestCandle = null;
            let minDiff = Infinity;
            for (const candle of data) {
              const diff = Math.abs(candle.time - mouseTime);
              if (diff < minDiff) {
                minDiff = diff;
                closestCandle = candle;
              }
            }
            if (closestCandle) {
              snappedTime = closestCandle.time;
            }
            box[axisPoint].time = snappedTime;
            // Also update logical index if available
            if (snappedLogicalIndex !== undefined) {
              box[axisPoint].logicalIndex = snappedLogicalIndex;
            }
          } else if (!isMagnet && startBox) {
            // revert to unsnapped value when magnet is released
            box[axisPoint].time = mouse.time;
            if (mouse.logicalIndex !== undefined) {
              box[axisPoint].logicalIndex = mouse.logicalIndex;
            }
          }
          // Always keep price unchanged for left/right midpoints
          // Determine if we're now controlling the left or right handle using screen coordinates
          const timeScale = chart.timeScale();
          const candleData = box._candleData;
          const axisPointX = getXCoordinate(
            box[axisPoint],
            timeScale,
            candleData,
          );
          const otherPointX = getXCoordinate(
            box[otherPoint],
            timeScale,
            candleData,
          );

          if (axisPointX !== null && otherPointX !== null) {
            newHandle = axisPointX < otherPointX ? "left" : "right";
          } else {
            // Fallback to logical comparison if screen coordinates fail
            newHandle =
              box[axisPoint].time < box[otherPoint].time ? "left" : "right";
          }
        } else if (axis === "price") {
          // For top/bottom midpoints, snap to candle price when magnet is on
          let snappedPrice = mouse.price;
          if (isMagnet && chart && mouse.x !== undefined) {
            const x = mouse.x;
            const y = mouse.y;
            const mouseTime = chart.timeScale().coordinateToTime(x);
            const mousePrice = candlestickSeries.coordinateToPrice(y);
            // Find the closest candle in your series data
            const data = candleData || [];
            let closestCandle = null;
            let minDiff = Infinity;
            for (const candle of data) {
              const diff = Math.abs(candle.time - mouseTime);
              if (diff < minDiff) {
                minDiff = diff;
                closestCandle = candle;
              }
            }
            if (closestCandle) {
              snappedPrice = getSnappedPrice(mousePrice, closestCandle);
            }
            box[axisPoint].price = snappedPrice;
          } else if (!isMagnet && startBox) {
            // revert to unsnapped value when magnet is released
            box[axisPoint].price = mouse.price;
          }

          // Determine if we're now controlling the top or bottom handle using screen coordinates
          const axisPointY = candlestickSeries.priceToCoordinate(
            box[axisPoint].price,
          );
          const otherPointY = candlestickSeries.priceToCoordinate(
            box[otherPoint].price,
          );

          if (axisPointY !== null && otherPointY !== null) {
            newHandle = axisPointY < otherPointY ? "top" : "bottom"; // Y coordinate is inverted
          } else {
            // Fallback to logical comparison if screen coordinates fail
            newHandle =
              box[axisPoint].price > box[otherPoint].price ? "top" : "bottom";
          }
        }

        if (newHandle && resizeState.current.corner !== newHandle) {
          resizeState.current.corner = newHandle;
          if (activeResizeHandleRef) {
            activeResizeHandleRef.current = newHandle;
          }
        }
      }
      // --- Corner resizing logic ---
      if (timePoint || pricePoint) {
        let snappedTime = timePoint ? mouse.time : undefined;
        let snappedPrice = pricePoint ? mouse.price : undefined;
        let snappedLogicalIndex = timePoint ? mouse.logicalIndex : undefined;
        if (isMagnet && chart && mouse.x !== undefined) {
          const x = mouse.x;
          const y = mouse.y;
          const mouseTime = chart.timeScale().coordinateToTime(x);
          const mousePrice = candlestickSeries.coordinateToPrice(y);
          // Find the closest candle in your series data
          const data = candleData || [];
          let closestCandle = null;
          let minDiff = Infinity;
          for (const candle of data) {
            const diff = Math.abs(candle.time - mouseTime);
            if (diff < minDiff) {
              minDiff = diff;
              closestCandle = candle;
            }
          }
          if (closestCandle) {
            if (timePoint) snappedTime = closestCandle.time;
            if (pricePoint)
              snappedPrice = getSnappedPrice(mousePrice, closestCandle);
          }
        }
        if (timePoint) {
          box[timePoint].time = snappedTime;
          if (snappedLogicalIndex !== undefined) {
            box[timePoint].logicalIndex = snappedLogicalIndex;
          }
        }
        if (pricePoint) box[pricePoint].price = snappedPrice;

        // --- Update active corner handle on flip (only after significant movement) ---
        if (timePoint && pricePoint && resizeState.current.handleHidden) {
          // Use screen coordinates for reliable comparison, especially when outside candle range
          const timeScale = chart.timeScale();
          const candleData = box._candleData;

          // Get screen coordinates for the dragged corner
          const draggedX = getXCoordinate(
            box[timePoint],
            timeScale,
            candleData,
          );
          const draggedY = candlestickSeries.priceToCoordinate(
            box[pricePoint].price,
          );

          // Get screen coordinates for the stationary corner
          const stationaryTimePoint = timePoint === "_p1" ? "_p2" : "_p1";
          const stationaryPricePoint = pricePoint === "_p1" ? "_p2" : "_p1";
          const stationaryX = getXCoordinate(
            box[stationaryTimePoint],
            timeScale,
            candleData,
          );
          const stationaryY = candlestickSeries.priceToCoordinate(
            box[stationaryPricePoint].price,
          );

          // Only proceed if we have valid screen coordinates
          if (
            draggedX !== null &&
            draggedY !== null &&
            stationaryX !== null &&
            stationaryY !== null
          ) {
            const draggedIsLeft = draggedX < stationaryX;
            const draggedIsTop = draggedY < stationaryY; // Y coordinate is inverted (top = smaller Y)

            let newCorner = "";
            if (draggedIsLeft) {
              newCorner = draggedIsTop ? "topLeft" : "bottomLeft";
            } else {
              newCorner = draggedIsTop ? "topRight" : "bottomRight";
            }

            if (newCorner && resizeState.current.corner !== newCorner) {
              resizeState.current.corner = newCorner;
              // Update visual handle to match the new corner position after flip
              if (activeResizeHandleRef) {
                activeResizeHandleRef.current = newCorner;
              }
            }
          }
        }
      }
      // Update the box visuals after resizing
      box.updateAllViews && box.updateAllViews();
      box.applyOptions && box.applyOptions({});
    };

    // --- ADDED: keydown/keyup listeners for instant snapping ---
    const handleKeyDown = (e) => {
      const wasMagnet = keyStateRef.current.isMagnet;
      if (e.key === "Control" || e.key === "Meta") {
        keyStateRef.current.isMagnet = true;
      }
      const stateChanged = keyStateRef.current.isMagnet !== wasMagnet;
      if (resizeState.current.isResizing && stateChanged) {
        handleMouseMove(lastMouseEventRef.current);
      }
    };
    const handleKeyUp = (e) => {
      const wasMagnet = keyStateRef.current.isMagnet;
      if (e.key === "Control" || e.key === "Meta") {
        keyStateRef.current.isMagnet = false;
      }
      const stateChanged = keyStateRef.current.isMagnet !== wasMagnet;
      if (resizeState.current.isResizing && stateChanged) {
        handleMouseMove(lastMouseEventRef.current);
      }
    };

    // Mouse up: finish resizing and reset state
    const handleMouseUp = () => {
      if (resizeState.current.isResizing) {
        const resizedBoxId = resizeState.current.boxId;

        // Update store with new rectangle position
        const resizedBox = boxesDataRef.current.find(
          (b) => b.id === resizedBoxId,
        );
        if (resizedBox) {
          updateDrawingPosition(resizedBox.id, resizedBox, "rectangle");
        }

        resizeState.current = {
          isResizing: false,
          boxId: null,
          corner: null,
          timePoint: null,
          pricePoint: null,
          axis: null,
          axisPoint: null,
          startMouse: null,
          startBox: null,
          handleHidden: false,
          originalCorner: null,
        };
        if (activeResizeHandleRef) {
          activeResizeHandleRef.current = null;
        }
        if (isResizingRef) isResizingRef.current = false;
        chart.applyOptions({ handleScroll: true, handleScale: true });
        if (dragOrResizeStateRef) {
          dragOrResizeStateRef.current = { isActive: false, cursor: null };
        }
      }
    };

    // Attach event listeners for resizing
    container.addEventListener("mousedown", handleMouseDown, true); // Use capture phase for priority
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    // --- ADDED: key listeners ---
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    // Cleanup listeners on unmount
    return () => {
      container.removeEventListener("mousedown", handleMouseDown, true); // Match capture flag
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      // --- ADDED: cleanup key listeners ---
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    chart,
    candlestickSeries,
    hoveredBoxId,
    selectedBoxId,
    boxesDataRef,
    isResizingRef,
    setSelectedBoxId,
    candleData,
    activeResizeHandleRef,
    dragOrResizeStateRef,
  ]);
}

export default useBoxResize;
