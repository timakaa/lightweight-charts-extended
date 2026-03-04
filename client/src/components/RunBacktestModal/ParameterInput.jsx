import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, ChevronUp, ChevronDown } from "lucide-react";

const ParameterInput = ({ paramKey, schema, value, onChange }) => {
  const handleChange = (e) => {
    const newValue = e.target.value;

    // Convert to appropriate type
    if (schema.type === "integer") {
      onChange(paramKey, parseInt(newValue) || schema.default);
    } else if (schema.type === "number") {
      onChange(paramKey, parseFloat(newValue) || schema.default);
    } else if (schema.type === "boolean") {
      onChange(paramKey, e.target.checked);
    } else {
      onChange(paramKey, newValue);
    }
  };

  const handleIncrement = () => {
    const step = schema.step || (schema.type === "integer" ? 1 : 0.01);
    const newValue = (parseFloat(value) || 0) + step;
    const clampedValue =
      schema.max !== undefined ? Math.min(newValue, schema.max) : newValue;
    onChange(
      paramKey,
      schema.type === "integer" ? Math.round(clampedValue) : clampedValue,
    );
  };

  const handleDecrement = () => {
    const step = schema.step || (schema.type === "integer" ? 1 : 0.01);
    const newValue = (parseFloat(value) || 0) - step;
    const clampedValue =
      schema.min !== undefined ? Math.max(newValue, schema.min) : newValue;
    onChange(
      paramKey,
      schema.type === "integer" ? Math.round(clampedValue) : clampedValue,
    );
  };

  const renderInput = () => {
    if (schema.type === "boolean") {
      return (
        <div className='flex items-center space-x-2'>
          <input
            type='checkbox'
            id={paramKey}
            checked={value}
            onChange={handleChange}
            className='h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-primary'
          />
        </div>
      );
    }

    return (
      <div className='relative flex items-center'>
        <Input
          type='number'
          id={paramKey}
          value={value}
          onChange={handleChange}
          min={schema.min}
          max={schema.max}
          step={schema.step || (schema.type === "integer" ? 1 : 0.01)}
          className='bg-background border-border text-primary pr-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
        />
        <div className='absolute right-0 flex flex-col border-l border-border'>
          <button
            type='button'
            onClick={handleIncrement}
            className='px-2 py-0.5 hover:bg-accent transition-colors border-b border-border'
            aria-label='Increment'
          >
            <ChevronUp className='h-3 w-3 text-muted-foreground' />
          </button>
          <button
            type='button'
            onClick={handleDecrement}
            className='px-2 py-0.5 hover:bg-accent transition-colors'
            aria-label='Decrement'
          >
            <ChevronDown className='h-3 w-3 text-muted-foreground' />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-2'>
        <Label
          htmlFor={paramKey}
          className='text-sm font-medium text-primary/80'
        >
          {schema.label}
        </Label>
        {schema.description && (
          <Tooltip>
            <TooltipTrigger asChild>
              <TooltipTrigger asChild>
                <button
                  type='button'
                  className='text-muted-foreground hover:text-foreground transition-colors'
                >
                  <Info className='h-3.5 w-3.5' />
                </button>
              </TooltipTrigger>
            </TooltipTrigger>
            <TooltipContent side='right' className='max-w-xs'>
              <p className='text-xs'>{schema.description}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {renderInput()}
    </div>
  );
};

export default ParameterInput;
