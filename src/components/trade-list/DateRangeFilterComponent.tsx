
import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRangeFilter } from "./useTradeList";

interface DateRangeFilterProps {
  dateRangeFilter: DateRangeFilter;
  onFilterByDate: (date: Date) => void;
  onFilterByWeek: (date: Date) => void;
  onFilterByMonth: (date: Date) => void;
  onFilterByDateRange: (startDate: Date, endDate: Date) => void;
  onClearFilter: () => void;
}

export function DateRangeFilterComponent({
  dateRangeFilter,
  onFilterByDate,
  onFilterByWeek,
  onFilterByMonth,
  onFilterByDateRange,
  onClearFilter,
}: DateRangeFilterProps) {
  const [date, setDate] = useState<Date | undefined>(
    dateRangeFilter.startDate || undefined
  );
  const [mode, setMode] = useState<"single" | "range">("single");
  const [selectedRange, setSelectedRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: dateRangeFilter.startDate || undefined,
    to: dateRangeFilter.endDate || undefined,
  });

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    setDate(selectedDate);
  };

  const handleRangeSelect = (range: { from: Date | undefined; to: Date | undefined }) => {
    setSelectedRange(range);
  };

  const handleApplyFilter = () => {
    if (mode === "single" && date) {
      onFilterByDate(date);
    } else if (
      mode === "range" &&
      selectedRange.from &&
      selectedRange.to
    ) {
      onFilterByDateRange(selectedRange.from, selectedRange.to);
    }
  };

  const formatFilterLabel = () => {
    if (dateRangeFilter.type === "none") {
      return "All Dates";
    } else if (dateRangeFilter.type === "date" && dateRangeFilter.startDate) {
      return format(dateRangeFilter.startDate, "MMM d, yyyy");
    } else if (dateRangeFilter.type === "week" && dateRangeFilter.startDate && dateRangeFilter.endDate) {
      return `Week of ${format(dateRangeFilter.startDate, "MMM d")} - ${format(dateRangeFilter.endDate, "MMM d, yyyy")}`;
    } else if (dateRangeFilter.type === "month" && dateRangeFilter.startDate) {
      return format(dateRangeFilter.startDate, "MMMM yyyy");
    } else if (dateRangeFilter.type === "range" && dateRangeFilter.startDate && dateRangeFilter.endDate) {
      return `${format(dateRangeFilter.startDate, "MMM d")} - ${format(dateRangeFilter.endDate, "MMM d, yyyy")}`;
    }
    return "All Dates";
  };

  const hasActiveFilter = dateRangeFilter.type !== "none";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={hasActiveFilter ? "border-primary" : ""}
        >
          <CalendarIcon className="h-4 w-4 mr-1" />
          {formatFilterLabel()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="p-3 border-b">
          <div className="flex gap-1 mb-2">
            <Button
              variant={mode === "single" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("single")}
              className="flex-1"
            >
              Single Date
            </Button>
            <Button
              variant={mode === "range" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("range")}
              className="flex-1"
            >
              Date Range
            </Button>
          </div>
          
          {mode === "single" && date && (
            <div className="flex gap-1 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFilterByWeek(date)}
                className="flex-1"
              >
                Filter by Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFilterByMonth(date)}
                className="flex-1"
              >
                Filter by Month
              </Button>
            </div>
          )}
        </div>
        
        <div className="p-0">
          {mode === "single" ? (
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              className="p-3 pointer-events-auto"
            />
          ) : (
            <Calendar
              mode="range"
              selected={selectedRange}
              onSelect={handleRangeSelect}
              className="p-3 pointer-events-auto"
            />
          )}
        </div>
        
        <div className="p-3 border-t flex justify-between">
          <Button variant="outline" size="sm" onClick={onClearFilter}>
            Clear
          </Button>
          <Button size="sm" onClick={handleApplyFilter}>
            Apply Filter
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
