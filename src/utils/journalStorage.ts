import { WeeklyReflection, MonthlyReflection } from '@/types';
import { toast } from '@/utils/toast';

const WEEKLY_REFLECTIONS_KEY = 'trade-journal-weekly-reflections';
const MONTHLY_REFLECTIONS_KEY = 'trade-journal-monthly-reflections';

const safeParse = <T>(value: string | null, defaultValue: T): T => {
  if (!value) return defaultValue;
  
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed !== 'object' || parsed === null) {
      console.error('Invalid data format in localStorage, expected object but got:', typeof parsed);
      return defaultValue;
    }
    return parsed as T;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return defaultValue;
  }
};

const debugStorage = (action: string, key: string, data?: any) => {
  console.log(`[JOURNAL STORAGE] ${action} for key "${key}"`);
  if (data) {
    console.log('Data:', typeof data === 'string' ? data.substring(0, 100) + '...' : data);
  }
  
  const allKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) allKeys.push(k);
  }
  console.log('All localStorage keys:', allKeys);
};

export const getWeeklyReflections = (): { [weekId: string]: WeeklyReflection } => {
  debugStorage('Retrieving weekly reflections', WEEKLY_REFLECTIONS_KEY);
  const storedReflections = localStorage.getItem(WEEKLY_REFLECTIONS_KEY);
  return safeParse(storedReflections, {});
};

export const getWeeklyReflectionById = (weekId: string): WeeklyReflection | undefined => {
  if (!weekId) {
    console.error('Cannot get weekly reflection: weekId is empty');
    return undefined;
  }
  
  debugStorage('Getting weekly reflection by ID', weekId);
  return getWeeklyReflection(weekId);
};

export const getMonthlyReflections = (): { [monthId: string]: MonthlyReflection } => {
  debugStorage('Retrieving monthly reflections', MONTHLY_REFLECTIONS_KEY);
  const storedReflections = localStorage.getItem(MONTHLY_REFLECTIONS_KEY);
  return safeParse(storedReflections, {});
};

export const getWeeklyReflection = (weekId: string): WeeklyReflection | undefined => {
  if (!weekId) {
    console.error('Cannot get weekly reflection: weekId is empty');
    return undefined;
  }
  
  debugStorage('Getting weekly reflection', weekId);
  const reflections = getWeeklyReflections();
  return reflections[weekId];
};

export const getMonthlyReflection = (monthId: string): MonthlyReflection | undefined => {
  if (!monthId) {
    console.error('Cannot get monthly reflection: monthId is empty');
    return undefined;
  }
  
  debugStorage('Getting monthly reflection', monthId);
  const reflections = getMonthlyReflections();
  return reflections[monthId];
};

export const weeklyReflectionExists = (weekId: string): boolean => {
  if (!weekId) return false;
  const reflections = getWeeklyReflections();
  return !!reflections[weekId];
};

export const monthlyReflectionExists = (monthId: string): boolean => {
  if (!monthId) return false;
  const reflections = getMonthlyReflections();
  return !!reflections[monthId];
};

export const removeDuplicateReflections = (): { weeklyRemoved: number, monthlyRemoved: number } => {
  console.log('=== REMOVING DUPLICATE REFLECTIONS ===');
  let weeklyRemoved = 0;
  let monthlyRemoved = 0;
  
  // === WEEKLY REFLECTIONS ===
  try {
    console.log('Processing weekly reflections...');
    const weeklyReflectionsRaw = localStorage.getItem(WEEKLY_REFLECTIONS_KEY);
    if (!weeklyReflectionsRaw) {
      console.log('No weekly reflections found in localStorage');
      return { weeklyRemoved, monthlyRemoved };
    }
    
    let allWeeklyReflections: Record<string, any>;
    try {
      allWeeklyReflections = JSON.parse(weeklyReflectionsRaw);
      const allKeys = Object.keys(allWeeklyReflections);
      console.log(`Parsed ${allKeys.length} weekly reflections with keys: ${allKeys.join(', ')}`);
    } catch (e) {
      console.error('Failed to parse weekly reflections JSON:', e);
      return { weeklyRemoved, monthlyRemoved };
    }
    
    if (typeof allWeeklyReflections !== 'object' || allWeeklyReflections === null) {
      console.error('Weekly reflections is not an object:', allWeeklyReflections);
      return { weeklyRemoved, monthlyRemoved };
    }
    
    // Create a map to store unique reflections by weekId
    const uniqueWeeklyReflections = new Map<string, WeeklyReflection>();
    // Create a set to track duplicate keys
    const duplicateKeys = new Set<string>();
    
    // First pass: Identify all unique weekIds and potential duplicates
    Object.entries(allWeeklyReflections).forEach(([key, value]) => {
      if (!value || typeof value !== 'object') {
        console.log(`Skipping invalid entry with key ${key}:`, value);
        return;
      }
      
      // Check if we have a valid weekId property (primary identifier for duplicates)
      const weekId = value.weekId || value.id;
      if (!weekId) {
        console.log(`Entry with key ${key} has no weekId or id:`, value);
        return;
      }
      
      // Check if we've already seen this weekId
      if (uniqueWeeklyReflections.has(weekId)) {
        console.log(`DUPLICATE DETECTED: WeekId ${weekId} appears multiple times`);
        duplicateKeys.add(key);
      } else {
        uniqueWeeklyReflections.set(weekId, value);
      }
    });
    
    console.log(`Found ${duplicateKeys.size} duplicate weekly reflection keys`);
    
    if (duplicateKeys.size > 0) {
      // If we found duplicates, create a new object with only unique entries
      const cleanedReflections: Record<string, WeeklyReflection> = {};
      
      Object.entries(allWeeklyReflections).forEach(([key, value]) => {
        if (!duplicateKeys.has(key)) {
          cleanedReflections[key] = value;
        } else {
          console.log(`Removing duplicate entry with key ${key}`);
        }
      });
      
      weeklyRemoved = duplicateKeys.size;
      console.log(`Removing ${weeklyRemoved} duplicate weekly reflections`);
      localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(cleanedReflections));
      
      // Additional phase - check for multiple entries with the same weekId but different keys
      const uniqueByWeekId = new Map<string, WeeklyReflection>();
      const duplicateWeekIds = new Set<string>();
      
      Object.values(cleanedReflections).forEach((value) => {
        const weekId = value.weekId;
        if (!weekId) return;
        
        if (uniqueByWeekId.has(weekId)) {
          duplicateWeekIds.add(weekId);
        } else {
          uniqueByWeekId.set(weekId, value);
        }
      });
      
      console.log(`Found ${duplicateWeekIds.size} weekIds with multiple entries after first cleanup`);
      
      if (duplicateWeekIds.size > 0) {
        // If we found weekIds with multiple entries, keep only the most recently updated one
        const finalCleanedReflections: Record<string, WeeklyReflection> = {};
        const processedWeekIds = new Set<string>();
        
        // Sort entries by weekId and lastUpdated (newest first)
        const sortedEntries = Object.entries(cleanedReflections).sort(([, valueA], [, valueB]) => {
          // First sort by weekId
          const weekIdA = valueA.weekId || '';
          const weekIdB = valueB.weekId || '';
          const weekIdCompare = weekIdA.localeCompare(weekIdB);
          
          if (weekIdCompare !== 0) return weekIdCompare;
          
          // If same weekId, sort by lastUpdated (newest first)
          const dateA = valueA.lastUpdated ? new Date(valueA.lastUpdated).getTime() : 0;
          const dateB = valueB.lastUpdated ? new Date(valueB.lastUpdated).getTime() : 0;
          return dateB - dateA;
        });
        
        sortedEntries.forEach(([key, value]) => {
          const weekId = value.weekId;
          if (!weekId) {
            finalCleanedReflections[key] = value;
            return;
          }
          
          // Only add the first (most recent) entry for each weekId
          if (!processedWeekIds.has(weekId)) {
            finalCleanedReflections[key] = value;
            processedWeekIds.add(weekId);
            console.log(`Keeping entry for weekId ${weekId} with key ${key}`);
          } else {
            console.log(`Discarding duplicate entry for weekId ${weekId} with key ${key}`);
            weeklyRemoved++;
          }
        });
        
        localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(finalCleanedReflections));
      }
      
      dispatchStorageEvent(WEEKLY_REFLECTIONS_KEY);
    } else {
      console.log('No duplicate weekly reflections found');
    }
  } catch (error) {
    console.error('Error processing weekly reflections:', error);
  }
  
  // === MONTHLY REFLECTIONS ===
  try {
    console.log('Processing monthly reflections...');
    const monthlyReflectionsRaw = localStorage.getItem(MONTHLY_REFLECTIONS_KEY);
    if (!monthlyReflectionsRaw) {
      console.log('No monthly reflections found in localStorage');
      return { weeklyRemoved, monthlyRemoved };
    }
    
    let allMonthlyReflections: Record<string, any>;
    try {
      allMonthlyReflections = JSON.parse(monthlyReflectionsRaw);
      const allKeys = Object.keys(allMonthlyReflections);
      console.log(`Parsed ${allKeys.length} monthly reflections with keys: ${allKeys.join(', ')}`);
    } catch (e) {
      console.error('Failed to parse monthly reflections JSON:', e);
      return { weeklyRemoved, monthlyRemoved };
    }
    
    if (typeof allMonthlyReflections !== 'object' || allMonthlyReflections === null) {
      console.error('Monthly reflections is not an object:', allMonthlyReflections);
      return { weeklyRemoved, monthlyRemoved };
    }
    
    // Create a map to store unique reflections by monthId
    const uniqueMonthlyReflections = new Map<string, MonthlyReflection>();
    // Create a set to track duplicate keys
    const duplicateKeys = new Set<string>();
    
    // First pass: Identify all unique monthIds and potential duplicates
    Object.entries(allMonthlyReflections).forEach(([key, value]) => {
      if (!value || typeof value !== 'object') {
        console.log(`Skipping invalid entry with key ${key}:`, value);
        return;
      }
      
      // Check if we have a valid monthId property (primary identifier for duplicates)
      const monthId = value.monthId || value.id;
      if (!monthId) {
        console.log(`Entry with key ${key} has no monthId or id:`, value);
        return;
      }
      
      // Check if we've already seen this monthId
      if (uniqueMonthlyReflections.has(monthId)) {
        console.log(`DUPLICATE DETECTED: MonthId ${monthId} appears multiple times`);
        duplicateKeys.add(key);
      } else {
        uniqueMonthlyReflections.set(monthId, value);
      }
    });
    
    console.log(`Found ${duplicateKeys.size} duplicate monthly reflection keys`);
    
    if (duplicateKeys.size > 0) {
      // If we found duplicates, create a new object with only unique entries
      const cleanedReflections: Record<string, MonthlyReflection> = {};
      
      Object.entries(allMonthlyReflections).forEach(([key, value]) => {
        if (!duplicateKeys.has(key)) {
          cleanedReflections[key] = value;
        } else {
          console.log(`Removing duplicate entry with key ${key}`);
        }
      });
      
      monthlyRemoved = duplicateKeys.size;
      console.log(`Removing ${monthlyRemoved} duplicate monthly reflections`);
      localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(cleanedReflections));
      
      // Additional phase - check for multiple entries with the same monthId but different keys
      const uniqueByMonthId = new Map<string, MonthlyReflection>();
      const duplicateMonthIds = new Set<string>();
      
      Object.values(cleanedReflections).forEach((value) => {
        const monthId = value.monthId;
        if (!monthId) return;
        
        if (uniqueByMonthId.has(monthId)) {
          duplicateMonthIds.add(monthId);
        } else {
          uniqueByMonthId.set(monthId, value);
        }
      });
      
      console.log(`Found ${duplicateMonthIds.size} monthIds with multiple entries after first cleanup`);
      
      if (duplicateMonthIds.size > 0) {
        // If we found monthIds with multiple entries, keep only the most recently updated one
        const finalCleanedReflections: Record<string, MonthlyReflection> = {};
        const processedMonthIds = new Set<string>();
        
        // Sort entries by monthId and lastUpdated (newest first)
        const sortedEntries = Object.entries(cleanedReflections).sort(([, valueA], [, valueB]) => {
          // First sort by monthId
          const monthIdA = valueA.monthId || '';
          const monthIdB = valueB.monthId || '';
          const monthIdCompare = monthIdA.localeCompare(monthIdB);
          
          if (monthIdCompare !== 0) return monthIdCompare;
          
          // If same monthId, sort by lastUpdated (newest first)
          const dateA = valueA.lastUpdated ? new Date(valueA.lastUpdated).getTime() : 0;
          const dateB = valueB.lastUpdated ? new Date(valueB.lastUpdated).getTime() : 0;
          return dateB - dateA;
        });
        
        sortedEntries.forEach(([key, value]) => {
          const monthId = value.monthId;
          if (!monthId) {
            finalCleanedReflections[key] = value;
            return;
          }
          
          // Only add the first (most recent) entry for each monthId
          if (!processedMonthIds.has(monthId)) {
            finalCleanedReflections[key] = value;
            processedMonthIds.add(monthId);
            console.log(`Keeping entry for monthId ${monthId} with key ${key}`);
          } else {
            console.log(`Discarding duplicate entry for monthId ${monthId} with key ${key}`);
            monthlyRemoved++;
          }
        });
        
        localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(finalCleanedReflections));
      }
      
      dispatchStorageEvent(MONTHLY_REFLECTIONS_KEY);
    } else {
      console.log('No duplicate monthly reflections found');
    }
  } catch (error) {
    console.error('Error processing monthly reflections:', error);
  }
  
  if (weeklyRemoved > 0 || monthlyRemoved > 0) {
    console.log(`Total duplicates removed: ${weeklyRemoved + monthlyRemoved}`);
    
    // Dispatch events to update UI
    window.dispatchEvent(new Event('storage'));
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('journal-updated'));
      window.dispatchEvent(new Event('storage'));
    }, 50);
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('journalUpdated'));
      window.dispatchEvent(new Event('storage'));
    }, 100);
  }
  
  return { weeklyRemoved, monthlyRemoved };
};

let lastEventDispatchTime: Record<string, number> = {};
const MIN_EVENT_INTERVAL = 500;

const dispatchStorageEvent = (key: string) => {
  const now = Date.now();
  if (lastEventDispatchTime[key] && (now - lastEventDispatchTime[key] < MIN_EVENT_INTERVAL)) {
    console.log(`Skipping event dispatch for ${key} - too soon after last event`);
    return;
  }
  
  lastEventDispatchTime[key] = now;
  
  const customEvent = new CustomEvent('journalUpdated', { detail: { key } });
  window.dispatchEvent(customEvent);
  
  const anotherCustomEvent = new CustomEvent('journal-updated', { detail: { key } });
  window.dispatchEvent(anotherCustomEvent);
  
  try {
    const storageEvent = new StorageEvent('storage', { key });
    window.dispatchEvent(storageEvent);
  } catch (e) {
    console.error('Error dispatching storage event:', e);
    window.dispatchEvent(new Event('storage'));
  }
  
  console.log(`Storage events dispatched for key: ${key}`);
};

export const associateTradeWithReflections = (tradeId: string, tradeDate: string | Date) => {
  if (!tradeId || !tradeDate) {
    console.error('Cannot associate trade: missing trade ID or date');
    return;
  }
  
  const tradeDateTime = new Date(tradeDate);
  if (isNaN(tradeDateTime.getTime())) {
    console.error('Cannot associate trade: invalid date format', tradeDate);
    return;
  }
  
  const weekStart = new Date(tradeDateTime);
  weekStart.setDate(tradeDateTime.getDate() - tradeDateTime.getDay() + (tradeDateTime.getDay() === 0 ? -6 : 1));
  const weekId = weekStart.toISOString().slice(0, 10);
  
  const monthId = tradeDateTime.toISOString().slice(0, 7);
  
  console.log(`Associating trade ${tradeId} with week ${weekId} and month ${monthId}`);
  
  const weeklyReflections = getWeeklyReflections();
  if (weeklyReflections[weekId]) {
    if (!weeklyReflections[weekId].tradeIds) {
      weeklyReflections[weekId].tradeIds = [];
    }
    
    if (!weeklyReflections[weekId].tradeIds.includes(tradeId)) {
      weeklyReflections[weekId].tradeIds.push(tradeId);
      localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(weeklyReflections));
      dispatchStorageEvent(WEEKLY_REFLECTIONS_KEY);
      console.log(`Added trade ${tradeId} to weekly reflection ${weekId}`);
    }
  }
  
  const monthlyReflections = getMonthlyReflections();
  if (monthlyReflections[monthId]) {
    if (!monthlyReflections[monthId].tradeIds) {
      monthlyReflections[monthId].tradeIds = [];
    }
    
    if (!monthlyReflections[monthId].tradeIds.includes(tradeId)) {
      monthlyReflections[monthId].tradeIds.push(tradeId);
      localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(monthlyReflections));
      dispatchStorageEvent(MONTHLY_REFLECTIONS_KEY);
      console.log(`Added trade ${tradeId} to monthly reflection ${monthId}`);
    }
  }
};

export const saveWeeklyReflection = (weekId: string, reflection: string, grade?: string, weeklyPlan?: string): void => {
  if (!weekId) {
    console.error('Cannot save weekly reflection: weekId is empty');
    return;
  }
  
  debugStorage('Saving weekly reflection', weekId, {reflection: reflection.substring(0, 50) + '...', grade, weeklyPlan: weeklyPlan?.substring(0, 50) + '...'});
  
  try {
    const reflections = getWeeklyReflections();
    
    const currentDate = new Date(weekId);
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    reflections[weekId] = {
      ...reflections[weekId],
      id: weekId,
      weekId: weekId,
      weekStart: reflections[weekId]?.weekStart || weekStart.toISOString(),
      weekEnd: reflections[weekId]?.weekEnd || weekEnd.toISOString(),
      reflection,
      weeklyPlan: weeklyPlan || '',
      grade: grade || '',
      lastUpdated: new Date().toISOString(),
      tradeIds: reflections[weekId]?.tradeIds || [],
      isPlaceholder: false
    };
    
    const reflectionsJson = JSON.stringify(reflections);
    
    try {
      localStorage.setItem(WEEKLY_REFLECTIONS_KEY, reflectionsJson);
      
      const savedData = localStorage.getItem(WEEKLY_REFLECTIONS_KEY);
      if (!savedData) {
        throw new Error('Failed to retrieve data after saving');
      }
      
      if (savedData.indexOf('"' + weekId + '"') === -1) {
        throw new Error(`Saved data doesn't contain the weekId: ${weekId}`);
      }
      
      debugStorage('Weekly reflection saved successfully', weekId);
    } catch (error) {
      console.error('Error saving weekly reflection:', error);
      
      if (error instanceof DOMException && 
          (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        const dataSize = reflectionsJson.length / 1024;
        console.error(`Storage limit reached! Attempted to save ${dataSize.toFixed(2)}KB`);
        toast.error('Storage limit reached. Try removing some old entries or images.');
      } else {
        toast.error('Failed to save reflection. Please try again or check console for errors.');
      }
      return;
    }
    
    dispatchStorageEvent(WEEKLY_REFLECTIONS_KEY);
  } catch (error) {
    console.error('Error in saveWeeklyReflection:', error);
    toast.error('Failed to save weekly reflection');
  }
};

export const saveMonthlyReflection = (monthId: string, reflection: string, grade?: string): void => {
  if (!monthId) {
    console.error('Cannot save monthly reflection: monthId is empty');
    return;
  }
  
  debugStorage('Saving monthly reflection', monthId, {reflection: reflection.substring(0, 50) + '...', grade});
  
  try {
    const reflections = getMonthlyReflections();
    
    let year: number;
    let month: number;
    
    if (monthId.match(/^\d{4}-\d{2}$/)) {
      year = parseInt(monthId.split('-')[0], 10);
      month = parseInt(monthId.split('-')[1], 10) - 1;
    } else {
      const date = new Date(monthId);
      year = date.getFullYear();
      month = date.getMonth();
    }
    
    if (isNaN(year) || isNaN(month)) {
      console.error(`Invalid monthId format: ${monthId}, expected 'YYYY-MM'`);
      return;
    }
    
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    const exactMonthId = monthId;
    
    reflections[exactMonthId] = {
      ...reflections[exactMonthId],
      id: exactMonthId,
      monthId: exactMonthId,
      monthStart: reflections[exactMonthId]?.monthStart || monthStart.toISOString(),
      monthEnd: reflections[exactMonthId]?.monthEnd || monthEnd.toISOString(),
      reflection,
      grade: grade || '',
      lastUpdated: new Date().toISOString(),
      tradeIds: reflections[exactMonthId]?.tradeIds || [],
      isPlaceholder: false
    };
    
    debugStorage("Saving monthly reflection object", exactMonthId, reflections[exactMonthId]);
    
    const reflectionsJson = JSON.stringify(reflections);
    
    try {
      localStorage.setItem(MONTHLY_REFLECTIONS_KEY, reflectionsJson);
      
      const savedData = localStorage.getItem(MONTHLY_REFLECTIONS_KEY);
      if (!savedData) {
        throw new Error('Failed to retrieve data after saving');
      }
      
      const parsedData = JSON.parse(savedData);
      if (!parsedData[exactMonthId]) {
        throw new Error(`Saved data doesn't contain the monthId: ${exactMonthId}`);
      }
      
      debugStorage('Monthly reflection saved successfully', exactMonthId);
    } catch (error) {
      console.error('Error saving monthly reflection:', error);
      
      if (error instanceof DOMException && 
          (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        const dataSize = reflectionsJson.length / 1024;
        console.error(`Storage limit reached! Attempted to save ${dataSize.toFixed(2)}KB`);
        toast.error('Storage limit reached. Try removing some old entries or images.');
      } else {
        toast.error('Failed to save reflection. Please try again or check console for errors.');
      }
      return;
    }
    
    dispatchStorageEvent(MONTHLY_REFLECTIONS_KEY);
  } catch (error) {
    console.error('Error in saveMonthlyReflection:', error);
    toast.error('Failed to save monthly reflection');
  }
};

export const saveWeeklyReflectionObject = (reflection: WeeklyReflection): void => {
  try {
    if (!reflection) {
      console.error('Cannot save null reflection object');
      return;
    }
    
    const reflections = getWeeklyReflections();
    const weekId = reflection.weekId || reflection.id || '';
    
    if (!weekId) {
      console.error('Cannot save reflection without id or weekId');
      return;
    }
    
    reflections[weekId] = {
      ...reflection,
      id: weekId,
      weekId: weekId,
      lastUpdated: new Date().toISOString(),
      isPlaceholder: false
    };
    
    localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(reflections));
    
    dispatchStorageEvent(WEEKLY_REFLECTIONS_KEY);
    console.log(`Weekly reflection object saved successfully for ${weekId}`);
  } catch (error) {
    console.error('Error saving weekly reflection object:', error);
  }
};

export const saveMonthlyReflectionObject = (reflection: MonthlyReflection): void => {
  try {
    if (!reflection) {
      console.error('Cannot save null reflection object');
      return;
    }
    
    const reflections = getMonthlyReflections();
    const monthId = reflection.monthId || reflection.id || '';
    
    if (!monthId) {
      console.error('Cannot save reflection without id or monthId');
      return;
    }
    
    reflections[monthId] = {
      ...reflection,
      id: monthId,
      monthId: monthId,
      lastUpdated: new Date().toISOString(),
      isPlaceholder: false
    };
    
    localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(reflections));
    
    dispatchStorageEvent(MONTHLY_REFLECTIONS_KEY);
    console.log(`Monthly reflection object saved successfully for ${monthId}`);
  } catch (error) {
    console.error('Error saving monthly reflection object:', error);
  }
};

export const deleteWeeklyReflection = (weekId: string): void => {
  try {
    if (!weekId) {
      console.error('Cannot delete weekly reflection: weekId is empty');
      return;
    }
    
    const reflections = getWeeklyReflections();
    delete reflections[weekId];
    localStorage.setItem(WEEKLY_REFLECTIONS_KEY, JSON.stringify(reflections));
    
    dispatchStorageEvent(WEEKLY_REFLECTIONS_KEY);
    console.log(`Weekly reflection deleted successfully for ${weekId}`);
  } catch (error) {
    console.error('Error deleting weekly reflection:', error);
  }
};

export const deleteMonthlyReflection = (monthId: string): void => {
  try {
    if (!monthId) {
      console.error('Cannot delete monthly reflection: monthId is empty');
      return;
    }
    
    const reflections = getMonthlyReflections();
    delete reflections[monthId];
    localStorage.setItem(MONTHLY_REFLECTIONS_KEY, JSON.stringify(reflections));
    
    dispatchStorageEvent(MONTHLY_REFLECTIONS_KEY);
    console.log(`Monthly reflection deleted successfully for ${monthId}`);
  } catch (error) {
    console.error('Error deleting monthly reflection:', error);
  }
};

export const getAllWeeklyReflections = () => {
  const reflectionsString = localStorage.getItem(WEEKLY_REFLECTIONS_KEY);
  debugStorage('Getting ALL weekly reflections', WEEKLY_REFLECTIONS_KEY, reflectionsString?.substring(0, 100) + '...');
  
  if (!reflectionsString) return {};
  
  try {
    return JSON.parse(reflectionsString);
  } catch (e) {
    console.error('Error parsing weekly reflections from storage', e);
    return {};
  }
};

export const getAllMonthlyReflections = () => {
  const reflectionsString = localStorage.getItem(MONTHLY_REFLECTIONS_KEY);
  debugStorage('Getting ALL monthly reflections', MONTHLY_REFLECTIONS_KEY, reflectionsString?.substring(0, 100) + '...');
  
  if (!reflectionsString) return {};
  
  try {
    return JSON.parse(reflectionsString);
  } catch (e) {
    console.error('Error parsing monthly reflections from storage', e);
    return {};
  }
};

export const getWeeklyReflectionsForMonth = (monthId: string): WeeklyReflection[] => {
  if (!monthId) {
    console.error('Cannot get weekly reflections: monthId is empty');
    return [];
  }

  try {
    let formattedMonthId = monthId;
    if (!monthId.match(/^\d{4}-\d{2}$/)) {
      const date = new Date(monthId);
      if (!isNaN(date.getTime())) {
        formattedMonthId = date.toISOString().slice(0, 7);
      }
    }

    const allWeeklyReflections = getAllWeeklyReflections();
    
    const weeklyReflectionMap = new Map<string, WeeklyReflection>();

    Object.values(allWeeklyReflections).forEach((reflection: WeeklyReflection) => {
      if (reflection && reflection.weekStart) {
        try {
          const weekStart = new Date(reflection.weekStart);
          const weekMonth = weekStart.toISOString().slice(0, 7);
          
          if (weekMonth === formattedMonthId) {
            const existingReflection = weeklyReflectionMap.get(reflection.weekId);
            
            if (!existingReflection || 
                (reflection.lastUpdated && existingReflection.lastUpdated && 
                 new Date(reflection.lastUpdated) > new Date(existingReflection.lastUpdated))) {
              weeklyReflectionMap.set(reflection.weekId, reflection);
            }
          }
        } catch (e) {
          console.error('Error parsing date in getWeeklyReflectionsForMonth:', e);
        }
      }
    });

    const monthlyReflections = Array.from(weeklyReflectionMap.values());

    monthlyReflections.sort((a, b) => {
      if (!a.weekStart || !b.weekStart) return 0;
      return new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime();
    });

    return monthlyReflections;
  } catch (e) {
    console.error('Error in getWeeklyReflectionsForMonth:', e);
    return [];
  }
};
