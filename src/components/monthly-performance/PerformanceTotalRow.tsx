
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/tradeCalculations';
import { Category } from '@/hooks/useMonthlyPerformanceData';

interface PerformanceTotalRowProps {
  activeCategories: Category[];
  totalDollarValue: number;
  totalR: number;
  count: number;
}

export function PerformanceTotalRow({ 
  activeCategories, 
  totalDollarValue, 
  totalR, 
  count 
}: PerformanceTotalRowProps) {
  return (
    <TableRow className="border-t-2 bg-muted/20">
      <TableCell className="font-bold">All Time Total</TableCell>
      {activeCategories.map(category => (
        <TableCell key={`total-${category.id}`}></TableCell>
      ))}
      <TableCell className="text-right">
        <div className="flex flex-col items-end">
          <span className={totalDollarValue > 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
            {formatCurrency(totalDollarValue)}
          </span>
          <span className={`text-xs font-medium ${totalR > 0 ? "text-green-600" : "text-red-600"}`}>
            {totalR > 0 ? '+' : ''}{parseFloat(totalR.toFixed(2))}R
          </span>
          <span className="text-xs text-muted-foreground">
            ({count} trades)
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
}
