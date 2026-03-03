import { useState } from "react";
import "./opacity-slider.css";
import { useTheme } from "@/hooks/useTheme";

export function OpacitySlider({ opacity = 100, onChange }) {
  const [localOpacity, setLocalOpacity] = useState(opacity);
  const { theme } = useTheme();

  const handleChange = (e) => {
    const value = parseInt(e.target.value);
    setLocalOpacity(value);
    onChange?.(value);
  };

  return (
    <div className='space-y-2'>
      <div className='text-xs text-primary/60 uppercase tracking-wider'>
        Opacity
      </div>
      <div className='flex items-center gap-3'>
        <div className='flex-1 relative h-5 rounded-full overflow-hidden'>
          {/* Checkered background pattern */}
          <div
            className='absolute inset-0'
            style={{
              backgroundImage: `
                linear-gradient(45deg, #ccc 25%, transparent 25%),
                linear-gradient(-45deg, #ccc 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #ccc 75%),
                linear-gradient(-45deg, transparent 75%, #ccc 75%)
              `,
              backgroundSize: "8px 8px",
              backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
            }}
          />
          {/* Opacity gradient overlay */}
          <div
            className='absolute inset-0'
            style={{
              background:
                theme === "dark"
                  ? `linear-gradient(to right, transparent 0%, #ccc 100%)`
                  : `linear-gradient(to right, transparent 0%, #000 100%)`,
            }}
          />
          {/* Range input */}
          <input
            type='range'
            min='0'
            max='100'
            value={localOpacity}
            onChange={handleChange}
            className='absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer opacity-range-input'
            style={{
              WebkitAppearance: "none",
              MozAppearance: "none",
            }}
          />
        </div>
        <div className='w-16 px-2 py-1 text-sm text-center border border-border rounded bg-background'>
          {localOpacity}%
        </div>
      </div>
    </div>
  );
}
