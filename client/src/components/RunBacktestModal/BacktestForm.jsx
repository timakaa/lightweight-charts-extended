import CustomSelect from "./CustomSelect";
import DateRangePicker from "./DateRangePicker";
import AsyncSymbolSelect from "./AsyncSymbolSelect";
import AsyncStrategySelect from "./AsyncStrategySelect";
import { TIMEFRAMES, DATE_PRESETS } from "./constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  onPresetClick,
  onSubmit,
}) => {
  const handleDateChange = ({ start, end }) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
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
        <div>
          <label className='block text-sm font-medium text-primary/80 mb-2'>
            Quick Presets
          </label>
          <div className='flex flex-wrap gap-2'>
            {DATE_PRESETS.map((preset, index) => (
              <Button
                key={index}
                type='button'
                variant='outline'
                size='sm'
                onClick={() => onPresetClick(preset)}
                className='bg-background border-border text-primary/80 hover:text-primary hover:bg-accent'
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
};

export default BacktestForm;
