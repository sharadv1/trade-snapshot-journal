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
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';
import { formatCurrency } from '@/utils/calculations/formatters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function MonthlyReflectionsList() {
  const navigate = useNavigate();
  const [reflections, setReflections] = useState<MonthlyReflection[]>([]);
  const [reflectionStats, setReflectionStats] = useState<Record<string, {
    totalPnL: number,
    totalR: number,
    tradeCount: number
  }>>({});
  
  useEffect(() => {
    loadReflections();
    
    // Listen for storage changes to reload reflections
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
    console.log("Loading monthly reflections...");
    const reflectionsMap = getMonthlyReflections();
    console.log("Monthly reflections map:", reflectionsMap);
    
    // Convert to array and sort by date, newest first
    let reflectionsArray = Object.entries(reflectionsMap).map(([monthId, reflection]) => ({
      ...reflection,
      id: reflection.id || monthId, // Ensure id is always set
      monthId: monthId // Ensure monthId is always set
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
        monthMap.set(reflection.monthId, reflection);
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
    const stats: Record<string, { totalPnL: number, totalR: number, tradeCount: number }> = {};
    
    reflectionsArray.forEach(reflection => {
      // Initialize month trades array
      let monthTrades = [];
      
      // First check by date range
      if (reflection.monthStart && reflection.monthEnd) {
        const monthStart = new Date(reflection.monthStart);
        const monthEnd = new Date(reflection.monthEnd);
        
        monthTrades = allTrades.filter(trade => {
          if (trade.exitDate) {
            const exitDate = new Date(trade.exitDate);
            return exitDate >= monthStart && exitDate <= monthEnd;
          }
          return false;
        });
      }
      
      // If we have explicit tradeIds, use those too
      if (reflection.tradeIds && reflection.tradeIds.length > 0) {
        const tradeIdsSet = new Set(reflection.tradeIds);
        const tradesByIds = allTrades.filter(trade => tradeIdsSet.has(trade.id));
        
        // Merge trades from date range and explicit IDs, avoiding duplicates
        const allMonthTradesMap = new Map();
        
        [...monthTrades, ...tradesByIds].forEach(trade => {
          allMonthTradesMap.set(trade.id, trade);
        });
        
        monthTrades = Array.from(allMonthTradesMap.values());
      }
      
      const totalPnL = monthTrades.reduce((sum, trade) => 
        sum + (trade.metrics.profitLoss || 0), 0);
      
      const totalR = monthTrades.reduce((sum, trade) => 
        sum + (trade.metrics.riskRewardRatio || 0), 0);
      
      stats[reflection.id] = { 
        totalPnL, 
        totalR, 
        tradeCount: monthTrades.length 
      };
    });
    
    setReflectionStats(stats);
  };
  
  const handleEditReflection = (monthId: string) => {
    if (!monthId) return;
    
    // Use the exact monthId for navigation to ensure we go to the correct entry
    navigate(`/journal/monthly/${monthId}`);
  };
  
  const handleJumpToReflection = (monthId: string) => {
    if (!monthId) return;
    navigate(`/journal/monthly/${monthId}`);
  };
  
  const handleCreateNew = () => {
    // Use current month for new reflection
    const today = new Date();
    const formattedDate = format(today, 'yyyy-MM');
    
    // Always navigate to the monthly journal for the current month
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
        <div className="flex items-center space-x-2">
          {reflections.length > 0 && (
            <Select onValueChange={handleJumpToReflection}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Jump to reflection" />
              </SelectTrigger>
              <SelectContent>
                {reflections.map((reflection) => (
                  <SelectItem key={reflection.monthId} value={reflection.monthId}>
                    {format(parseISO(reflection.monthStart), 'MMMM yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
                const reflectionId = reflection.id;
                const stats = reflectionStats[reflectionId] || { 
                  totalPnL: 0, 
                  totalR: 0, 
                  tradeCount: 0 
                };
                
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
                    <TableCell>{stats.tradeCount} trades</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEditReflection(reflection.monthId)}>
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
