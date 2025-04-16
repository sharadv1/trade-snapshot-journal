
import { useEffect, useState, useRef } from 'react';

// Global cache for tracking generation attempts across component instances
const generationState = {
  hasGenerated: false,
  inProgress: false,
  lastAttempt: 0,
  error: null as string | null
};

// Enhanced cache to prevent redundant generation and infinite loops
const reflectionCache = {
  timestamp: 0,
  isValid: false,
  forceSkipPaths: ['/journal', '/journal/weekly', '/journal/monthly', '/journal/weekly/', '/journal/monthly/']
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
  
  // Add hard skip for specific routes
  const shouldForceSkip = useRef(false);
  
  // Check route immediately on mount
  useEffect(() => {
    const path = window.location.pathname;
    
    // Check for detail pages (with path parameters)
    const isDetailPage = path.match(/\/journal\/(weekly|monthly)\/[^\/]+$/i);
    
    // Immediately mark as complete and skip all processing on journal pages
    if (reflectionCache.forceSkipPaths.some(skipPath => path.startsWith(skipPath)) || isDetailPage) {
      console.log(`Skipping reflection generation on path: ${path}`);
      shouldForceSkip.current = true;
      setIsComplete(true);
      setIsGenerating(false);
      return;
    }
    
    // Safety: mark as complete after a short timeout regardless of route
    const safetyTimer = setTimeout(() => {
      if (isMounted.current) {
        setIsComplete(true);
        setIsGenerating(false);
      }
    }, 1000); // Reduced from 2000ms to 1000ms for faster completion
    
    return () => clearTimeout(safetyTimer);
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
    if (!isMounted.current || isProcessingRef.current || shouldForceSkip.current) {
      setIsComplete(true);
      setIsGenerating(false);
      return;
    }
    
    // Re-check route on effect - route could have changed
    const currentPath = window.location.pathname;
    // Check for detail pages (with path parameters)
    const isDetailPage = currentPath.match(/\/journal\/(weekly|monthly)\/[^\/]+$/i);
    
    if (reflectionCache.forceSkipPaths.some(skipPath => currentPath.startsWith(skipPath)) || isDetailPage) {
      console.log(`Route check: skipping reflection generation on path: ${currentPath}`);
      setIsComplete(true);
      setIsGenerating(false);
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
      }, 1000); // Reduced timeout to 1 second to prevent UI freezing
      
      return;
    }
    
    // Check cache validity - to further reduce unnecessary processing
    const now = Date.now();
    if (reflectionCache.isValid && (now - reflectionCache.timestamp < 30000)) {
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
    if (attemptsRef.current > 0) { // Only allow one attempt max per instance
      console.log('Limiting reflection generation attempts to prevent loops');
      setIsGenerating(false);
      setIsComplete(true); // Mark as complete anyway to prevent UI blocking
      return;
    }
    
    attemptsRef.current++;
    
    // Begin generation process with a slight delay to avoid UI blocking
    setTimeout(async () => {
      try {
        // Check one final time if path is a journal page
        const currentPathFinal = window.location.pathname;
        const isDetailPageFinal = currentPathFinal.match(/\/journal\/(weekly|monthly)\/[^\/]+$/i);
        
        if (reflectionCache.forceSkipPaths.some(skipPath => currentPathFinal.startsWith(skipPath)) || isDetailPageFinal) {
          console.log(`Final check: skipping reflection generation on path: ${currentPathFinal}`);
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
        }, 1500);
        
        // Dynamically import with a timeout guard
        timeoutRef.current = setTimeout(async () => {
          try {
            // Safety check for unmounting
            if (!isMounted.current) {
              cleanupProcessing();
              return;
            }
            
            const { getTradesWithMetrics } = await import('@/utils/storage/tradeOperations');
            
            // Get trades safely - if this function call is causing infinite loops,
            // we'll catch it in the completionTimeout above
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
        }, 50);
      } catch (error) {
        console.error('Error in reflection generation setup:', error);
        updateCompleteState(); // Still complete to prevent UI blocking
      }
    }, 10);
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
