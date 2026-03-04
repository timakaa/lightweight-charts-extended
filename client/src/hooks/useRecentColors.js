import { useLocalStorage } from "./useLocalStorage";

const MAX_RECENT_COLORS = 9;

export function useRecentColors() {
  const [recentColors, setRecentColors] = useLocalStorage("recentColors", []);

  const addRecentColor = (color) => {
    // Normalize color to uppercase for comparison
    const normalizedColor = color.toUpperCase();

    setRecentColors((prev) => {
      // Remove the color if it already exists
      const filtered = prev.filter((c) => c.toUpperCase() !== normalizedColor);

      // Add to the beginning and limit to MAX_RECENT_COLORS
      return [normalizedColor, ...filtered].slice(0, MAX_RECENT_COLORS);
    });
  };

  return { recentColors, addRecentColor };
}
