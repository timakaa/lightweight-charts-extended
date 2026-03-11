import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  usePresets,
  useCreatePreset,
  useDeletePreset,
} from "@hooks/presets/usePresets";
import { Trash2, Loader2, Info } from "lucide-react";

const PresetsSection = ({ timeframe, startDate, endDate, onPresetClick }) => {
  const { data: presetsData, isLoading: presetsLoading } = usePresets(1, 100);
  const { mutate: createPreset, isPending: isCreating } = useCreatePreset();
  const { mutate: deletePreset, isPending: isDeleting } = useDeletePreset();

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, ".");
  };

  const handleSavePreset = () => {
    // Auto-generate name from date range and timeframe
    const formattedStart = formatDate(startDate);
    const formattedEnd = formatDate(endDate);
    const name = `${formattedStart} - ${formattedEnd} (${timeframe})`;

    createPreset({
      name,
      timeframe,
      start_date: startDate,
      end_date: endDate,
    });
  };

  const handleDeletePreset = (presetId, e) => {
    e.stopPropagation();
    deletePreset(presetId);
  };

  return (
    <div>
      <div className='flex items-center justify-between mb-2'>
        <div className='flex items-center gap-1.5'>
          <label className='block text-sm font-medium text-primary/80'>
            Quick Presets
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
            <TooltipContent side='right' className='max-w-[250px]'>
              <p>
                Save your current timeframe and date range to quickly apply it
                later in one click
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={handleSavePreset}
          disabled={isCreating || !startDate || !endDate || !timeframe}
          className='h-7 text-xs'
        >
          {isCreating ? (
            <Loader2 className='h-3 w-3 animate-spin mr-1' />
          ) : null}
          Save Preset
        </Button>
      </div>

      <div>
        {presetsLoading ? (
          <div className='text-sm text-muted-foreground'>
            Loading presets...
          </div>
        ) : presetsData?.presets?.length > 0 ? (
          <div className='grid grid-cols-2 gap-2'>
            {presetsData.presets.map((preset) => (
              <div key={preset.id} className='relative'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => onPresetClick(preset)}
                  disabled={isDeleting}
                  className='bg-background border-border text-primary/80 hover:text-primary hover:bg-accent'
                >
                  {preset.name}
                  <div
                    type='button'
                    onClick={(e) => handleDeletePreset(preset.id, e)}
                    className='text-error'
                  >
                    <Trash2 />
                  </div>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className='text-sm text-muted-foreground'>
            No presets yet. Save one to get started!
          </div>
        )}
      </div>
    </div>
  );
};

export default PresetsSection;
