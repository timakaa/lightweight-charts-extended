export function RecentColors({ colors, onColorSelect }) {
  if (!colors || colors.length === 0) return null;

  return (
    <div className='mb-4'>
      <div className='text-xs text-primary/60 mb-2 uppercase tracking-wider'>
        Recent Colors
      </div>
      <div className='grid grid-cols-10'>
        {colors.map((color) => (
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
    </div>
  );
}
