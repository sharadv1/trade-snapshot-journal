
import React from 'react';
import { Trade, TradeWithMetrics } from '@/types';
import {
  Table,
  TableBody,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useMonthlyPerformanceData } from '@/hooks/useMonthlyPerformanceData';
import { PerformanceTableHeader } from './monthly-performance/PerformanceTableHeader';
import { PerformanceDataRow } from './monthly-performance/PerformanceDataRow';
import { PerformanceTotalRow } from './monthly-performance/PerformanceTotalRow';
import { EmptyPerformanceState } from './monthly-performance/EmptyPerformanceState';

interface MonthlyPerformanceTableProps {
  trades: TradeWithMetrics[];
  isLoading?: boolean;
}

export function MonthlyPerformanceTable({ trades, isLoading = false }: MonthlyPerformanceTableProps) {
  const { monthlyData, activeCategories, totals } = useMonthlyPerformanceData(trades);

  if (isLoading) {
    return <Skeleton className="w-full h-64" />;
  }

  if (trades.length === 0) {
    return (
      <EmptyPerformanceState message="No trade data available to generate monthly performance table." />
    );
  }

  if (activeCategories.length === 0) {
    return (
      <EmptyPerformanceState message="Not enough categorized trade data to generate performance table." />
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <PerformanceTableHeader activeCategories={activeCategories} />
        <TableBody>
          {monthlyData.map(monthData => (
            <PerformanceDataRow 
              key={monthData.month} 
              monthData={monthData} 
              activeCategories={activeCategories} 
            />
          ))}
          
          <PerformanceTotalRow 
            activeCategories={activeCategories}
            totalDollarValue={totals.totalDollarValue}
            totalR={totals.totalR}
            count={totals.count}
          />
        </TableBody>
      </Table>
    </div>
  );
}
