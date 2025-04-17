
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MonthlyReflection, WeeklyReflection } from '@/types';
import { format, parseISO } from 'date-fns';
import { toast } from '@/utils/toast';
import { deleteWeeklyReflection, deleteMonthlyReflection } from '@/utils/reflectionStorage';
import { ReflectionCard } from './ReflectionCard';
import { countWords, hasContent, getCurrentPeriodId, getReflectionStats } from '@/utils/journal/reflectionUtils';

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
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            console.warn("Invalid date in reflection:", weeklyReflection);
            return 'Invalid date range';
          }
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
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            console.warn("Invalid date in reflection:", monthlyReflection);
            return 'Invalid date range';
          }
          return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
        } catch (error) {
          console.error("Error formatting date range:", error);
          return 'Invalid date range';
        }
      } else if (monthlyReflection.monthId) {
        try {
          const date = new Date(parseInt(monthlyReflection.monthId.split('-')[0]), 
                               parseInt(monthlyReflection.monthId.split('-')[1]) - 1, 1);
          if (!isNaN(date.getTime())) {
            return format(date, 'MMMM yyyy');
          }
        } catch (error) {
          console.error("Error parsing month ID:", error);
        }
      }
      return 'Date unavailable';
    }
  };

  // Helper to get reflection ID
  const getReflectionId = (reflection: WeeklyReflection | MonthlyReflection) => {
    if (type === 'weekly') {
      return (reflection as WeeklyReflection).weekId || reflection.id;
    } else {
      return (reflection as MonthlyReflection).monthId || reflection.id;
    }
  };
  
  // Function to handle reflection deletion
  const handleDelete = async (reflectionId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!reflectionId) {
      console.error('Cannot delete reflection with empty ID');
      toast.error('Failed to delete reflection: Invalid ID');
      return;
    }
    
    try {
      if (type === 'weekly') {
        await deleteWeeklyReflection(reflectionId);
      } else {
        await deleteMonthlyReflection(reflectionId);
      }
      toast.success(`${type === 'weekly' ? 'Weekly' : 'Monthly'} reflection deleted successfully`);
      
      // Trigger UI updates
      window.dispatchEvent(new CustomEvent('journal-updated'));
    } catch (error) {
      console.error('Error deleting reflection:', error);
      toast.error(`Failed to delete ${type} reflection`);
    }
  };
  
  // Function to determine if a reflection is deletable (no associated trades)
  const isDeletable = (reflection: WeeklyReflection | MonthlyReflection): boolean => {
    const stats = getStats(reflection);
    return stats.tradeCount === 0;
  };

  console.log(`Rendering ${safeReflections.length} ${type} reflections`);

  // Check if there's any invalid data in the reflections
  const hasInvalidData = safeReflections.some(r => !r.id || (type === 'weekly' && !(r as WeeklyReflection).weekId) || 
                                            (type === 'monthly' && !(r as MonthlyReflection).monthId));
  
  // Show warning if invalid data is detected
  if (hasInvalidData) {
    console.warn("Invalid reflection data detected:", safeReflections.filter(r => !r.id || 
      (type === 'weekly' && !(r as WeeklyReflection).weekId) || 
      (type === 'monthly' && !(r as MonthlyReflection).monthId)));
  }

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

      {hasInvalidData && (
        <Card className="mb-4 border-amber-300 bg-amber-50">
          <CardContent className="py-3 flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            <p className="text-amber-700">
              Some reflections contain invalid data. This may affect display and functionality.
            </p>
          </CardContent>
        </Card>
      )}

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
            if (!reflection || typeof reflection !== 'object') {
              console.error('Invalid reflection object:', reflection);
              return null;
            }
            
            try {
              const reflectionId = getReflectionId(reflection);
              
              if (!reflectionId) {
                console.warn('Reflection has no ID:', reflection);
                return null;
              }
              
              const stats = getStats(reflection);
              const dateRange = formatDateRange(reflection);
              
              // Calculate word counts
              let reflectionWordCount = 0;
              let planWordCount = 0;
              
              if (type === 'weekly') {
                const weeklyReflection = reflection as WeeklyReflection;
                reflectionWordCount = countWords(weeklyReflection.reflection || '');
                planWordCount = countWords(weeklyReflection.weeklyPlan || '');
              } else {
                const monthlyReflection = reflection as MonthlyReflection;
                reflectionWordCount = countWords(monthlyReflection.reflection || '');
              }
              
              // Determine if reflection can be deleted
              const canDelete = isDeletable(reflection);

              return (
                <ReflectionCard
                  key={reflectionId}
                  reflection={reflection}
                  type={type}
                  stats={stats}
                  dateRange={dateRange}
                  reflectionWordCount={reflectionWordCount}
                  planWordCount={planWordCount}
                  canDelete={canDelete}
                  onDelete={handleDelete}
                  hasContent={stats.hasContent}
                />
              );
            } catch (error) {
              console.error("Error rendering reflection card:", error, reflection);
              return (
                <Card key={`error-${Math.random()}`} className="border-red-300 bg-red-50">
                  <CardContent className="py-3">
                    <p className="text-red-700">Error displaying this reflection</p>
                  </CardContent>
                </Card>
              );
            }
          }).filter(Boolean)}
        </div>
      )}
    </div>
  );
}
