
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/tradeCalculations';
import { Category } from '@/hooks/useMonthlyPerformanceData';
import { PerformanceTableCell } from './PerformanceTableCell';
import { MonthPerformanceData } from '@/hooks/useMonthlyPerformanceData';

interface PerformanceDataRowProps {
  monthData: MonthPerformanceData;
  activeCategories: Category[];
}

export function PerformanceDataRow({ monthData, activeCategories }: PerformanceDataRowProps) {
  return (
    <TableRow key={monthData.month}>
      <TableCell className="font-medium">{monthData.month}</TableCell>
      
      {/* Category Cells */}
      {activeCategories.map(category => (
        <PerformanceTableCell key={category.id} data={monthData[category.id]} />
      ))}
      
      {/* Cumulative Total Cell */}
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
  );
}
