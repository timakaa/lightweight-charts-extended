import { PRIMARY_COLORS, SHADE_COLORS } from "./color-presets";

export function PresetColorGrid({ onColorSelect }) {
  return (
    <>
      {/* First table: Grays and bright colors */}
      <div className='grid grid-cols-10 mb-4'>
        {PRIMARY_COLORS.map((color) => (
          <button
            key={color}
            className='w-7 h-7 rounded-md p-0.5 border-2 border-transparent hover:border-gray-400 transition-colors'
            onClick={() => onColorSelect(color)}
          >
            <div
              className='w-full h-full rounded-sm'
              style={{ backgroundColor: color }}
            />
          </button>
        ))}
      </div>

      {/* Second table: Shades */}
      <div className='grid grid-cols-10 mb-4'>
        {SHADE_COLORS.map((color) => (
          <button
            key={color}
            className='w-7 h-7 rounded-md p-0.5 border-2 border-transparent hover:border-gray-400 transition-colors'
            onClick={() => onColorSelect(color)}
          >
            <div
              className='w-full h-full rounded-sm'
              style={{ backgroundColor: color }}
            />
          </button>
        ))}
      </div>
    </>
  );
}
