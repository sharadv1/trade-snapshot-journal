
import { useEffect } from 'react';
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';

export function useReflectionGenerator() {
  useEffect(() => {
    // Generate reflections when component mounts
    const generateReflections = async () => {
      try {
        const trades = getTradesWithMetrics();
        if (trades.length > 0) {
          const { generateMissingReflections } = await import('@/utils/reflectionGenerator');
          await generateMissingReflections(trades);
          
          // Dispatch an event to notify the UI that reflections have been generated
          const customEvent = new CustomEvent('journal-updated', { detail: { source: 'reflectionGenerator' } });
          window.dispatchEvent(customEvent);
          console.log('Reflections generation completed');
        } else {
          console.log('No trades found, skipping reflection generation');
        }
      } catch (error) {
        console.error('Error generating reflections:', error);
      }
    };
    
    // Small delay to avoid interfering with initial render
    const timer = setTimeout(() => {
      generateReflections();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
}
