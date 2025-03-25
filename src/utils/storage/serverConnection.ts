
import { safeGetItem, safeSetItem } from './storageUtils';

// Server URL storage key
export const SERVER_URL_KEY = 'trade-journal-server-url';

// Flag to determine if using server sync or just localStorage
let useServerSync = false;
let serverUrl = '';

// Get the server connection status
export const isUsingServerSync = (): boolean => {
  return useServerSync;
};

export const getServerUrl = (): string => {
  return serverUrl;
};

export const setServerSync = (enabled: boolean, url: string = ''): void => {
  useServerSync = enabled;
  serverUrl = url;
  
  // Log to help with debugging
  console.log(`Server sync ${enabled ? 'enabled' : 'disabled'}${enabled ? ' with URL: ' + url : ''}`);

  // If enabling with a URL, save to localStorage
  if (enabled && url) {
    safeSetItem(SERVER_URL_KEY, url);
  } else if (!enabled) {
    // If disabling, remove from localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SERVER_URL_KEY);
    }
  }
};

// Initialize server connection from localStorage (called on app start)
export const initServerConnectionFromStorage = (): void => {
  const savedUrl = safeGetItem(SERVER_URL_KEY);
  if (savedUrl) {
    setServerSync(true, savedUrl);
  } else {
    setServerSync(false, '');
  }
};
