import { useMemo } from 'react';
import { format } from 'date-fns';
import { TradeWithMetrics } from '@/types';
import { formatCurrency } from '@/utils/calculations/formatters';

interface ChartDataPoint {
  date: string;
  formattedDate: string;
  timestamp: number;
  total: number;
  [key: string]: number | string; // For strategy-specific data
}

export function useCumulativePnLData(trades: TradeWithMetrics[]) {
  // Sort and prepare data for chart (only closed trades)
  return useMemo(() => {
    // Filter by closed trades and sort by exit date
    const closedTrades = trades
      .filter(trade => trade.status === 'closed' && trade.exitDate)
      .sort((a, b) => {
        const dateA = new Date(a.exitDate || 0).getTime();
        const dateB = new Date(b.exitDate || 0).getTime();
        return dateA - dateB;
      });
    
    // Get unique strategies
    const uniqueStrategies = Array.from(
      new Set(
        closedTrades
          .filter(trade => trade.strategy)
          .map(trade => trade.strategy as string)
      )
    );
    
    // Prepare data points by date
    const dataByDate = new Map<string, ChartDataPoint>();
    
    // Initialize strategy cumulative values
    const strategyCumulatives: Record<string, number> = {};
    uniqueStrategies.forEach(strategy => {
      strategyCumulatives[strategy] = 0;
    });
    
    let totalCumulative = 0;

    // Process each trade
    closedTrades.forEach(trade => {
      if (!trade.exitDate) return;
      
      const exitDate = new Date(trade.exitDate);
      const dateKey = format(exitDate, 'yyyy-MM-dd');
      const formattedDate = format(exitDate, 'MMM d, yyyy');
      const timestamp = exitDate.getTime();
      
      // Update total cumulative P&L
      totalCumulative += trade.metrics.profitLoss;
      
      // Update strategy-specific cumulative P&L
      if (trade.strategy) {
        strategyCumulatives[trade.strategy] = 
          (strategyCumulatives[trade.strategy] || 0) + trade.metrics.profitLoss;
      }
      
      // Create or update data point
      if (!dataByDate.has(dateKey)) {
        const dataPoint: ChartDataPoint = {
          date: dateKey,
          formattedDate,
          timestamp,
          total: totalCumulative,
        };
        
        // Add strategy-specific values
        uniqueStrategies.forEach(strategy => {
          dataPoint[strategy] = strategyCumulatives[strategy];
        });
        
        dataByDate.set(dateKey, dataPoint);
      } else {
        // Update existing data point
        const dataPoint = dataByDate.get(dateKey)!;
        dataPoint.total = totalCumulative;
        
        // Update strategy values
        uniqueStrategies.forEach(strategy => {
          dataPoint[strategy] = strategyCumulatives[strategy];
        });
      }
    });
    
    // Convert map to array and sort by timestamp
    const chartData = Array.from(dataByDate.values())
      .sort((a, b) => a.timestamp - b.timestamp);
    
    // Define strategy colors
    const strategyColors = [
      '#2563eb', // Blue
      '#059669', // Green
      '#d946ef', // Purple
      '#f59e0b', // Amber
      '#dc2626', // Red
      '#6366f1', // Indigo
      '#0891b2', // Cyan
    ];
    
    // Determine chart colors for the total line
    const isPositive = chartData.length > 0 && chartData[chartData.length - 1]?.total >= 0;
    const totalLineColor = isPositive ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)';
    
    return { 
      chartData, 
      strategies: uniqueStrategies, 
      strategyColors,
      totalLineColor,
      hasData: chartData.length > 0
    };
  }, [trades]);
}
