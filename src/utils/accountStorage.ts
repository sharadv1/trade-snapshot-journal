
const ACCOUNTS_STORAGE_KEY = 'trading-journal-accounts';

export function getAccounts(): string[] {
  try {
    const storedData = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!storedData) return [];
    
    const parsedData = JSON.parse(storedData);
    
    // Ensure we always return an array of strings
    if (Array.isArray(parsedData)) {
      // Filter out any non-string values
      return parsedData.filter(item => typeof item === 'string');
    }
    
    return [];
  } catch (error) {
    console.error('Error retrieving accounts from localStorage:', error);
    return [];
  }
}

export function saveAccounts(accounts: string[]): void {
  try {
    // Ensure we only save valid string arrays
    if (!Array.isArray(accounts)) {
      throw new Error('Accounts must be an array');
    }
    
    // Filter out any non-string values
    const validAccounts = accounts.filter(account => typeof account === 'string');
    
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(validAccounts));
  } catch (error) {
    console.error('Error saving accounts to localStorage:', error);
  }
}
