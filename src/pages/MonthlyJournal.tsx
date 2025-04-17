
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight, Save, Loader2, ExternalLink } from 'lucide-react';
import { MonthlyReflection, TradeWithMetrics } from '@/types';
import { getMonthlyReflection, saveMonthlyReflection } from '@/utils/journal/reflectionStorage';
import { RichTextEditor } from '@/components/journal/RichTextEditor';
import { toast } from '@/utils/toast';
import { formatCurrency } from '@/utils/calculations/formatters';
import { clearTradeCache, getTradesForMonth } from '@/utils/tradeCalculations';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function MonthlyJournal() {
  const { monthId } = useParams<{ monthId: string }>();
  const navigate = useNavigate();
  const [reflection, setReflection] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [monthlyReflection, setMonthlyReflection] = useState<MonthlyReflection | null>(null);
  const [tradesForMonth, setTradesForMonth] = useState<TradeWithMetrics[]>([]);
  const [isLoadingTrades, setIsLoadingTrades] = useState<boolean>(false);
  
  const isMountedRef = useRef(true);
  
  const backupRef = React.useRef<{reflection: string, grade: string}>({
    reflection: '',
    grade: ''
  });
  
  const formattedMonth = monthId ? format(new Date(monthId), 'MMMM yyyy') : 'Unknown Month';
  
  const currentDate = monthId ? new Date(monthId) : new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  useEffect(() => {
    isMountedRef.current = true;
    
    clearTradeCache();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const goToPreviousMonth = useCallback(() => {
    if (!monthId || isSaving || isLoading) return;
    
    const date = new Date(monthId);
    date.setMonth(date.getMonth() - 1);
    const previousMonth = format(date, 'yyyy-MM');
    
    clearTradeCache();
    
    navigate(`/journal/monthly/${previousMonth}`);
  }, [navigate, monthId, isSaving, isLoading]);
  
  const goToNextMonth = useCallback(() => {
    if (!monthId || isSaving || isLoading) return;
    
    const date = new Date(monthId);
    date.setMonth(date.getMonth() + 1);
    const nextMonth = format(date, 'yyyy-MM');
    
    clearTradeCache();
    
    navigate(`/journal/monthly/${nextMonth}`);
  }, [navigate, monthId, isSaving, isLoading]);
  
  const loadReflection = useCallback(async () => {
    if (!monthId || !isMountedRef.current) return;
    
    try {
      setIsLoading(true);
      const reflectionData = await getMonthlyReflection(monthId);
      
      if (!isMountedRef.current) return;
      
      if (reflectionData) {
        setMonthlyReflection(reflectionData);
        setReflection(reflectionData.reflection || '');
        setGrade(reflectionData.grade || '');
        
        backupRef.current = {
          reflection: reflectionData.reflection || '',
          grade: reflectionData.grade || ''
        };
      } else {
        setMonthlyReflection(null);
        setReflection('');
        setGrade('');
        backupRef.current = { reflection: '', grade: '' };
      }
    } catch (error) {
      console.error('Error loading monthly reflection:', error);
      if (isMountedRef.current) {
        toast.error('Failed to load monthly reflection');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [monthId]);
  
  const loadTrades = useCallback(() => {
    if (!monthId || !isMountedRef.current) return;
    
    try {
      setIsLoadingTrades(true);
      console.log(`Loading trades for month ${monthStart.toISOString()} to ${monthEnd.toISOString()}`);
      
      const monthTrades = getTradesForMonth(monthStart, monthEnd);
      
      if (isMountedRef.current) {
        console.log(`Found ${monthTrades.length} trades for month ${monthId}`);
        setTradesForMonth(monthTrades);
        setIsLoadingTrades(false);
      }
    } catch (error) {
      console.error('Error loading trades for month:', error);
      if (isMountedRef.current) {
        setTradesForMonth([]);
        setIsLoadingTrades(false);
      }
    }
  }, [monthId, monthStart, monthEnd]);
  
  useEffect(() => {
    if (monthId) {
      loadReflection();
      loadTrades();
    }
  }, [loadReflection, loadTrades, monthId]);
  
  const handleSave = useCallback(async () => {
    if (!monthId || isSaving || !isMountedRef.current) return;
    
    setIsSaving(true);
    
    try {
      await saveMonthlyReflection(monthId, reflection, grade);
      
      if (!isMountedRef.current) return;
      
      toast.success('Monthly reflection saved successfully');
      
      backupRef.current = { reflection, grade };
      
      loadReflection();
    } catch (error) {
      console.error('Error saving monthly reflection:', error);
      if (isMountedRef.current) {
        toast.error('Failed to save monthly reflection');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [monthId, reflection, grade, isSaving, loadReflection]);
  
  const handleSaveAndReturn = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      await handleSave();
      
      clearTradeCache();
      
      navigate('/journal/monthly');
    } catch (error) {
      console.error('Error in save and return:', error);
    }
  }, [handleSave, navigate]);
  
  const navigateToTradeDetails = useCallback((tradeId: string) => {
    navigate(`/trade/${tradeId}`);
  }, [navigate]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex justify-center items-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading monthly journal...</p>
        </div>
      </div>
    );
  }
  
  const totalPnL = tradesForMonth.reduce((sum, trade) => 
    sum + (trade.metrics?.profitLoss || 0), 0);
  
  const totalR = tradesForMonth.reduce((sum, trade) => 
    sum + (trade.metrics?.rMultiple || 0), 0);
  
  const winCount = tradesForMonth.filter(trade => 
    (trade.metrics?.profitLoss || 0) > 0).length;
  
  const lossCount = tradesForMonth.filter(trade => 
    (trade.metrics?.profitLoss || 0) < 0).length;
  
  const winRate = tradesForMonth.length > 0 
    ? (winCount / tradesForMonth.length) * 100 
    : 0;
  
  const avgWin = winCount > 0 
    ? tradesForMonth.filter(t => (t.metrics?.profitLoss || 0) > 0)
        .reduce((sum, t) => sum + (t.metrics?.profitLoss || 0), 0) / winCount 
    : 0;
  
  const avgLoss = lossCount > 0 
    ? tradesForMonth.filter(t => (t.metrics?.profitLoss || 0) < 0)
        .reduce((sum, t) => sum + (t.metrics?.profitLoss || 0), 0) / lossCount 
    : 0;
  
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => {
            clearTradeCache();
            navigate('/journal/monthly');
          }}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Monthly Journal
        </Button>
        
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold">Monthly Journal</h1>
          <p className="text-muted-foreground">Reflect on your trading month.</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center my-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={goToPreviousMonth}
          className="rounded-full"
          disabled={isSaving || isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-xl font-medium text-center">
          {formattedMonth}
        </h2>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={goToNextMonth}
          className="rounded-full"
          disabled={isSaving || isLoading}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 text-center">
          <div className="bg-card/60 rounded p-3">
            <p className="text-xs text-muted-foreground mb-1">Total P&L</p>
            <p className={`text-lg font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalPnL)}
            </p>
          </div>
          
          <div className="bg-card/60 rounded p-3">
            <p className="text-xs text-muted-foreground mb-1">Total R</p>
            <p className={`text-lg font-bold ${totalR >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalR.toFixed(2)}R
            </p>
          </div>
          
          <div className="bg-card/60 rounded p-3">
            <p className="text-xs text-muted-foreground mb-1">Trades</p>
            <p className="text-lg font-bold">{tradesForMonth.length}</p>
          </div>
          
          <div className="bg-card/60 rounded p-3">
            <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
            <p className="text-lg font-bold">{winRate.toFixed(1)}%</p>
          </div>
          
          <div className="bg-card/60 rounded p-3">
            <p className="text-xs text-muted-foreground mb-1">Win/Loss</p>
            <p className="text-lg font-bold">{winCount}/{lossCount}</p>
          </div>
          
          <div className="bg-card/60 rounded p-3">
            <p className="text-xs text-muted-foreground mb-1">Avg Win</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(avgWin)}</p>
          </div>
          
          <div className="bg-card/60 rounded p-3">
            <p className="text-xs text-muted-foreground mb-1">Avg Loss</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(avgLoss)}</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-6">
          Monthly Reflection - {formattedMonth}
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-md font-medium mb-2">Reflection</h3>
            <RichTextEditor
              id="monthly-reflection"
              content={reflection}
              onChange={setReflection}
              placeholder="Write your monthly reflection here..."
            />
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-2">Month Grade</h3>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C+">C+</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="D">D</SelectItem>
                <SelectItem value="F">F</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-center">
            <Button 
              className="w-64"
              onClick={handleSaveAndReturn}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save & Return to List
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
      
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">
          Trades for {formattedMonth}
        </h2>
        
        {isLoadingTrades ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : tradesForMonth.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            No trades found for this month.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Symbol</th>
                  <th className="text-left py-2 px-4">Direction</th>
                  <th className="text-left py-2 px-4">Grade</th>
                  <th className="text-left py-2 px-4">Entry Date</th>
                  <th className="text-left py-2 px-4">Exit Date</th>
                  <th className="text-right py-2 px-4">P&L</th>
                  <th className="text-right py-2 px-4">R Value</th>
                  <th className="text-right py-2 px-4">Details</th>
                </tr>
              </thead>
              <tbody>
                {tradesForMonth.map(trade => (
                  <tr key={trade.id} className="border-b hover:bg-accent/10 cursor-pointer" onClick={() => navigateToTradeDetails(trade.id)}>
                    <td className="py-2 px-4">{trade.symbol}</td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.direction?.toUpperCase() === 'LONG' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      {trade.grade && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          trade.grade.startsWith('A') ? 'bg-green-100 text-green-800' : 
                          trade.grade.startsWith('B') ? 'bg-blue-100 text-blue-800' : 
                          trade.grade.startsWith('C') ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {trade.grade}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      {trade.entryDate ? format(new Date(trade.entryDate), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="py-2 px-4">
                      {trade.exitDate ? format(new Date(trade.exitDate), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className={`py-2 px-4 text-right ${
                      (trade.metrics?.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(trade.metrics?.profitLoss || 0)}
                    </td>
                    <td className={`py-2 px-4 text-right ${
                      (trade.metrics?.rMultiple || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(trade.metrics?.rMultiple || 0) > 0 ? '+' : ''}
                      {(trade.metrics?.rMultiple || 0).toFixed(2)}R
                    </td>
                    <td className="py-2 px-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
