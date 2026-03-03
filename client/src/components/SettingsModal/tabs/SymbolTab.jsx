import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";

export function SymbolTab({ chartTheme, updateCandleColors, updateData }) {
  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-sm font-semibold text-primary/60 mb-4 uppercase tracking-wider'>
          CANDLES
        </h3>

        {/* Body Colors */}
        <div className='mb-4 flex items-center gap-4'>
          <Checkbox
            id='body-colors'
            checked={chartTheme.candles.bodyEnabled}
            onCheckedChange={(checked) =>
              updateCandleColors({ bodyEnabled: checked })
            }
          />
          <Label
            htmlFor='body-colors'
            className='text-primary w-24 cursor-pointer'
          >
            Body
          </Label>
          <div className='flex gap-3'>
            <ColorPicker
              value={chartTheme.candles.bodyUpColor}
              onChange={(color) => updateCandleColors({ bodyUpColor: color })}
              opacity={chartTheme.candles.bodyUpOpacity}
              onOpacityChange={(opacity) =>
                updateCandleColors({ bodyUpOpacity: opacity ?? 100 })
              }
            />
            <ColorPicker
              value={chartTheme.candles.bodyDownColor}
              onChange={(color) => updateCandleColors({ bodyDownColor: color })}
              opacity={chartTheme.candles.bodyDownOpacity}
              onOpacityChange={(opacity) =>
                updateCandleColors({ bodyDownOpacity: opacity ?? 100 })
              }
            />
          </div>
        </div>

        {/* Border Colors */}
        <div className='mb-4 flex items-center gap-4'>
          <Checkbox
            id='border-colors'
            checked={chartTheme.candles.borderEnabled}
            onCheckedChange={(checked) =>
              updateCandleColors({ borderEnabled: checked })
            }
          />
          <Label
            htmlFor='border-colors'
            className='text-primary w-24 cursor-pointer'
          >
            Borders
          </Label>
          <div className='flex gap-3'>
            <ColorPicker
              value={chartTheme.candles.borderUpColor}
              onChange={(color) => updateCandleColors({ borderUpColor: color })}
              opacity={chartTheme.candles.borderUpOpacity ?? 100}
              onOpacityChange={(opacity) =>
                updateCandleColors({ borderUpOpacity: opacity })
              }
            />
            <ColorPicker
              value={chartTheme.candles.borderDownColor}
              onChange={(color) =>
                updateCandleColors({ borderDownColor: color })
              }
              opacity={chartTheme.candles.borderDownOpacity ?? 100}
              onOpacityChange={(opacity) =>
                updateCandleColors({ borderDownOpacity: opacity })
              }
            />
          </div>
        </div>

        {/* Wick Colors */}
        <div className='mb-6 flex items-center gap-4'>
          <Checkbox
            id='wick-colors'
            checked={chartTheme.candles.wickEnabled}
            onCheckedChange={(checked) =>
              updateCandleColors({ wickEnabled: checked })
            }
          />
          <Label
            htmlFor='wick-colors'
            className='text-primary w-24 cursor-pointer'
          >
            Wick
          </Label>
          <div className='flex gap-3'>
            <ColorPicker
              value={chartTheme.candles.wickUpColor}
              onChange={(color) => updateCandleColors({ wickUpColor: color })}
              opacity={chartTheme.candles.wickUpOpacity ?? 100}
              onOpacityChange={(opacity) =>
                updateCandleColors({ wickUpOpacity: opacity })
              }
            />
            <ColorPicker
              value={chartTheme.candles.wickDownColor}
              onChange={(color) => updateCandleColors({ wickDownColor: color })}
              opacity={chartTheme.candles.wickDownOpacity ?? 100}
              onOpacityChange={(opacity) =>
                updateCandleColors({ wickDownOpacity: opacity })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
