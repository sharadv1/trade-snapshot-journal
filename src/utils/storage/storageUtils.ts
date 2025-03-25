
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
    localStorage.setItem(key, value);
    return true;
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
