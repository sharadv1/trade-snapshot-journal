import { Trade } from '@/types';
import { getTrades, saveTrades, getTradesSync } from './storage/storageCore';
import { getStrategies } from './strategyStorage';
import { getSymbols, saveSymbols } from './symbolStorage';

// Create a local interface for SymbolDetails to avoid type conflicts
interface SymbolDetails {
  id: string;
  symbol: string;
  name: string;
  type: "equity" | "futures" | "option";
  sector?: string;
  exchange?: string;
  contractSize?: number;
}

// Helper function to save strategies
export const saveStrategies = (strategies: any[]): void => {
  localStorage.setItem('tradeStrategies', JSON.stringify(strategies));
  window.dispatchEvent(new Event('storage'));
};

// Function to export trades to CSV
export const exportTradesToCSV = async (): Promise<string> => {
  const trades = await getTrades();
  const csvRows = [];

  // Headers
  csvRows.push([
    "id", "date", "symbol", "entryPrice", "exitPrice", "positionSize", "notes",
    "strategy", "outcome", "setup", "tags", "ideaId"
  ].join(','));

  for (const trade of trades) {
    const values = [
      trade.id,
      trade.date,
      trade.symbol,
      trade.entryPrice,
      trade.exitPrice,
      trade.positionSize,
      `"${(trade.notes || '').replace(/"/g, '""')}"`, // Escape double quotes
      trade.strategy,
      trade.outcome,
      trade.setup,
      trade.tags ? `"${trade.tags.join(';')}"` : "",
      trade.ideaId || ""
    ];
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  return 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvString);
};

// Function to import trades from CSV
export const importTradesFromCSV = async (csvData: string): Promise<void> => {
  const lines = csvData.split('\n');
  const headers = lines.shift()?.split(',') || [];
  const trades: Trade[] = [];

  for (const line of lines) {
    const values = line.split(',');
    if (values.length !== headers.length) continue; // Skip incomplete lines

    const trade: Partial<Trade> = {};
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      let value = values[i];

      // Remove quotes from the beginning and end of the value
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1).replace(/""/g, '"'); // Unescape double quotes
      }

      switch (header) {
        case 'entryPrice':
        case 'exitPrice':
        case 'positionSize':
          trade[header] = parseFloat(value);
          break;
        case 'tags':
          trade[header] = value ? value.split(';') : [];
          break;
        default:
          trade[header] = value;
      }
    }
    trades.push(trade as Trade);
  }
  await saveTrades(trades);
};

// Added aliases for backward compatibility
export const exportTradesToFile = exportTradesToCSV;
export const importTradesFromFile = importTradesFromCSV;

// Export data function
export const exportData = () => {
  const trades = getTradesSync();
  const strategies = getStrategies();
  const symbols = getSymbols();

  const exportData = {
    trades,
    strategies,
    symbols,
    version: 1
  };

  return JSON.stringify(exportData, null, 2);
};

// Import data function
export const importData = (jsonData: string) => {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.trades) {
      saveTrades(data.trades);
    }
    
    if (data.strategies) {
      saveStrategies(data.strategies);
    }
    
    if (data.symbols) {
      saveSymbols(data.symbols as SymbolDetails[]);
    }
    
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};
