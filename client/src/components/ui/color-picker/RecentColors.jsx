import { Plus } from "lucide-react";
import { Button } from "../button";

export function RecentColors({ colors, onColorSelect, onAddColor }) {
  if (!colors || colors.length === 0) {
    return (
      <div>
        <div className='text-xs text-primary/60 mb-2 uppercase tracking-wider'>
          Recent Colors
        </div>
        <div className='grid grid-cols-10 gap-1'>
          <Button
            size={28}
            variant='ghost'
            className='w-7 h-7 rounded-md transition-colors flex items-center justify-center'
            onClick={onAddColor}
            title='Add custom color'
          >
            <Plus />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className='text-xs text-primary/60 mb-2 uppercase tracking-wider'>
        Recent Colors
      </div>
      <div className='grid grid-cols-10 gap-1'>
        {colors.slice(0, 9).map((color) => (
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
        <Button
          size={28}
          variant='ghost'
          className='w-7 h-7 rounded-md transition-colors flex items-center justify-center'
          onClick={onAddColor}
          title='Add custom color'
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}
