import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useChartTheme } from "@/hooks/useChartTheme";
import { Sliders, BarChart3, Ruler, Palette } from "lucide-react";
import { SymbolTab } from "./tabs/SymbolTab";
import { StatusLineTab } from "./tabs/StatusLineTab";
import { ScalesTab } from "./tabs/ScalesTab";
import { CanvasTab } from "./tabs/CanvasTab";

const SettingsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("symbol");
  const {
    chartTheme,
    updateCandleColors,
    updateCanvasColors,
    updateScalesColors,
    updateButtons,
    updateMargins,
    updateData,
  } = useChartTheme();

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

  const renderTabContent = () => {
    switch (activeTab) {
      case "symbol":
        return (
          <SymbolTab
            chartTheme={chartTheme}
            updateCandleColors={updateCandleColors}
            updateData={updateData}
          />
        );
      case "status":
        return <StatusLineTab />;
      case "scales":
        return <ScalesTab />;
      case "canvas":
        return (
          <CanvasTab
            chartTheme={chartTheme}
            updateCanvasColors={updateCanvasColors}
            updateScalesColors={updateScalesColors}
            updateButtons={updateButtons}
            updateMargins={updateMargins}
          />
        );
      default:
        return null;
    }
  };

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
          <div className='flex-1 overflow-y-auto p-6'>{renderTabContent()}</div>
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
