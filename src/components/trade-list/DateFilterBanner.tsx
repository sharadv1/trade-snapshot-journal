
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X as XIcon } from 'lucide-react';
import { format, parse } from 'date-fns';
import { DateRangeFilter } from './useTradeList';

interface DateFilterBannerProps {
  dateParam: string | null;
  dateRangeFilter: DateRangeFilter;
  onClearFilter: () => void;
}

export function DateFilterBanner({ dateParam, dateRangeFilter, onClearFilter }: DateFilterBannerProps) {
  const navigate = useNavigate();
  
  // If neither filter is active, don't show the banner
  if (!dateParam && dateRangeFilter.type === 'none') return null;
  
  const renderDateFilterText = () => {
    // If using date range filter, show appropriate text
    if (dateRangeFilter.type !== 'none' && dateRangeFilter.startDate) {
      switch (dateRangeFilter.type) {
        case 'date':
          return `Showing trades closed on: ${format(dateRangeFilter.startDate, 'MMMM d, yyyy')}`;
        case 'week':
          return `Showing trades for week of: ${format(dateRangeFilter.startDate, 'MMMM d')} - ${format(dateRangeFilter.endDate!, 'MMMM d, yyyy')}`;
        case 'month':
          return `Showing trades for month: ${format(dateRangeFilter.startDate, 'MMMM yyyy')}`;
        case 'range':
          return `Showing trades from: ${format(dateRangeFilter.startDate, 'MMMM d, yyyy')} to ${format(dateRangeFilter.endDate!, 'MMMM d, yyyy')}`;
      }
    }
    
    // Legacy URL param date filter
    if (dateParam) {
      const filterDate = parse(dateParam, 'yyyy-MM-dd', new Date());
      if (filterDate) {
        return `Showing trades closed on: ${format(filterDate, 'MMMM d, yyyy')}`;
      }
    }
    
    return 'Filtered by date';
  };
  
  const handleClear = () => {
    // Clear the component's filter
    onClearFilter();
    
    // If we're using URL params, also clear those by navigating
    if (dateParam) {
      navigate('/');
    }
  };
  
  return (
    <div className="mb-4 p-2 bg-muted rounded-md flex justify-between items-center">
      <span>
        <strong>{renderDateFilterText()}</strong>
      </span>
      <Button variant="ghost" size="sm" onClick={handleClear}>
        <XIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
