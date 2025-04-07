
// Custom user symbols storage utility
import { COMMON_FUTURES_CONTRACTS } from '@/types';
import { isUsingServerSync, getServerUrl } from './storage/serverSync';
import { toast } from './toast';

// Default preset symbols that should be in the system 
const PRESET_SYMBOLS = [
  // Common stocks with their types
  { symbol: 'AAPL', type: 'stock' as const },
  { symbol: 'MSFT', type: 'stock' as const },
  { symbol: 'GOOGL', type: 'stock' as const },
  { symbol: 'AMZN', type: 'stock' as const },
  { symbol: 'META', type: 'stock' as const },
  { symbol: 'TSLA', type: 'stock' as const },
  { symbol: 'NVDA', type: 'stock' as const },
  { symbol: 'AMD', type: 'stock' as const },
  { symbol: 'JPM', type: 'stock' as const },
  { symbol: 'BAC', type: 'stock' as const },
  { symbol: 'WMT', type: 'stock' as const },
  { symbol: 'NFLX', type: 'stock' as const },
  { symbol: 'DIS', type: 'stock' as const },
  { symbol: 'INTC', type: 'stock' as const },
  { symbol: 'V', type: 'stock' as const },
  { symbol: 'PFE', type: 'stock' as const },
  { symbol: 'KO', type: 'stock' as const },
  { symbol: 'NKE', type: 'stock' as const },
  // Common forex pairs
  { symbol: 'EUR/USD', type: 'forex' as const },
  { symbol: 'USD/JPY', type: 'forex' as const },
  { symbol: 'GBP/USD', type: 'forex' as const },
  { symbol: 'USD/CHF', type: 'forex' as const },
  { symbol: 'AUD/USD', type: 'forex' as const },
  { symbol: 'USD/CAD', type: 'forex' as const },
  // Common crypto symbols
  { symbol: 'BTC/USD', type: 'crypto' as const },
  { symbol: 'ETH/USD', type: 'crypto' as const },
  { symbol: 'SOL/USD', type: 'crypto' as const },
  { symbol: 'XRP/USD', type: 'crypto' as const },
];

const CUSTOM_SYMBOLS_KEY = 'customSymbols';

export interface SymbolDetails {
  symbol: string;
  type: 'stock' | 'futures' | 'options' | 'forex' | 'crypto';
  isPreset?: boolean;
  meaning?: string; // Adding support for custom meanings
}

/**
 * Gets the description/meaning of a symbol
 * @param symbol Symbol to get meaning for
 * @returns Description or name of the symbol
 */
export function getSymbolMeaning(symbol: string): string | null {
  // First check if there's a custom meaning
  const customSymbols = getCustomSymbols();
  const customSymbol = customSymbols.find(s => s.symbol === symbol);
  if (customSymbol && customSymbol.meaning) {
    return customSymbol.meaning;
  }
  
  // Then check futures contracts
  const futuresContract = COMMON_FUTURES_CONTRACTS.find(
    contract => contract.symbol === symbol
  );
  
  if (futuresContract) {
    return futuresContract.name;
  }
  
  // Known equity symbols
  const equityMeanings: Record<string, string> = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOGL': 'Alphabet Inc. (Google)',
    'AMZN': 'Amazon.com Inc.',
    'META': 'Meta Platforms Inc. (Facebook)',
    'TSLA': 'Tesla Inc.',
    'NVDA': 'NVIDIA Corporation',
    'AMD': 'Advanced Micro Devices Inc.',
  };
  
  return equityMeanings[symbol] || null;
}

// Get all preset symbols (including futures)
export function getPresetSymbols(): SymbolDetails[] {
  // Get futures symbols from the common contracts
  const futuresSymbols = COMMON_FUTURES_CONTRACTS.map(contract => ({
    symbol: contract.symbol,
    type: 'futures' as const,
    isPreset: true
  }));
  
  // Add isPreset flag to stock preset symbols
  const stockSymbols = PRESET_SYMBOLS.map(item => ({
    ...item,
    isPreset: true
  }));
  
  // Combine stock and futures preset symbols
  return [...stockSymbols, ...futuresSymbols];
}

// Save custom symbols to storage (localStorage and server)
export const saveCustomSymbols = (symbols: SymbolDetails[]): void => {
  try {
    // Always save to localStorage as a fallback
    localStorage.setItem(CUSTOM_SYMBOLS_KEY, JSON.stringify(symbols));
    
    // If server sync is enabled, also save to server
    if (isUsingServerSync() && getServerUrl()) {
      const serverUrl = `${getServerUrl().replace(/\/trades$/, '')}/symbols`;
      console.log('Saving custom symbols to server:', serverUrl);
      
      fetch(serverUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(symbols),
      })
      .then(response => {
        if (!response.ok) {
          console.error('Error saving symbols to server:', response.statusText);
          toast.error('Failed to sync symbols with server');
        } else {
          console.log('Symbols synced with server successfully');
        }
      })
      .catch(error => {
        console.error('Error syncing symbols with server:', error);
        toast.error('Server sync failed for symbols, but saved locally');
      });
    }
    
    // Dispatch a storage event to notify other tabs
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error('Error saving symbols:', error);
    toast.error('Failed to save symbols');
  }
};

// Sync symbols with server (force pull)
export const syncSymbolsWithServer = async (): Promise<boolean> => {
  if (!isUsingServerSync() || !getServerUrl()) {
    return false;
  }
  
  try {
    const serverUrl = `${getServerUrl().replace(/\/trades$/, '')}/symbols`;
    console.log('Syncing symbols with server at:', serverUrl);
    const response = await fetch(serverUrl);
    
    if (response.ok) {
      const serverSymbols = await response.json();
      localStorage.setItem(CUSTOM_SYMBOLS_KEY, JSON.stringify(serverSymbols));
      window.dispatchEvent(new Event('storage'));
      console.log('Symbols synced with server successfully');
      return true;
    } else {
      console.error('Server returned an error status when syncing symbols', response.status);
      return false;
    }
  } catch (error) {
    console.error('Error syncing symbols with server:', error);
    return false;
  }
};

/**
 * Retrieves custom symbols from localStorage
 * @returns Array of custom symbols
 */
export function getCustomSymbols(): SymbolDetails[] {
  try {
    // If server sync is enabled, try to sync first
    if (isUsingServerSync()) {
      syncSymbolsWithServer().catch(error => {
        console.error('Error syncing symbols:', error);
      });
    }

    const savedSymbols = localStorage.getItem(CUSTOM_SYMBOLS_KEY);
    return savedSymbols ? JSON.parse(savedSymbols) : [];
  } catch (error) {
    console.error('Error loading symbols from localStorage:', error);
    return [];
  }
}

/**
 * Saves a custom symbol to localStorage
 * @param symbolDetails Symbol details to add
 * @returns Updated array of custom symbols
 */
export function addCustomSymbol(symbolDetails: SymbolDetails): SymbolDetails[] {
  if (!symbolDetails.symbol) return getCustomSymbols();
  
  const symbols = getCustomSymbols();
  if (symbols.some(s => s.symbol === symbolDetails.symbol)) return symbols;
  
  const newSymbols = [...symbols, symbolDetails];
  try {
    saveCustomSymbols(newSymbols);
    return newSymbols;
  } catch (error) {
    console.error('Error saving symbols to localStorage:', error);
    return symbols;
  }
}

/**
 * Removes a custom symbol from localStorage
 * @param symbol Symbol to remove
 * @returns Updated array of custom symbols
 */
export function removeCustomSymbol(symbol: string): SymbolDetails[] {
  const symbols = getCustomSymbols();
  const newSymbols = symbols.filter(s => s.symbol !== symbol);
  
  try {
    saveCustomSymbols(newSymbols);
    return newSymbols;
  } catch (error) {
    console.error('Error saving symbols to localStorage:', error);
    return symbols;
  }
}

/**
 * Updates a symbol in localStorage
 * @param oldSymbol Original symbol string
 * @param newSymbolDetails Updated symbol details
 * @returns Updated array of custom symbols
 */
export function updateCustomSymbol(oldSymbol: string, newSymbolDetails: SymbolDetails): SymbolDetails[] {
  if (!oldSymbol || !newSymbolDetails.symbol) return getCustomSymbols();
  
  const symbols = getCustomSymbols();
  
  // If no change in the symbol, just update the type and meaning
  if (oldSymbol === newSymbolDetails.symbol) {
    const newSymbols = symbols.map(s => 
      s.symbol === oldSymbol ? { ...s, type: newSymbolDetails.type, meaning: newSymbolDetails.meaning } : s
    );
    try {
      saveCustomSymbols(newSymbols);
      return newSymbols;
    } catch (error) {
      console.error('Error saving symbols to localStorage:', error);
      return symbols;
    }
  }
  
  // Check if new symbol already exists
  if (symbols.some(s => s.symbol === newSymbolDetails.symbol)) {
    // Remove old symbol only
    const newSymbols = symbols.filter(s => s.symbol !== oldSymbol);
    try {
      saveCustomSymbols(newSymbols);
      return newSymbols;
    } catch (error) {
      console.error('Error saving symbols to localStorage:', error);
      return symbols;
    }
  }
  
  // Replace old symbol with new one
  const newSymbols = symbols.map(s => 
    s.symbol === oldSymbol ? newSymbolDetails : s
  );
  try {
    saveCustomSymbols(newSymbols);
    return newSymbols;
  } catch (error) {
    console.error('Error saving symbols to localStorage:', error);
    return symbols;
  }
}

/**
 * Gets all symbols (preset and custom)
 * @returns Combined array of preset and custom symbols
 */
export function getAllSymbols(): SymbolDetails[] {
  const presetSymbols = getPresetSymbols();
  const customSymbols = getCustomSymbols();
  
  // Create a Set of symbols to remove duplicates (prioritizing custom symbols)
  const symbolMap = new Map<string, SymbolDetails>();
  
  // Add preset symbols first
  presetSymbols.forEach(symbol => {
    symbolMap.set(symbol.symbol, symbol);
  });
  
  // Then add custom symbols (will overwrite presets if duplicate exists)
  customSymbols.forEach(symbol => {
    symbolMap.set(symbol.symbol, symbol);
  });
  
  // Convert map back to array
  return Array.from(symbolMap.values());
}
