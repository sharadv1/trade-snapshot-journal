
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MonthlyReflection, WeeklyReflection } from '@/types';
import { format, parseISO } from 'date-fns';
import { toast } from '@/utils/toast';
import { deleteWeeklyReflection, deleteMonthlyReflection } from '@/utils/journalStorage';
import { ReflectionCard } from './ReflectionCard';
import { countWords, hasContent, getCurrentPeriodId } from './ReflectionUtility';

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
  // Ensure reflections is an array
  const safeReflections = Array.isArray(reflections) ? reflections : [];
  
  // Function to format date ranges for display
  const formatDateRange = (reflection: WeeklyReflection | MonthlyReflection) => {
    if (type === 'weekly') {
      const weeklyReflection = reflection as WeeklyReflection;
      if (weeklyReflection.weekStart && weeklyReflection.weekEnd) {
        try {
          const start = new Date(weeklyReflection.weekStart);
          const end = new Date(weeklyReflection.weekEnd);
          return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
        } catch (error) {
          console.error("Error formatting date range:", error);
          return 'Invalid date range';
        }
      }
      return 'Date range unavailable';
    } else {
      const monthlyReflection = reflection as MonthlyReflection;
      if (monthlyReflection.monthStart && monthlyReflection.monthEnd) {
        try {
          const start = new Date(monthlyReflection.monthStart);
          const end = new Date(monthlyReflection.monthEnd);
          return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
        } catch (error) {
          console.error("Error formatting date range:", error);
          return 'Invalid date range';
        }
      } else if (monthlyReflection.monthId) {
        try {
          const parts = monthlyReflection.monthId.split('-');
          if (parts.length === 2) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            return format(new Date(year, month, 1), 'MMMM yyyy');
          }
        } catch (error) {
          console.error("Error parsing month ID:", error);
        }
      }
      return 'Date unavailable';
    }
  };

  // Helper to get reflection ID (weekId or monthId)
  const getReflectionId = (reflection: WeeklyReflection | MonthlyReflection) => {
    if (type === 'weekly') {
      return (reflection as WeeklyReflection).weekId || reflection.id;
    } else {
      return (reflection as MonthlyReflection).monthId || reflection.id;
    }
  };
  
  // Function to handle reflection deletion
  const handleDelete = (reflectionId: string) => {
    if (type === 'weekly') {
      deleteWeeklyReflection(reflectionId);
    } else {
      deleteMonthlyReflection(reflectionId);
    }
    toast.success(`${type === 'weekly' ? 'Weekly' : 'Monthly'} reflection deleted successfully`);
    
    // Trigger UI updates
    window.dispatchEvent(new CustomEvent('journal-updated'));
  };
  
  // Function to determine if a reflection is deletable (no associated trades)
  const isDeletable = (reflection: WeeklyReflection | MonthlyReflection): boolean => {
    const stats = getStats(reflection);
    return stats.tradeCount === 0;
  };

  console.log(`Rendering ${safeReflections.length} ${type} reflections`);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {type === 'weekly' ? 'Weekly' : 'Monthly'} Reflections
        </h2>
        <div className="w-[200px]"></div>
        <Button asChild>
          <Link to={`/journal/${type}/${getCurrentPeriodId(type)}`}>
            <Plus className="mr-2 h-4 w-4" />
            New {type === 'weekly' ? 'Week' : 'Month'}
          </Link>
        </Button>
      </div>

      {safeReflections.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No {type} reflections yet. Create your first one!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {safeReflections.map((reflection) => {
            try {
              const stats = getStats(reflection);
              const dateRange = formatDateRange(reflection);
              
              // Calculate word counts
              let reflectionWordCount = 0;
              let planWordCount = 0;
              
              if (type === 'weekly') {
                const weeklyReflection = reflection as WeeklyReflection;
                reflectionWordCount = countWords(weeklyReflection.reflection);
                planWordCount = countWords(weeklyReflection.weeklyPlan);
              } else {
                const monthlyReflection = reflection as MonthlyReflection;
                reflectionWordCount = countWords(monthlyReflection.reflection);
              }
              
              // Determine if reflection has content
              const reflectionHasContent = hasContent(reflection, type, stats.hasContent);
              
              // Determine if reflection can be deleted
              const canDelete = isDeletable(reflection);
              
              const reflectionId = getReflectionId(reflection);

              return (
                <ReflectionCard
                  key={reflectionId || reflection.id || `reflection-${Math.random()}`}
                  reflection={reflection}
                  type={type}
                  stats={stats}
                  dateRange={dateRange}
                  reflectionWordCount={reflectionWordCount}
                  planWordCount={planWordCount}
                  canDelete={canDelete}
                  onDelete={handleDelete}
                  hasContent={reflectionHasContent}
                />
              );
            } catch (error) {
              console.error("Error rendering reflection card:", error, reflection);
              return null;
            }
          }).filter(Boolean)}
        </div>
      )}
    </div>
  );
}
