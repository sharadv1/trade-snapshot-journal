
import { useEffect, useState, useRef } from 'react';
import { toast } from '@/utils/toast';

// Global cache for tracking generation attempts across component instances
const generationState = {
  hasGenerated: false,
  inProgress: false,
  lastAttempt: 0,
  error: null as string | null
};

export function useReflectionGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  
  // Refs for component lifecycle management
  const isMounted = useRef(true);
  const isProcessingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef(0);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any timeouts when unmounting
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Skip if unmounted or already processing
    if (!isMounted.current || isProcessingRef.current) return;
    
    // Prevent simultaneous generation attempts across components
    if (generationState.inProgress) {
      setIsGenerating(true);
      
      // Add a safety timeout to force completion if generation gets stuck
      completionTimeoutRef.current = setTimeout(() => {
        if (isMounted.current && isGenerating) {
          console.log('Force completing reflection generation due to timeout');
          setIsComplete(true);
          setIsGenerating(false);
          generationState.hasGenerated = true;
          generationState.inProgress = false;
        }
      }, 5000); // Force completion after 5 seconds if stuck
      
      return;
    }
    
    // Skip if already completed successfully recently (within last 30 seconds)
    const now = Date.now();
    if (generationState.hasGenerated && (now - generationState.lastAttempt < 30000)) {
      console.log('Using cached generation result from recent successful attempt');
      setIsComplete(true);
      setIsGenerating(false);
      return;
    }
    
    // Limit the number of attempts to prevent infinite loops
    if (attemptsRef.current > 3) {
      console.log('Too many reflection generation attempts, stopping');
      setIsGenerating(false);
      setError('Too many generation attempts. Please refresh the page and try again.');
      return;
    }
    
    attemptsRef.current++;
    
    // Begin generation process
    const generateReflections = async () => {
      try {
        console.log('Starting reflection generation process');
        setIsGenerating(true);
        setError(null);
        isProcessingRef.current = true;
        generationState.inProgress = true;
        
        // Dynamically import trade operations with a timeout guard
        timeoutRef.current = setTimeout(async () => {
          try {
            // Safety check to prevent further processing if component unmounted
            if (!isMounted.current) {
              cleanupProcessing();
              return;
            }
            
            const { getTradesWithMetrics } = await import('@/utils/storage/tradeOperations');
            
            // Get trades safely
            const trades = getTradesWithMetrics();
            console.log(`Processing ${trades.length} trades for reflection generation`);
            
            if (!isMounted.current) {
              cleanupProcessing();
              return;
            }
            
            if (trades.length > 0) {
              // Dynamically import to prevent circular dependencies
              const { generateMissingReflections } = await import('@/utils/journal/reflectionGenerator');
              
              if (!isMounted.current) {
                cleanupProcessing();
                return;
              }
              
              await generateMissingReflections(trades);
              
              // Update completion state
              updateCompleteState();
            } else {
              console.log('No trades found for reflection generation');
              updateCompleteState();
            }
          } catch (error) {
            handleError(error);
          }
        }, 300);
        
        // Add a safety timeout to force completion if generation gets stuck
        completionTimeoutRef.current = setTimeout(() => {
          if (isMounted.current && isGenerating) {
            console.log('Force completing reflection generation due to timeout');
            updateCompleteState();
          }
        }, 8000); // Force completion after 8 seconds max
      } catch (error) {
        handleError(error);
      }
    };
    
    // Helper functions
    const cleanupProcessing = () => {
      isProcessingRef.current = false;
      generationState.inProgress = false;
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
    
    const updateCompleteState = () => {
      if (isMounted.current) {
        generationState.hasGenerated = true;
        generationState.lastAttempt = Date.now();
        generationState.inProgress = false;
        generationState.error = null;
        setIsComplete(true);
        setIsGenerating(false);
        
        // Dispatch event to notify the system that reflections are ready
        window.dispatchEvent(new CustomEvent('reflections-generated'));
      }
      cleanupProcessing();
    };
    
    const handleError = (error: any) => {
      console.error('Error in reflection generation:', error);
      
      if (isMounted.current) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        generationState.error = errorMessage;
        generationState.inProgress = false;
        setError(errorMessage);
        setIsGenerating(false);
        toast.error('Failed to generate reflections. Please try again.');
        
        // Even on error, mark as complete so the UI can proceed
        setIsComplete(true);
      }
      
      cleanupProcessing();
    };
    
    // Start the generation process
    generateReflections();
  }, []);

  return { isGenerating, error, isComplete };
}
