
import { getTrades, saveTrades } from './tradeStorage';
import { Trade } from '@/types';
import { toast } from './toast';

/**
 * Exports all trades as a JSON file that downloads to the user's device
 */
export const exportTradesToFile = (): void => {
  try {
    const trades = getTrades();
    
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
 * Imports trades from a JSON file
 * @param file The JSON file containing the trades data
 * @returns A promise that resolves when the import is complete
 */
export const importTradesFromFile = (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
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
        
        // Save the imported trades
        saveTrades(importedTrades);
        toast.success(`${importedTrades.length} trades imported successfully`);
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
