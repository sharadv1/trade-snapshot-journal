
import { notifyJournalUpdate, dispatchStorageEvent } from './storageCore';

const TRADE_ASSOCIATIONS_KEY = 'trade-journal-trade-associations';

/**
 * Associates a trade with reflections
 */
export function associateTradeWithReflections(
  tradeId: string,
  weeklyReflectionId?: string,
  monthlyReflectionId?: string
): void {
  try {
    const associationsJson = localStorage.getItem(TRADE_ASSOCIATIONS_KEY);
    let associations = associationsJson ? JSON.parse(associationsJson) : {};
    
    if (!associations[tradeId]) {
      associations[tradeId] = {
        weeklyReflectionId: weeklyReflectionId || null,
        monthlyReflectionId: monthlyReflectionId || null
      };
    } else {
      if (weeklyReflectionId) {
        associations[tradeId].weeklyReflectionId = weeklyReflectionId;
      }
      if (monthlyReflectionId) {
        associations[tradeId].monthlyReflectionId = monthlyReflectionId;
      }
    }
    
    localStorage.setItem(TRADE_ASSOCIATIONS_KEY, JSON.stringify(associations));
    
    notifyJournalUpdate('associateTradeWithReflections');
    dispatchStorageEvent();
  } catch (error) {
    console.error('Error associating trade with reflections:', error);
  }
}

/**
 * Get reflection IDs for a trade
 */
export function getReflectionIdsForTrade(tradeId: string): {
  weeklyReflectionId: string | null;
  monthlyReflectionId: string | null;
} {
  try {
    const associationsJson = localStorage.getItem(TRADE_ASSOCIATIONS_KEY);
    if (!associationsJson) return { weeklyReflectionId: null, monthlyReflectionId: null };
    
    const associations = JSON.parse(associationsJson);
    
    return {
      weeklyReflectionId: associations[tradeId]?.weeklyReflectionId || null,
      monthlyReflectionId: associations[tradeId]?.monthlyReflectionId || null
    };
  } catch (error) {
    console.error('Error getting reflection IDs for trade:', error);
    return { weeklyReflectionId: null, monthlyReflectionId: null };
  }
}

/**
 * Get trades for a weekly reflection
 */
export function getTradesForWeeklyReflection(weeklyReflectionId: string): string[] {
  try {
    const associationsJson = localStorage.getItem(TRADE_ASSOCIATIONS_KEY);
    if (!associationsJson) return [];
    
    const associations = JSON.parse(associationsJson);
    
    const tradeIds: string[] = [];
    Object.entries(associations).forEach(([tradeId, association]: [string, any]) => {
      if (association.weeklyReflectionId === weeklyReflectionId) {
        tradeIds.push(tradeId);
      }
    });
    
    return tradeIds;
  } catch (error) {
    console.error('Error getting trades for weekly reflection:', error);
    return [];
  }
}

/**
 * Get trades for a monthly reflection
 */
export function getTradesForMonthlyReflection(monthlyReflectionId: string): string[] {
  try {
    const associationsJson = localStorage.getItem(TRADE_ASSOCIATIONS_KEY);
    if (!associationsJson) return [];
    
    const associations = JSON.parse(associationsJson);
    
    const tradeIds: string[] = [];
    Object.entries(associations).forEach(([tradeId, association]: [string, any]) => {
      if (association.monthlyReflectionId === monthlyReflectionId) {
        tradeIds.push(tradeId);
      }
    });
    
    return tradeIds;
  } catch (error) {
    console.error('Error getting trades for monthly reflection:', error);
    return [];
  }
}

/**
 * Remove associations for a trade
 */
export function removeTradeAssociations(tradeId: string): void {
  try {
    const associationsJson = localStorage.getItem(TRADE_ASSOCIATIONS_KEY);
    if (!associationsJson) return;
    
    const associations = JSON.parse(associationsJson);
    
    if (associations[tradeId]) {
      delete associations[tradeId];
      
      localStorage.setItem(TRADE_ASSOCIATIONS_KEY, JSON.stringify(associations));
      
      notifyJournalUpdate('removeTradeAssociations');
      dispatchStorageEvent();
    }
  } catch (error) {
    console.error('Error removing trade associations:', error);
  }
}
