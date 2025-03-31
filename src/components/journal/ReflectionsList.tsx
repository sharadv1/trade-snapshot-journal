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
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';
import { formatCurrency } from '@/utils/calculations/formatters';

export function ReflectionsList() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  const [reflectionStats, setReflectionStats] = useState<Record<string, {
    totalPnL: number,
    totalR: number,
    tradeCount: number
  }>>({});
  
  useEffect(() => {
    loadReflections();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadReflections();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('journalUpdated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('journalUpdated', handleStorageChange);
    };
  }, []);
  
  const loadReflections = () => {
    console.log("Loading weekly reflections...");
    const reflectionsMap = getWeeklyReflections();
    console.log("Weekly reflections map:", reflectionsMap);
    
    // Convert to array and sort by date
    let reflectionsArray = Object.entries(reflectionsMap).map(([weekId, reflection]) => ({
      ...reflection,
      id: reflection.id || weekId,
      weekId: weekId
    }));
    
    // Deduplicate reflections by weekStart - only keep the latest entry for each week
    const weekMap = new Map<string, WeeklyReflection>();
    reflectionsArray.forEach(reflection => {
      if (reflection.weekStart) {
        const weekKey = new Date(reflection.weekStart).toISOString().slice(0, 10); // YYYY-MM-DD
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
    
    console.log("Weekly reflections array after deduplication:", reflectionsArray);
    
    // Sort by date (newest first)
    reflectionsArray.sort((a, b) => 
      new Date(b.weekStart || '').getTime() - new Date(a.weekStart || '').getTime()
    );
    
    setReflections(reflectionsArray);
    
    // Calculate stats for each reflection
    const allTrades = getTradesWithMetrics();
    const stats: Record<string, { totalPnL: number, totalR: number, tradeCount: number }> = {};
    
    reflectionsArray.forEach(reflection => {
      // Initialize week trades array
      let weekTrades = [];
      
      // First check by date range
      if (reflection.weekStart && reflection.weekEnd) {
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
      
      // If we have explicit tradeIds, use those too
      if (reflection.tradeIds && reflection.tradeIds.length > 0) {
        const tradeIdsSet = new Set(reflection.tradeIds);
        const tradesByIds = allTrades.filter(trade => tradeIdsSet.has(trade.id));
        
        // Merge trades from date range and explicit IDs, avoiding duplicates
        const allWeekTradesMap = new Map();
        
        [...weekTrades, ...tradesByIds].forEach(trade => {
          allWeekTradesMap.set(trade.id, trade);
        });
        
        weekTrades = Array.from(allWeekTradesMap.values());
      }
      
      const totalPnL = weekTrades.reduce((sum, trade) => 
        sum + (trade.metrics.profitLoss || 0), 0);
      
      const totalR = weekTrades.reduce((sum, trade) => 
        sum + (trade.metrics.riskRewardRatio || 0), 0);
      
      stats[reflection.id] = { 
        totalPnL, 
        totalR, 
        tradeCount: weekTrades.length 
      };
    });
    
    setReflectionStats(stats);
  };
  
  const handleEditReflection = (weekId: string) => {
    if (!weekId) return;
    navigate(`/journal/weekly/${weekId}`);
  };
  
  const handleCreateNew = () => {
    // Use current date for new reflection
    const today = new Date();
    const formattedDate = format(today, 'yyyy-MM-dd');
    
    navigate(`/journal/weekly/${formattedDate}`);
  };
  
  const getGradeColor = (grade: string = '') => {
    switch(grade) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-orange-100 text-orange-800';
      case 'F': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Card className="mt-0">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Weekly Trading Journal Reflections</CardTitle>
        <div className="flex items-center space-x-2">
          <Button onClick={handleCreateNew}>
            <Calendar className="mr-2 h-4 w-4" />
            New Reflection
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {reflections.length === 0 ? (
          <div className="text-center py-8" key="empty-state">
            <p className="text-muted-foreground mb-4">
              You haven't created any weekly reflections yet.
            </p>
            <Button onClick={handleCreateNew}>
              Create Your First Weekly Reflection
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
                const reflectionId = reflection.id;
                const stats = reflectionStats[reflectionId] || { 
                  totalPnL: 0, 
                  totalR: 0, 
                  tradeCount: 0 
                };
                
                return (
                  <TableRow key={reflectionId || Math.random().toString()}>
                    <TableCell>
                      {reflection.weekStart && reflection.weekEnd ? 
                        `${format(parseISO(reflection.weekStart), 'MMM d')} - ${format(parseISO(reflection.weekEnd), 'MMM d, yyyy')}` :
                        'Unknown week'}
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
                    <TableCell>{stats.tradeCount} trades</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEditReflection(reflection.weekId)}>
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
