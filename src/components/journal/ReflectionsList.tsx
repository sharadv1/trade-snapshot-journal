import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isValid, addWeeks, subWeeks } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Pencil, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { getWeeklyReflections } from '@/utils/journalStorage';
import { WeeklyReflection } from '@/types';
import { getTradesWithMetrics } from '@/utils/tradeStorage';
import { formatCurrency } from '@/utils/calculations/formatters';

export function ReflectionsList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  const [reflectionStats, setReflectionStats] = useState<Record<string, {
    totalPnL: number,
    totalR: number
  }>>({});
  const [currentWeekDate, setCurrentWeekDate] = useState(new Date());
  
  // Determine if we're in weekly or monthly view
  const isWeeklyView = !location.pathname.includes('/monthly');
  
  useEffect(() => {
    // Only load reflections if we're in the weekly view
    if (isWeeklyView) {
      loadReflections();
    }
    
    // Listen for storage changes to reload reflections
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'trade-journal-weekly-reflections' && isWeeklyView) {
        loadReflections();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isWeeklyView]);
  
  const loadReflections = () => {
    console.log("Loading weekly reflections...");
    const reflectionsMap = getWeeklyReflections();
    console.log("Weekly reflections map:", reflectionsMap);
    
    // Convert to array and sort by date, newest first
    let reflectionsArray = Object.entries(reflectionsMap).map(([weekId, reflection]) => ({
      ...reflection,
      id: reflection.id || weekId, // Ensure id is always set
      weekId: reflection.weekId || weekId // Ensure weekId is always set
    }));
    
    // Deduplicate reflections by weekStart - only keep the latest entry for each week
    const weekMap = new Map<string, WeeklyReflection>();
    reflectionsArray.forEach(reflection => {
      if (reflection.weekStart) {
        const weekKey = new Date(reflection.weekStart).toISOString().slice(0, 10);
        const existing = weekMap.get(weekKey);
        
        // Only replace if this is a newer entry or if no entry exists
        if (!existing || (reflection.lastUpdated && existing.lastUpdated && 
            new Date(reflection.lastUpdated) > new Date(existing.lastUpdated))) {
          weekMap.set(weekKey, reflection);
        }
      } else {
        // For entries without weekStart, use the weekId as the key
        weekMap.set(reflection.weekId, reflection);
      }
    });
    
    // Convert back to array
    reflectionsArray = Array.from(weekMap.values());
    
    reflectionsArray.sort((a, b) => {
      // Use weekStart for sorting if available
      if (a.weekStart && b.weekStart) {
        return new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime();
      }
      // Fallback to weekId if weekStart is not available
      return new Date(b.weekId || '').getTime() - new Date(a.weekId || '').getTime();
    });
    
    console.log("Weekly reflections array after deduplication:", reflectionsArray);
    setReflections(reflectionsArray);
    
    // Calculate stats for each reflection
    const allTrades = getTradesWithMetrics();
    const stats: Record<string, { totalPnL: number, totalR: number }> = {};
    
    reflectionsArray.forEach(reflection => {
      const tradeIds = reflection.tradeIds || [];
      const weekTrades = allTrades.filter(trade => 
        tradeIds.includes(trade.id)
      );
      
      const totalPnL = weekTrades.reduce((sum, trade) => 
        sum + (trade.metrics.profitLoss || 0), 0);
      
      const totalR = weekTrades.reduce((sum, trade) => 
        sum + (trade.metrics.riskRewardRatio || 0), 0);
      
      stats[reflection.id] = { totalPnL, totalR };
    });
    
    setReflectionStats(stats);
  };
  
  const handleEditReflection = (weekId: string) => {
    navigate(`/journal/${weekId}`);
  };
  
  const handleCreateNew = () => {
    const weekId = format(currentWeekDate, 'yyyy-MM-dd');
    navigate(`/journal/${weekId}`);
  };

  const goToPreviousWeek = () => {
    const newDate = subWeeks(currentWeekDate, 1);
    setCurrentWeekDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = addWeeks(currentWeekDate, 1);
    setCurrentWeekDate(newDate);
  };
  
  const getGradeColor = (grade: string = '') => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  
  const formatDateRange = (start?: string, end?: string) => {
    if (!start || !end) return 'Unknown date range';
    
    try {
      const startDate = parseISO(start);
      const endDate = parseISO(end);
      
      if (!isValid(startDate) || !isValid(endDate)) {
        return 'Invalid date range';
      }
      
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
    } catch (error) {
      console.error('Error formatting date range:', error);
      return 'Error in date range';
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Weekly Trading Journal Reflections</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={goToPreviousWeek} className="flex items-center">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Previous Week</span>
          </Button>
          <Button variant="outline" onClick={goToNextWeek} className="flex items-center">
            <span className="hidden sm:inline mr-1">Next Week</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={handleCreateNew}>
            <Calendar className="mr-2 h-4 w-4" />
            New Reflection
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {reflections.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              You haven't created any weekly reflections yet.
            </p>
            <Button onClick={handleCreateNew}>
              Create Your First Reflection
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>P&L</TableHead>
                <TableHead>R Value</TableHead>
                <TableHead>Trades</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reflections.map((reflection) => {
                const reflectionId = reflection.id || reflection.weekId || '';
                const stats = reflectionId ? (reflectionStats[reflectionId] || { totalPnL: 0, totalR: 0 }) : { totalPnL: 0, totalR: 0 };
                return (
                  <TableRow key={reflectionId || Math.random().toString()}>
                    <TableCell>
                      {formatDateRange(reflection.weekStart, reflection.weekEnd)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getGradeColor(reflection.grade)}>
                        {reflection.grade || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className={stats.totalPnL >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {formatCurrency(stats.totalPnL)}
                    </TableCell>
                    <TableCell className={stats.totalR >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {stats.totalR > 0 ? '+' : ''}{stats.totalR.toFixed(1)}R
                    </TableCell>
                    <TableCell>{(reflection.tradeIds?.length || 0)} trades</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEditReflection(reflectionId)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
