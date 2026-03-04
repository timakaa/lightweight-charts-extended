import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

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
      <Input
        type='number'
        id={paramKey}
        value={value}
        onChange={handleChange}
        min={schema.min}
        max={schema.max}
        step={schema.step || (schema.type === "integer" ? 1 : 0.01)}
        className='bg-background border-border text-primary'
      />
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
              <HelpCircle className='h-3.5 w-3.5 text-muted-foreground' />
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
