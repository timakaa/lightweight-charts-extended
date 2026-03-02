import { useState, useEffect, useCallback } from "react";

/**
 * Hook to sync state with localStorage and listen for changes across tabs/components
 * @param {string} key - localStorage key
 * @param {any} initialValue - Initial value if key doesn't exist
 * @returns {[any, Function]} - [value, setValue]
 */
export const useLocalStorage = (key, initialValue) => {
  // Get initial value from localStorage or use initialValue
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when value changes
  const setValue = useCallback(
    (value) => {
      try {
        // Allow value to be a function like useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));

        // Dispatch custom event to notify other components
        window.dispatchEvent(
          new CustomEvent("localStorageChange", {
            detail: { key, value: valueToStore },
          }),
        );
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue],
  );

  // Listen for changes from other components or tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Handle native storage event (from other tabs)
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(
            `Error parsing localStorage value for key "${key}":`,
            error,
          );
        }
      }
    };

    const handleCustomStorageChange = (e) => {
      // Handle custom event (from same tab, other components)
      if (e.detail.key === key) {
        setStoredValue(e.detail.value);
      }
    };

    // Listen for changes from other tabs
    window.addEventListener("storage", handleStorageChange);

    // Listen for changes from other components in same tab
    window.addEventListener("localStorageChange", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "localStorageChange",
        handleCustomStorageChange,
      );
    };
  }, [key]);

  return [storedValue, setValue];
};
