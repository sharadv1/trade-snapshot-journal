
import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Category } from '@/hooks/useMonthlyPerformanceData';

interface PerformanceTableHeaderProps {
  activeCategories: Category[];
}

export function PerformanceTableHeader({ activeCategories }: PerformanceTableHeaderProps) {
  return (
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
  );
}
