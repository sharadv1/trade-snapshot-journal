
import { useEffect, useState } from 'react';
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';
import { toast } from '@/utils/toast';

export function useReflectionGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Generate reflections when component mounts
    const generateReflections = async () => {
      try {
        setIsGenerating(true);
        setError(null);
        
        const trades = getTradesWithMetrics();
        if (trades.length > 0) {
          console.log(`Found ${trades.length} trades for reflection generation`);
          
          try {
            // Dynamically import to avoid circular dependencies
            const { generateMissingReflections } = await import('@/utils/reflectionGenerator');
            await generateMissingReflections(trades);
            
            // Dispatch an event to notify the UI that reflections have been generated
            const customEvent = new CustomEvent('journal-updated', { 
              detail: { source: 'reflectionGenerator', success: true } 
            });
            window.dispatchEvent(customEvent);
            
            console.log('Reflections generation completed successfully');
          } catch (error) {
            console.error('Failed to generate reflections:', error);
            throw error;
          }
        } else {
          console.log('No trades found, skipping reflection generation');
        }
      } catch (error) {
        console.error('Error generating reflections:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        
        toast.error('Failed to generate reflections. Please try again.');
        
        // Dispatch an event even when there's an error so UI can stop showing loading state
        const customEvent = new CustomEvent('journal-updated', { 
          detail: { source: 'reflectionGenerator', error: true } 
        });
        window.dispatchEvent(customEvent);
      } finally {
        setIsGenerating(false);
      }
    };
    
    // Small delay to avoid interfering with initial render
    const timer = setTimeout(() => {
      generateReflections();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return { isGenerating, error };
}
