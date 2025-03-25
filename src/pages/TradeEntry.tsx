
import { TradeForm } from '@/components/TradeForm';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '@/utils/toast';

export default function TradeEntry() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get('ideaId');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    console.log('TradeEntry mounted. Idea ID from URL:', ideaId);
    try {
      // Scroll to top when component mounts
      window.scrollTo(0, 0);
      setIsLoading(false);
    } catch (error) {
      console.error('Error in TradeEntry:', error);
      setHasError(true);
      setIsLoading(false);
      toast.error('There was an error loading the trade form. Please try again.');
    }
  }, [ideaId]);

  const handleFormError = (error: unknown) => {
    console.error('TradeEntry form error:', error);
    setHasError(true);
    toast.error('There was an error processing your trade. Please try again.');
  };

  const handleFormSuccess = (tradeId: string) => {
    console.log('Trade saved successfully, navigating to detail page');
    toast.success('Trade saved successfully!');
    navigate(`/trade/${tradeId}`);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (hasError) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-4">Error Loading Form</h2>
        <p className="mb-4">There was a problem loading the trade form.</p>
        <button 
          onClick={() => navigate('/')} 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Record New Trade {ideaId ? '(From Idea)' : ''}
      </h1>
      <TradeForm 
        onSuccess={handleFormSuccess}
        onError={handleFormError}
        ideaId={ideaId}
      />
    </div>
  );
}
