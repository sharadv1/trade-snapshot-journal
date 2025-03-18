
import React from 'react';
import { TableCell } from '@/components/ui/table';
import { formatCurrency } from '@/utils/tradeCalculations';

interface PerformanceData {
  totalDollarValue: number;
  totalR: number;
  count: number;
}

interface PerformanceTableCellProps {
  data?: PerformanceData;
}

export function PerformanceTableCell({ data }: PerformanceTableCellProps) {
  if (!data || data.count === 0) {
    return <TableCell><span className="text-muted-foreground">-</span></TableCell>;
  }

  const isProfitable = data.totalDollarValue > 0;
  
  return (
    <TableCell>
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
    </TableCell>
  );
}
