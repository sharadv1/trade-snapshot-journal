
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { TradeWithMetrics } from '@/types';
import { formatCurrency } from '@/utils/tradeCalculations';
import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { getStrategies } from '@/utils/strategyStorage';
import { calculateExpectedValue } from '@/utils/calculations/advancedMetrics';

interface DayOfWeekPerformanceTableProps {
  trades: TradeWithMetrics[];
  timeframes?: string[];
}

interface DayPerformance {
  pnl: number;
  count: number;
  winCount: number;
  winRate?: number;
  trades: TradeWithMetrics[];
}

export function DayOfWeekPerformanceTable({ trades, timeframes = ['15m', '1h'] }: DayOfWeekPerformanceTableProps) {
  const [strategies, setStrategies] = useState([]);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  
  // Fetch strategies on component mount
  useEffect(() => {
    const loadStrategies = async () => {
      const strategiesData = getStrategies();
      setStrategies(strategiesData);
    };
    
    loadStrategies();
  }, []);
  
  // Filter trades by timeframe if specified
  const filteredTrades = timeframes 
    ? trades.filter(trade => {
        if (!trade.timeframe) return false;
        
        // Normalize timeframes for comparison
        const normalizedTradeTimeframe = trade.timeframe.toLowerCase();
        
        // Check multiple possible formats (m15/15m, h1/1h, etc.)
        return timeframes.some(tf => {
          const normalizedTf = tf.toLowerCase();
          
          // Check for direct match
          if (normalizedTradeTimeframe === normalizedTf) return true;
          
          // Check for reversed format (m15 vs 15m, h1 vs 1h)
          if (normalizedTf.startsWith('m') && normalizedTradeTimeframe.endsWith('m')) {
            const minutes = normalizedTf.substring(1);
            if (normalizedTradeTimeframe.startsWith(minutes)) return true;
          } else if (normalizedTf.endsWith('m') && normalizedTradeTimeframe.startsWith('m')) {
            const minutes = normalizedTf.substring(0, normalizedTf.length - 1);
            if (normalizedTradeTimeframe.endsWith(minutes)) return true;
          } else if (normalizedTf.startsWith('h') && normalizedTradeTimeframe.endsWith('h')) {
            const hours = normalizedTf.substring(1);
            if (normalizedTradeTimeframe.startsWith(hours)) return true;
          } else if (normalizedTf.endsWith('h') && normalizedTradeTimeframe.startsWith('h')) {
            const hours = normalizedTf.substring(0, normalizedTf.length - 1);
            if (normalizedTradeTimeframe.endsWith(hours)) return true;
          }
          
          return false;
        });
      })
    : trades;
  
  // Filter trades by selected strategies
  const strategyFilteredTrades = selectedStrategies.length > 0
    ? filteredTrades.filter(trade => selectedStrategies.includes(trade.strategy || ''))
    : filteredTrades;
  
  // Get only closed trades
  const closedTrades = strategyFilteredTrades.filter(trade => trade.status === 'closed');
  
  // Initialize data for each day of week
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayPnL: Record<string, DayPerformance> = {};
  
  daysOfWeek.forEach(day => {
    dayPnL[day] = { pnl: 0, count: 0, winCount: 0, trades: [] };
  });
  
  // Calculate P&L for each day of week
  closedTrades.forEach(trade => {
    if (trade.entryDate) {
      const entryDate = new Date(trade.entryDate);
      const dayName = daysOfWeek[entryDate.getDay()];
      
      dayPnL[dayName].pnl += trade.metrics.profitLoss;
      dayPnL[dayName].count += 1;
      dayPnL[dayName].trades.push(trade);
      
      if (trade.metrics.profitLoss > 0) {
        dayPnL[dayName].winCount += 1;
      }
    }
  });
  
  // Calculate win rates
  Object.keys(dayPnL).forEach(day => {
    if (dayPnL[day].count === 0) {
      dayPnL[day].winRate = 0;
    } else {
      dayPnL[day].winRate = (dayPnL[day].winCount / dayPnL[day].count) * 100;
    }
  });

  const handleStrategyChange = (strategyId: string) => {
    setSelectedStrategies(prev => 
      prev.includes(strategyId) 
        ? prev.filter(id => id !== strategyId)
        : [...prev, strategyId]
    );
  };
  
  return (
    <Card className="shadow-subtle border mb-8">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          Performance by Day of Week {timeframes ? `(${timeframes.join(', ')} Timeframes)` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-4">
          <div className="text-sm font-medium">Filter by strategy:</div>
          <div className="flex flex-wrap gap-3">
            {strategies.map(strategy => (
              <div key={strategy.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`strategy-${strategy.id}`}
                  checked={selectedStrategies.includes(strategy.id)}
                  onCheckedChange={() => handleStrategyChange(strategy.id)}
                />
                <label 
                  htmlFor={`strategy-${strategy.id}`}
                  className="text-sm cursor-pointer"
                  style={{ color: strategy.color }}
                >
                  {strategy.name}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Day</TableHead>
              <TableHead className="text-right">Trades</TableHead>
              <TableHead className="text-right">Win Rate</TableHead>
              <TableHead className="text-right">Expected Value</TableHead>
              <TableHead className="text-right">P&L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {daysOfWeek.map(day => {
              // Calculate expected value for this day
              const expectedValue = dayPnL[day].count > 0 
                ? calculateExpectedValue(dayPnL[day].trades)
                : 0;
                
              return (
                <TableRow key={day}>
                  <TableCell className="font-medium">{day}</TableCell>
                  <TableCell className="text-right">{dayPnL[day].count}</TableCell>
                  <TableCell className="text-right">
                    {dayPnL[day].count > 0 ? `${dayPnL[day].winRate?.toFixed(1)}%` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {dayPnL[day].count > 0 ? (
                      <span className={expectedValue >= 0 ? 'text-profit' : 'text-loss'}>
                        {formatCurrency(expectedValue)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${dayPnL[day].pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {dayPnL[day].count > 0 ? formatCurrency(dayPnL[day].pnl) : '-'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
