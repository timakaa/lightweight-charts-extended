import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SaturationValuePicker } from "./SaturationValuePicker";
import { HueSlider } from "./HueSlider";
import { hexToHsv, hsvToHex } from "./color-utils";

export function CustomColorPicker({ initialColor, onAdd, onBack }) {
  const [customColor, setCustomColor] = useState(initialColor);
  const [hsv, setHsv] = useState(() => hexToHsv(initialColor));

  useEffect(() => {
    const newHsv = hexToHsv(customColor);
    setHsv(newHsv);
  }, []);

  const handleHsvChange = (newHsv) => {
    setHsv(newHsv);
    const hex = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
    setCustomColor(hex);
  };

  const handleSVChange = (s, v) => {
    handleHsvChange({ ...hsv, s, v });
  };

  const handleHueChange = (h) => {
    handleHsvChange({ ...hsv, h });
  };

  const handleHexInputChange = (e) => {
    const hex = e.target.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      setCustomColor(hex);
      setHsv(hexToHsv(hex));
    } else {
      setCustomColor(hex);
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-start gap-3'>
        <div
          className='w-20 h-20 rounded-lg border-2 border-border flex-shrink-0'
          style={{ backgroundColor: customColor }}
        />
        <Input
          type='text'
          value={customColor}
          onChange={handleHexInputChange}
          placeholder='#000000'
          className='flex-1'
        />
      </div>

      <div className='flex gap-3'>
        <SaturationValuePicker
          hue={hsv.h}
          saturation={hsv.s}
          value={hsv.v}
          onChange={handleSVChange}
        />
        <HueSlider hue={hsv.h} onChange={handleHueChange} />
      </div>

      <div className='flex gap-2'>
        <Button variant='outline' className='flex-1' onClick={onBack}>
          Back
        </Button>
        <Button
          className='flex-1 bg-primary text-primary-foreground'
          onClick={() => onAdd(customColor)}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
