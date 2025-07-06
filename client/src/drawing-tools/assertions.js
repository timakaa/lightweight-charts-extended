export function ensureDefined(value) {
  if (value === undefined || value === null) {
    throw new Error("Value is not defined");
  }
  return value;
}
