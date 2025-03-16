
import { TradeForm } from '@/components/TradeForm';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function TradeEntry() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get('ideaId');
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Record New Trade
      </h1>
      <TradeForm />
    </div>
  );
}
