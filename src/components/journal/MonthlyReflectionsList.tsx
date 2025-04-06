import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Pencil, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { getMonthlyReflections, getAllWeeklyReflections, getWeeklyReflectionById } from '@/utils/journalStorage';
import { MonthlyReflection, WeeklyReflection } from '@/types';
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';
import { formatCurrency } from '@/utils/calculations/formatters';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

export function MonthlyReflectionsList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [reflections, setReflections] = useState<MonthlyReflection[]>([]);
  const [weeklyReflections, setWeeklyReflections] = useState<Record<string, WeeklyReflection[]>>({});
  const [reflectionStats, setReflectionStats] = useState<Record<string, {
    totalPnL: number,
    totalR: number,
    tradeCount: number
  }>>({});
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [selectedWeeklyReflection, setSelectedWeeklyReflection] = useState<WeeklyReflection | null>(null);
  const [isWeeklyDialogOpen, setIsWeeklyDialogOpen] = useState(false);
  
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
    })) as MonthlyReflection[];
    
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
    
    // Now load all weekly reflections to filter by month
    const allWeeklyReflections = getAllWeeklyReflections();
    const weeklyReflectionsByMonth: Record<string, WeeklyReflection[]> = {};
    
    // Group weekly reflections by month
    Object.values(allWeeklyReflections).forEach((weeklyReflection: any) => {
      if (weeklyReflection && weeklyReflection.weekStart) {
        try {
          const startDate = new Date(weeklyReflection.weekStart);
          const monthKey = format(startDate, 'yyyy-MM');
          
          if (!weeklyReflectionsByMonth[monthKey]) {
            weeklyReflectionsByMonth[monthKey] = [];
          }
          
          weeklyReflectionsByMonth[monthKey].push(weeklyReflection as WeeklyReflection);
        } catch (error) {
          console.error("Error processing weekly reflection:", error);
        }
      }
    });
    
    // Sort weekly reflections within each month
    Object.keys(weeklyReflectionsByMonth).forEach(monthKey => {
      weeklyReflectionsByMonth[monthKey].sort((a, b) => {
        if (!a.weekStart || !b.weekStart) return 0;
        return new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime();
      });
    });
    
    setWeeklyReflections(weeklyReflectionsByMonth);
    
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
  
  const handleEditWeeklyReflection = (weekId: string) => {
    // If we're on the monthly edit page, show the weekly reflection in a dialog
    if (location.pathname.includes('/journal/monthly/')) {
      const weeklyReflection = getWeeklyReflectionById(weekId);
      if (weeklyReflection) {
        setSelectedWeeklyReflection(weeklyReflection);
        setIsWeeklyDialogOpen(true);
      }
    } else {
      // Otherwise navigate to the weekly journal page
      if (!weekId) return;
      navigate(`/journal/weekly/${weekId}`);
    }
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
  
  const toggleMonthExpansion = (monthId: string) => {
    if (expandedMonth === monthId) {
      setExpandedMonth(null);
    } else {
      setExpandedMonth(monthId);
    }
  };
  
  const formatWeekDates = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return 'Unknown week';
    
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
    } catch (error) {
      console.error("Error formatting week dates:", error);
      return 'Invalid dates';
    }
  };
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Monthly Trading Journal Reflections</CardTitle>
            <CardDescription>View your monthly reflections and related weekly entries</CardDescription>
          </div>
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
                You haven't created any monthly reflections yet.
              </p>
              <Button onClick={handleCreateNew}>
                Create Your First Monthly Reflection
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {reflections.map((reflection) => {
                const reflectionId = reflection.id;
                const monthId = reflection.monthId;
                const monthKey = reflection.monthStart ? format(new Date(reflection.monthStart), 'yyyy-MM') : monthId.split('/')[0];
                const stats = reflectionStats[reflectionId] || { 
                  totalPnL: 0, 
                  totalR: 0, 
                  tradeCount: 0 
                };
                
                const relevantWeeklyReflections = weeklyReflections[monthKey] || [];
                const isExpanded = expandedMonth === monthId;
                
                return (
                  <Collapsible key={reflectionId} open={isExpanded} onOpenChange={() => toggleMonthExpansion(monthId)}>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted/30">
                        <Table>
                          <TableBody>
                            <TableRow className="hover:bg-muted/40 cursor-pointer" onClick={() => toggleMonthExpansion(monthId)}>
                              <TableCell className="font-medium">
                                <div className="flex items-center">
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="p-0 mr-2">
                                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                  </CollapsibleTrigger>
                                  {reflection.monthStart ? 
                                    format(parseISO(reflection.monthStart), 'MMMM yyyy') :
                                    'Unknown month'}
                                </div>
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
                                {stats.totalR > 0 ? '+' : ''}{(stats.totalR || 0).toFixed(1)}R
                              </TableCell>
                              <TableCell>{stats.tradeCount} trades</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditReflection(reflection.monthId);
                                }}>
                                  <Pencil className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      
                      <CollapsibleContent>
                        <div className="p-4 bg-background border-t">
                          <h4 className="text-sm font-medium mb-2">Weekly Reflections for This Month</h4>
                          {relevantWeeklyReflections.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Week</TableHead>
                                  <TableHead>Grade</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {relevantWeeklyReflections.map(weeklyReflection => (
                                  <TableRow key={weeklyReflection.id}>
                                    <TableCell>
                                      {formatWeekDates(weeklyReflection.weekStart, weeklyReflection.weekEnd)}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className={getGradeColor(weeklyReflection.grade)}>
                                        {weeklyReflection.grade || '-'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditWeeklyReflection(weeklyReflection.weekId);
                                        }}
                                      >
                                        <Pencil className="h-4 w-4 mr-1" />
                                        View
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <p className="text-muted-foreground text-sm">No weekly reflections found for this month.</p>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Reflection Dialog */}
      <Dialog open={isWeeklyDialogOpen} onOpenChange={setIsWeeklyDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedWeeklyReflection && selectedWeeklyReflection.weekStart ? 
                `Weekly Reflection: ${formatWeekDates(selectedWeeklyReflection.weekStart, selectedWeeklyReflection.weekEnd)}` :
                'Weekly Reflection'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedWeeklyReflection && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge variant="outline" className={getGradeColor(selectedWeeklyReflection.grade)}>
                  Grade: {selectedWeeklyReflection.grade || 'Not graded'}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsWeeklyDialogOpen(false);
                    navigate(`/journal/weekly/${selectedWeeklyReflection.weekId}`);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1">Reflection</h3>
                <div className="text-sm border rounded-md p-3 bg-muted/20">
                  {selectedWeeklyReflection.reflection || 'No reflection recorded'}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1">Weekly Plan</h3>
                <div className="text-sm border rounded-md p-3 bg-muted/20">
                  {selectedWeeklyReflection.weeklyPlan || 'No plan recorded'}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
