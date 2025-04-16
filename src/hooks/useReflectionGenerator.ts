
import { useEffect, useState, useRef } from 'react';
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';
import { toast } from '@/utils/toast';

export function useReflectionGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  
  const isMounted = useRef(true);
  const hasAttemptedGeneration = useRef(false);
  const generationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (hasAttemptedGeneration.current || !isMounted.current || isComplete) return;
    
    hasAttemptedGeneration.current = true;
    
    const generateReflections = async () => {
      if (!isMounted.current) return;
      
      try {
        setIsGenerating(true);
        setError(null);
        
        // Get trades in a non-blocking way
        generationTimeoutRef.current = setTimeout(async () => {
          try {
            const trades = getTradesWithMetrics();
            if (trades.length > 0) {
              // Dynamically import to prevent initial load blocking
              const { generateMissingReflections } = await import('@/utils/journal/reflectionGenerator');
              await generateMissingReflections(trades);
              
              if (isMounted.current) {
                setIsComplete(true);
                setIsGenerating(false);
              }
            } else {
              if (isMounted.current) {
                setIsComplete(true);
                setIsGenerating(false);
              }
            }
          } catch (error) {
            if (isMounted.current) {
              console.error('Error in delayed reflection generation:', error);
              setError(error instanceof Error ? error.message : 'Unknown error');
              setIsGenerating(false);
              toast.error('Failed to generate reflections. Please try again.');
            }
          }
        }, 500); // Short delay to let UI render first
      } catch (error) {
        if (isMounted.current) {
          console.error('Error setting up reflection generation:', error);
          setError(error instanceof Error ? error.message : 'Unknown error');
          setIsGenerating(false);
        }
      }
    };
    
    generateReflections();
    
  }, [isComplete]);

  return { isGenerating, error, isComplete };
}
