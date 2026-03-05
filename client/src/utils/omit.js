export function omit(obj, keys) {
  return Object.fromEntries(
    Object.entries(obj ?? {}).filter(([k]) => !keys.includes(k)),
  );
}
