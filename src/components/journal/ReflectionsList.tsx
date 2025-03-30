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
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';
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
  const [currentWeekId, setCurrentWeekId] = useState(() => {
    const weekStart = new Date(currentWeekDate);
    weekStart.setDate(currentWeekDate.getDate() - currentWeekDate.getDay() + (currentWeekDate.getDay() === 0 ? -6 : 1));
    return format(weekStart, 'yyyy-MM-dd');
  });
  const [hasCurrentWeekReflection, setHasCurrentWeekReflection] = useState(false);
  
  const isWeeklyView = !location.pathname.includes('/monthly');
  
  useEffect(() => {
    if (isWeeklyView) {
      loadReflections();
    }
    
    const handleStorageChange = (event: Event) => {
      if (isWeeklyView) {
        loadReflections();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('journalUpdated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('journalUpdated', handleStorageChange);
    };
  }, [isWeeklyView]);
  
  useEffect(() => {
    const weekStart = new Date(currentWeekDate);
    weekStart.setDate(currentWeekDate.getDate() - currentWeekDate.getDay() + (currentWeekDate.getDay() === 0 ? -6 : 1));
    const weekId = format(weekStart, 'yyyy-MM-dd');
    setCurrentWeekId(weekId);
    
    const reflectionsMap = getWeeklyReflections();
    setHasCurrentWeekReflection(!!reflectionsMap[weekId]);
  }, [currentWeekDate]);
  
  const loadReflections = () => {
    console.log("Loading weekly reflections...");
    const reflectionsMap = getWeeklyReflections();
    console.log("Weekly reflections map:", reflectionsMap);
    
    let reflectionsArray = Object.entries(reflectionsMap).map(([weekId, reflection]) => ({
      ...reflection,
      id: reflection.id || weekId,
      weekId: reflection.weekId || weekId
    }));
    
    const weekMap = new Map<string, WeeklyReflection>();
    reflectionsArray.forEach(reflection => {
      if (reflection.weekStart) {
        const weekKey = new Date(reflection.weekStart).toISOString().slice(0, 10);
        const existing = weekMap.get(weekKey);
        
        if (!existing || (reflection.lastUpdated && existing.lastUpdated && 
            new Date(reflection.lastUpdated) > new Date(existing.lastUpdated))) {
          weekMap.set(weekKey, reflection);
        }
      } else {
        weekMap.set(reflection.weekId, reflection);
      }
    });
    
    reflectionsArray = Array.from(weekMap.values());
    
    reflectionsArray.sort((a, b) => {
      if (a.weekStart && b.weekStart) {
        return new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime();
      }
      return new Date(b.weekId || '').getTime() - new Date(a.weekId || '').getTime();
    });
    
    console.log("Weekly reflections array after deduplication:", reflectionsArray);
    setReflections(reflectionsArray);
    
    const allTrades = getTradesWithMetrics();
    const stats: Record<string, { totalPnL: number, totalR: number }> = {};
    
    reflectionsArray.forEach(reflection => {
      let weekTrades = [];
      
      if (reflection.tradeIds && reflection.tradeIds.length > 0) {
        weekTrades = allTrades.filter(trade => 
          reflection.tradeIds?.includes(trade.id)
        );
      } else if (reflection.weekStart && reflection.weekEnd) {
        const weekStart = new Date(reflection.weekStart);
        const weekEnd = new Date(reflection.weekEnd);
        
        weekTrades = allTrades.filter(trade => {
          if (trade.exitDate) {
            const exitDate = new Date(trade.exitDate);
            return exitDate >= weekStart && exitDate <= weekEnd;
          }
          return false;
        });
      }
      
      const totalPnL = weekTrades.reduce((sum, trade) => 
        sum + (trade.metrics.profitLoss || 0), 0);
      
      const totalR = weekTrades.reduce((sum, trade) => 
        sum + (trade.metrics.riskRewardRatio || 0), 0);
      
      stats[reflection.id] = { totalPnL, totalR };
    });
    
    setReflectionStats(stats);
    
    setHasCurrentWeekReflection(!!reflectionsMap[currentWeekId]);
  };
  
  const handleEditReflection = (weekId: string) => {
    navigate(`/journal/weekly/${weekId}`);
  };
  
  const handleCreateNew = () => {
    navigate(`/journal/weekly/${currentWeekId}`);
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
  
  const weekStart = new Date(currentWeekDate);
  weekStart.setDate(currentWeekDate.getDate() - currentWeekDate.getDay() + (currentWeekDate.getDay() === 0 ? -6 : 1));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const currentWeekFormatted = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Weekly Trading Journal Reflections</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={goToPreviousWeek} className="flex items-center">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Previous Week</span>
          </Button>
          <span className="text-sm font-medium px-3 py-1 bg-primary/10 rounded-md">{currentWeekFormatted}</span>
          <Button variant="outline" onClick={goToNextWeek} className="flex items-center">
            <span className="hidden sm:inline mr-1">Next Week</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            onClick={handleCreateNew} 
            disabled={hasCurrentWeekReflection}
            title={hasCurrentWeekReflection ? "An entry already exists for this week" : "Create new reflection"}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {hasCurrentWeekReflection ? "Entry Exists" : "New Reflection"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {reflections.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              You haven't created any weekly reflections yet.
            </p>
            <Button onClick={handleCreateNew} disabled={hasCurrentWeekReflection}>
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
