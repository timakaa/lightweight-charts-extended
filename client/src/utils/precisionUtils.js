/**
 * Convert precision value to number of decimal places
 *
 * @param {number|null|undefined} value - Precision value (e.g., 0.01, 2, or null)
 * @returns {number} Number of decimal places (defaults to 2)
 *
 * @example
 * getPrecisionDecimals(0.01) // returns 2
 * getPrecisionDecimals(0.001) // returns 3
 * getPrecisionDecimals(6) // returns 6
 * getPrecisionDecimals(null) // returns 2
 */
export const getPrecisionDecimals = (value) => {
  if (value === null || value === undefined) return 2;

  // If it's already an integer (number of decimals), return it
  if (Number.isInteger(value)) return value;

  // If it's a float less than 1 (like 0.01), calculate decimal places
  if (value < 1) {
    return Math.round(-Math.log10(value));
  }

  // Otherwise, round to integer
  return Math.round(value);
};
