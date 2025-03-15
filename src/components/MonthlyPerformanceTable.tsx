
import { useMemo } from 'react';
import { format } from 'date-fns';
import { Trade, TradeWithMetrics } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface MonthPerformanceData {
  month: string;
  rawMonth: Date;
  [key: string]: any;
}

interface MonthlyPerformanceTableProps {
  trades: TradeWithMetrics[];
  isLoading?: boolean;
}

export function MonthlyPerformanceTable({ trades, isLoading = false }: MonthlyPerformanceTableProps) {
  const { monthlyData, categories } = useMemo(() => {
    // Get unique months from trades
    const months = new Map<string, Date>();
    
    // Get unique categories (strategies and instruments)
    const uniqueStrategies = new Set<string>();
    const uniqueInstruments = new Set<string>();
    
    // Process all trades
    trades.forEach(trade => {
      // Get month and year from entry date
      const entryDate = new Date(trade.entryDate);
      const monthYear = format(entryDate, 'MMM yyyy');
      
      // Store the month
      if (!months.has(monthYear)) {
        months.set(monthYear, entryDate);
      }
      
      // Add strategy and instrument type
      if (trade.strategy) {
        uniqueStrategies.add(trade.strategy);
      }
      uniqueInstruments.add(trade.type);
    });
    
    // Convert months to array and sort chronologically
    const sortedMonths = Array.from(months.entries())
      .sort((a, b) => a[1].getTime() - b[1].getTime())
      .map(([monthYear, date]) => ({ 
        month: monthYear, 
        rawMonth: date 
      }));
    
    // Create categories for both strategies and instruments
    const strategyCategories = Array.from(uniqueStrategies).map(strategy => ({
      id: `strategy-${strategy}`,
      name: strategy,
      type: 'strategy'
    }));
    
    const instrumentCategories = Array.from(uniqueInstruments).map(instrument => ({
      id: `instrument-${instrument}`,
      name: instrument,
      type: 'instrument'
    }));
    
    // Combine all categories
    const allCategories = [
      ...strategyCategories,
      ...instrumentCategories
    ];
    
    // Calculate win rates for each month and category
    const monthlyPerformance: MonthPerformanceData[] = sortedMonths.map(({ month, rawMonth }) => {
      const monthData: MonthPerformanceData = { month, rawMonth };
      
      // For each category, calculate win rate
      allCategories.forEach(category => {
        const monthStart = new Date(rawMonth.getFullYear(), rawMonth.getMonth(), 1);
        const monthEnd = new Date(rawMonth.getFullYear(), rawMonth.getMonth() + 1, 0);
        
        let tradesInCategory;
        
        if (category.type === 'strategy') {
          tradesInCategory = trades.filter(trade => {
            const tradeDate = new Date(trade.entryDate);
            const isInMonth = tradeDate >= monthStart && tradeDate <= monthEnd;
            return isInMonth && trade.strategy === category.name;
          });
        } else {
          tradesInCategory = trades.filter(trade => {
            const tradeDate = new Date(trade.entryDate);
            const isInMonth = tradeDate >= monthStart && tradeDate <= monthEnd;
            return isInMonth && trade.type === category.name;
          });
        }
        
        if (tradesInCategory.length > 0) {
          const winningTrades = tradesInCategory.filter(
            trade => trade.metrics && trade.metrics.profitLoss > 0
          ).length;
          const winRate = (winningTrades / tradesInCategory.length) * 100;
          monthData[category.id] = {
            winRate: Math.round(winRate),
            count: tradesInCategory.length
          };
        } else {
          monthData[category.id] = { winRate: null, count: 0 };
        }
      });
      
      return monthData;
    });
    
    return {
      monthlyData: monthlyPerformance,
      categories: allCategories
    };
  }, [trades]);

  if (isLoading) {
    return <Skeleton className="w-full h-64" />;
  }

  if (trades.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No trade data available to generate monthly performance table.
      </div>
    );
  }

  // Filter out empty categories (no trades for any month)
  const activeCategories = categories.filter(category => 
    monthlyData.some(month => month[category.id]?.count > 0)
  );

  if (activeCategories.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Not enough categorized trade data to generate performance table.
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead className="font-semibold text-foreground text-base py-4">Month</TableHead>
            {activeCategories.map(category => (
              <TableHead key={category.id} className="font-semibold text-foreground text-base py-4">
                {category.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {monthlyData.map(monthData => (
            <TableRow key={monthData.month}>
              <TableCell className="font-medium">{monthData.month}</TableCell>
              {activeCategories.map(category => {
                const data = monthData[category.id];
                return (
                  <TableCell key={category.id}>
                    {data?.count > 0 ? (
                      <div className="flex flex-col">
                        <span className={data.winRate >= 50 ? "text-green-600" : "text-red-600"}>
                          {data.winRate}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({data.count} trades)
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
