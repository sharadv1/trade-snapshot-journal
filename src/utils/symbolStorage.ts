
// Custom user symbols storage utility
import { COMMON_FUTURES_CONTRACTS } from '@/types';

// Default preset symbols that should be in the system 
const PRESET_SYMBOLS = [
  // Common stocks with their types
  { symbol: 'AAPL', type: 'equity' },
  { symbol: 'MSFT', type: 'equity' },
  { symbol: 'GOOGL', type: 'equity' },
  { symbol: 'AMZN', type: 'equity' },
  { symbol: 'META', type: 'equity' },
  { symbol: 'TSLA', type: 'equity' },
  { symbol: 'NVDA', type: 'equity' },
  { symbol: 'AMD', type: 'equity' },
];

export interface SymbolDetails {
  symbol: string;
  type: 'equity' | 'futures' | 'option' | 'forex' | 'crypto';
  isPreset?: boolean;
}

// Get all preset symbols (including futures)
export function getPresetSymbols(): SymbolDetails[] {
  // Get futures symbols from the common contracts
  const futuresSymbols = COMMON_FUTURES_CONTRACTS.map(contract => ({
    symbol: contract.symbol,
    type: 'futures',
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
