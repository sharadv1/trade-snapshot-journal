// Basic storage utilities for safe localStorage operations

// Fallback memory storage when localStorage is full
const memoryStorage: Record<string, string> = {};

// Safe localStorage getter with error handling and memory fallback
export const safeGetItem = (key: string): string | null => {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.warn('localStorage is not available in this environment');
      return memoryStorage[key] || null;
    }
    
    // Try localStorage first
    const value = localStorage.getItem(key);
    
    // If value exists in localStorage, return it
    if (value !== null) {
      return value;
    }
    
    // If not in localStorage but in memory fallback, return from memory
    if (memoryStorage[key]) {
      console.log(`Retrieved ${key} from memory fallback`);
      return memoryStorage[key];
    }
    
    return null;
  } catch (error) {
    console.error(`Error accessing localStorage for key ${key}:`, error);
    // Return from memory fallback if available
    return memoryStorage[key] || null;
  }
};

// Safe localStorage setter with error handling and memory fallback
export const safeSetItem = (key: string, value: string): boolean => {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.warn('localStorage is not available in this environment');
      // Store in memory fallback
      memoryStorage[key] = value;
      return false;
    }
    
    // Always store in memory fallback first
    memoryStorage[key] = value;
    
    // Try to set the item in localStorage
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
          // More aggressive cleaning strategy
          for (let i = 0; i < localStorage.length; i++) {
            const storageKey = localStorage.key(i);
            if (storageKey && (
              storageKey.includes('temp') || 
              storageKey.includes('cache') ||
              // Add more patterns that are safe to clear
              storageKey.includes('draft-') ||
              storageKey.includes('log-')
            )) {
              localStorage.removeItem(storageKey);
            }
          }
          
          // Try again after clearing some space
          localStorage.setItem(key, value);
          return true;
        } catch (clearError) {
          console.error('Failed to clear space in localStorage:', clearError);
          
          // If still failing, and this is the server URL, we're using memory fallback anyway
          if (key.includes('server-url')) {
            console.log('Could not save server URL to localStorage, using memory fallback');
            return false;
          }
          
          // Otherwise, try to remove the largest items
          try {
            const itemsToKeep = ['trade-journal-server-url']; // Keys to preserve
            removeOldestItemsUntilSpace(itemsToKeep, key, value);
            return true;
          } catch (e) {
            console.error('Still failed to make space in localStorage:', e);
            return false;
          }
        }
      }
      
      console.error(`Error setting localStorage for key ${key}:`, e);
      return false;
    }
  } catch (error) {
    console.error(`Error setting localStorage for key ${key}:`, error);
    // Still store in memory as fallback
    memoryStorage[key] = value;
    return false;
  }
};

// Helper function to remove oldest/largest items until we have space
const removeOldestItemsUntilSpace = (
  keysToKeep: string[], 
  targetKey: string, 
  targetValue: string
): boolean => {
  // Find the largest items that aren't in keysToKeep
  const storageItems: Array<{ key: string, size: number }> = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !keysToKeep.includes(key)) {
      const value = localStorage.getItem(key) || '';
      storageItems.push({ key, size: value.length });
    }
  }
  
  // Sort by size, largest first
  storageItems.sort((a, b) => b.size - a.size);
  
  // Remove items until we have space or run out of items
  for (const item of storageItems) {
    localStorage.removeItem(item.key);
    console.log(`Removed item ${item.key} (${item.size} bytes) to make space`);
    
    // Try to set the item again
    try {
      localStorage.setItem(targetKey, targetValue);
      return true;
    } catch (e) {
      // Continue removing items
      continue;
    }
  }
  
  return false;
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
  isNearLimit: boolean,
  remainingSpace: number
} => {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return { percentUsed: 0, isNearLimit: false, remainingSpace: 0 };
    }
    
    // Calculate approximate storage usage
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) total += value.length * 2; // Unicode characters can take up to 2 bytes
      }
    }
    
    // Approximate localStorage limit (typically 5MB)
    const estimatedLimit = 5 * 1024 * 1024;
    const percentUsed = (total / estimatedLimit) * 100;
    const remainingSpace = Math.max(0, estimatedLimit - total);
    
    return {
      percentUsed,
      isNearLimit: percentUsed > 70,
      remainingSpace
    };
  } catch (error) {
    console.error('Error checking storage quota:', error);
    return { percentUsed: 0, isNearLimit: false, remainingSpace: 0 };
  }
};

// Get all keys in localStorage
export const getAllStorageKeys = (): string[] => {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return Object.keys(memoryStorage);
    }
    
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }
    return keys;
  } catch (error) {
    console.error('Error getting all storage keys:', error);
    return Object.keys(memoryStorage);
  }
};

// Get the total size of localStorage in bytes
export const getStorageSize = (): number => {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return 0;
    }
    
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          // Each character in JS is 2 bytes for UTF-16
          total += (key.length + value.length) * 2;
        }
      }
    }
    return total;
  } catch (error) {
    console.error('Error calculating storage size:', error);
    return 0;
  }
};
