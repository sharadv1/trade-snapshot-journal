
/**
 * Utility for debugging storage issues
 */

import { toast } from '@/utils/toast';

// Check if storage is available and has enough space
export const checkStorageAvailability = () => {
  try {
    // Check if localStorage is available
    if (typeof localStorage === 'undefined') {
      console.error('localStorage is not available in this environment');
      return false;
    }
    
    // Try to write a test item
    const testKey = 'storage-test';
    localStorage.setItem(testKey, 'test');
    
    // Check if we can read the test item
    const testValue = localStorage.getItem(testKey);
    if (testValue !== 'test') {
      console.error('Storage read/write test failed');
      return false;
    }
    
    // Clean up the test item
    localStorage.removeItem(testKey);
    
    // Storage is available
    return true;
  } catch (error) {
    console.error('Storage availability check failed:', error);
    return false;
  }
};

// Get storage usage information
export const getStorageInfo = () => {
  try {
    if (typeof localStorage === 'undefined') {
      return { available: false, used: 0, total: 0, items: 0 };
    }
    
    let totalSize = 0;
    let items = 0;
    
    // Calculate total size of all items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        totalSize += key.length + value.length;
        items++;
      }
    }
    
    // Convert to KB
    const usedKB = Math.round(totalSize / 1024);
    
    // Estimate total available (most browsers limit to ~5MB)
    const totalKB = 5 * 1024;
    
    return {
      available: true,
      used: usedKB,
      total: totalKB,
      items,
      percentUsed: Math.round((usedKB / totalKB) * 100)
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return { available: false, used: 0, total: 0, items: 0 };
  }
};

// Debug function to log the size of a specific item
export const logItemSize = (key: string) => {
  try {
    const value = localStorage.getItem(key);
    if (value === null) {
      console.log(`Item '${key}' not found in localStorage`);
      return;
    }
    
    const sizeInBytes = key.length + value.length;
    const sizeInKB = Math.round(sizeInBytes / 1024);
    
    console.log(`Storage item '${key}':`);
    console.log(`- Size: ${sizeInBytes} bytes (${sizeInKB} KB)`);
    console.log(`- Characters: ${value.length}`);
    
    // Try to parse as JSON to show structure
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        console.log(`- Type: Array with ${parsed.length} items`);
      } else if (typeof parsed === 'object') {
        console.log(`- Type: Object with ${Object.keys(parsed).length} keys`);
      }
    } catch {
      // Not valid JSON
      console.log('- Type: Not valid JSON (raw string)');
    }
    
    return { key, sizeInBytes, sizeInKB };
  } catch (error) {
    console.error(`Error checking size for '${key}':`, error);
    return null;
  }
};

// Show storage summary as a toast notification
export const showStorageSummary = () => {
  const info = getStorageInfo();
  
  if (!info.available) {
    toast.error('LocalStorage is not available');
    return;
  }
  
  toast.info(
    `Storage: ${info.used}KB used of ${info.total}KB (${info.percentUsed}%), ${info.items} items stored`,
    { duration: 5000 }
  );
  
  // Log more detailed info to console
  console.log('=============== STORAGE SUMMARY ===============');
  console.log(`Total used: ${info.used}KB of ${info.total}KB (${info.percentUsed}%)`);
  console.log(`Total items: ${info.items}`);
  
  // Log the size of each item
  console.log('=============== STORAGE ITEMS ===============');
  const itemDetails = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const details = logItemSize(key);
      if (details) {
        itemDetails.push(details);
      }
    }
  }
  
  // Sort items by size (largest first)
  itemDetails.sort((a, b) => b.sizeInBytes - a.sizeInBytes);
  
  console.log('=============== LARGEST ITEMS ===============');
  itemDetails.slice(0, 5).forEach((item, index) => {
    console.log(`${index + 1}. '${item.key}': ${item.sizeInKB}KB`);
  });
};
