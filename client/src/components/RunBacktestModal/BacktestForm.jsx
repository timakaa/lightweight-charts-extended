import CustomSelect from "./CustomSelect";
import DateRangePicker from "./DateRangePicker";
import AsyncSymbolSelect from "./AsyncSymbolSelect";
import AsyncStrategySelect from "./AsyncStrategySelect";
import PresetsSection from "./PresetsSection";
import StrategyParameters from "./StrategyParameters";
import { TIMEFRAMES } from "./constants";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSymbolDateRange } from "@hooks/useSymbolDateRange";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

const BacktestForm = ({
  strategy,
  setStrategy,
  symbol,
  setSymbol,
  timeframe,
  setTimeframe,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  parameters,
  setParameters,
  isLive,
  setIsLive,
  onSubmit,
}) => {
  const { data: dateRangeData } = useSymbolDateRange(symbol);

  const handleDateChange = ({ start, end }) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handlePresetClick = (preset) => {
    setTimeframe(preset.timeframe);
    setStartDate(preset.start_date);
    setEndDate(preset.end_date);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <form onSubmit={onSubmit} className='flex-1 overflow-y-auto p-4'>
        <div className='space-y-4'>
          {/* Live Backtest Toggle - At the top */}
          <div className='flex items-center justify-between p-3 bg-background rounded-lg border border-border'>
            <div className='flex items-center gap-2'>
              <label className='text-sm font-medium text-primary/80 cursor-pointer'>
                Live Backtest
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type='button'
                    className='text-muted-foreground hover:text-foreground transition-colors'
                  >
                    <Info className='h-3.5 w-3.5' />
                  </button>
                </TooltipTrigger>
                <TooltipContent side='right' className='max-w-xs'>
                  <p className='text-xs'>
                    Simulates real-time trading by processing bars with delays
                    proportional to the timeframe. Watch your strategy execute
                    as if trading live, with real-time chart updates and trade
                    notifications.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch checked={isLive} onCheckedChange={setIsLive} />
          </div>

          {/* Strategy */}
          <div>
            <label className='block text-sm font-medium text-primary/80 mb-2'>
              Strategy
            </label>
            <AsyncStrategySelect value={strategy} onChange={setStrategy} />
          </div>

          {/* Symbol */}
          <div>
            <label className='block text-sm font-medium text-primary/80 mb-2'>
              Symbol
            </label>
            <AsyncSymbolSelect value={symbol} onChange={setSymbol} />
          </div>

          {/* Timeframe */}
          <div>
            <label className='block text-sm font-medium text-primary/80 mb-2'>
              Timeframe
            </label>
            <CustomSelect
              value={timeframe}
              onChange={setTimeframe}
              options={TIMEFRAMES}
            />
          </div>

          {/* Date Range - Hidden in live mode */}
          {!isLive && (
            <div>
              <label className='block text-sm font-medium text-primary/80 mb-2'>
                Date Range
                {dateRangeData?.min_date && (
                  <span className='text-xs text-muted-foreground ml-2'>
                    (Available from {dateRangeData.min_date})
                  </span>
                )}
              </label>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onDateChange={handleDateChange}
                minDate={dateRangeData?.min_date}
                maxDate={dateRangeData?.max_date}
              />
            </div>
          )}

          {/* Presets - Hidden in live mode */}
          {!isLive && (
            <PresetsSection
              timeframe={timeframe}
              startDate={startDate}
              endDate={endDate}
              onPresetClick={handlePresetClick}
            />
          )}

          {/* Strategy Parameters */}
          <StrategyParameters
            strategy={strategy}
            parameters={parameters}
            setParameters={setParameters}
          />
        </div>
      </form>
    </TooltipProvider>
  );
};

export default BacktestForm;
