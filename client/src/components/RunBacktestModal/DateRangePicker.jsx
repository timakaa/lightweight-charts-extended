import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const DateRangePicker = ({
  startDate,
  endDate,
  onDateChange,
  minDate,
  maxDate,
}) => {
  const [date, setDate] = useState({
    from: startDate ? new Date(startDate) : undefined,
    to: endDate ? new Date(endDate) : undefined,
  });

  // Sync internal state with props when they change externally (e.g., from presets)
  useEffect(() => {
    setDate({
      from: startDate ? new Date(startDate) : undefined,
      to: endDate ? new Date(endDate) : undefined,
    });
  }, [startDate, endDate]);

  useEffect(() => {
    if (date?.from) {
      onDateChange({
        start: format(date.from, "yyyy-MM-dd"),
        end: date.to
          ? format(date.to, "yyyy-MM-dd")
          : format(date.from, "yyyy-MM-dd"),
      });
    }
  }, [date]);

  // Convert min/max dates to Date objects
  const fromDate = minDate ? new Date(minDate) : undefined;
  const toDate = maxDate ? new Date(maxDate) : new Date();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn(
            "w-full justify-start px-3 font-normal text-left bg-background text-primary",
          )}
        >
          <svg
            className='mr-2 h-4 w-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
            />
          </svg>
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "LLL dd, y")} -{" "}
                {format(date.to, "LLL dd, y")}
              </>
            ) : (
              format(date.from, "LLL dd, y")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-auto p-0 bg-background overflow-hidden border-border'
        align='start'
      >
        <Calendar
          mode='range'
          defaultMonth={date?.from}
          selected={date}
          onSelect={setDate}
          numberOfMonths={2}
          fromDate={fromDate}
          toDate={toDate}
          disabled={(date) => {
            if (fromDate && date < fromDate) return true;
            if (toDate && date > toDate) return true;
            return false;
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;
