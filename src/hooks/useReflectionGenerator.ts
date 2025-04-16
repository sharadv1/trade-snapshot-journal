
import { useEffect, useState, useRef } from 'react';

export function useReflectionGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  
  // Refs for component lifecycle management
  const isMounted = useRef(true);
  const skipGeneration = useRef(false);
  
  // Check if we're on a journal page (skip generation)
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/journal/')) {
      console.log(`Skipping reflection generation on journal path: ${currentPath}`);
      skipGeneration.current = true;
      setIsComplete(true);
    }
    
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  useEffect(() => {
    // Skip if already complete or should skip
    if (isComplete || skipGeneration.current) {
      return;
    }
    
    // Generate reflections with small delay to avoid UI blocking
    const timer = setTimeout(async () => {
      try {
        if (!isMounted.current) return;
        
        // Double-check path - could have changed
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/journal/')) {
          console.log(`Skipping reflection generation after path check: ${currentPath}`);
          setIsComplete(true);
          return;
        }
        
        setIsGenerating(true);
        
        // Get trades with metrics
        const { getTradesWithMetrics } = await import('@/utils/storage/tradeOperations');
        const trades = getTradesWithMetrics();
        
        if (!isMounted.current) return;
        
        if (trades.length > 0) {
          console.log(`Generating reflections for ${trades.length} trades...`);
          
          // Import generation function dynamically to avoid circular dependencies
          const { generateMissingReflections } = await import('@/utils/journal/reflectionGenerator');
          await generateMissingReflections(trades);
          
          // Dispatch event to notify UI
          window.dispatchEvent(new CustomEvent('reflections-generated'));
        } else {
          console.log('No trades found, skipping reflection generation');
        }
        
        if (isMounted.current) {
          setIsComplete(true);
          setIsGenerating(false);
        }
      } catch (error) {
        console.error('Error in reflection generation:', error);
        if (isMounted.current) {
          setError(error instanceof Error ? error.message : 'Unknown error');
          setIsComplete(true);
          setIsGenerating(false);
        }
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isComplete]);
  
  return { isGenerating, error, isComplete };
}
