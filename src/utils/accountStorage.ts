
const ACCOUNTS_STORAGE_KEY = 'trading-journal-accounts';

/**
 * Get the list of accounts from storage
 * @returns Array of account names
 */
export function getAccounts(): string[] {
  try {
    const accountsData = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!accountsData) {
      return [];
    }
    
    const parsedData = JSON.parse(accountsData);
    if (!Array.isArray(parsedData)) {
      console.warn('Accounts data is not an array, resetting to empty array');
      return [];
    }
    
    // Make sure all items are strings
    return parsedData.filter(item => typeof item === 'string');
  } catch (error) {
    console.error('Error loading accounts from localStorage:', error);
    return [];
  }
}

/**
 * Save the list of accounts to storage
 * @param accounts Array of account names
 */
export function saveAccounts(accounts: string[]): void {
  try {
    // Ensure we're only saving valid data
    const validAccounts = Array.isArray(accounts) 
      ? accounts.filter(acc => typeof acc === 'string')
      : [];
      
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(validAccounts));
  } catch (error) {
    console.error('Error saving accounts to localStorage:', error);
  }
}
