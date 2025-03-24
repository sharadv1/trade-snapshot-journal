
import { Trade } from '@/types';
import { getTrades, saveTrades, getTradesSync } from './storage/storageCore';
import { getStrategies } from './strategyStorage';
import { getAllSymbols, saveCustomSymbols } from './symbolStorage';

// Create a local interface for SymbolDetails to avoid type conflicts
interface SymbolDetails {
  id?: string;
  symbol: string;
  name?: string;
  type: "equity" | "futures" | "option" | "forex" | "crypto";
  sector?: string;
  exchange?: string;
  contractSize?: number;
  meaning?: string;
  isPreset?: boolean;
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
    "id", "symbol", "entryPrice", "exitPrice", "quantity", "notes",
    "strategy", "grade", "tags", "ideaId"
  ].join(','));

  for (const trade of trades) {
    const values = [
      trade.id,
      trade.symbol,
      trade.entryPrice,
      trade.exitPrice,
      trade.quantity,
      `"${(trade.notes || '').replace(/"/g, '""')}"`, // Escape double quotes
      trade.strategy,
      trade.grade || "",
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
        case 'quantity':
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

// Parse CSV file content to string
export const parseCsvFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

// Updated functions to handle CSV files
export const exportTradesToFile = async (): Promise<void> => {
  try {
    const csvUrl = await exportTradesToCSV();
    const link = document.createElement('a');
    link.href = csvUrl;
    link.download = `trade-journal-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting trades:', error);
  }
};

export const importTradesFromFile = async (file: File): Promise<void> => {
  try {
    const csvContent = await parseCsvFile(file);
    await importTradesFromCSV(csvContent);
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error('Error importing trades:', error);
  }
};

// Export data function
export const exportData = () => {
  const trades = getTradesSync();
  const strategies = getStrategies();
  const symbols = getAllSymbols();

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
      saveCustomSymbols(data.symbols as SymbolDetails[]);
    }
    
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};
