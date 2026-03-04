import { useStrategyParameters } from "@hooks/backtests/useStrategyParameters";
import ParameterInput from "./ParameterInput";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const StrategyParameters = ({ strategy, parameters, setParameters }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data, isLoading, error } = useStrategyParameters(strategy);

  // Initialize parameters with defaults when data loads
  useEffect(() => {
    if (data?.parameter_schema) {
      // Extract defaults from schema
      const defaults = {};
      Object.entries(data.parameter_schema).forEach(([key, schema]) => {
        defaults[key] = schema.default;
      });
      console.log("Setting default parameters from schema:", defaults);
      setParameters(defaults);
    }
  }, [data, setParameters]);

  if (!strategy) return null;

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-4'>
        <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
        <span className='ml-2 text-sm text-muted-foreground'>
          Loading parameters...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-sm text-destructive py-2'>
        Failed to load strategy parameters
      </div>
    );
  }

  if (
    !data?.parameter_schema ||
    Object.keys(data.parameter_schema).length === 0
  ) {
    return null;
  }

  const handleParameterChange = (key, value) => {
    setParameters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    // Extract defaults from schema
    const defaults = {};
    Object.entries(data.parameter_schema).forEach(([key, schema]) => {
      defaults[key] = schema.default;
    });
    setParameters(defaults);
  };

  return (
    <div className='border border-border rounded-lg overflow-hidden'>
      {/* Header */}
      <button
        type='button'
        onClick={() => setIsExpanded(!isExpanded)}
        className='w-full flex items-center justify-between p-3 bg-background hover:bg-muted transition-colors'
      >
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium text-primary/80'>
            Strategy Parameters
          </span>
          <span className='text-xs text-muted-foreground'>
            ({Object.keys(data.parameter_schema).length} parameters)
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className='h-4 w-4 text-muted-foreground' />
        ) : (
          <ChevronDown className='h-4 w-4 text-muted-foreground' />
        )}
      </button>

      {/* Parameters */}
      {isExpanded && (
        <div className='p-4 space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            {Object.entries(data.parameter_schema).map(([key, schema]) => (
              <ParameterInput
                key={key}
                paramKey={key}
                schema={schema}
                value={parameters[key] ?? schema.default}
                onChange={handleParameterChange}
              />
            ))}
          </div>

          {/* Reset Button */}
          <div className='flex justify-end pt-2 border-t border-border'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={handleReset}
              className='text-xs text-muted-foreground hover:text-primary'
            >
              Reset to Defaults
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategyParameters;
