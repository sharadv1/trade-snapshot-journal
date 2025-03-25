
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X as XIcon } from 'lucide-react';
import { format, parse } from 'date-fns';

interface DateFilterBannerProps {
  dateParam: string | null;
}

export function DateFilterBanner({ dateParam }: DateFilterBannerProps) {
  const navigate = useNavigate();
  
  if (!dateParam) return null;
  
  return (
    <div className="mb-4 p-2 bg-muted rounded-md flex justify-between items-center">
      <span>
        Showing trades closed on: <strong>{format(parse(dateParam, 'yyyy-MM-dd', new Date()), 'MMMM d, yyyy')}</strong>
      </span>
      <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
        <XIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
