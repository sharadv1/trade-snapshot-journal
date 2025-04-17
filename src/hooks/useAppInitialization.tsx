
import { useEffect, useRef } from 'react';
import { createDefaultStrategiesIfNoneExist } from '@/utils/defaultStrategies';
import { removeDuplicateReflections, cleanupEmptyReflections } from '@/utils/journal/storage/duplicateReflections';
import { toast } from '@/utils/toast';

export function useAppInitialization() {
  const hasInitializedRef = useRef(false);
  
  useEffect(() => {
    // Only run once
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    const initializeApp = async () => {
      try {
        console.log('Initializing app with default data if needed');
        
        // Check and create default strategies if none exist
        await createDefaultStrategiesIfNoneExist();
        
        // Clean up duplicate reflections on app start (silently)
        try {
          console.log('Running automatic cleanup of duplicate reflections');
          const { weeklyRemoved, monthlyRemoved } = await removeDuplicateReflections();
          
          if (weeklyRemoved > 0 || monthlyRemoved > 0) {
            console.log(`Removed ${weeklyRemoved} weekly and ${monthlyRemoved} monthly duplicate reflections on startup`);
            
            // Also clean up empty reflections
            const emptyRemoved = await cleanupEmptyReflections();
            if (emptyRemoved > 0) {
              console.log(`Also removed ${emptyRemoved} empty reflections`);
            }
            
            // Force storage event to update UI
            window.dispatchEvent(new Event('storage'));
          }
        } catch (error) {
          console.error('Error removing duplicates during initialization:', error);
        }
        
        console.log('App initialization complete');
      } catch (error) {
        console.error('Error during app initialization:', error);
      }
    };
    
    initializeApp();
    
    // Add event listener to detect storage changes
    const handleStorageEvent = () => {
      console.log('Storage changed, checking if strategies exist');
      createDefaultStrategiesIfNoneExist();
    };
    
    window.addEventListener('storage', handleStorageEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);
}
