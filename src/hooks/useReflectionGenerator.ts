import { useEffect, useState, useRef } from 'react';
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';
import { toast } from '@/utils/toast';

export function useReflectionGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  
  const isMounted = useRef(true);
  const hasAttemptedGeneration = useRef(false);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (hasAttemptedGeneration.current || !isMounted.current) return;
    
    hasAttemptedGeneration.current = true;
    
    const generateReflections = async () => {
      if (!isMounted.current) return;
      
      try {
        setIsGenerating(true);
        setError(null);
        
        const trades = getTradesWithMetrics();
        if (trades.length > 0) {
          console.log(`Found ${trades.length} trades for reflection generation`);
          
          try {
            const { generateMissingReflections } = await import('@/utils/journal/reflectionGenerator');
            await generateMissingReflections(trades);
            
            if (!isMounted.current) return;
            
            console.log('Reflections generation completed successfully');
            setIsComplete(true);
          } catch (error) {
            if (!isMounted.current) return;
            console.error('Failed to generate reflections:', error);
            throw error;
          }
        } else {
          console.log('No trades found, skipping reflection generation');
          if (isMounted.current) setIsComplete(true);
        }
      } catch (error) {
        if (!isMounted.current) return;
        
        console.error('Error generating reflections:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        
        if (isMounted.current) {
          toast.error('Failed to generate reflections. Please try again.');
        }
      } finally {
        if (isMounted.current) setIsGenerating(false);
      }
    };
    
    const timer = setTimeout(() => {
      generateReflections();
    }, 1000);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  return { isGenerating, error, isComplete };
}
