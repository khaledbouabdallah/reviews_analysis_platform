// frontend/src/components/ui/date-range-picker.tsx
import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateRange {
  from: Date;
  to: Date;
}

interface DatePickerWithRangeProps {
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
  className?: string;
}

export function DatePickerWithRange({
  value,
  onChange,
  className
}: DatePickerWithRangeProps) {
  const [date, setDate] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
    from: value?.from,
    to: value?.to,
  });

  const handleDateChange = (selectedDate: { from: Date | undefined; to: Date | undefined } | undefined) => {
    setDate(selectedDate || { from: undefined, to: undefined });
    
    if (selectedDate?.from && selectedDate?.to) {
      onChange({ from: selectedDate.from, to: selectedDate.to });
    } else if (!selectedDate?.from && !selectedDate?.to) {
      onChange(null);
    }
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-60 justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} -{' '}
                  {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}