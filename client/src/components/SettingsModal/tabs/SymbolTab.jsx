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

        {/* Color bars based on previous close */}
        <div className='mb-6 flex items-center gap-3'>
          <Checkbox
            id='color-bars-prev-close'
            checked={chartTheme.data.colorBarsBasedOnPrevClose}
            onCheckedChange={(checked) =>
              updateData({ colorBarsBasedOnPrevClose: checked })
            }
          />
          <Label
            htmlFor='color-bars-prev-close'
            className='text-primary cursor-pointer'
          >
            Color bars based on previous close
          </Label>
        </div>

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
            />
            <ColorPicker
              value={chartTheme.candles.bodyDownColor}
              onChange={(color) => updateCandleColors({ bodyDownColor: color })}
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
            />
            <ColorPicker
              value={chartTheme.candles.borderDownColor}
              onChange={(color) =>
                updateCandleColors({ borderDownColor: color })
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
            />
            <ColorPicker
              value={chartTheme.candles.wickDownColor}
              onChange={(color) => updateCandleColors({ wickDownColor: color })}
            />
          </div>
        </div>

        {/* Data Modification Section */}
        <h3 className='text-sm font-semibold text-primary/60 mb-4 uppercase tracking-wider'>
          DATA MODIFICATION
        </h3>

        <div className='space-y-4'>
          {/* Precision */}
          <div className='flex items-center gap-4'>
            <span className='text-primary w-32'>Precision</span>
            <Select
              value={chartTheme.data.precision}
              onValueChange={(value) => updateData({ precision: value })}
            >
              <SelectTrigger className='flex-1'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='default'>Default</SelectItem>
                <SelectItem value='0'>0</SelectItem>
                <SelectItem value='1'>1</SelectItem>
                <SelectItem value='2'>2</SelectItem>
                <SelectItem value='3'>3</SelectItem>
                <SelectItem value='4'>4</SelectItem>
                <SelectItem value='5'>5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timezone */}
          <div className='flex items-center gap-4'>
            <span className='text-primary w-32'>Timezone</span>
            <Select
              value={chartTheme.data.timezone}
              onValueChange={(value) => updateData({ timezone: value })}
            >
              <SelectTrigger className='flex-1'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='utc0'>(UTC+0) London</SelectItem>
                <SelectItem value='utc1'>(UTC+1) Berlin</SelectItem>
                <SelectItem value='utc3'>(UTC+3) Moscow</SelectItem>
                <SelectItem value='utc-5'>(UTC-5) New York</SelectItem>
                <SelectItem value='utc-8'>(UTC-8) Los Angeles</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
