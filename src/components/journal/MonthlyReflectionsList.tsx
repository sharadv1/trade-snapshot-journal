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
import { getMonthlyReflections } from '@/utils/journalStorage';
import { MonthlyReflection } from '@/types';
import { getTradesWithMetrics } from '@/utils/tradeStorage';
import { formatCurrency } from '@/utils/calculations/formatters';

export function MonthlyReflectionsList() {
  const navigate = useNavigate();
  const [reflections, setReflections] = useState<MonthlyReflection[]>([]);
  const [reflectionStats, setReflectionStats] = useState<Record<string, {
    totalPnL: number,
    totalR: number
  }>>({});
  
  useEffect(() => {
    loadReflections();
    
    // Listen for storage changes to reload reflections
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'trade-journal-monthly-reflections') {
        loadReflections();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const loadReflections = () => {
    console.log("Loading monthly reflections...");
    const reflectionsMap = getMonthlyReflections();
    console.log("Monthly reflections map:", reflectionsMap);
    
    // Convert to array and sort by date, newest first
    let reflectionsArray = Object.entries(reflectionsMap).map(([monthId, reflection]) => ({
      ...reflection,
      id: monthId,
      monthId: monthId
    }));
    
    // Deduplicate reflections by monthStart - only keep the latest entry for each month
    const monthMap = new Map<string, MonthlyReflection>();
    reflectionsArray.forEach(reflection => {
      if (reflection.monthStart) {
        const monthKey = new Date(reflection.monthStart).toISOString().slice(0, 7); // YYYY-MM
        const existing = monthMap.get(monthKey);
        
        // Only replace if this is a newer entry or if no entry exists
        if (!existing || (reflection.lastUpdated && existing.lastUpdated && 
            new Date(reflection.lastUpdated) > new Date(existing.lastUpdated))) {
          monthMap.set(monthKey, reflection);
        }
      } else {
        // For entries without monthStart, use the monthId as the key
        monthMap.set(reflection.monthId || '', reflection);
      }
    });
    
    // Convert back to array
    reflectionsArray = Array.from(monthMap.values());
    
    reflectionsArray.sort((a, b) => 
      new Date(b.monthStart || '').getTime() - new Date(a.monthStart || '').getTime()
    );
    
    console.log("Monthly reflections array:", reflectionsArray);
    setReflections(reflectionsArray);
    
    // Calculate stats for each reflection
    const allTrades = getTradesWithMetrics();
    const stats: Record<string, { totalPnL: number, totalR: number }> = {};
    
    reflectionsArray.forEach(reflection => {
      const tradeIds = reflection.tradeIds || [];
      const monthTrades = allTrades.filter(trade => 
        tradeIds.includes(trade.id)
      );
      
      const totalPnL = monthTrades.reduce((sum, trade) => 
        sum + (trade.metrics.profitLoss || 0), 0);
      
      const totalR = monthTrades.reduce((sum, trade) => 
        sum + (trade.metrics.riskRewardRatio || 0), 0);
      
      const reflectionId = reflection.id || reflection.monthId || '';
      if (reflectionId) {
        stats[reflectionId] = { totalPnL, totalR };
      }
    });
    
    setReflectionStats(stats);
  };
  
  const handleEditReflection = (monthId: string) => {
    // Format date correctly for the route
    if (!monthId) return;
    
    // Parse the monthId to get year and month
    const [year, month] = monthId.split('-');
    if (!year || !month) return;
    
    // Create a date object for the middle of the month (15th)
    const date = new Date(parseInt(year), parseInt(month) - 1, 15);
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    console.log(`Navigating to monthly reflection detail: /journal/monthly/${formattedDate}`);
    navigate(`/journal/monthly/${formattedDate}`);
  };
  
  const handleCreateNew = () => {
    const today = new Date();
    const formattedDate = format(today, 'yyyy-MM-dd');
    navigate(`/journal/monthly/${formattedDate}`);
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
        <CardTitle>Monthly Trading Journal Reflections</CardTitle>
        <Button onClick={handleCreateNew}>
          <Calendar className="mr-2 h-4 w-4" />
          Current Month
        </Button>
      </CardHeader>
      <CardContent>
        {reflections.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              You haven't created any monthly reflections yet.
            </p>
            <Button onClick={handleCreateNew}>
              Create Your First Monthly Reflection
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>P&L</TableHead>
                <TableHead>R Value</TableHead>
                <TableHead>Trades</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reflections.map((reflection) => {
                const reflectionId = reflection.id || reflection.monthId || '';
                const stats = reflectionId ? (reflectionStats[reflectionId] || { totalPnL: 0, totalR: 0 }) : { totalPnL: 0, totalR: 0 };
                return (
                  <TableRow key={reflectionId || Math.random().toString()}>
                    <TableCell>
                      {reflection.monthStart ? 
                        format(parseISO(reflection.monthStart), 'MMMM yyyy') :
                        'Unknown month'}
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
