
import { Trade } from '@/types';
import { toast } from '@/utils/toast';
import { safeGetItem, safeSetItem, dispatchStorageEvents } from './storageUtils';
import { isUsingServerSync, getServerUrl } from './serverConnection';
import { isValidTrade, normalizeTrade } from './tradeValidation';

// Local storage keys
export const TRADES_STORAGE_KEY = 'trade-journal-trades';

// Synchronous version for components that can't use async/await
export const getTradesSync = (): Trade[] => {
  try {
    console.log('Getting trades from localStorage synchronously');
    const tradesJson = safeGetItem(TRADES_STORAGE_KEY);
    if (!tradesJson) {
      console.info('No trades found in localStorage');
      return [];
    }
    
    let parsed;
    try {
      parsed = JSON.parse(tradesJson);
    } catch (parseError) {
      console.error('Failed to parse trades JSON:', parseError);
      return [];
    }
    
    if (!Array.isArray(parsed)) {
      console.error('Invalid trades data format in localStorage, expected array but got:', typeof parsed);
      return [];
    }
    
    // Filter out invalid trades and ensure all trades have required fields
    const validTrades = parsed
      .filter(isValidTrade)
      .map(normalizeTrade);
    
    // Log the count of valid trades found
    console.info(`Found ${validTrades.length} valid trades in localStorage`);
    return validTrades;
  } catch (error) {
    console.error('Error getting trades from localStorage:', error);
    return [];
  }
};

// Enhanced save trades function with better error handling
export const saveTrades = async (trades: Trade[]): Promise<boolean> => {
  if (!trades || !Array.isArray(trades)) {
    console.error('Invalid trades data:', trades);
    toast.error('Invalid trade data format');
    return false;
  }
  
  // Ensure all trades have required fields to prevent rendering errors
  const validatedTrades = trades.map(normalizeTrade);
  
  try {
    // Always save to localStorage as a fallback
    const stringified = JSON.stringify(validatedTrades);
    const saved = safeSetItem(TRADES_STORAGE_KEY, stringified);
    
    if (!saved) {
      toast.error('Could not save to local storage. Storage might be full or disabled.');
      return false;
    }
    
    console.log(`Saved ${validatedTrades.length} trades to local storage`);
    
    // If server sync is enabled, also save to server
    if (isUsingServerSync() && getServerUrl()) {
      try {
        console.log('Saving trades to server:', getServerUrl());
        const response = await fetch(getServerUrl(), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: stringified,
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
    
    // Dispatch events to notify other components
    dispatchStorageEvents();
    
    return true;
  } catch (error) {
    console.error('Error saving trades to localStorage:', error);
    toast.error('Failed to save trades');
    return false;
  }
};

// Enhanced get trades function with improved error handling
export const getTrades = async (): Promise<Trade[]> => {
  try {
    console.log('Getting trades asynchronously');
    // Try to get from server first if server sync is enabled
    if (isUsingServerSync() && getServerUrl()) {
      try {
        console.log('Attempting to load trades from server:', getServerUrl());
        const response = await fetch(getServerUrl());
        if (response.ok) {
          const serverTrades = await response.json();
          console.log(`Loaded ${serverTrades.length} trades from server`);
          
          // Validate the data is an array before saving
          if (Array.isArray(serverTrades)) {
            // Ensure all trades have required fields
            const validatedTrades = serverTrades.map(normalizeTrade);
            
            // Update localStorage with server data
            safeSetItem(TRADES_STORAGE_KEY, JSON.stringify(validatedTrades));
            return validatedTrades;
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
    return getTradesSync();
  } catch (error) {
    console.error('Error getting trades:', error);
    toast.error('Failed to load trades');
    return [];
  }
};
