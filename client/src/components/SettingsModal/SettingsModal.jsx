import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";
import { Sliders, BarChart3, Ruler, Palette } from "lucide-react";

const SettingsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("symbol");

  // Color states
  const [bodyUpColor, setBodyUpColor] = useState("#26a69a");
  const [bodyDownColor, setBodyDownColor] = useState("#ef5350");
  const [borderUpColor, setBorderUpColor] = useState("#26a69a");
  const [borderDownColor, setBorderDownColor] = useState("#ef5350");
  const [wickUpColor, setWickUpColor] = useState("#26a69a");
  const [wickDownColor, setWickDownColor] = useState("#ef5350");

  const [canvasBackground, setCanvasBackground] = useState("#000000");
  const [canvasGrid, setCanvasGrid] = useState("#363c4e");
  const [canvasCrosshair, setCanvasCrosshair] = useState("#9598a1");
  const [canvasWatermark, setCanvasWatermark] = useState("#ffffff");
  const [scalesText, setScalesText] = useState("#b2b5be");
  const [scalesLines, setScalesLines] = useState("#2b2b43");

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const tabs = [
    { id: "symbol", label: "Symbol", icon: Sliders },
    { id: "status", label: "Status line", icon: BarChart3 },
    { id: "scales", label: "Scales and lines", icon: Ruler },
    { id: "canvas", label: "Canvas", icon: Palette },
  ];

  return (
    <div
      className='fixed cursor-default inset-0 bg-background/50 flex items-center justify-center z-[999]'
      onClick={handleBackdropClick}
    >
      <div className='bg-background border border-border rounded-lg w-[800px] h-[600px] flex flex-col'>
        {/* Header */}
        <div className='p-4 border-b border-border flex-shrink-0'>
          <div className='flex justify-between items-center'>
            <h2 className='text-xl font-bold text-primary'>Settings</h2>
            <Button
              variant='ghost'
              size='icon'
              onClick={onClose}
              className='text-primary/70 hover:text-primary h-8 w-8'
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Content with Sidebar */}
        <div className='flex flex-1 overflow-hidden'>
          {/* Sidebar */}
          <div className='w-64 border-r border-border flex-shrink-0 overflow-y-auto'>
            <div className='p-2'>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-left transition-colors ${
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary"
                        : "text-primary/70 hover:bg-foreground/5 hover:text-primary"
                    }`}
                  >
                    <Icon className='w-5 h-5' />
                    <span className='font-medium'>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className='flex-1 overflow-y-auto p-6'>
            {activeTab === "symbol" && (
              <div className='space-y-6'>
                <div>
                  <h3 className='text-sm font-semibold text-primary/60 mb-4 uppercase tracking-wider'>
                    CANDLES
                  </h3>

                  {/* Color bars based on previous close */}
                  <div className='mb-6 flex items-center gap-3'>
                    <Checkbox id='color-bars-prev-close' />
                    <Label
                      htmlFor='color-bars-prev-close'
                      className='text-primary cursor-pointer'
                    >
                      Color bars based on previous close
                    </Label>
                  </div>

                  {/* Body Colors */}
                  <div className='mb-4 flex items-center gap-4'>
                    <Checkbox id='body-colors' defaultChecked />
                    <Label
                      htmlFor='body-colors'
                      className='text-primary w-24 cursor-pointer'
                    >
                      Body
                    </Label>
                    <div className='flex gap-3'>
                      <ColorPicker
                        value={bodyUpColor}
                        onChange={setBodyUpColor}
                      />
                      <ColorPicker
                        value={bodyDownColor}
                        onChange={setBodyDownColor}
                      />
                    </div>
                  </div>

                  {/* Border Colors */}
                  <div className='mb-4 flex items-center gap-4'>
                    <Checkbox id='border-colors' defaultChecked />
                    <Label
                      htmlFor='border-colors'
                      className='text-primary w-24 cursor-pointer'
                    >
                      Borders
                    </Label>
                    <div className='flex gap-3'>
                      <ColorPicker
                        value={borderUpColor}
                        onChange={setBorderUpColor}
                      />
                      <ColorPicker
                        value={borderDownColor}
                        onChange={setBorderDownColor}
                      />
                    </div>
                  </div>

                  {/* Wick Colors */}
                  <div className='mb-6 flex items-center gap-4'>
                    <Checkbox id='wick-colors' defaultChecked />
                    <Label
                      htmlFor='wick-colors'
                      className='text-primary w-24 cursor-pointer'
                    >
                      Wick
                    </Label>
                    <div className='flex gap-3'>
                      <ColorPicker
                        value={wickUpColor}
                        onChange={setWickUpColor}
                      />
                      <ColorPicker
                        value={wickDownColor}
                        onChange={setWickDownColor}
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
                      <Select defaultValue='default'>
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
                      <Select defaultValue='utc0'>
                        <SelectTrigger className='flex-1'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='utc0'>(UTC+0) London</SelectItem>
                          <SelectItem value='utc1'>(UTC+1) Berlin</SelectItem>
                          <SelectItem value='utc3'>(UTC+3) Moscow</SelectItem>
                          <SelectItem value='utc-5'>
                            (UTC-5) New York
                          </SelectItem>
                          <SelectItem value='utc-8'>
                            (UTC-8) Los Angeles
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "status" && (
              <div className='text-primary/60'>
                Status line settings coming soon...
              </div>
            )}

            {activeTab === "scales" && (
              <div className='text-primary/60'>
                Scales and lines settings coming soon...
              </div>
            )}

            {activeTab === "canvas" && (
              <div className='space-y-6'>
                {/* CHART BASIC STYLES */}
                <div>
                  <h3 className='text-sm font-semibold text-primary/60 mb-4 uppercase tracking-wider'>
                    CHART BASIC STYLES
                  </h3>
                  <div className='space-y-4'>
                    {/* Background */}
                    <div className='flex items-center gap-4'>
                      <Checkbox id='canvas-background' defaultChecked />
                      <Label
                        htmlFor='canvas-background'
                        className='text-primary w-32 cursor-pointer'
                      >
                        Background
                      </Label>
                      <ColorPicker
                        value={canvasBackground}
                        onChange={setCanvasBackground}
                      />
                    </div>

                    {/* Grid lines */}
                    <div className='flex items-center gap-4'>
                      <Checkbox id='canvas-grid' defaultChecked />
                      <Label
                        htmlFor='canvas-grid'
                        className='text-primary w-32 cursor-pointer'
                      >
                        Grid lines
                      </Label>
                      <ColorPicker
                        value={canvasGrid}
                        onChange={setCanvasGrid}
                      />
                    </div>

                    {/* Crosshair */}
                    <div className='flex items-center gap-4'>
                      <Checkbox id='canvas-crosshair' defaultChecked />
                      <Label
                        htmlFor='canvas-crosshair'
                        className='text-primary w-32 cursor-pointer'
                      >
                        Crosshair
                      </Label>
                      <ColorPicker
                        value={canvasCrosshair}
                        onChange={setCanvasCrosshair}
                      />
                    </div>

                    {/* Watermark */}
                    <div className='flex items-center gap-4'>
                      <Checkbox id='canvas-watermark' defaultChecked />
                      <Label
                        htmlFor='canvas-watermark'
                        className='text-primary w-32 cursor-pointer'
                      >
                        Watermark
                      </Label>
                      <ColorPicker
                        value={canvasWatermark}
                        onChange={setCanvasWatermark}
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
                      <Checkbox id='scales-text' defaultChecked />
                      <Label
                        htmlFor='scales-text'
                        className='text-primary w-32 cursor-pointer'
                      >
                        Text
                      </Label>
                      <ColorPicker
                        value={scalesText}
                        onChange={setScalesText}
                      />
                      <Select defaultValue='12'>
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
                      <Checkbox id='scales-lines' defaultChecked />
                      <Label
                        htmlFor='scales-lines'
                        className='text-primary w-32 cursor-pointer'
                      >
                        Lines
                      </Label>
                      <ColorPicker
                        value={scalesLines}
                        onChange={setScalesLines}
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
                      <Checkbox id='buttons-navigation' defaultChecked />
                      <Label
                        htmlFor='buttons-navigation'
                        className='text-primary cursor-pointer'
                      >
                        Navigation buttons
                      </Label>
                    </div>

                    {/* Pane buttons */}
                    <div className='flex items-center gap-3'>
                      <Checkbox id='buttons-pane' defaultChecked />
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
                        defaultValue='0'
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
                        defaultValue='0'
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
                        defaultValue='0'
                        min='0'
                        max='100'
                        className='flex-1'
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className='p-4 border-t border-border flex justify-end gap-2 flex-shrink-0'>
          <Button variant='ghost' onClick={onClose} className='text-primary'>
            Cancel
          </Button>
          <Button
            onClick={onClose}
            className='bg-primary text-primary-foreground hover:bg-primary/90'
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
