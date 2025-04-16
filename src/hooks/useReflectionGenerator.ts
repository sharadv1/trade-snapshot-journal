
import { useEffect, useState } from 'react';
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';
import { toast } from '@/utils/toast';

export function useReflectionGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const generateReflections = async () => {
      if (!isMounted) return;
      
      try {
        setIsGenerating(true);
        setError(null);
        
        const trades = getTradesWithMetrics();
        if (trades.length > 0) {
          console.log(`Found ${trades.length} trades for reflection generation`);
          
          try {
            // Import dynamically to avoid circular dependencies
            const { generateMissingReflections } = await import('@/utils/journal/reflectionGenerator');
            await generateMissingReflections(trades);
            
            if (!isMounted) return;
            
            console.log('Reflections generation completed successfully');
            setIsComplete(true);
          } catch (error) {
            if (!isMounted) return;
            console.error('Failed to generate reflections:', error);
            throw error;
          }
        } else {
          console.log('No trades found, skipping reflection generation');
          if (isMounted) setIsComplete(true);
        }
      } catch (error) {
        if (!isMounted) return;
        
        console.error('Error generating reflections:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        
        toast.error('Failed to generate reflections. Please try again.');
      } finally {
        if (isMounted) setIsGenerating(false);
      }
    };
    
    // Small delay to avoid interfering with initial render
    const timer = setTimeout(() => {
      generateReflections();
    }, 1000);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  return { isGenerating, error, isComplete };
}
