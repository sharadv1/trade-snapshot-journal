
// Basic storage utilities for safe localStorage operations

// Safe localStorage getter with error handling
export const safeGetItem = (key: string): string | null => {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.warn('localStorage is not available in this environment');
      return null;
    }
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error accessing localStorage for key ${key}:`, error);
    return null;
  }
};

// Safe localStorage setter with error handling
export const safeSetItem = (key: string, value: string): boolean => {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.warn('localStorage is not available in this environment');
      return false;
    }
    
    // Try to set the item
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      // If we hit a quota error, try to clear some space first
      if (e instanceof DOMException && (
        e.name === 'QuotaExceededError' || 
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        
        console.warn('Storage quota exceeded, attempting to make space');
        
        // Try to remove temporary data first
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('temp') || key.includes('cache'))) {
              localStorage.removeItem(key);
            }
          }
          
          // Try again after clearing some space
          localStorage.setItem(key, value);
          return true;
        } catch (clearError) {
          console.error('Failed to clear space in localStorage:', clearError);
          return false;
        }
      }
      
      console.error(`Error setting localStorage for key ${key}:`, e);
      return false;
    }
  } catch (error) {
    console.error(`Error setting localStorage for key ${key}:`, error);
    return false;
  }
};

// Helper function to dispatch storage events
export const dispatchStorageEvents = () => {
  try {
    if (typeof window !== 'undefined') {
      // Use a standard storage event for broad compatibility
      window.dispatchEvent(new Event('storage'));
      // Also dispatch a custom event for components listening specifically for trade updates
      window.dispatchEvent(new CustomEvent('trades-updated'));
      console.log('Storage events dispatched successfully');
    }
  } catch (eventError) {
    console.error('Error dispatching storage event:', eventError);
  }
};

// Check available storage space and show warning if needed
export const checkStorageQuota = (): {
  percentUsed: number,
  isNearLimit: boolean
} => {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return { percentUsed: 0, isNearLimit: false };
    }
    
    // Calculate approximate storage usage
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) total += value.length;
      }
    }
    
    // Approximate localStorage limit (typically 5MB)
    const estimatedLimit = 5 * 1024 * 1024;
    const percentUsed = (total / estimatedLimit) * 100;
    
    return {
      percentUsed,
      isNearLimit: percentUsed > 70
    };
  } catch (error) {
    console.error('Error checking storage quota:', error);
    return { percentUsed: 0, isNearLimit: false };
  }
};
