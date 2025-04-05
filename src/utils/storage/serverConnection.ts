import { safeGetItem, safeSetItem } from './storageUtils';

// Server URL storage key
export const SERVER_URL_KEY = 'trade-journal-server-url';

// Flag to determine if using server sync or just localStorage
let useServerSync = false;
let serverUrl = '';

// Memory fallback when localStorage is full
let memoryServerUrl = '';

// Get the server connection status
export const isUsingServerSync = (): boolean => {
  return useServerSync;
};

export const getServerUrl = (): string => {
  return serverUrl || memoryServerUrl;
};

export const setServerSync = (enabled: boolean, url: string = ''): void => {
  useServerSync = enabled;
  
  if (enabled) {
    serverUrl = url;
    // Keep in memory regardless of localStorage success
    memoryServerUrl = url;
  } else {
    serverUrl = '';
    memoryServerUrl = '';
  }
  
  // Log to help with debugging
  console.log(`Server sync ${enabled ? 'enabled' : 'disabled'}${enabled ? ' with URL: ' + url : ''}`);

  // If enabling with a URL, save to localStorage
  if (enabled && url) {
    try {
      // Try to clean up some space first by removing less important items
      if (typeof localStorage !== 'undefined') {
        try {
          // Remove any temporary data that might be taking up space
          localStorage.removeItem('trade-journal-temp-data');
          
          // Try to remove draft or temporary items
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('draft-') || key.includes('temp-'))) {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          console.warn('Could not clean up localStorage:', e);
        }
      }
      
      const result = safeSetItem(SERVER_URL_KEY, url);
      if (!result) {
        console.log('Server URL saved to memory fallback. Normal operation will continue.');
      }
    } catch (error) {
      console.error('Error saving server URL to localStorage:', error);
      console.log('Using memory fallback for server URL - connection is still active');
    }
  } else if (!enabled) {
    // If disabling, remove from localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(SERVER_URL_KEY);
        // Also clear memory storage
        memoryServerUrl = '';
      } catch (e) {
        console.warn('Error removing server URL from localStorage:', e);
      }
    }
  }
};

// Initialize server connection from localStorage (called on app start)
export const initServerConnectionFromStorage = (): void => {
  try {
    const savedUrl = safeGetItem(SERVER_URL_KEY) || memoryServerUrl;
    if (savedUrl) {
      setServerSync(true, savedUrl);
    } else {
      setServerSync(false, '');
    }
  } catch (error) {
    console.error('Error initializing server connection:', error);
    
    // If there was an error but we have a memory fallback, use it
    if (memoryServerUrl) {
      console.log('Using memory fallback for server URL:', memoryServerUrl);
      setServerSync(true, memoryServerUrl);
    } else {
      setServerSync(false, '');
    }
  }
};

// Helper to check if we're likely running in a Docker environment
export const isLikelyDockerEnvironment = (): boolean => {
  const origin = window.location.origin;
  // If not a localhost dev server, it's likely a Docker deployment
  return (
    origin !== 'http://localhost:3000' && 
    origin !== 'http://localhost:5173' && 
    origin !== 'http://127.0.0.1:5173'
  );
};
