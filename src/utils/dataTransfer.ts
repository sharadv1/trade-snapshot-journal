
import { Trade } from '@/types';
import { getTrades, saveTrades, getTradesSync } from './storage/storageCore';
import { getStrategies, saveStrategies } from './strategyStorage';
import { getAllSymbols, saveCustomSymbols } from './symbolStorage';
import { getIdeas, saveIdeas } from './ideaStorage';
import { toast } from './toast';

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

// Function to export trades to CSV
export const exportTradesToCSV = async (): Promise<string> => {
  const trades = await getTrades();
  const csvRows = [];

  // Headers
  csvRows.push([
    "id", "symbol", "entryPrice", "exitPrice", "quantity", "notes",
    "strategy", "grade", "tags", "ideaId", "direction"  // Added direction to ensure it's exported
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
      trade.ideaId || "",
      trade.direction || "long"  // Include direction with fallback
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

  console.log('Importing CSV: headers', headers);

  for (const line of lines) {
    if (!line.trim()) continue; // Skip empty lines
    
    const values = line.split(',');
    if (values.length < headers.length - 2) {
      console.warn('Skipping incomplete line:', line);
      continue; // Skip lines with too few values
    }

    const trade: Partial<Trade> = {
      // Set required fields with defaults
      direction: 'long', // Default direction
      type: 'equity',    // Default type
      status: 'closed',  // Default status
    };
    
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      let value = values[i] || '';

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
        case 'direction':
          trade[header] = (value === 'short') ? 'short' : 'long'; // Ensure valid direction
          break;
        default:
          if (value) trade[header] = value;
      }
    }

    // Set entryDate if missing (required field)
    if (!trade.entryDate) {
      trade.entryDate = new Date().toISOString();
    }

    // Add only if we have the minimum required fields
    if (trade.symbol && trade.entryPrice !== undefined && trade.quantity !== undefined) {
      trades.push(trade as Trade);
    } else {
      console.warn('Skipping incomplete trade:', trade);
    }
  }

  console.log(`Importing ${trades.length} trades from CSV`);
  if (trades.length > 0) {
    await saveTrades(trades);
    toast.success(`Imported ${trades.length} trades successfully`);
    // Dispatch storage event to refresh components
    window.dispatchEvent(new Event('storage'));
  } else {
    toast.error('No valid trades found in CSV');
  }
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
    // Export to JSON instead of CSV for better data retention
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `trade-journal-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Data exported successfully');
  } catch (error) {
    console.error('Error exporting data:', error);
    toast.error('Error exporting data');
  }
};

export const importTradesFromFile = async (file: File): Promise<void> => {
  try {
    console.log('Importing file:', file.name, file.type);
    
    if (file.name.endsWith('.json')) {
      // Handle JSON import
      const textContent = await parseCsvFile(file);
      try {
        console.log('Parsing JSON file...');
        // First check if it's an array (direct trades import) or an object with structure
        let parsedData;
        try {
          parsedData = JSON.parse(textContent);
        } catch (e) {
          toast.error('Invalid JSON format');
          return;
        }
        
        // Handle both array of trades directly or structured data
        if (Array.isArray(parsedData)) {
          console.log('Found array of trades:', parsedData.length);
          const validatedTrades = parsedData.map(trade => ({
            ...trade,
            direction: trade.direction || 'long',
            type: trade.type || 'equity',
            status: trade.status || 'closed',
            entryDate: trade.entryDate || new Date().toISOString()
          }));
          
          await saveTrades(validatedTrades);
          toast.success(`Imported ${validatedTrades.length} trades successfully`);
          // Force refresh UI components
          window.dispatchEvent(new Event('storage'));
        } else {
          // Try structured data format
          const success = importData(textContent);
          if (success) {
            toast.success('Data imported successfully');
            // Dispatch events to update all components
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('ideas-updated'));
            window.dispatchEvent(new Event('symbols-updated'));
            window.dispatchEvent(new Event('strategies-updated'));
          } else {
            toast.error('Failed to import data');
          }
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
        toast.error('Invalid JSON file');
      }
    } else if (file.name.endsWith('.csv')) {
      // Handle CSV import (backward compatibility)
      const csvContent = await parseCsvFile(file);
      await importTradesFromCSV(csvContent);
    } else {
      toast.error('Unsupported file format. Please use .json or .csv');
    }
  } catch (error) {
    console.error('Error importing file:', error);
    toast.error('Error importing file');
  }
};

// Export data function
export const exportData = () => {
  const trades = getTradesSync();
  const strategies = getStrategies();
  const symbols = getAllSymbols();
  const ideas = getIdeas();

  const exportData = {
    trades,
    strategies,
    symbols,
    ideas,
    version: 1
  };

  return JSON.stringify(exportData, null, 2);
};

// Import data function
export const importData = (jsonData: string) => {
  try {
    console.log('Parsing import data...');
    const data = JSON.parse(jsonData);
    console.log('Data parsed successfully');
    
    // Add defensive checks for each data type
    if (data.trades && Array.isArray(data.trades)) {
      console.log(`Importing ${data.trades.length} trades`);
      
      // Ensure all required fields are set with defaults
      const validatedTrades = data.trades.map(trade => ({
        ...trade,
        direction: trade.direction || 'long',
        type: trade.type || 'equity',
        status: trade.status || 'closed',
        entryDate: trade.entryDate || new Date().toISOString()
      }));
      
      saveTrades(validatedTrades);
      console.log(`Saved ${validatedTrades.length} trades`);
    }
    
    if (data.strategies && Array.isArray(data.strategies)) {
      console.log(`Importing ${data.strategies.length} strategies`);
      saveStrategies(data.strategies);
    }
    
    if (data.symbols && Array.isArray(data.symbols)) {
      console.log(`Importing ${data.symbols.length} symbols`);
      saveCustomSymbols(data.symbols as SymbolDetails[]);
    }
    
    if (data.ideas && Array.isArray(data.ideas)) {
      console.log(`Importing ${data.ideas.length} ideas`);
      // Ensure all ideas have a direction
      const validatedIdeas = data.ideas.map(idea => ({
        ...idea,
        direction: idea.direction || 'long'
      }));
      saveIdeas(validatedIdeas);
    }
    
    console.log('Import completed successfully');
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    toast.error('Error importing data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    return false;
  }
};
