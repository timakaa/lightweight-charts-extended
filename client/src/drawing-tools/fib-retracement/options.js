/**
 * Default options for fib retracement drawing tool
 *
 * Controls appearance, behavior, and styling of fib retracements:
 * - Colors for lines, fills, labels, and handles
 * - Fibonacci levels and their custom colors
 * - Hover tolerance and handle settings
 * - Label formatting for price and time display
 */
export const defaultOptions = {
  // Background fill color for the retracement area
  fillColor: "#80808020",

  // Color for fib level lines
  lineColor: "#606060",

  // Background color for axis labels (matches rectangle tool)
  labelColor: "rgba(0, 100, 255, 1)",

  // Text color for axis labels
  labelTextColor: "white",

  // Font settings for labels
  labelFont: "sans-serif",
  labelFontSize: 12,

  // Fibonacci levels to display (1 = 100%, 0 = 0%, etc.)
  fibLevels: [1, 0.79, 0.705, 0.62, 0.5, 0, 1, 2, 2.5, 4],

  // Custom colors for specific fib levels
  levelColors: {
    0.79: "#bbb", // 78.6% level
    0.62: "#bbb", // 61.8% level
    0.705: "#FFD600", // 70.5% level (gold)
  },

  // Tolerance for x-axis hover detection (5% of retracement width)
  hoverTolerance: 0.05,

  // Handle appearance settings
  handleFillColor: "white",
  handleStrokeColor: "#0094FF",
  handleStrokeWidth: 1,
  handleRadius: 4,

  // Whether to show resize handles
  showHandles: false,

  // Background color for axis overlays (matches rectangle tool)
  axisFillColor: "rgba(0, 100, 255, 0.4)",

  /**
   * Formats price values for axis labels
   * @param {number} price - Price value to format
   * @returns {string} Formatted price string
   */
  priceLabelFormatter: (price) => price.toFixed(2),

  /**
   * Formats time values for axis labels
   * @param {number|string} time - Time value to format
   * @returns {string} Formatted time string
   */
  timeLabelFormatter: (time) => {
    if (typeof time == "string") return time;
    const date = new Date(time * 1000);
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
};
