
import { Trade, TradeIdea, Strategy, WeeklyReflection, MonthlyReflection } from '@/types';
import { getTrades, saveTrades } from './storage/storageCore';
import { getIdeas, saveIdeas } from './ideaStorage';
import { getStrategies, saveStrategies } from './strategyStorage';
import { getAllSymbols, saveCustomSymbols } from './symbolStorage';
import { 
  getWeeklyReflections, 
  getMonthlyReflections,
  saveWeeklyReflectionObject,
  saveMonthlyReflectionObject
} from './journalStorage';
import { toast } from './toast';

// Variable to store the latest export summary
let lastExportSummary = {
  trades: [],
  ideas: [],
  strategies: [],
  symbols: [],
  weeklyReflections: [],
  monthlyReflections: []
};

// Function to get the last export summary
export const getLastExportSummary = () => {
  return lastExportSummary;
};

// Function to export trades, ideas, strategies, and symbols to a file
export const exportTradesToFile = async () => {
  try {
    const trades = await getTrades();
    const ideas = getIdeas();
    const strategies = getStrategies();
    const symbols = getAllSymbols();
    const weeklyReflectionsObj = getWeeklyReflections();
    const monthlyReflectionsObj = getMonthlyReflections();
    
    // Convert reflection objects to arrays for the export summary
    const weeklyReflectionsArray = Object.values(weeklyReflectionsObj);
    const monthlyReflectionsArray = Object.values(monthlyReflectionsObj);
    
    // Store the export summary
    lastExportSummary = {
      trades,
      ideas,
      strategies,
      symbols,
      weeklyReflections: weeklyReflectionsArray,
      monthlyReflections: monthlyReflectionsArray
    };

    // Create a data object with all elements
    const data = {
      trades,
      ideas,
      strategies,
      symbols,
      weeklyReflections: weeklyReflectionsObj,
      monthlyReflections: monthlyReflectionsObj,
      version: "1.1",
      exportDate: new Date().toISOString()
    };
    
    // Convert to JSON
    const jsonData = JSON.stringify(data, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `trade-journal-export-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Fire a custom event to notify that export is complete with summary data
    const exportCompleteEvent = new CustomEvent('export-complete', { 
      detail: { summaryData: lastExportSummary } 
    });
    document.dispatchEvent(exportCompleteEvent);
    
    toast.success('Export completed successfully');
  } catch (error) {
    console.error('Export error:', error);
    toast.error('Export failed');
  }
};

// Helper function to convert CSV to array of objects
const csvToObjects = (csv: string) => {
  const lines = csv.split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines
    
    const obj: Record<string, any> = {};
    const currentLine = lines[i].split(',').map(item => item.trim());
    
    for (let j = 0; j < headers.length; j++) {
      const value = currentLine[j];
      
      // Try to parse as number if applicable
      if (!isNaN(Number(value)) && value !== '') {
        obj[headers[j]] = Number(value);
      } else {
        obj[headers[j]] = value;
      }
    }
    
    // Ensure required fields exist
    obj.id = obj.id || crypto.randomUUID();
    obj.direction = obj.direction || 'long';
    obj.status = obj.status || 'closed';
    obj.type = obj.type || 'equity';
    obj.images = obj.images || [];
    obj.partialExits = obj.partialExits || [];
    obj.tags = obj.tags || [];
    
    result.push(obj);
  }
  
  return result;
};

// Function to create a downloadable CSV file from trades
export const exportTradesToCSV = async () => {
  try {
    const trades = await getTrades();
    
    if (trades.length === 0) {
      toast.error('No trades to export');
      return;
    }
    
    // Define the headers you want to include
    const headers = [
      'id', 'symbol', 'type', 'direction', 'entryDate', 'entryPrice', 
      'exitDate', 'exitPrice', 'quantity', 'fees', 'status', 'strategy',
      'stopLoss', 'takeProfit', 'notes'
    ];
    
    // Create CSV header row
    let csvContent = headers.join(',') + '\n';
    
    // Add each trade as a row
    trades.forEach(trade => {
      const row = headers.map(header => {
        // Handle special cases
        if (header === 'notes' && trade.notes) {
          // Escape any commas or quotes in the notes field
          return `"${trade.notes.replace(/"/g, '""')}"`;
        }
        
        // For regular fields, convert to string or use empty string
        return trade[header as keyof Trade]?.toString() || '';
      });
      
      csvContent += row.join(',') + '\n';
    });
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `trade-journal-export-${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('CSV export completed successfully');
  } catch (error) {
    console.error('CSV export error:', error);
    toast.error('CSV export failed');
  }
};

// Read the uploaded file as text
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

// Parse CSV file
const parseCsvFile = async (file: File): Promise<string> => {
  const text = await readFileAsText(file);
  if (file.name.endsWith('.json')) {
    return text;
  } else {
    // For CSV, we need to convert to JSON format
    try {
      const tradesArray = csvToObjects(text);
      return JSON.stringify(tradesArray);
    } catch (error) {
      console.error('Error converting CSV to JSON:', error);
      throw new Error('Invalid CSV format');
    }
  }
};

// Create a new variable to store the latest import summary
let lastImportSummary = {
  trades: [],
  ideas: [],
  strategies: [],
  symbols: [],
  weeklyReflections: [],
  monthlyReflections: []
};

// Function to get the last import summary
export const getLastImportSummary = () => {
  return lastImportSummary;
};

// Function to import data from a JSON string
const importData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);
    
    if (!data) {
      console.error('Invalid data format - parsed to null/undefined');
      return false;
    }
    
    // Reset the summary data
    lastImportSummary = {
      trades: [],
      ideas: [],
      strategies: [],
      symbols: [],
      weeklyReflections: [],
      monthlyReflections: []
    };
    
    // Structured export with all data types
    if (data.trades && data.version) {
      // Validate and import trades
      if (Array.isArray(data.trades)) {
        const validatedTrades = data.trades.map((trade: Trade) => ({
          ...trade,
          direction: trade.direction || 'long',
          type: trade.type || 'equity',
          status: trade.status || 'closed'
        }));
        saveTrades(validatedTrades);
        console.log(`Imported ${validatedTrades.length} trades`);
        lastImportSummary.trades = validatedTrades;
      } else {
        console.warn('Invalid trades data format in import');
      }
      
      // Validate and import ideas
      if (Array.isArray(data.ideas)) {
        const validatedIdeas = data.ideas.map((idea: TradeIdea) => ({
          ...idea,
          direction: idea.direction || 'long'
        }));
        saveIdeas(validatedIdeas);
        console.log(`Imported ${validatedIdeas.length} ideas`);
        lastImportSummary.ideas = validatedIdeas;
      } else {
        console.warn('Invalid ideas data format in import');
      }
      
      // Validate and import strategies
      if (Array.isArray(data.strategies)) {
        saveStrategies(data.strategies);
        console.log(`Imported ${data.strategies.length} strategies`);
        lastImportSummary.strategies = data.strategies;
      } else {
        console.warn('Invalid strategies data format in import');
      }
      
      // Validate and import symbols
      if (Array.isArray(data.symbols)) {
        saveCustomSymbols(data.symbols);
        console.log(`Imported ${data.symbols.length} symbols`);
        lastImportSummary.symbols = data.symbols;
      } else {
        console.warn('Invalid symbols data format in import');
      }
      
      // Import weekly journal reflections (new in v1.1)
      if (data.weeklyReflections) {
        const weeklyReflectionsArray = Object.values(data.weeklyReflections);
        weeklyReflectionsArray.forEach((reflection: any) => {
          saveWeeklyReflectionObject(reflection as WeeklyReflection);
        });
        console.log(`Imported ${weeklyReflectionsArray.length} weekly reflections`);
        lastImportSummary.weeklyReflections = weeklyReflectionsArray;
      }
      
      // Import monthly journal reflections (new in v1.1)
      if (data.monthlyReflections) {
        const monthlyReflectionsArray = Object.values(data.monthlyReflections);
        monthlyReflectionsArray.forEach((reflection: any) => {
          saveMonthlyReflectionObject(reflection as MonthlyReflection);
        });
        console.log(`Imported ${monthlyReflectionsArray.length} monthly reflections`);
        lastImportSummary.monthlyReflections = monthlyReflectionsArray;
      }
      
      return true;
    }
    
    // Direct array of trades (simpler format)
    if (Array.isArray(data)) {
      console.log('Importing direct array of trades:', data.length);
      const validatedTrades = data.map(trade => ({
        ...trade,
        direction: trade.direction || 'long',
        type: trade.type || 'equity',
        status: trade.status || 'closed'
      }));
      saveTrades(validatedTrades);
      lastImportSummary.trades = validatedTrades;
      return true;
    }
    
    console.error('Unrecognized data format');
    return false;
  } catch (error) {
    console.error('Error parsing import data:', error);
    return false;
  }
};

// Function to import trades from a file
export const importTradesFromFile = async (file: File): Promise<void> => {
  console.log('Importing file:', file.name);
  
  // Reset the summary data before each import
  lastImportSummary = {
    trades: [],
    ideas: [],
    strategies: [],
    symbols: [],
    weeklyReflections: [],
    monthlyReflections: []
  };
  
  try {
    // Parse the file content based on the file type
    if (file.name.endsWith('.csv')) {
      console.log('Parsing CSV file...');
      const tradesJson = await parseCsvFile(file);
      const tradesArray = JSON.parse(tradesJson);
      
      if (Array.isArray(tradesArray)) {
        console.log(`Parsed ${tradesArray.length} trades from CSV`);
        
        // Ensure all required fields exist to prevent rendering errors
        const validatedTrades = tradesArray.map(trade => ({
          ...trade,
          direction: trade.direction || 'long',
          type: trade.type || 'equity',
          status: trade.status || 'closed',
          entryDate: trade.entryDate || new Date().toISOString()
        }));
        
        await saveTrades(validatedTrades);
        console.log(`Imported ${validatedTrades.length} trades from CSV`);
        lastImportSummary.trades = validatedTrades;
        
        // Force refresh UI components
        window.dispatchEvent(new Event('storage'));
        toast.success(`Imported ${validatedTrades.length} trades from CSV`);
      } else {
        throw new Error('Invalid CSV format - could not parse to array');
      }
    } else if (file.name.endsWith('.json')) {
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
          lastImportSummary.trades = validatedTrades;
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
            window.dispatchEvent(new StorageEvent('storage', { key: 'trade-journal-reflections' }));
            window.dispatchEvent(new StorageEvent('storage', { key: 'trade-journal-monthly-reflections' }));
          } else {
            toast.error('Failed to import data');
          }
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
        toast.error('Invalid JSON format');
      }
    } else {
      toast.error('Unsupported file format. Please use CSV or JSON.');
    }
  } catch (error) {
    console.error('Error importing file:', error);
    toast.error('Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
  
  // Fire a custom event to notify that import is complete with summary data
  const importCompleteEvent = new CustomEvent('import-complete', { 
    detail: { summaryData: lastImportSummary } 
  });
  document.dispatchEvent(importCompleteEvent);
};
