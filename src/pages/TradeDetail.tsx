import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowDown, 
  ArrowLeft, 
  ArrowUp, 
  Calendar, 
  CircleDollarSign, 
  Edit3, 
  Hash, 
  LineChart, 
  Target, 
  Trash2,
  CircleCheck,
  SplitSquareVertical,
  Calculator
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { TradeWithMetrics } from '@/types';
import { deleteTrade, getTradeById } from '@/utils/tradeStorage';
import { calculateTradeMetrics, formatCurrency, formatPercentage } from '@/utils/tradeCalculations';
import { toast } from '@/utils/toast';
import { ExitTradeForm } from '@/components/ExitTradeForm';
import { PartialExitsList } from '@/components/PartialExitsList';
import { FuturesContractDetails } from '@/components/FuturesContractDetails';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';

export default function TradeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trade, setTrade] = useState<TradeWithMetrics | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [showCalculations, setShowCalculations] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const loadTradeData = () => {
    if (!id) return;
    
    const tradeData = getTradeById(id);
    if (tradeData) {
      const metrics = calculateTradeMetrics(tradeData);
      setTrade({ ...tradeData, metrics });
      setRefreshKey(prev => prev + 1);
    } else {
      toast.error('Trade not found');
      navigate('/');
    }
  };
  
  useEffect(() => {
    loadTradeData();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'trade-journal-trades') {
        loadTradeData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    const intervalId = setInterval(loadTradeData, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [id, navigate]);
  
  const handleDeleteTrade = () => {
    if (!trade) return;
    
    if (confirm('Are you sure you want to delete this trade?')) {
      deleteTrade(trade.id);
      toast.success('Trade deleted successfully');
      navigate('/');
    }
  };

  const handleExitDialogClose = () => {
    setExitDialogOpen(false);
    loadTradeData();
  };
  
  const handleTradeUpdate = () => {
    loadTradeData();
  };

  const toggleCalculations = () => {
    setShowCalculations(!showCalculations);
  };
  
  if (!trade) {
    return (
      <div className="py-8 text-center">
        <p>Loading trade details...</p>
      </div>
    );
  }

  const totalExitedQuantity = (trade.partialExits || []).reduce(
    (total, exit) => total + exit.quantity, 
    0
  );
  
  const remainingQuantity = trade.quantity - totalExitedQuantity;

  const displayExitPrice = trade.metrics.weightedExitPrice || trade.exitPrice;
  const displayExitDate = trade.metrics.latestExitDate || trade.exitDate;

  return (
    <div className="py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <Button
            variant="outline"
            size="sm"
            className="mb-3"
            asChild
          >
            <Link to="/">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Journal
            </Link>
          </Button>
          
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {trade.symbol}
            </h1>
            <div className={cn(
              "p-2 rounded",
              trade.direction === 'long'
                ? "bg-profit/10 text-profit"
                : "bg-loss/10 text-loss"
            )}>
              {trade.direction === 'long' ? (
                <ArrowUp className="h-5 w-5" />
              ) : (
                <ArrowDown className="h-5 w-5" />
              )}
            </div>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-sm",
              trade.status === 'open'
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "bg-muted text-muted-foreground"
            )}>
              {trade.status === 'open' ? 'Open' : 'Closed'}
            </span>
          </div>
          
          <div className="text-muted-foreground mt-1">
            {trade.type.charAt(0).toUpperCase() + trade.type.slice(1)} • {trade.quantity} {trade.type === 'futures' ? 'contracts' : 'shares'}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {trade.status === 'open' && remainingQuantity > 0 && (
            <Dialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">
                  <CircleCheck className="mr-1 h-4 w-4" />
                  Exit Position
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md p-0">
                <DialogTitle className="sr-only">Exit Position</DialogTitle>
                <ExitTradeForm 
                  trade={trade} 
                  onClose={handleExitDialogClose}
                  onUpdate={handleTradeUpdate}
                />
              </DialogContent>
            </Dialog>
          )}
          
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link to={`/trade/edit/${trade.id}`}>
              <Edit3 className="mr-1 h-4 w-4" />
              Edit
            </Link>
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteTrade}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-4">
              <Card className="shadow-subtle border">
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                          <Calendar className="mr-1.5 h-4 w-4" />
                          Entry Date & Time
                        </h3>
                        <p className="mt-1">
                          {new Date(trade.entryDate).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                          <CircleDollarSign className="mr-1.5 h-4 w-4" />
                          Entry Price
                        </h3>
                        <p className="mt-1 font-mono">
                          {formatCurrency(trade.entryPrice)}
                        </p>
                      </div>
                      
                      {trade.stopLoss && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                            <Target className="mr-1.5 h-4 w-4 text-loss" />
                            Stop Loss
                          </h3>
                          <p className="mt-1 font-mono text-loss">
                            {formatCurrency(trade.stopLoss)}
                          </p>
                        </div>
                      )}
                      
                      {trade.strategy && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Strategy
                          </h3>
                          <p className="mt-1">
                            {trade.strategy}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {trade.status === 'closed' && displayExitDate && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                            <Calendar className="mr-1.5 h-4 w-4" />
                            Exit Date & Time
                          </h3>
                          <p className="mt-1">
                            {new Date(displayExitDate).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {trade.partialExits && trade.partialExits.length > 1 && (
                              <span className="text-xs ml-2 text-muted-foreground">(latest exit)</span>
                            )}
                          </p>
                        </div>
                      )}
                      
                      {(trade.status === 'closed' || totalExitedQuantity > 0) && displayExitPrice && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                            <CircleDollarSign className="mr-1.5 h-4 w-4" />
                            {trade.partialExits && trade.partialExits.length > 1 ? 'Avg. Exit Price' : 'Exit Price'}
                          </h3>
                          <p className="mt-1 font-mono">
                            {formatCurrency(displayExitPrice)}
                            {trade.partialExits && trade.partialExits.length > 1 && (
                              <span className="text-xs ml-2 text-muted-foreground">(weighted avg.)</span>
                            )}
                          </p>
                        </div>
                      )}
                      
                      {trade.takeProfit && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                            <Target className="mr-1.5 h-4 w-4 text-profit" />
                            Take Profit
                          </h3>
                          <p className="mt-1 font-mono text-profit">
                            {formatCurrency(trade.takeProfit)}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                          <Hash className="mr-1.5 h-4 w-4" />
                          Quantity
                        </h3>
                        <p className="mt-1">
                          {trade.quantity} {trade.type === 'futures' ? 'contracts' : 'shares'}
                          {trade.partialExits && trade.partialExits.length > 0 && (
                            <span className="text-sm text-muted-foreground ml-2">
                              ({remainingQuantity} remaining)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {trade.type === 'futures' && trade.contractDetails && (
                    <>
                      <Separator />
                      
                      <div>
                        <h3 className="text-sm font-medium mb-3">Contract Details</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-muted/50 p-3 rounded-md">
                            <h4 className="text-xs text-muted-foreground mb-1">Exchange</h4>
                            <p className="font-medium">{trade.contractDetails.exchange}</p>
                          </div>
                          
                          <div className="bg-muted/50 p-3 rounded-md">
                            <h4 className="text-xs text-muted-foreground mb-1">Contract Size</h4>
                            <p className="font-medium">{trade.contractDetails.contractSize}</p>
                          </div>
                          
                          <div className="bg-muted/50 p-3 rounded-md">
                            <h4 className="text-xs text-muted-foreground mb-1">Tick Size</h4>
                            <p className="font-medium">{trade.contractDetails.tickSize}</p>
                          </div>
                          
                          <div className="bg-muted/50 p-3 rounded-md">
                            <h4 className="text-xs text-muted-foreground mb-1">Tick Value</h4>
                            <p className="font-medium">${trade.contractDetails.tickValue}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {(trade.status === 'closed' || (trade.partialExits && trade.partialExits.length > 0)) && (
                    <>
                      <Separator />
                      
                      <div>
                        <h3 className="text-sm font-medium mb-3">Performance</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-muted/50 p-3 rounded-md">
                            <h4 className="text-xs text-muted-foreground mb-1">P&L</h4>
                            <p className={cn(
                              "font-mono font-medium",
                              trade.metrics.profitLoss >= 0 ? "text-profit" : "text-loss"
                            )}>
                              {formatCurrency(trade.metrics.profitLoss)}
                            </p>
                          </div>
                          
                          <div className="bg-muted/50 p-3 rounded-md">
                            <h4 className="text-xs text-muted-foreground mb-1">P&L %</h4>
                            <p className={cn(
                              "font-mono font-medium",
                              trade.metrics.profitLossPercentage >= 0 ? "text-profit" : "text-loss"
                            )}>
                              {trade.metrics.profitLossPercentage >= 0 ? '+' : ''}
                              {formatPercentage(trade.metrics.profitLossPercentage)}
                            </p>
                          </div>
                          
                          {trade.metrics.riskRewardRatio && (
                            <div className="bg-muted/50 p-3 rounded-md">
                              <h4 className="text-xs text-muted-foreground mb-1">R:R Ratio</h4>
                              <p className="font-mono font-medium">
                                {trade.metrics.riskRewardRatio.toFixed(2)}
                              </p>
                            </div>
                          )}
                          
                          {trade.metrics.riskedAmount && (
                            <div className="bg-muted/50 p-3 rounded-md">
                              <h4 className="text-xs text-muted-foreground mb-1">Risk Amount</h4>
                              <p className="font-mono font-medium">
                                {formatCurrency(trade.metrics.riskedAmount)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                  
                  {trade.metrics.riskedAmount && trade.metrics.calculationExplanation && (
                    <>
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium">Risk/Reward Calculation</h3>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={toggleCalculations} 
                          className="flex items-center gap-1"
                        >
                          <Calculator className="h-4 w-4" />
                          {showCalculations ? 'Hide Calculations' : 'Show Calculations'}
                        </Button>
                      </div>
                      
                      {showCalculations && (
                        <div className="bg-muted/30 p-4 rounded-md font-mono text-sm whitespace-pre-wrap">
                          {trade.metrics.calculationExplanation}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {trade.partialExits && trade.partialExits.length > 0 && (
                <div className="mt-6">
                  <PartialExitsList 
                    trade={trade} 
                    onUpdate={handleTradeUpdate} 
                  />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="notes" className="mt-4">
              <Card className="shadow-subtle border">
                <CardHeader>
                  <CardTitle className="text-lg">Trade Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {trade.notes ? (
                    <div className="whitespace-pre-wrap">
                      {trade.notes}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">
                      No notes were added for this trade.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="images" className="mt-4">
              <Card className="shadow-subtle border">
                <CardHeader>
                  <CardTitle className="text-lg">Trade Images</CardTitle>
                </CardHeader>
                <CardContent>
                  {trade.images && trade.images.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {trade.images.map((image, index) => (
                        <div
                          key={index}
                          className="block border rounded-md overflow-hidden hover:shadow-elevated transition-all cursor-pointer"
                          onClick={() => setViewingImage(image)}
                        >
                          <img 
                            src={image} 
                            alt={`Trade image ${index + 1}`} 
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">
                      No images were added for this trade.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="space-y-6">
          <Card className="shadow-subtle border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Trade Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {trade.status === 'closed' || (trade.partialExits && trade.partialExits.length > 0) ? (
                <div className="space-y-3">
                  <div className={cn(
                    "py-6 px-4 rounded-md text-center",
                    trade.metrics.profitLoss >= 0 
                      ? "bg-profit/10 text-profit" 
                      : "bg-loss/10 text-loss"
                  )}>
                    <div className="text-sm font-medium">Profit / Loss</div>
                    <div className="text-2xl font-bold mt-1">
                      {formatCurrency(trade.metrics.profitLoss)}
                    </div>
                    <div className="text-sm">
                      {trade.metrics.profitLossPercentage >= 0 ? '+' : ''}
                      {formatPercentage(trade.metrics.profitLossPercentage)}
                    </div>
                  </div>
                  
                  {trade.metrics.riskRewardRatio && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-xs text-muted-foreground">Risk</div>
                        <div className="font-medium mt-1">
                          {formatCurrency(trade.metrics.riskedAmount || 0)}
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-xs text-muted-foreground">R:R Ratio</div>
                        <div className="font-medium mt-1">
                          {trade.metrics.riskRewardRatio.toFixed(2)}:1
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="py-6 px-4 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-center">
                    <div className="text-sm font-medium">Open Position</div>
                    <div className="text-2xl font-bold mt-1">
                      {formatCurrency(trade.entryPrice * trade.quantity)}
                    </div>
                    <div className="text-sm">
                      {trade.quantity} × {formatCurrency(trade.entryPrice)}
                    </div>
                  </div>
                  
                  {trade.metrics.riskedAmount && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-xs text-muted-foreground">Risk</div>
                        <div className="font-medium mt-1">
                          {formatCurrency(trade.metrics.riskedAmount)}
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-xs text-muted-foreground">Potential Gain</div>
                        <div className="font-medium mt-1">
                          {trade.metrics.maxPotentialGain 
                            ? formatCurrency(trade.metrics.maxPotentialGain)
                            : 'Not set'
                          }
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <Button className="w-full" variant="outline" asChild>
                <Link to={`/trade/edit/${trade.id}`}>
                  <Edit3 className="mr-1 h-4 w-4" />
                  Edit Trade
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="shadow-subtle border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Trade Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Entry Date:</span>
                  <span>
                    {new Date(trade.entryDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                {trade.status === 'closed' && trade.exitDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Exit Date:</span>
                    <span>
                      {new Date(trade.exitDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trade Type:</span>
                  <span>
                    {trade.type.charAt(0).toUpperCase() + trade.type.slice(1)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Direction:</span>
                  <span className={trade.direction === 'long' ? 'text-profit' : 'text-loss'}>
                    {trade.direction.charAt(0).toUpperCase() + trade.direction.slice(1)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span>
                    {trade.quantity}
                    {trade.partialExits && trade.partialExits.length > 0 && (
                      <span className="text-muted-foreground ml-1">
                        ({remainingQuantity} remaining)
                      </span>
                    )}
                  </span>
                </div>
                
                {trade.fees !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fees:</span>
                    <span>{formatCurrency(trade.fees)}</span>
                  </div>
                )}
                
                {trade.status === 'closed' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Hold Time:</span>
                    <span>
                      {trade.exitDate 
                        ? calculateHoldTime(trade.entryDate, trade.exitDate)
                        : 'N/A'
                      }
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {viewingImage && (
        <ImageViewerDialog 
          image={viewingImage} 
          isOpen={!!viewingImage} 
          onClose={() => setViewingImage(null)} 
        />
      )}
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

function calculateHoldTime(entryDate: string, exitDate: string): string {
  const entry = new Date(entryDate);
  const exit = new Date(exitDate);
  
  const diffMs = exit.getTime() - entry.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 60) {
    return `${diffMinutes} min${diffMinutes !== 1 ? 's' : ''}`;
  }
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
}
