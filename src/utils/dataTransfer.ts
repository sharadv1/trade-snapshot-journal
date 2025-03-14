
import { getTrades, saveTrades, getTradesSync } from './tradeStorage';
import { Trade } from '@/types';
import { toast } from './toast';

/**
 * Exports all trades as a JSON file that downloads to the user's device
 */
export const exportTradesToFile = (): void => {
  try {
    const trades = getTradesSync();
    
    if (trades.length === 0) {
      toast.warning('No trades to export');
      return;
    }
    
    // Create a JSON blob with the trades data
    const tradesJson = JSON.stringify(trades, null, 2);
    const blob = new Blob([tradesJson], { type: 'application/json' });
    
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
    
    toast.success(`${trades.length} trades exported successfully`);
  } catch (error) {
    console.error('Error exporting trades:', error);
    toast.error('Failed to export trades');
  }
};

/**
 * Imports trades from a JSON file with deduplication
 * @param file The JSON file containing the trades data
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
        
        const importedTrades = JSON.parse(event.target.result) as Trade[];
        
        // Validate the imported data
        if (!Array.isArray(importedTrades)) {
          throw new Error('Invalid file format - expected an array of trades');
        }
        
        // Basic validation of required trade properties
        importedTrades.forEach(trade => {
          if (!trade.id || !trade.symbol) {
            throw new Error('Invalid trade data - missing required properties');
          }
        });
        
        // Get existing trades for deduplication
        const existingTrades = getTradesSync();
        
        // Perform deduplication
        const { newTrades, duplicates } = deduplicateTrades(existingTrades, importedTrades);
        
        if (newTrades.length === 0) {
          toast.info('All imported trades already exist in your journal');
          resolve();
          return;
        }
        
        // Merge existing and new trades
        const mergedTrades = [...existingTrades, ...newTrades];
        
        // Save the merged trades
        await saveTrades(mergedTrades);
        
        // Show success message with counts
        if (duplicates > 0) {
          toast.success(`Imported ${newTrades.length} new trades (${duplicates} duplicates skipped)`);
        } else {
          toast.success(`${newTrades.length} trades imported successfully`);
        }
        
        resolve();
      } catch (error) {
        console.error('Error importing trades:', error);
        toast.error('Failed to import trades: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
 * Deduplicates trades by comparing IDs and trade details
 * @param existingTrades Array of existing trades
 * @param importedTrades Array of imported trades
 * @returns Object containing new trades and count of duplicates
 */
function deduplicateTrades(existingTrades: Trade[], importedTrades: Trade[]): { 
  newTrades: Trade[], 
  duplicates: number 
} {
  const existingIds = new Set(existingTrades.map(trade => trade.id));
  let duplicates = 0;
  
  const newTrades = importedTrades.filter(importedTrade => {
    // Check if the ID already exists
    if (existingIds.has(importedTrade.id)) {
      duplicates++;
      return false;
    }
    
    // Could add additional deduplication logic here if needed
    // For example, comparing trades with same symbol, entry date, etc.
    
    return true;
  });
  
  return { newTrades, duplicates };
}
