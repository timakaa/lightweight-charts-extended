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
            <Label htmlFor='canvas-background' className='text-primary w-32'>
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
            <Label htmlFor='canvas-grid' className='text-primary w-32'>
              Grid lines
            </Label>
            <ColorPicker
              value={chartTheme.canvas.gridColor}
              onChange={(color) => updateCanvasColors({ gridColor: color })}
              opacity={chartTheme.canvas.gridOpacity ?? 100}
              onOpacityChange={(opacity) =>
                updateCanvasColors({ gridOpacity: opacity })
              }
            />
          </div>

          {/* Crosshair */}
          <div className='flex items-center gap-4'>
            <Label htmlFor='canvas-crosshair' className='text-primary w-32'>
              Crosshair
            </Label>
            <ColorPicker
              value={chartTheme.canvas.crosshairColor}
              onChange={(color) =>
                updateCanvasColors({ crosshairColor: color })
              }
              opacity={chartTheme.canvas.crosshairOpacity ?? 100}
              onOpacityChange={(opacity) =>
                updateCanvasColors({ crosshairOpacity: opacity })
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
            <Label htmlFor='scales-text' className='text-primary w-32'>
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
        </div>
      </div>
    </div>
  );
}
