
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/utils/calculations/formatters';
import { MonthlyReflection, WeeklyReflection } from '@/types';

export interface ReflectionsListProps {
  reflections: WeeklyReflection[] | MonthlyReflection[];
  type: 'weekly' | 'monthly';
  getStats: (reflection: WeeklyReflection | MonthlyReflection) => {
    pnl: number;
    rValue: number;
    tradeCount: number;
  };
}

export function ReflectionsList({ reflections, type, getStats }: ReflectionsListProps) {
  // Function to format date ranges for display
  const formatDateRange = (reflection: WeeklyReflection | MonthlyReflection) => {
    if (type === 'weekly') {
      const weeklyReflection = reflection as WeeklyReflection;
      if (weeklyReflection.weekStart && weeklyReflection.weekEnd) {
        const start = new Date(weeklyReflection.weekStart);
        const end = new Date(weeklyReflection.weekEnd);
        return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
      }
      return 'Date range unavailable';
    } else {
      const monthlyReflection = reflection as MonthlyReflection;
      if (monthlyReflection.monthStart && monthlyReflection.monthEnd) {
        const start = new Date(monthlyReflection.monthStart);
        const end = new Date(monthlyReflection.monthEnd);
        return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
      }
      return 'Date range unavailable';
    }
  };

  // Helper to get reflection ID (weekId or monthId)
  const getReflectionId = (reflection: WeeklyReflection | MonthlyReflection) => {
    if (type === 'weekly') {
      return (reflection as WeeklyReflection).weekId;
    } else {
      return (reflection as MonthlyReflection).monthId;
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {type === 'weekly' ? 'Weekly' : 'Monthly'} Reflections
        </h2>
        <Button asChild>
          <Link to={`/journal/${type}/${type === 'weekly' ? 'new-week' : 'new-month'}`}>
            <Plus className="mr-2 h-4 w-4" />
            New {type === 'weekly' ? 'Week' : 'Month'}
          </Link>
        </Button>
      </div>

      {reflections.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No {type} reflections yet. Create your first one!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reflections.map((reflection) => {
            const stats = getStats(reflection);
            const id = getReflectionId(reflection);
            const dateRange = formatDateRange(reflection);

            return (
              <Link key={id} to={`/journal/${type}/${id}`}>
                <Card className="hover:bg-accent/10 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium flex justify-between">
                      <span>{type === 'weekly' ? `Week of ${dateRange}` : `Month of ${new Date(id).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`}</span>
                      <span className={stats.pnl >= 0 ? 'text-profit' : 'text-loss'}>
                        {formatCurrency(stats.pnl)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <div>Trades: {stats.tradeCount}</div>
                      <div>R-Value: {stats.rValue > 0 ? '+' : ''}{stats.rValue.toFixed(2)}R</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
