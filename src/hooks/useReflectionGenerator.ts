
import { useEffect } from 'react';
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';

export function useReflectionGenerator() {
  useEffect(() => {
    // Generate reflections when component mounts
    const generateReflections = async () => {
      const trades = getTradesWithMetrics();
      if (trades.length > 0) {
        const { generateMissingReflections } = await import('@/utils/reflectionGenerator');
        generateMissingReflections(trades);
      }
    };
    
    // Small delay to avoid interfering with initial render
    const timer = setTimeout(() => {
      generateReflections();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
}
