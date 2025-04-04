
const ACCOUNTS_STORAGE_KEY = 'trading-journal-accounts';

/**
 * Get the list of accounts from storage
 * @returns Array of account names
 */
export function getAccounts(): string[] {
  try {
    const accounts = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (accounts) {
      const parsedAccounts = JSON.parse(accounts);
      return Array.isArray(parsedAccounts) ? parsedAccounts : [];
    }
    return [];
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
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (error) {
    console.error('Error saving accounts to localStorage:', error);
  }
}
