
const ACCOUNTS_STORAGE_KEY = 'trading-journal-accounts';

export function getAccounts(): string[] {
  try {
    const accounts = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    return accounts ? JSON.parse(accounts) : [];
  } catch (error) {
    console.error('Error loading accounts from localStorage:', error);
    return [];
  }
}

export function saveAccounts(accounts: string[]): void {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (error) {
    console.error('Error saving accounts to localStorage:', error);
  }
}
