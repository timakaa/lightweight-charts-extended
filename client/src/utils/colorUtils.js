/**
 * Convert hex color and opacity percentage to rgba string
 * @param {string} hex - Hex color (e.g., "#000000")
 * @param {number} opacity - Opacity percentage (0-100)
 * @returns {string} - RGBA color string (e.g., "rgba(0, 0, 0, 0.5)") or "transparent"
 */
export function hexToRgba(hex, opacity = 100) {
  // If opacity is 0, return transparent
  if (opacity === 0) {
    return "transparent";
  }

  // Remove # if present
  hex = hex.replace("#", "");

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Convert opacity percentage to 0-1 range
  const alpha = opacity / 100;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
