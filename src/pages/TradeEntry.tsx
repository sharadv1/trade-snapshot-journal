
import { TradeForm } from '@/components/TradeForm';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '@/utils/toast';

export default function TradeEntry() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get('ideaId');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    console.log('TradeEntry mounted. Idea ID from URL:', ideaId);
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    setIsLoading(false);
  }, [ideaId]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Record New Trade {ideaId ? '(From Idea)' : ''}
      </h1>
      <TradeForm />
    </div>
  );
}
