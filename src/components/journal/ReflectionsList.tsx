
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Pencil, Calendar } from 'lucide-react';
import { getWeeklyReflections } from '@/utils/journalStorage';
import { WeeklyReflection } from '@/types';
import { getTradesWithMetrics } from '@/utils/tradeStorage';
import { formatCurrency } from '@/utils/calculations/formatters';

export function ReflectionsList() {
  const navigate = useNavigate();
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  const [reflectionStats, setReflectionStats] = useState<Record<string, {
    totalPnL: number,
    totalR: number
  }>>({});
  
  useEffect(() => {
    loadReflections();
    
    // Listen for storage changes to reload reflections
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'trade-journal-reflections') {
        loadReflections();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const loadReflections = () => {
    const reflectionsMap = getWeeklyReflections();
    // Convert to array and sort by date, newest first
    const reflectionsArray = Object.values(reflectionsMap);
    reflectionsArray.sort((a, b) => 
      new Date(b.weekStart || '').getTime() - new Date(a.weekStart || '').getTime()
    );
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
      
      const reflectionId = reflection.id || '';
      if (reflectionId) {
        stats[reflectionId] = { totalPnL, totalR };
      }
    });
    
    setReflectionStats(stats);
  };
  
  const handleEditReflection = (weekId: string) => {
    navigate(`/journal/${weekId}`);
  };
  
  const handleCreateNew = () => {
    navigate('/journal/new');
  };
  
  const getGradeColor = (grade: string = '') => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Weekly Trading Journal Reflections</CardTitle>
        <Button onClick={handleCreateNew}>
          <Calendar className="mr-2 h-4 w-4" />
          Current Week
        </Button>
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
                const reflectionId = reflection.id || '';
                const stats = reflectionId ? (reflectionStats[reflectionId] || { totalPnL: 0, totalR: 0 }) : { totalPnL: 0, totalR: 0 };
                return (
                  <TableRow key={reflectionId || Math.random().toString()}>
                    <TableCell>
                      {reflection.weekStart && reflection.weekEnd ? 
                        `${format(parseISO(reflection.weekStart), 'MMM d')} - ${format(parseISO(reflection.weekEnd), 'MMM d, yyyy')}` :
                        'Unknown date range'}
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
