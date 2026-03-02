import CustomSelect from "./CustomSelect";
import DateRangePicker from "./DateRangePicker";
import AsyncSymbolSelect from "./AsyncSymbolSelect";
import AsyncStrategySelect from "./AsyncStrategySelect";
import PresetsSection from "./PresetsSection";
import { TIMEFRAMES } from "./constants";
import { TooltipProvider } from "@/components/ui/tooltip";

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
  onSubmit,
}) => {
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

          {/* Date Range */}
          <div>
            <label className='block text-sm font-medium text-primary/80 mb-2'>
              Date Range
            </label>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onDateChange={handleDateChange}
            />
          </div>

          {/* Presets */}
          <PresetsSection
            timeframe={timeframe}
            startDate={startDate}
            endDate={endDate}
            onPresetClick={handlePresetClick}
          />
        </div>
      </form>
    </TooltipProvider>
  );
};

export default BacktestForm;
