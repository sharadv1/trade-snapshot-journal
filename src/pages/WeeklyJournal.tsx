import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  saveWeeklyReflection, 
  getWeeklyReflection, 
  saveMonthlyReflection, 
  getMonthlyReflection,
  getAllWeeklyReflections,
  getAllMonthlyReflections,
  getWeeklyReflectionsForMonth
} from '@/utils/journalStorage';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  parseISO,
  isValid
} from 'date-fns';
import { ArrowLeft, ArrowRight, Save, Calendar, Pencil, ChevronDown, ChevronUp, ExternalLink, Award, Download } from 'lucide-react';
import { toast } from 'sonner';
import { getTradesWithMetrics } from '@/utils/storage/tradeOperations';
import { TradeWithMetrics, WeeklyReflection } from '@/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { formatCurrency } from '@/utils/calculations/formatters';
import { WeeklySummaryMetrics } from '@/components/journal/WeeklySummaryMetrics';
import { RichTextEditor } from '@/components/journal/RichTextEditor';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TradeDetailModal } from '@/components/trade-list/TradeDetailModal';
import { generatePDFReport } from '@/components/journal/ReportGenerator';

// Make sure the component is exported as default
export default function WeeklyJournal() {
  const { weekId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [date, setDate] = useState<Date>(weekId ? parseISO(weekId) : new Date());
  const [reflection, setReflection] = useState<WeeklyReflection | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [trades, setTrades] = useState<TradeWithMetrics[]>([]);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<TradeWithMetrics | null>(null);
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
  const editorRef = useRef(null);
  
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  const weekStartFormatted = format(weekStart, 'MMM d');
  const weekEndFormatted = format(weekEnd, 'MMM d, yyyy');
  const weekRange = `${weekStartFormatted} - ${weekEndFormatted}`;
  
  const [content, setContent] = useState('');
  const [weeklyPlan, setWeeklyPlan] = useState('');
  const [grade, setGrade] = useState<string | undefined>(undefined);
  
  const [totalPnL, setTotalPnL] = useState(0);
  const [totalR, setTotalR] = useState(0);
  
  const [isMonthlyView, setIsMonthlyView] = useState(false);
  const [monthDate, setMonthDate] = useState<Date>(new Date());
  
  const [allWeeklyReflections, setAllWeeklyReflections] = useState<WeeklyReflection[]>([]);
  const [allMonthlyReflections, setAllMonthlyReflections] = useState<any[]>([]);
  
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  
  // Function to handle downloading the weekly report
  const handleDownloadReport = () => {
    if (!reflection?.weekStart || !reflection?.weekEnd) {
      toast.error("Cannot generate report: Missing week dates");
      return;
    }
    
    // Get trades for this week
    const weekStart = new Date(reflection.weekStart);
    const weekEnd = new Date(reflection.weekEnd);
    
    const weekTrades = trades.filter(trade => {
      if (trade.exitDate) {
        const exitDate = new Date(trade.exitDate);
        return exitDate >= weekStart && exitDate <= weekEnd;
      }
      return false;
    });
    
    // Format date range for the report
    const dateRange = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    
    // Show generation toast
    toast.info("Generating PDF report...");
    
    // Data for the report
    const reportData = {
      title: `Weekly Trading Report: ${dateRange}`,
      dateRange,
      trades: weekTrades,
      metrics: {
        totalPnL,
        winRate: (weekTrades.filter(trade => (trade.metrics?.profitLoss || 0) > 0).length / weekTrades.length) * 100,
        totalR,
        tradeCount: weekTrades.length,
        winningTrades: weekTrades.filter(trade => (trade.metrics?.profitLoss || 0) > 0).length,
        losingTrades: weekTrades.length - weekTrades.filter(trade => (trade.metrics?.profitLoss || 0) > 0).length
      }
    };
    
    // Generate and download the PDF report
    const filename = `trading-report-${format(weekStart, 'yyyy-MM-dd')}.pdf`;
    
    if (generatePDFReport(reportData, filename)) {
      toast.success("Trading report downloaded successfully!");
    }
  };
  
  // Function to fetch all weekly reflections
  const fetchAllWeeklyReflections = useCallback(() => {
    const reflections = getAllWeeklyReflections();
    setAllWeeklyReflections(Object.values(reflections));
  }, []);
  
  // Function to fetch all monthly reflections
  const fetchAllMonthlyReflections = useCallback(() => {
    const reflections = getAllMonthlyReflections();
    setAllMonthlyReflections(Object.values(reflections));
  }, []);
  
  // Function to handle navigation to a specific week
  const goToWeek = (newDate: Date) => {
    const newWeekId = format(newDate, 'yyyy-MM-dd');
    navigate(`/weekly-journal/${newWeekId}`);
    setDate(newDate);
  };
  
  // Function to handle navigation to the next week
  const goToNextWeek = () => {
    const nextWeek = addWeeks(date, 1);
    goToWeek(nextWeek);
  };
  
  // Function to handle navigation to the previous week
  const goToPreviousWeek = () => {
    const previousWeek = subWeeks(date, 1);
    goToWeek(previousWeek);
  };
  
  // Function to handle navigation to a specific month
  const goToMonth = (newDate: Date) => {
    const newMonthId = format(newDate, 'yyyy-MM-dd');
    navigate(`/monthly-journal/${newMonthId}`);
    setDate(newDate);
  };
  
  // Function to handle navigation to the next month
  const goToNextMonth = () => {
    const nextMonth = addMonths(monthDate, 1);
    goToMonth(nextMonth);
  };
  
  // Function to handle navigation to the previous month
  const goToPreviousMonth = () => {
    const previousMonth = subMonths(monthDate, 1);
    goToMonth(previousMonth);
  };
  
  // Function to handle saving the weekly reflection
  const handleSave = async () => {
    setIsSaving(true);
    
    const weekId = format(weekStart, 'yyyy-MM-dd');
    
    const reflectionToSave: WeeklyReflection = {
      id: reflection?.id || weekId,
      date: new Date().toISOString(),
      reflection: content,
      weeklyPlan: weeklyPlan,
      grade: grade,
      weekId: weekId,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalPnL: totalPnL,
      totalR: totalR,
      tradeIds: trades.map(trade => trade.id),
      isPlaceholder: false,
      lastUpdated: new Date().toISOString()
    };
    
    try {
      await saveWeeklyReflection(reflectionToSave);
      toast.success('Weekly reflection saved!');
      
      // Dispatch a custom event to notify other components
      window.dispatchEvent(new Event('journal-updated'));
      window.dispatchEvent(new Event('journalUpdated'));
      
      // Update the reflection state with the saved reflection
      setReflection(reflectionToSave);
    } catch (error) {
      console.error('Error saving weekly reflection:', error);
      toast.error('Failed to save weekly reflection');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Function to handle opening the trade detail modal
  const handleOpenTradeModal = (trade: TradeWithMetrics) => {
    setSelectedTrade(trade);
    setIsTradeModalOpen(true);
  };
  
  // Function to handle closing the trade detail modal
  const handleCloseTradeModal = () => {
    setSelectedTrade(null);
    setIsTradeModalOpen(false);
  };
  
  // Function to fetch the weekly reflection
  const fetchWeeklyReflection = useCallback(async () => {
    if (!weekId) {
      console.warn('No weekId provided');
      return;
    }
    
    try {
      const fetchedReflection = await getWeeklyReflection(weekId);
      if (fetchedReflection) {
        setReflection(fetchedReflection);
        setContent(fetchedReflection.reflection || '');
        setWeeklyPlan(fetchedReflection.weeklyPlan || '');
        setGrade(fetchedReflection.grade);
        console.log('Fetched weekly reflection:', fetchedReflection);
      } else {
        setReflection(null);
        setContent('');
        setWeeklyPlan('');
        setGrade(undefined);
        console.log('No weekly reflection found for weekId:', weekId);
      }
    } catch (error) {
      console.error('Error fetching weekly reflection:', error);
      toast.error('Failed to fetch weekly reflection');
    }
  }, [weekId]);
  
  // Function to fetch trades for the week
  const fetchTradesForWeek = useCallback(() => {
    const allTrades = getTradesWithMetrics();
    
    // Filter trades that exited within the week
    const weekTrades = allTrades.filter(trade => {
      if (trade.exitDate) {
        const exitDate = new Date(trade.exitDate);
        return exitDate >= weekStart && exitDate <= weekEnd;
      }
      return false;
    });
    
    setTrades(weekTrades);
    
    // Calculate total P&L and total R for the week
    const totalPnL = weekTrades.reduce((sum, trade) => sum + (trade.metrics?.profitLoss || 0), 0);
    const totalR = weekTrades.reduce((sum, trade) => sum + (trade.metrics?.rMultiple || 0), 0);
    setTotalPnL(totalPnL);
    setTotalR(totalR);
  }, [weekStart, weekEnd]);
  
  // Load data on initial render and when weekId changes
  useEffect(() => {
    fetchWeeklyReflection();
    fetchTradesForWeek();
    fetchAllWeeklyReflections();
    fetchAllMonthlyReflections();
  }, [fetchWeeklyReflection, fetchTradesForWeek, fetchAllWeeklyReflections, fetchAllMonthlyReflections]);
  
  // Function to handle grade selection
  const handleGradeChange = (value: string) => {
    setGrade(value);
  };
  
  return (
    <div className="container max-w-5xl mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">
            Weekly Trading Journal
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setIsReportDialogOpen(true)}>
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-pulse" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardDescription>
          Reflect on your trading week and plan for the next.
        </CardDescription>
        
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={goToPreviousWeek}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous Week
            </Button>
            <h2 className="text-xl font-semibold">{weekRange}</h2>
            <Button variant="ghost" size="sm" onClick={goToNextWeek}>
              Next Week
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid gap-4">
            <div>
              <Label htmlFor="reflection">Weekly Reflection</Label>
              <RichTextEditor 
                id="reflection"
                initialContent={content}
                onChange={setContent}
              />
            </div>
            
            <div>
              <Label htmlFor="weeklyPlan">Weekly Plan</Label>
              <RichTextEditor 
                id="weeklyPlan"
                initialContent={weeklyPlan}
                onChange={setWeeklyPlan}
              />
            </div>
            
            <div>
              <Label>Grade</Label>
              <Select value={grade} onValueChange={handleGradeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                  <SelectItem value="F">F</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Collapsible open={isCollapsibleOpen} onOpenChange={setIsCollapsibleOpen}>
              <CollapsibleTrigger className="w-full flex items-center justify-between p-2 border rounded-md hover:bg-secondary/50">
                Weekly Summary & Trades
                {isCollapsibleOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <WeeklySummaryMetrics totalPnL={totalPnL} totalR={totalR} trades={trades} />
                
                {trades.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Direction</TableHead>
                          <TableHead>Exit Date</TableHead>
                          <TableHead className="text-right">P/L</TableHead>
                          <TableHead className="text-right">R</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trades.map((trade) => (
                          <TableRow key={trade.id}>
                            <TableCell className="font-medium">{trade.symbol}</TableCell>
                            <TableCell>{trade.direction}</TableCell>
                            <TableCell>{trade.exitDate ? format(new Date(trade.exitDate), 'MMM d, yyyy') : 'N/A'}</TableCell>
                            <TableCell className="text-right">{formatCurrency(trade.metrics?.profitLoss || 0)}</TableCell>
                            <TableCell className="text-right">{trade.metrics?.rMultiple?.toFixed(2) || '0.00'}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleOpenTradeModal(trade)}>
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    No trades for this week.
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>
      
      <TradeDetailModal 
        isOpen={isTradeModalOpen}
        onClose={handleCloseTradeModal}
        trade={selectedTrade}
      />
      
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Download Weekly Report</DialogTitle>
            <DialogDescription>
              Generate a PDF report for this week's trading performance.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              Download a detailed report of your trading activity for the week of 
              <br />
              <strong className="text-lg">{weekRange}</strong>.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDownloadReport}>
              Download Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
