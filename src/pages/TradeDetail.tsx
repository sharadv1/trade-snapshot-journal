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
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';
import { PartialExitsList } from '@/components/PartialExitsList';
import { ExitTradeForm } from '@/components/ExitTradeForm';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getTradeIdea } from '@/utils/tradeOperations';
import { ArrowLeft, AlertTriangle, PenSquare, Trash2, CircleDollarSign, ImageIcon, Lightbulb, Calendar, Clock, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FuturesContractDetails } from '@/components/FuturesContractDetails';

export default function TradeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<TradeMetrics | null>(null);
  const [isCalculationOpen, setIsCalculationOpen] = useState(false);

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
        window.dispatchEvent(new Event('storage'));
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
      window.dispatchEvent(new Event('storage'));
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

  const isFullyExited = trade.status === 'closed' || 
    (trade.partialExits && trade.partialExits.reduce((acc, exit) => acc + exit.quantity, 0) === trade.quantity);
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const profitLoss = metrics?.profitLoss || 0;
  const riskRewardRatio = metrics?.riskRewardRatio;

  const formatTimeframe = (timeframe?: string) => {
    if (!timeframe) return 'N/A';
    return timeframe.toUpperCase();
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
            {trade.strategy || 'No Strategy'}
          </Badge>
          
          {trade.grade && (
            <Badge variant="outline" className={
              trade.grade === 'A' ? 'bg-green-100 text-green-800' :
              trade.grade === 'B' ? 'bg-blue-100 text-blue-800' :
              trade.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
              trade.grade === 'D' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }>
              <Star className="h-3 w-3 mr-1" />
              Grade: {trade.grade}
            </Badge>
          )}
          
          {trade.tags && trade.tags.map((tag, index) => (
            <Badge key={index} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Trade Details</CardTitle>
            <CardDescription>Key information about this trade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Entry Date</h3>
                  <p className="text-lg">{formatDate(trade.entryDate)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium">Entry Price</h3>
                  <p className="text-lg">{trade.entryPrice?.toFixed(2)}</p>
                </div>
                
                {trade.exitPrice && (
                  <>
                    <div>
                      <h3 className="text-sm font-medium">Exit Date</h3>
                      <p className="text-lg">{formatDate(trade.exitDate)}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium">Exit Price</h3>
                      <p className="text-lg">{trade.exitPrice.toFixed(2)}</p>
                    </div>
                  </>
                )}
                
                <div>
                  <h3 className="text-sm font-medium">Quantity</h3>
                  <p className="text-lg">{trade.quantity}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium">Type</h3>
                  <p className="text-lg capitalize">{trade.type}</p>
                </div>
                
                {trade.pspTime && (
                  <div>
                    <h3 className="text-sm font-medium">PSP Time</h3>
                    <p className="text-lg flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                      {trade.pspTime}
                    </p>
                  </div>
                )}
                
                {trade.timeframe && (
                  <div>
                    <h3 className="text-sm font-medium">Timeframe</h3>
                    <p className="text-lg flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                      {formatTimeframe(trade.timeframe)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Risk & Reward</CardTitle>
            <CardDescription>Trade performance and risk metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {trade.stopLoss && (
                  <div>
                    <h3 className="text-sm font-medium">Stop Loss</h3>
                    <p className="text-lg">{trade.stopLoss.toFixed(2)}</p>
                  </div>
                )}
                
                {trade.takeProfit && (
                  <div>
                    <h3 className="text-sm font-medium">Take Profit</h3>
                    <p className="text-lg">{trade.takeProfit.toFixed(2)}</p>
                  </div>
                )}
                
                {trade.status === 'closed' && metrics && (
                  <>
                    <div>
                      <h3 className="text-sm font-medium">P&L</h3>
                      <p className={`text-lg font-medium ${profitLoss > 0 ? 'text-green-600' : profitLoss < 0 ? 'text-red-600' : ''}`}>
                        ${profitLoss.toFixed(2)}
                      </p>
                    </div>
                    
                    {riskRewardRatio !== undefined && (
                      <div>
                        <h3 className="text-sm font-medium">R Multiple</h3>
                        <p className={`text-lg font-medium ${riskRewardRatio > 0 ? 'text-green-600' : riskRewardRatio < 0 ? 'text-red-600' : ''}`}>
                          {riskRewardRatio.toFixed(2)}R
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-sm font-medium">P&L %</h3>
                      <p className={`text-lg font-medium ${metrics.profitLossPercentage > 0 ? 'text-green-600' : metrics.profitLossPercentage < 0 ? 'text-red-600' : ''}`}>
                        {metrics.profitLossPercentage.toFixed(2)}%
                      </p>
                    </div>
                    
                    {metrics.riskedAmount && (
                      <div>
                        <h3 className="text-sm font-medium">Risked Amount</h3>
                        <p className="text-lg">${metrics.riskedAmount.toFixed(2)}</p>
                      </div>
                    )}
                    
                    {metrics.maxPotentialGain && (
                      <div>
                        <h3 className="text-sm font-medium">Reward Amount</h3>
                        <p className="text-lg">${metrics.maxPotentialGain.toFixed(2)}</p>
                      </div>
                    )}
                  </>
                )}
                
                {trade.fees !== undefined && (
                  <div>
                    <h3 className="text-sm font-medium">Fees</h3>
                    <p className="text-lg">${trade.fees.toFixed(2)}</p>
                  </div>
                )}
              </div>
              
              {metrics?.calculationExplanation && (
                <Collapsible 
                  open={isCalculationOpen} 
                  onOpenChange={setIsCalculationOpen}
                  className="mt-4"
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full flex justify-between">
                      <span>Calculation Details</span>
                      {isCalculationOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-3 mt-2 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {metrics.calculationExplanation}
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </CardContent>
        </Card>
        
        {trade.type === 'futures' && trade.contractDetails && (
          <Card>
            <CardHeader>
              <CardTitle>Contract Specifications</CardTitle>
              <CardDescription>Futures contract details</CardDescription>
            </CardHeader>
            <CardContent>
              {trade.symbol && trade.contractDetails && (
                <FuturesContractDetails
                  symbol={trade.symbol}
                  contractDetails={trade.contractDetails}
                />
              )}
            </CardContent>
          </Card>
        )}
        
        {trade.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{trade.notes}</p>
            </CardContent>
          </Card>
        )}
        
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
          <Card className="col-span-full">
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
      </div>
      
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
