import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";

export function CanvasTab({
  chartTheme,
  updateCanvasColors,
  updateScalesColors,
  updateButtons,
  updateMargins,
}) {
  return (
    <div className='space-y-6'>
      {/* CHART BASIC STYLES */}
      <div>
        <h3 className='text-sm font-semibold text-primary/60 mb-4 uppercase tracking-wider'>
          CHART BASIC STYLES
        </h3>
        <div className='space-y-4'>
          {/* Background */}
          <div className='flex items-center gap-4'>
            <Checkbox
              id='canvas-background'
              checked={chartTheme.canvas.backgroundEnabled}
              onCheckedChange={(checked) =>
                updateCanvasColors({ backgroundEnabled: checked })
              }
            />
            <Label
              htmlFor='canvas-background'
              className='text-primary w-32 cursor-pointer'
            >
              Background
            </Label>
            <ColorPicker
              value={chartTheme.canvas.backgroundColor}
              onChange={(color) =>
                updateCanvasColors({ backgroundColor: color })
              }
              opacity={chartTheme.canvas.backgroundOpacity ?? 100}
              onOpacityChange={(opacity) =>
                updateCanvasColors({ backgroundOpacity: opacity })
              }
            />
          </div>

          {/* Grid lines */}
          <div className='flex items-center gap-4'>
            <Checkbox
              id='canvas-grid'
              checked={chartTheme.canvas.gridEnabled}
              onCheckedChange={(checked) =>
                updateCanvasColors({ gridEnabled: checked })
              }
            />
            <Label
              htmlFor='canvas-grid'
              className='text-primary w-32 cursor-pointer'
            >
              Grid lines
            </Label>
            <ColorPicker
              value={chartTheme.canvas.gridColor}
              onChange={(color) => updateCanvasColors({ gridColor: color })}
            />
          </div>

          {/* Crosshair */}
          <div className='flex items-center gap-4'>
            <Checkbox
              id='canvas-crosshair'
              checked={chartTheme.canvas.crosshairEnabled}
              onCheckedChange={(checked) =>
                updateCanvasColors({ crosshairEnabled: checked })
              }
            />
            <Label
              htmlFor='canvas-crosshair'
              className='text-primary w-32 cursor-pointer'
            >
              Crosshair
            </Label>
            <ColorPicker
              value={chartTheme.canvas.crosshairColor}
              onChange={(color) =>
                updateCanvasColors({ crosshairColor: color })
              }
            />
          </div>

          {/* Watermark */}
          <div className='flex items-center gap-4'>
            <Checkbox
              id='canvas-watermark'
              checked={chartTheme.canvas.watermarkEnabled}
              onCheckedChange={(checked) =>
                updateCanvasColors({ watermarkEnabled: checked })
              }
            />
            <Label
              htmlFor='canvas-watermark'
              className='text-primary w-32 cursor-pointer'
            >
              Watermark
            </Label>
            <ColorPicker
              value={chartTheme.canvas.watermarkColor}
              onChange={(color) =>
                updateCanvasColors({ watermarkColor: color })
              }
            />
          </div>
        </div>
      </div>

      {/* SCALES */}
      <div>
        <h3 className='text-sm font-semibold text-primary/60 mb-4 uppercase tracking-wider'>
          SCALES
        </h3>
        <div className='space-y-4'>
          {/* Text */}
          <div className='flex items-center gap-4'>
            <Checkbox
              id='scales-text'
              checked={chartTheme.scales.textEnabled}
              onCheckedChange={(checked) =>
                updateScalesColors({ textEnabled: checked })
              }
            />
            <Label
              htmlFor='scales-text'
              className='text-primary w-32 cursor-pointer'
            >
              Text
            </Label>
            <ColorPicker
              value={chartTheme.scales.textColor}
              onChange={(color) => updateScalesColors({ textColor: color })}
            />
            <Select
              value={chartTheme.scales.textSize}
              onValueChange={(value) => updateScalesColors({ textSize: value })}
            >
              <SelectTrigger className='w-20'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='10'>10</SelectItem>
                <SelectItem value='11'>11</SelectItem>
                <SelectItem value='12'>12</SelectItem>
                <SelectItem value='13'>13</SelectItem>
                <SelectItem value='14'>14</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lines */}
          <div className='flex items-center gap-4'>
            <Checkbox
              id='scales-lines'
              checked={chartTheme.scales.linesEnabled}
              onCheckedChange={(checked) =>
                updateScalesColors({ linesEnabled: checked })
              }
            />
            <Label
              htmlFor='scales-lines'
              className='text-primary w-32 cursor-pointer'
            >
              Lines
            </Label>
            <ColorPicker
              value={chartTheme.scales.linesColor}
              onChange={(color) => updateScalesColors({ linesColor: color })}
            />
          </div>
        </div>
      </div>

      {/* BUTTONS */}
      <div>
        <h3 className='text-sm font-semibold text-primary/60 mb-4 uppercase tracking-wider'>
          BUTTONS
        </h3>
        <div className='space-y-4'>
          {/* Navigation buttons */}
          <div className='flex items-center gap-3'>
            <Checkbox
              id='buttons-navigation'
              checked={chartTheme.buttons.navigationEnabled}
              onCheckedChange={(checked) =>
                updateButtons({ navigationEnabled: checked })
              }
            />
            <Label
              htmlFor='buttons-navigation'
              className='text-primary cursor-pointer'
            >
              Navigation buttons
            </Label>
          </div>

          {/* Pane buttons */}
          <div className='flex items-center gap-3'>
            <Checkbox
              id='buttons-pane'
              checked={chartTheme.buttons.paneEnabled}
              onCheckedChange={(checked) =>
                updateButtons({ paneEnabled: checked })
              }
            />
            <Label
              htmlFor='buttons-pane'
              className='text-primary cursor-pointer'
            >
              Pane buttons
            </Label>
          </div>
        </div>
      </div>

      {/* MARGINS */}
      <div>
        <h3 className='text-sm font-semibold text-primary/60 mb-4 uppercase tracking-wider'>
          MARGINS
        </h3>
        <div className='space-y-4'>
          {/* Top */}
          <div className='flex items-center gap-4'>
            <span className='text-primary w-32'>Top</span>
            <Input
              type='number'
              value={chartTheme.margins.top}
              onChange={(e) =>
                updateMargins({ top: parseInt(e.target.value) || 0 })
              }
              min='0'
              max='100'
              className='flex-1'
            />
          </div>

          {/* Bottom */}
          <div className='flex items-center gap-4'>
            <span className='text-primary w-32'>Bottom</span>
            <Input
              type='number'
              value={chartTheme.margins.bottom}
              onChange={(e) =>
                updateMargins({
                  bottom: parseInt(e.target.value) || 0,
                })
              }
              min='0'
              max='100'
              className='flex-1'
            />
          </div>

          {/* Right */}
          <div className='flex items-center gap-4'>
            <span className='text-primary w-32'>Right</span>
            <Input
              type='number'
              value={chartTheme.margins.right}
              onChange={(e) =>
                updateMargins({
                  right: parseInt(e.target.value) || 0,
                })
              }
              min='0'
              max='100'
              className='flex-1'
            />
          </div>
        </div>
      </div>
    </div>
  );
}
