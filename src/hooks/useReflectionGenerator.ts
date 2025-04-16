
import { useEffect, useState, useRef } from 'react';
import { toast } from '@/utils/toast';

// Global cache for tracking generation attempts across component instances
const generationState = {
  hasGenerated: false,
  inProgress: false,
  lastAttempt: 0,
  error: null as string | null
};

// Cache to prevent redundant generation
const reflectionCache = {
  timestamp: 0,
  isValid: false
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
  
  // Check if we should skip generation entirely
  const shouldSkipGeneration = useRef(false);
  
  // Performance optimization: check if we're on a reflection list or detail page
  useEffect(() => {
    const path = window.location.pathname;
    // Skip generation on ALL reflection-related pages to prevent UI freezing
    if (path.includes('/journal/weekly') || 
        path.includes('/journal/monthly') || 
        path === '/journal') {
      console.log('Skipping reflection generation on reflections page');
      shouldSkipGeneration.current = true;
      setIsComplete(true);
      setIsGenerating(false);
    }
  }, []);

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
    // Skip if unmounted, already processing, or should be skipped
    if (!isMounted.current || isProcessingRef.current || shouldSkipGeneration.current) {
      if (shouldSkipGeneration.current) {
        console.log('Skipping reflection generation on reflections page');
      }
      setIsComplete(true);
      return;
    }
    
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
      }, 3000); // Reduced timeout to 3 seconds to prevent UI freezing
      
      return;
    }
    
    // Check cache validity - to further reduce unnecessary processing
    const now = Date.now();
    if (reflectionCache.isValid && (now - reflectionCache.timestamp < 60000)) {
      console.log('Using cached generation state, skipping');
      setIsComplete(true);
      setIsGenerating(false);
      return;
    }
    
    // Skip if already completed successfully recently
    if (generationState.hasGenerated && (now - generationState.lastAttempt < 30000)) {
      console.log('Using cached generation result from recent successful attempt');
      setIsComplete(true);
      setIsGenerating(false);
      return;
    }
    
    // Limit the number of attempts to prevent infinite loops
    if (attemptsRef.current > 2) { // Reduced max attempts to 2
      console.log('Too many reflection generation attempts, stopping');
      setIsGenerating(false);
      setIsComplete(true); // Mark as complete anyway to prevent UI blocking
      setError('Too many generation attempts. Please refresh the page and try again.');
      return;
    }
    
    attemptsRef.current++;
    
    // Begin generation process with a slight delay to avoid UI blocking
    setTimeout(async () => {
      try {
        // Do one final check if we should skip - this catches route changes
        const currentPath = window.location.pathname;
        if (currentPath.includes('/journal/weekly') || 
            currentPath.includes('/journal/monthly') ||
            currentPath === '/journal') {
          console.log('Route changed to reflections page, skipping generation');
          updateCompleteState();
          return;
        }
        
        console.log('Starting reflection generation process');
        setIsGenerating(true);
        setError(null);
        isProcessingRef.current = true;
        generationState.inProgress = true;
        
        // Ensure we have a fast bailout timeout in case things get stuck
        completionTimeoutRef.current = setTimeout(() => {
          if (isMounted.current) {
            console.log('Forcing reflection generation completion after timeout');
            updateCompleteState();
          }
        }, 5000);
        
        // Dynamically import with a timeout guard
        timeoutRef.current = setTimeout(async () => {
          try {
            // Safety check for unmounting
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
              try {
                // Dynamically import to prevent circular dependencies
                const { generateMissingReflections } = await import('@/utils/journal/reflectionGenerator');
                
                if (!isMounted.current) {
                  cleanupProcessing();
                  return;
                }
                
                await generateMissingReflections(trades);
                
                // Update cache state
                reflectionCache.isValid = true;
                reflectionCache.timestamp = Date.now();
                
                // Update completion state
                updateCompleteState();
              } catch (processingError) {
                console.error('Error during reflection generation:', processingError);
                // Still mark as complete to prevent UI freezing
                updateCompleteState();
              }
            } else {
              console.log('No trades found for reflection generation');
              updateCompleteState();
            }
          } catch (error) {
            console.error('Error in delayed reflection processing:', error);
            updateCompleteState(); // Still complete to prevent UI blocking
          }
        }, 100);
      } catch (error) {
        console.error('Error in reflection generation setup:', error);
        updateCompleteState(); // Still complete to prevent UI blocking
      }
    }, 50);
  }, [isGenerating]);
  
  // Helper functions
  const cleanupProcessing = () => {
    isProcessingRef.current = false;
    generationState.inProgress = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
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
      
      // Even on error, mark as complete so the UI can proceed
      setIsComplete(true);
    }
    
    cleanupProcessing();
  };

  return { isGenerating, error, isComplete };
}
