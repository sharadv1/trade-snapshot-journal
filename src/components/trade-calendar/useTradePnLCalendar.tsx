
import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { TradeWithMetrics } from '@/types';
import { getTradesWithMetrics } from '@/utils/tradeStorage';
import { getAccounts } from '@/utils/accountStorage';
import { DailyPnL } from './types';

export function useTradePnLCalendar() {
  const [trades, setTrades] = useState<TradeWithMetrics[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [strategyFilter, setStrategyFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<'all' | 'win' | 'loss'>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastNavigatedDate, setLastNavigatedDate] = useState<string | null>(null);

  const loadTrades = () => {
    console.log('Loading trades in TradePnLCalendar');
    const allTrades = getTradesWithMetrics();
    setTrades(allTrades.filter(trade => trade.status === 'closed'));
  };

  // Load trades when component mounts or when refreshKey changes
  useEffect(() => {
    loadTrades();
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'trade-journal-trades') {
        console.log('Trade storage changed, refreshing calendar data');
        loadTrades();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('trades-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('trades-updated', handleStorageChange);
    };
  }, [refreshKey]);

  const filteredTrades = useMemo(() => {
    let result = [...trades];
    
    if (strategyFilter !== 'all') {
      result = result.filter(trade => trade.strategy === strategyFilter);
    }
    
    if (accountFilter !== 'all') {
      result = result.filter(trade => trade.account === accountFilter);
    }
    
    if (resultFilter !== 'all') {
      result = result.filter(trade => {
        if (resultFilter === 'win') {
          return trade.metrics.profitLoss >= 0;
        } else {
          return trade.metrics.profitLoss < 0;
        }
      });
    }
    
    return result;
  }, [trades, strategyFilter, accountFilter, resultFilter, refreshKey]);

  const dailyPnL = useMemo(() => {
    const pnlByDay: DailyPnL = {};
    
    filteredTrades.forEach(trade => {
      const exitDate = trade.metrics.latestExitDate || trade.exitDate;
      
      if (exitDate && trade.metrics.profitLoss !== undefined) {
        const exitDay = format(new Date(exitDate), 'yyyy-MM-dd');
        
        if (!pnlByDay[exitDay]) {
          pnlByDay[exitDay] = { 
            pnl: 0, 
            tradeCount: 0, 
            tradeIds: [],
            rValue: 0 
          };
        }
        
        pnlByDay[exitDay].pnl += trade.metrics.profitLoss;
        pnlByDay[exitDay].tradeCount += 1;
        pnlByDay[exitDay].tradeIds.push(trade.id);

        // Use rMultiple for R value calculation instead of riskRewardRatio
        if (trade.metrics.rMultiple !== undefined) {
          pnlByDay[exitDay].rValue += trade.metrics.rMultiple;
        }
      }
    });
    
    return pnlByDay;
  }, [filteredTrades, refreshKey]);

  const availableStrategies = useMemo(() => {
    const strategies = new Set<string>();
    trades.forEach(trade => {
      if (trade.strategy) {
        strategies.add(trade.strategy);
      }
    });
    return Array.from(strategies).sort();
  }, [trades]);
  
  const availableAccounts = useMemo(() => {
    const accounts = getAccounts();
    return accounts || [];
  }, [trades]);
  
  // Function to handle calendar navigation with persistance
  const handleMonthChange = (newMonth: Date) => {
    setCurrentMonth(newMonth);
    // Force a refresh when month changes to ensure data is up-to-date
    setRefreshKey(prev => prev + 1);
  };
  
  // Record last navigated date for state persistence
  const recordNavigatedDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    setLastNavigatedDate(dateKey);
    // Force refresh to ensure journal entries reload when navigating between dates
    setRefreshKey(prev => prev + 1);
  };

  return {
    currentMonth,
    setCurrentMonth: handleMonthChange,
    strategyFilter,
    setStrategyFilter,
    resultFilter,
    setResultFilter,
    accountFilter,
    setAccountFilter,
    dailyPnL,
    availableStrategies,
    availableAccounts,
    refreshKey,
    loadTrades,
    lastNavigatedDate,
    recordNavigatedDate
  };
}
