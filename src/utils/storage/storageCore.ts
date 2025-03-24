
import { Trade } from '@/types';
import { toast } from '@/utils/toast';

// Local storage keys
export const TRADES_STORAGE_KEY = 'trade-journal-trades';

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
};

// Synchronous version for components that can't use async/await
export const getTradesSync = (): Trade[] => {
  try {
    const tradesJson = localStorage.getItem(TRADES_STORAGE_KEY);
    if (!tradesJson) return [];
    return JSON.parse(tradesJson);
  } catch (error) {
    console.error('Error getting trades from localStorage:', error);
    return [];
  }
};

// Enhanced save trades function with better error handling
export const saveTrades = async (trades: Trade[]): Promise<void> => {
  if (!trades || !Array.isArray(trades)) {
    console.error('Invalid trades data:', trades);
    toast.error('Invalid trade data format');
    return;
  }
  
  try {
    // Always save to localStorage as a fallback
    localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(trades));
    console.log(`Saved ${trades.length} trades to local storage`);
    
    // If server sync is enabled, also save to server
    if (useServerSync && serverUrl) {
      try {
        console.log('Saving trades to server:', serverUrl);
        const response = await fetch(serverUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(trades),
        });
        
        if (!response.ok) {
          throw new Error(`Server returned status: ${response.status}`);
        } else {
          console.log('Trades synced with server successfully');
        }
      } catch (serverError) {
        console.error('Error syncing with server:', serverError);
        toast.error('Server sync failed, but trades saved locally');
      }
    }
    
    // Dispatch a storage event to notify other tabs/components
    window.dispatchEvent(new Event('storage'));
    console.log('Trades saved successfully and storage event dispatched');
  } catch (error) {
    console.error('Error saving trades to localStorage:', error);
    toast.error('Failed to save trades');
  }
};

// Enhanced get trades function with improved error handling
export const getTrades = async (): Promise<Trade[]> => {
  try {
    // Try to get from server first if server sync is enabled
    if (useServerSync && serverUrl) {
      try {
        console.log('Attempting to load trades from server:', serverUrl);
        const response = await fetch(serverUrl);
        if (response.ok) {
          const serverTrades = await response.json();
          console.log(`Loaded ${serverTrades.length} trades from server`);
          
          // Validate the data is an array before saving
          if (Array.isArray(serverTrades)) {
            // Update localStorage with server data
            localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(serverTrades));
            return serverTrades;
          } else {
            throw new Error('Server returned invalid data format (not an array)');
          }
        } else {
          throw new Error(`Server returned an error status: ${response.status}`);
        }
      } catch (serverError) {
        console.error('Error fetching from server:', serverError);
        toast.error('Server connection failed, using local storage');
      }
    }
    
    // Fallback to localStorage
    const tradesJson = localStorage.getItem(TRADES_STORAGE_KEY);
    if (!tradesJson) return [];
    
    const parsedTrades = JSON.parse(tradesJson);
    if (!Array.isArray(parsedTrades)) {
      console.error('Invalid trade data format in localStorage');
      return [];
    }
    
    return parsedTrades;
  } catch (error) {
    console.error('Error getting trades:', error);
    toast.error('Failed to load trades');
    return [];
  }
};
