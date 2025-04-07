// Custom user symbols storage utility
import { COMMON_FUTURES_CONTRACTS } from '@/types';
import { isUsingServerSync, getServerUrl } from './storage/serverSync';
import { toast } from './toast';

// Default preset symbols that should be in the system 
const PRESET_SYMBOLS = [
  // Major Futures contracts
  { symbol: 'ES', type: 'futures' as const, meaning: 'E-mini S&P 500' },
  { symbol: 'NQ', type: 'futures' as const, meaning: 'E-mini NASDAQ-100' },
  { symbol: 'YM', type: 'futures' as const, meaning: 'E-mini Dow Jones' },
  { symbol: 'RTY', type: 'futures' as const, meaning: 'E-mini Russell 2000' },
  { symbol: 'CL', type: 'futures' as const, meaning: 'Crude Oil' },
  { symbol: 'GC', type: 'futures' as const, meaning: 'Gold' },
  { symbol: 'SI', type: 'futures' as const, meaning: 'Silver' },
  { symbol: 'HG', type: 'futures' as const, meaning: 'Copper' },
  { symbol: 'ZB', type: 'futures' as const, meaning: '30-Year U.S. Treasury Bond' },
  { symbol: 'ZN', type: 'futures' as const, meaning: '10-Year U.S. Treasury Note' },
  { symbol: 'ZT', type: 'futures' as const, meaning: '2-Year U.S. Treasury Note' },
  { symbol: 'ZF', type: 'futures' as const, meaning: '5-Year U.S. Treasury Note' },
  { symbol: 'ZC', type: 'futures' as const, meaning: 'Corn' },
  { symbol: 'ZS', type: 'futures' as const, meaning: 'Soybeans' },
  { symbol: 'ZW', type: 'futures' as const, meaning: 'Wheat' },
  { symbol: 'KE', type: 'futures' as const, meaning: 'KC Wheat' },
  { symbol: 'NG', type: 'futures' as const, meaning: 'Natural Gas' },
  { symbol: 'HE', type: 'futures' as const, meaning: 'Lean Hogs' },
  { symbol: 'LE', type: 'futures' as const, meaning: 'Live Cattle' },
  
  // Micro Futures
  { symbol: 'MES', type: 'futures' as const, meaning: 'Micro E-mini S&P 500' },
  { symbol: 'MNQ', type: 'futures' as const, meaning: 'Micro E-mini NASDAQ-100' },
  { symbol: 'MYM', type: 'futures' as const, meaning: 'Micro E-mini Dow Jones' },
  { symbol: 'M2K', type: 'futures' as const, meaning: 'Micro E-mini Russell 2000' },
  { symbol: 'MCL', type: 'futures' as const, meaning: 'Micro Crude Oil' },
  { symbol: 'MGC', type: 'futures' as const, meaning: 'Micro Gold' },
  { symbol: 'SIL', type: 'futures' as const, meaning: 'Micro Silver' },
  
  // Major Crypto
  { symbol: 'BTC/USD', type: 'crypto' as const, meaning: 'Bitcoin' },
  { symbol: 'ETH/USD', type: 'crypto' as const, meaning: 'Ethereum' },
  { symbol: 'SOL/USD', type: 'crypto' as const, meaning: 'Solana' },
  { symbol: 'XRP/USD', type: 'crypto' as const, meaning: 'Ripple' },
  { symbol: 'ADA/USD', type: 'crypto' as const, meaning: 'Cardano' },
  { symbol: 'DOT/USD', type: 'crypto' as const, meaning: 'Polkadot' },
  { symbol: 'DOGE/USD', type: 'crypto' as const, meaning: 'Dogecoin' },
  { symbol: 'LINK/USD', type: 'crypto' as const, meaning: 'Chainlink' },
  { symbol: 'AVAX/USD', type: 'crypto' as const, meaning: 'Avalanche' },
  { symbol: 'MATIC/USD', type: 'crypto' as const, meaning: 'Polygon' },
  { symbol: 'ATOM/USD', type: 'crypto' as const, meaning: 'Cosmos' },
  { symbol: 'UNI/USD', type: 'crypto' as const, meaning: 'Uniswap' },
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
  
  // Then check preset symbols for meaning
  const presetSymbol = PRESET_SYMBOLS.find(s => s.symbol === symbol);
  if (presetSymbol && presetSymbol.meaning) {
    return presetSymbol.meaning;
  }
  
  // Then check futures contracts
  const futuresContract = COMMON_FUTURES_CONTRACTS.find(
    contract => contract.symbol === symbol
  );
  
  if (futuresContract) {
    return futuresContract.name;
  }
  
  return null;
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
