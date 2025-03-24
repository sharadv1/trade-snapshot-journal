import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from '@/utils/toast';
import { calculateTradeMetrics } from '@/utils/tradeCalculations';
import { getTradeById, deleteTrade } from '@/utils/tradeStorage';
import { Trade, PartialExit, TradeMetrics } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';
import { TradeMetrics as TradeMetricsComponent } from '@/components/TradeMetrics';
import { PartialExitsList } from '@/components/PartialExitsList';
import { ExitTradeForm } from '@/components/ExitTradeForm';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getTradeIdea } from '@/utils/tradeOperations';
import { ArrowLeft, AlertTriangle, ArrowUpRight, PenSquare, Trash2, CircleDollarSign, ImageIcon, Lightbulb } from 'lucide-react';

import { useState as useUpdateState, useCallback } from 'react';

function useMonthlyPerformanceUpdater() {
  const [updateCounter, setUpdateCounter] = useUpdateState(0);
  
  const updateData = useCallback(() => {
    setUpdateCounter(prev => prev + 1);
    window.dispatchEvent(new Event('storage'));
  }, []);
  
  return { updateData };
}

export default function TradeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const { updateData } = useMonthlyPerformanceUpdater();
  
  const [metrics, setMetrics] = useState<TradeMetrics | null>(null);

  useEffect(() => {
    if (!id) {
      toast.error('No trade ID provided');
      navigate('/');
      return;
    }
    
    try {
      const tradeData = getTradeById(id);
      if (tradeData) {
        setTrade(tradeData);
        setMetrics(calculateTradeMetrics(tradeData));
      } else {
        toast.error('Trade not found');
        navigate('/');
      }
    } catch (error) {
      console.error('Error loading trade:', error);
      toast.error('Error loading trade details');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  const handleTradeExit = () => {
    try {
      const updatedTrade = getTradeById(id as string);
      if (updatedTrade) {
        setTrade(updatedTrade);
        setMetrics(calculateTradeMetrics(updatedTrade));
        toast.success('Trade exited successfully');
        updateData();
      }
    } catch (error) {
      console.error('Error refreshing trade after exit:', error);
      toast.error('Error refreshing trade data');
    }
    
    setIsExitDialogOpen(false);
  };

  const handleDeleteTrade = async () => {
    try {
      await deleteTrade(id as string);
      toast.success('Trade deleted successfully');
      navigate('/');
      updateData();
    } catch (error) {
      console.error('Error deleting trade:', error);
      toast.error('Error deleting trade');
    }
  };

  const viewImage = (index: number) => {
    setCurrentImageIndex(index);
    setIsImageDialogOpen(true);
  };

  const relatedIdea = trade?.ideaId ? getTradeIdea(trade.ideaId) : null;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">Loading trade details...</div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Trade Not Found</h1>
          <p className="mb-4">The trade you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const tradeWithMetrics = {
    ...trade,
    metrics: metrics || calculateTradeMetrics(trade)
  };
  
  const isFullyExited = trade.status === 'closed' || 
    (trade.partialExits && trade.partialExits.reduce((acc, exit) => acc + exit.quantity, 0) === trade.quantity);
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
        
        <div className="flex gap-2">
          {!isFullyExited && (
            <Button 
              onClick={() => setIsExitDialogOpen(true)}
              variant="outline"
              className="flex items-center gap-1"
            >
              <CircleDollarSign className="h-4 w-4" />
              <span>Exit Trade</span>
            </Button>
          )}
          
          <Button 
            onClick={() => navigate(`/trade/${id}/edit`)}
            variant="outline" 
            className="flex items-center gap-1"
          >
            <PenSquare className="h-4 w-4" />
            <span>Edit</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-1 text-destructive hover:bg-destructive/10"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </Button>
        </div>
      </div>
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {trade.symbol} {trade.direction === 'long' ? 'Long' : 'Short'}
          {trade.type === 'futures' && ' (Futures)'}
        </h1>
        
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant={trade.status === 'open' ? 'default' : 'secondary'}>
            {trade.status === 'open' ? 'Open' : 'Closed'}
          </Badge>
          
          <Badge variant="outline">
            {trade.strategy}
          </Badge>
          
          {trade.tags && trade.tags.map((tag, index) => (
            <Badge key={index} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Trade Metrics</CardTitle>
          <CardDescription>Key performance indicators for this trade</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TradeMetricsComponent trades={[tradeWithMetrics]} />
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Entry</h3>
                <p className="text-lg">
                  {trade.entryPrice?.toFixed(2)} on {formatDate(trade.entryDate)}
                </p>
              </div>
              
              {trade.exitPrice && (
                <div>
                  <h3 className="text-sm font-medium">Exit</h3>
                  <p className="text-lg">
                    {trade.exitPrice.toFixed(2)} on {formatDate(trade.exitDate)}
                  </p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium">Quantity</h3>
                <p className="text-lg">{trade.quantity}</p>
              </div>
              
              {trade.stopLoss && (
                <div>
                  <h3 className="text-sm font-medium">Stop Loss</h3>
                  <p className="text-lg">{trade.stopLoss.toFixed(2)}</p>
                </div>
              )}
              
              {trade.takeProfit && (
                <div>
                  <h3 className="text-sm font-medium">Target</h3>
                  <p className="text-lg">{trade.takeProfit.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
          
          {trade.status === 'closed' && metrics && (
            <div className="mt-6 p-4 bg-muted rounded-md">
              <h3 className="font-medium mb-2">Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">P&L</p>
                  <p className={`text-lg font-medium ${metrics.profitLoss > 0 ? 'text-green-600' : metrics.profitLoss < 0 ? 'text-red-600' : ''}`}>
                    ${metrics.profitLoss.toFixed(2)}
                  </p>
                </div>
                
                {metrics.riskRewardRatio !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">R Multiple</p>
                    <p className={`text-lg font-medium ${metrics.riskRewardRatio > 0 ? 'text-green-600' : metrics.riskRewardRatio < 0 ? 'text-red-600' : ''}`}>
                      {metrics.riskRewardRatio.toFixed(2)}R
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {trade.notes && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Notes</h3>
              <p className="whitespace-pre-line">{trade.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {trade.partialExits && trade.partialExits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Partial Exits</CardTitle>
          </CardHeader>
          <CardContent>
            <PartialExitsList 
              trade={trade}
              allowEditing={false}
              onUpdate={() => {}}
            />
          </CardContent>
        </Card>
      )}
      
      {relatedIdea && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Related Idea</CardTitle>
              <CardDescription>This trade was based on a saved idea</CardDescription>
            </div>
            <Lightbulb className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Symbol</span>
                <p className="font-medium">{relatedIdea.symbol}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Direction</span>
                <p className="font-medium capitalize">{relatedIdea.direction}</p>
              </div>
              {relatedIdea.description && (
                <div>
                  <span className="text-sm text-muted-foreground">Notes</span>
                  <p className="whitespace-pre-line">{relatedIdea.description}</p>
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full mt-2" 
                onClick={() => navigate('/ideas')}
              >
                View All Ideas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {trade.images && trade.images.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Trade Images</CardTitle>
              <CardDescription>Screenshots and charts for this trade</CardDescription>
            </div>
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {trade.images.map((image, index) => (
                <div 
                  key={index} 
                  className="aspect-square border rounded overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => viewImage(index)}
                >
                  <img 
                    src={image} 
                    alt={`Trade image ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trade? This action cannot be undone and all data including images will be permanently lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteTrade}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {trade.images && trade.images.length > 0 && isImageDialogOpen && (
        <ImageViewerDialog
          image={trade.images[currentImageIndex]}
          isOpen={isImageDialogOpen}
          onClose={() => setIsImageDialogOpen(false)}
        />
      )}
      
      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <ExitTradeForm 
            trade={trade}
            onClose={() => setIsExitDialogOpen(false)}
            onUpdate={handleTradeExit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

