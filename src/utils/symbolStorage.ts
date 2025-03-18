
// Custom user symbols storage utility
import { COMMON_FUTURES_CONTRACTS } from '@/types';

// Default preset symbols that should be in the system 
const PRESET_SYMBOLS = [
  // Common stocks with their types
  { symbol: 'AAPL', type: 'equity' as const },
  { symbol: 'MSFT', type: 'equity' as const },
  { symbol: 'GOOGL', type: 'equity' as const },
  { symbol: 'AMZN', type: 'equity' as const },
  { symbol: 'META', type: 'equity' as const },
  { symbol: 'TSLA', type: 'equity' as const },
  { symbol: 'NVDA', type: 'equity' as const },
  { symbol: 'AMD', type: 'equity' as const },
];

export interface SymbolDetails {
  symbol: string;
  type: 'equity' | 'futures' | 'option' | 'forex' | 'crypto';
  isPreset?: boolean;
}

/**
 * Gets the description/meaning of a symbol
 * @param symbol Symbol to get meaning for
 * @returns Description or name of the symbol
 */
export function getSymbolMeaning(symbol: string): string | null {
  // Check futures contracts first
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

/**
 * Retrieves custom symbols from localStorage
 * @returns Array of custom symbols
 */
export function getCustomSymbols(): SymbolDetails[] {
  try {
    const savedSymbols = localStorage.getItem('customSymbols');
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
    localStorage.setItem('customSymbols', JSON.stringify(newSymbols));
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
    localStorage.setItem('customSymbols', JSON.stringify(newSymbols));
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
  
  // If no change in the symbol, just update the type
  if (oldSymbol === newSymbolDetails.symbol) {
    const newSymbols = symbols.map(s => 
      s.symbol === oldSymbol ? { ...s, type: newSymbolDetails.type } : s
    );
    try {
      localStorage.setItem('customSymbols', JSON.stringify(newSymbols));
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
      localStorage.setItem('customSymbols', JSON.stringify(newSymbols));
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
    localStorage.setItem('customSymbols', JSON.stringify(newSymbols));
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
  
  // Filter out duplicates by creating a combined array with unique symbols
  return [
    ...presetSymbols, 
    ...customSymbols.filter(s => !presetSymbols.some(p => p.symbol === s.symbol))
  ];
}
