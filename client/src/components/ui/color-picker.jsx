import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PresetColorGrid } from "./color-picker/PresetColorGrid";
import { CustomColorPicker } from "./color-picker/CustomColorPicker";
import { RecentColors } from "./color-picker/RecentColors";
import { useRecentColors } from "@/hooks/useRecentColors";

export function ColorPicker({ value, onChange, className }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const { recentColors, addRecentColor } = useRecentColors();

  const handlePresetClick = (color) => {
    onChange(color);
    setIsOpen(false);
    setShowCustomPicker(false);
  };

  const handleAddCustomColor = (color) => {
    addRecentColor(color);
    onChange(color);
    setShowCustomPicker(false);
  };

  const handleBack = () => {
    setShowCustomPicker(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={`w-10 h-10 rounded-lg p-1 border-2 border-transparent hover:border-gray-400 transition-colors cursor-pointer ${className}`}
        >
          <div
            className='w-full h-full rounded-md'
            style={{ backgroundColor: value }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className='w-80 p-4' align='start'>
        {!showCustomPicker ? (
          <div>
            <PresetColorGrid onColorSelect={handlePresetClick} />
            <RecentColors
              colors={recentColors}
              onColorSelect={handlePresetClick}
              onAddColor={() => setShowCustomPicker(true)}
            />
          </div>
        ) : (
          <CustomColorPicker
            initialColor={value || "#000000"}
            onAdd={handleAddCustomColor}
            onBack={handleBack}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
