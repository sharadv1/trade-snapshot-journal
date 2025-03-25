
import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { TradeWithMetrics } from '@/types';
import { getTradesWithMetrics } from '@/utils/tradeStorage';
import { DailyPnL } from './types';

export function useTradePnLCalendar() {
  const [trades, setTrades] = useState<TradeWithMetrics[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [strategyFilter, setStrategyFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<'all' | 'win' | 'loss'>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const loadTrades = () => {
    const allTrades = getTradesWithMetrics();
    setTrades(allTrades.filter(trade => trade.status === 'closed'));
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    loadTrades();
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'trade-journal-trades') {
        loadTrades();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    const intervalId = setInterval(loadTrades, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  const filteredTrades = useMemo(() => {
    let result = [...trades];
    
    if (strategyFilter !== 'all') {
      result = result.filter(trade => trade.strategy === strategyFilter);
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
  }, [trades, strategyFilter, resultFilter, refreshKey]);

  const dailyPnL = useMemo(() => {
    const pnlByDay: DailyPnL = {};
    
    filteredTrades.forEach(trade => {
      const exitDate = trade.metrics.latestExitDate || trade.exitDate;
      
      if (exitDate && trade.metrics.profitLoss !== undefined) {
        const exitDay = format(new Date(exitDate), 'yyyy-MM-dd');
        
        if (!pnlByDay[exitDay]) {
          pnlByDay[exitDay] = { pnl: 0, tradeCount: 0, tradeIds: [] };
        }
        
        pnlByDay[exitDay].pnl += trade.metrics.profitLoss;
        pnlByDay[exitDay].tradeCount += 1;
        pnlByDay[exitDay].tradeIds.push(trade.id);
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

  return {
    currentMonth,
    setCurrentMonth,
    strategyFilter,
    setStrategyFilter,
    resultFilter,
    setResultFilter,
    dailyPnL,
    availableStrategies,
    refreshKey,
    loadTrades
  };
}
