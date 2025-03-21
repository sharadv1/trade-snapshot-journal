import { getTrades, saveTrades, getTradesSync } from '@/utils/tradeStorage';
import { getIdeas, saveIdeas } from './ideaStorage';
import { getStrategies } from './strategyStorage';
import { getAllSymbols, saveCustomSymbols } from './symbolStorage';
import { Trade, TradeIdea, Strategy } from '@/types';
import { toast } from './toast';

interface SymbolDetails {
  symbol: string;
  name: string;
  exchange?: string;
  isPreset?: boolean;
  type?: string;
}

interface ExportData {
  trades: Trade[];
  ideas: TradeIdea[];
  strategies: Strategy[];
  symbols: SymbolDetails[];
  version: string;
}

/**
 * Exports all data (trades, ideas, strategies, symbols) as a JSON file that downloads to the user's device
 */
export const exportTradesToFile = (): void => {
  try {
    const trades = getTradesSync();
    const ideas = getIdeas();
    const strategies = getStrategies();
    const symbols = getAllSymbols().filter(s => !s.isPreset); // Only export custom symbols
    
    if (trades.length === 0 && ideas.length === 0 && 
        strategies.length === 0 && symbols.length === 0) {
      toast.warning('No data to export');
      return;
    }
    
    // Create an export data object that includes all data types
    const exportData: ExportData = {
      trades,
      ideas,
      strategies,
      symbols,
      version: '1.0'  // Export format version for future compatibility
    };
    
    // Create a JSON blob with the export data
    const dataJson = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataJson], { type: 'application/json' });
    
    // Create a download link and trigger a download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    
    link.href = url;
    link.download = `trade-journal-backup-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    const itemCounts = [
      trades.length > 0 ? `${trades.length} trades` : null,
      ideas.length > 0 ? `${ideas.length} ideas` : null,
      strategies.length > 0 ? `${strategies.length} strategies` : null,
      symbols.length > 0 ? `${symbols.length} custom symbols` : null
    ].filter(Boolean).join(', ');
    
    toast.success(`Exported ${itemCounts} successfully`);
  } catch (error) {
    console.error('Error exporting data:', error);
    toast.error('Failed to export data');
  }
};

/**
 * Imports data from a JSON file with deduplication
 * @param file The JSON file containing the export data
 * @returns A promise that resolves when the import is complete
 */
export const importTradesFromFile = (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        if (!event.target || typeof event.target.result !== 'string') {
          throw new Error('Failed to read file');
        }
        
        // Try to parse as new format first
        let importedData: ExportData;
        try {
          importedData = JSON.parse(event.target.result) as ExportData;
        } catch (parseError) {
          // Legacy format might just be an array of trades
          const legacyTrades = JSON.parse(event.target.result) as Trade[];
          if (Array.isArray(legacyTrades)) {
            importedData = {
              trades: legacyTrades,
              ideas: [],
              strategies: [],
              symbols: [],
              version: 'legacy'
            };
          } else {
            throw new Error('Invalid file format');
          }
        }
        
        // Statistics for user feedback
        const stats = {
          trades: { imported: 0, duplicates: 0 },
          ideas: { imported: 0, duplicates: 0 },
          strategies: { imported: 0, duplicates: 0 },
          symbols: { imported: 0, duplicates: 0 }
        };
        
        // Import trades with deduplication
        if (Array.isArray(importedData.trades)) {
          const existingTrades = getTradesSync();
          const { newItems: newTrades, duplicates: tradeDuplicates } = 
            deduplicateItems(existingTrades, importedData.trades, 'id');
          
          if (newTrades.length > 0) {
            await saveTrades([...existingTrades, ...newTrades]);
            stats.trades.imported = newTrades.length;
          }
          stats.trades.duplicates = tradeDuplicates;
        }
        
        // Import ideas with deduplication
        if (Array.isArray(importedData.ideas)) {
          const existingIdeas = getIdeas();
          const { newItems: newIdeas, duplicates: ideaDuplicates } = 
            deduplicateItems(existingIdeas, importedData.ideas, 'id');
          
          if (newIdeas.length > 0) {
            saveIdeas([...existingIdeas, ...newIdeas]);
            stats.ideas.imported = newIdeas.length;
          }
          stats.ideas.duplicates = ideaDuplicates;
        }
        
        // Import strategies with deduplication
        if (Array.isArray(importedData.strategies)) {
          const existingStrategies = getStrategies();
          const { newItems: newStrategies, duplicates: strategyDuplicates } = 
            deduplicateItems(existingStrategies, importedData.strategies, 'id');
          
          if (newStrategies.length > 0) {
            saveStrategies([...existingStrategies, ...newStrategies]);
            stats.strategies.imported = newStrategies.length;
          }
          stats.strategies.duplicates = strategyDuplicates;
        }
        
        // Import custom symbols with deduplication
        if (Array.isArray(importedData.symbols)) {
          const existingSymbols = getAllSymbols().filter(s => !s.isPreset);
          const { newItems: newSymbols, duplicates: symbolDuplicates } = 
            deduplicateItems(existingSymbols, importedData.symbols, 'symbol');
          
          if (newSymbols.length > 0) {
            saveCustomSymbols([...existingSymbols, ...newSymbols]);
            stats.symbols.imported = newSymbols.length;
          }
          stats.symbols.duplicates = symbolDuplicates;
        }
        
        // Show success message with counts
        const successParts = [];
        
        if (stats.trades.imported > 0) {
          successParts.push(`${stats.trades.imported} trades`);
        }
        if (stats.ideas.imported > 0) {
          successParts.push(`${stats.ideas.imported} ideas`);
        }
        if (stats.strategies.imported > 0) {
          successParts.push(`${stats.strategies.imported} strategies`);
        }
        if (stats.symbols.imported > 0) {
          successParts.push(`${stats.symbols.imported} symbols`);
        }
        
        const totalImported = stats.trades.imported + stats.ideas.imported + 
                              stats.strategies.imported + stats.symbols.imported;
        const totalDuplicates = stats.trades.duplicates + stats.ideas.duplicates + 
                                stats.strategies.duplicates + stats.symbols.duplicates;
        
        if (totalImported === 0) {
          if (totalDuplicates > 0) {
            toast.info(`All ${totalDuplicates} items already exist in your journal`);
          } else {
            toast.warning('No data was imported (empty file or format error)');
          }
        } else {
          if (totalDuplicates > 0) {
            toast.success(`Imported ${successParts.join(', ')} (${totalDuplicates} duplicates skipped)`);
          } else {
            toast.success(`Imported ${successParts.join(', ')}`);
          }
        }
        
        resolve();
      } catch (error) {
        console.error('Error importing data:', error);
        toast.error('Failed to import data: ' + (error instanceof Error ? error.message : 'Unknown error'));
        reject(error);
      }
    };
    
    reader.onerror = () => {
      toast.error('Error reading file');
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Generic function to deduplicate items by ID
 * @param existingItems Array of existing items
 * @param importedItems Array of imported items
 * @param idField Field to use for identification (default: 'id')
 * @returns Object containing new items and count of duplicates
 */
function deduplicateItems<T>(
  existingItems: T[], 
  importedItems: T[], 
  idField: keyof T = 'id' as keyof T
): { 
  newItems: T[], 
  duplicates: number 
} {
  const existingIds = new Set(existingItems.map(item => item[idField]));
  let duplicates = 0;
  
  const newItems = importedItems.filter(importedItem => {
    // Check if the ID already exists
    if (existingIds.has(importedItem[idField])) {
      duplicates++;
      return false;
    }
    
    return true;
  });
  
  return { newItems, duplicates };
}

const saveStrategies = (strategies: Strategy[]): void => {
  try {
    localStorage.setItem('trading-journal-strategies', JSON.stringify(strategies));
    // Dispatch a storage event to notify other tabs
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error('Error saving strategies:', error);
    toast.error('Failed to save strategies');
  }
};
