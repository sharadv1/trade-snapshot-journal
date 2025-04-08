
import { useEffect } from 'react';
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';
import { format } from 'date-fns';

export function useReflectionGenerator() {
  useEffect(() => {
    // Generate reflections when component mounts
    const generateReflections = async () => {
      const trades = getTradesWithMetrics();
      if (trades.length > 0) {
        const { generateMissingReflections } = await import('@/utils/reflectionGenerator');
        generateMissingReflections(trades);
        
        // Dispatch an event to notify the UI that reflections have been generated
        const customEvent = new CustomEvent('journal-updated', { detail: { source: 'reflectionGenerator' } });
        window.dispatchEvent(customEvent);
      }
    };
    
    // Small delay to avoid interfering with initial render
    const timer = setTimeout(() => {
      generateReflections();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
}
