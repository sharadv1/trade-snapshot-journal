
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/utils/calculations/formatters';
import { MonthlyReflection, WeeklyReflection } from '@/types';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export interface ReflectionsListProps {
  reflections: WeeklyReflection[] | MonthlyReflection[];
  type: 'weekly' | 'monthly';
  getStats: (reflection: WeeklyReflection | MonthlyReflection) => {
    pnl: number;
    rValue: number;
    tradeCount: number;
    hasContent: boolean;
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

  // Helper to get grade color class
  const getGradeColor = (grade: string) => {
    if (!grade) return '';
    
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Get current week/month ID for the "New" button
  const getCurrentPeriodId = () => {
    const today = new Date();
    return type === 'weekly' 
      ? format(today, 'yyyy-MM-dd') // Current week ID
      : format(today, 'yyyy-MM');   // Current month ID
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {type === 'weekly' ? 'Weekly' : 'Monthly'} Reflections
        </h2>
        <div className="w-[200px]"></div>
        <Button asChild>
          <Link to={`/journal/${type}/${getCurrentPeriodId()}`}>
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
            
            // For weekly reflections, check if there's content in either the weekly plan or reflection
            const hasReflectionContent = type === 'weekly' 
              ? !!(reflection as WeeklyReflection).reflection || !!(reflection as WeeklyReflection).weeklyPlan
              : !!(reflection as MonthlyReflection).reflection;
              
            // Get the grade
            const grade = type === 'weekly' 
              ? (reflection as WeeklyReflection).grade 
              : (reflection as MonthlyReflection).grade;

            return (
              <Card 
                key={id} 
                className={`hover:bg-accent/10 transition-colors ${stats.tradeCount > 0 || hasReflectionContent ? '' : 'opacity-70'}`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex justify-between">
                    <div className="flex items-center">
                      <span>{type === 'weekly' ? `Week of ${dateRange}` : `Month of ${new Date(id.toString()).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`}</span>
                      {grade && (
                        <Badge variant="outline" className={`ml-3 ${getGradeColor(grade)}`}>
                          Grade: {grade}
                        </Badge>
                      )}
                    </div>
                    <span className={stats.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(stats.pnl)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">
                      <div>Trades: {stats.tradeCount}</div>
                      <div>R-Value: {stats.rValue > 0 ? '+' : ''}{stats.rValue.toFixed(2)}R</div>
                    </div>
                    
                    <Button 
                      asChild
                      variant={hasReflectionContent ? "outline" : "default"}
                      size="sm"
                      className={hasReflectionContent ? "border-blue-400 hover:bg-blue-50 hover:text-blue-600" : "bg-green-600 hover:bg-green-700"}
                    >
                      <Link to={`/journal/${type}/${id}`}>
                        {hasReflectionContent ? (
                          <>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Reflection
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Reflection
                          </>
                        )}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
