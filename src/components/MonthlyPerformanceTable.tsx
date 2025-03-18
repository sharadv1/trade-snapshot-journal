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
import { formatCurrency } from '@/utils/tradeCalculations';

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
  const { monthlyData, categories, totals } = useMemo(() => {
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
    
    // Track totals for cumulative calculation - only using instrument data
    const categoryTotals = {
      totalDollarValue: 0,
      totalR: 0,
      count: 0
    };
    
    // Fix: Create a direct mapping of monthly data for debugging and validation
    const monthlyDataMap = new Map();
    
    // Calculate performance metrics for each month and category
    const monthlyPerformance: MonthPerformanceData[] = sortedMonths.map(({ month, rawMonth }) => {
      const monthData: MonthPerformanceData = { month, rawMonth };
      
      // Monthly totals for all categories combined - only tracking instruments
      let monthlyDollarTotal = 0;
      let monthlyRTotal = 0;
      let monthlyTradeCount = 0;
      
      // For each category, calculate metrics
      allCategories.forEach(category => {
        const monthStart = new Date(rawMonth.getFullYear(), rawMonth.getMonth(), 1);
        const monthEnd = new Date(rawMonth.getFullYear(), rawMonth.getMonth() + 1, 0);
        
        // Filter trades that are in this month and belong to this category
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
          // Calculate total dollar value (sum of all profit/loss)
          const totalDollarValue = tradesInCategory.reduce(
            (sum, trade) => sum + (trade.metrics?.profitLoss || 0), 
            0
          );
          
          // Fix: Calculate total R value directly from closed trades
          let totalR = 0;
          tradesInCategory.forEach(trade => {
            if (trade.status === 'closed' && trade.metrics && trade.metrics.riskRewardRatio) {
              totalR += trade.metrics.riskRewardRatio;
            }
          });
          
          // Store metrics in month data
          monthData[category.id] = {
            totalDollarValue,
            totalR: parseFloat(totalR.toFixed(2)),
            count: tradesInCategory.length
          };
          
          // Only add to monthly totals for instrument categories
          if (category.type === 'instrument') {
            monthlyDollarTotal += totalDollarValue;
            monthlyRTotal += totalR;
            monthlyTradeCount += tradesInCategory.length;
          }
        } else {
          monthData[category.id] = { 
            totalDollarValue: 0, 
            totalR: 0, 
            count: 0 
          };
        }
      });
      
      // Add monthly total for all categories
      monthData.monthlyTotal = {
        totalDollarValue: monthlyDollarTotal,
        totalR: parseFloat(monthlyRTotal.toFixed(2)),
        count: monthlyTradeCount
      };
      
      // Fix: Store monthly data in map for validation
      monthlyDataMap.set(month, {
        dollarTotal: monthlyDollarTotal,
        rTotal: monthlyRTotal,
        tradeCount: monthlyTradeCount
      });
      
      // Update cumulative totals (only counting instruments)
      categoryTotals.totalDollarValue += monthlyDollarTotal;
      categoryTotals.totalR += monthlyRTotal;
      categoryTotals.count += monthlyTradeCount;
      
      return monthData;
    });
    
    // Debug monthly totals calculation
    console.log('Monthly Performance - Monthly data detailed:', 
      Array.from(monthlyDataMap.entries()).map(([month, data]) => ({
        month,
        dollarTotal: data.dollarTotal,
        rTotal: data.rTotal,
        tradeCount: data.tradeCount
      }))
    );
    
    // Direct calculation of total R from all closed trades for comparison
    let directTotalR = 0;
    trades.forEach(trade => {
      if (trade.status === 'closed' && trade.metrics && trade.metrics.riskRewardRatio) {
        directTotalR += trade.metrics.riskRewardRatio;
      }
    });
    
    console.log('Monthly Performance - Direct total R from all trades:', directTotalR);
    console.log('Monthly Performance - Accumulated total R:', categoryTotals.totalR);
    
    return {
      monthlyData: monthlyPerformance,
      categories: allCategories,
      totals: {
        totalDollarValue: categoryTotals.totalDollarValue,
        // Fix: Use direct calculation for total R to avoid any accumulation errors
        totalR: parseFloat(directTotalR.toFixed(2)),
        count: categoryTotals.count
      }
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
            <TableHead className="font-semibold text-foreground text-base py-4 text-right">
              Cumulative Total
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {monthlyData.map(monthData => (
            <TableRow key={monthData.month}>
              <TableCell className="font-medium">{monthData.month}</TableCell>
              {activeCategories.map(category => {
                const data = monthData[category.id];
                const isProfitable = data?.totalDollarValue > 0;
                
                return (
                  <TableCell key={category.id}>
                    {data?.count > 0 ? (
                      <div className="flex flex-col">
                        <span className={isProfitable ? "text-green-600" : "text-red-600"}>
                          {formatCurrency(data.totalDollarValue)}
                        </span>
                        <span className={`text-xs ${isProfitable ? "text-green-600" : "text-red-600"}`}>
                          {data.totalR > 0 ? '+' : ''}{data.totalR}R
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
              
              {/* Cumulative Total Column */}
              <TableCell className="text-right">
                {monthData.monthlyTotal?.count > 0 ? (
                  <div className="flex flex-col items-end">
                    <span className={monthData.monthlyTotal.totalDollarValue > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {formatCurrency(monthData.monthlyTotal.totalDollarValue)}
                    </span>
                    <span className={`text-xs ${monthData.monthlyTotal.totalR > 0 ? "text-green-600" : "text-red-600"}`}>
                      {monthData.monthlyTotal.totalR > 0 ? '+' : ''}{monthData.monthlyTotal.totalR}R
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({monthData.monthlyTotal.count} trades)
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
          
          {/* Grand Total Row */}
          <TableRow className="border-t-2 bg-muted/20">
            <TableCell className="font-bold">All Time Total</TableCell>
            {activeCategories.map(category => (
              <TableCell key={`total-${category.id}`}></TableCell>
            ))}
            <TableCell className="text-right">
              <div className="flex flex-col items-end">
                <span className={totals.totalDollarValue > 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  {formatCurrency(totals.totalDollarValue)}
                </span>
                <span className={`text-xs font-medium ${totals.totalR > 0 ? "text-green-600" : "text-red-600"}`}>
                  {totals.totalR > 0 ? '+' : ''}{parseFloat(totals.totalR.toFixed(2))}R
                </span>
                <span className="text-xs text-muted-foreground">
                  ({totals.count} trades)
                </span>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
