
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/utils/calculations/formatters';
import { MonthlyReflection, WeeklyReflection } from '@/types';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, startOfWeek } from 'date-fns';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from '@/utils/toast';
import { deleteWeeklyReflection, deleteMonthlyReflection } from '@/utils/journalStorage';

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
        return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
      }
      return 'Date range unavailable';
    } else {
      const monthlyReflection = reflection as MonthlyReflection;
      if (monthlyReflection.monthStart && monthlyReflection.monthEnd) {
        const start = new Date(monthlyReflection.monthStart);
        const end = new Date(monthlyReflection.monthEnd);
        return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
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
    if (type === 'weekly') {
      const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
      return format(currentWeekStart, 'yyyy-MM-dd');
    } else {
      return format(today, 'yyyy-MM');
    }
  };

  // Check if a reflection has actual content - now respecting the isPlaceholder flag
  const hasContent = (reflection: WeeklyReflection | MonthlyReflection): boolean => {
    // First check if our stats function says it has content
    const statsHasContent = getStats(reflection).hasContent;
    
    // Also check for isPlaceholder flag
    if ('isPlaceholder' in reflection && reflection.isPlaceholder === true) {
      return false;
    }
    
    if (type === 'weekly') {
      const weeklyReflection = reflection as WeeklyReflection;
      return !!(weeklyReflection.reflection || weeklyReflection.weeklyPlan) && statsHasContent;
    } else {
      const monthlyReflection = reflection as MonthlyReflection;
      return !!monthlyReflection.reflection && statsHasContent;
    }
  };

  // Function to count words in a string, handling HTML content
  const countWords = (htmlString: string = ''): number => {
    if (!htmlString) return 0;
    
    // Remove HTML tags
    const text = htmlString.replace(/<[^>]*>/g, ' ');
    
    // Remove extra spaces and split by spaces
    const words = text.trim().replace(/\s+/g, ' ').split(' ');
    
    // Filter out empty strings
    return words.filter(word => word.length > 0).length;
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
            
            // Format date range appropriately for weekly or monthly reflections
            let dateRange;
            if (type === 'weekly') {
              const weekReflection = reflection as WeeklyReflection;
              if (weekReflection.weekStart && weekReflection.weekEnd) {
                const start = new Date(weekReflection.weekStart);
                const end = new Date(weekReflection.weekEnd);
                dateRange = `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
              } else {
                dateRange = 'Date range unavailable';
              }
            } else {
              const monthReflection = reflection as MonthlyReflection;
              if (monthReflection.monthStart) {
                const start = new Date(monthReflection.monthStart);
                dateRange = format(start, 'MMMM yyyy');
              } else if (monthReflection.monthId) {
                const parts = monthReflection.monthId.split('-');
                if (parts.length === 2) {
                  const year = parseInt(parts[0], 10);
                  const month = parseInt(parts[1], 10) - 1;
                  dateRange = format(new Date(year, month, 1), 'MMMM yyyy');
                } else {
                  dateRange = 'Date unavailable';
                }
              } else {
                dateRange = 'Date unavailable';
              }
            }
            
            // Determine if reflection has content - accounting for the isPlaceholder flag
            const reflectionHasContent = hasContent(reflection);
            
            // Get the grade
            const grade = type === 'weekly' 
              ? (reflection as WeeklyReflection).grade 
              : (reflection as MonthlyReflection).grade;

            // Check if this is explicitly marked as a placeholder
            const isPlaceholder = 'isPlaceholder' in reflection && reflection.isPlaceholder === true;
            
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
            
            // Determine if reflection can be deleted
            const canDelete = isDeletable(reflection);

            return (
              <Card 
                key={id} 
                className={`hover:bg-accent/10 transition-colors ${stats.tradeCount > 0 || reflectionHasContent ? '' : 'opacity-70'}`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex justify-between">
                    <div className="flex items-center">
                      <span>{type === 'weekly' ? `Week of ${dateRange}` : `${dateRange}`}</span>
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
                      
                      {/* Word count information */}
                      <div className="mt-2 text-xs">
                        {type === 'weekly' ? (
                          <>
                            <span>Reflection: {reflectionWordCount} words</span>
                            <span className="ml-2">Plan: {planWordCount} words</span>
                          </>
                        ) : (
                          <span>Reflection: {reflectionWordCount} words</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {canDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-500 border-red-300 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Reflection</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this {type} reflection? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-red-500 hover:bg-red-600" 
                                onClick={() => handleDelete(id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      
                      <Button 
                        asChild
                        variant={reflectionHasContent ? "outline" : "default"}
                        size="sm"
                        className={reflectionHasContent ? "border-blue-400 hover:bg-blue-50 hover:text-blue-600" : "bg-green-600 hover:bg-green-700"}
                      >
                        <Link to={`/journal/${type}/${id}`}>
                          {reflectionHasContent ? (
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
