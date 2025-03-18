
// Custom user symbols storage utility

/**
 * Retrieves custom symbols from localStorage
 * @returns Array of custom symbols
 */
export function getCustomSymbols(): string[] {
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
 * @param symbol Symbol to add
 * @returns Updated array of custom symbols
 */
export function addCustomSymbol(symbol: string): string[] {
  if (!symbol) return getCustomSymbols();
  
  const symbols = getCustomSymbols();
  if (symbols.includes(symbol)) return symbols;
  
  const newSymbols = [...symbols, symbol];
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
export function removeCustomSymbol(symbol: string): string[] {
  const symbols = getCustomSymbols();
  const newSymbols = symbols.filter(s => s !== symbol);
  
  try {
    localStorage.setItem('customSymbols', JSON.stringify(newSymbols));
    return newSymbols;
  } catch (error) {
    console.error('Error saving symbols to localStorage:', error);
    return symbols;
  }
}

/**
 * Updates a custom symbol in localStorage
 * @param oldSymbol Symbol to update
 * @param newSymbol New symbol value
 * @returns Updated array of custom symbols
 */
export function updateCustomSymbol(oldSymbol: string, newSymbol: string): string[] {
  if (!oldSymbol || !newSymbol) return getCustomSymbols();
  
  const symbols = getCustomSymbols();
  if (oldSymbol === newSymbol) return symbols;
  
  // Check if new symbol already exists
  if (symbols.includes(newSymbol)) {
    // Remove old symbol only
    const newSymbols = symbols.filter(s => s !== oldSymbol);
    try {
      localStorage.setItem('customSymbols', JSON.stringify(newSymbols));
      return newSymbols;
    } catch (error) {
      console.error('Error saving symbols to localStorage:', error);
      return symbols;
    }
  }
  
  // Replace old symbol with new one
  const newSymbols = symbols.map(s => s === oldSymbol ? newSymbol : s);
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
 * @param presetSymbols Array of preset symbols
 * @returns Combined array of preset and custom symbols
 */
export function getAllSymbols(presetSymbols: string[]): string[] {
  const customSymbols = getCustomSymbols();
  return [...presetSymbols, ...customSymbols.filter(s => !presetSymbols.includes(s))];
}
