import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, ChevronDown, ChevronUp, Star, AlertTriangle, Ratio, Target, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { getTradeById } from '@/utils/storage/tradeOperations';
import { Button } from '@/components/ui/button';
import { Trade, TradeWithMetrics } from '@/types';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TradeCommentsList } from '@/components/journal/TradeCommentsList';
import { PartialExitsList } from '@/components/PartialExitsList';
import { calculateTradeMetrics, formatCurrency, formatPercentage } from '@/utils/calculations';
import { ContentRenderer } from '@/components/journal/ContentRenderer';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { getStrategyById } from '@/utils/strategyStorage';
import { getCurrentMaxRisk } from '@/utils/maxRiskStorage';
import { TradeMetrics } from '@/components/TradeMetrics';

const getTimeframeDisplayValue = (timeframe: string | undefined): string => {
  if (!timeframe) return '';
  
  const timeframeDisplayMap: Record<string, string> = {
    '1m': '1 Minute',
    '5m': '5 Minutes',
    '15m': '15 Minutes',
    '30m': '30 Minutes',
    '1h': '1 Hour',
    '4h': '4 Hours',
    'D': 'Daily',
    'W': 'Weekly',
    'M': 'Monthly',
    'm5': '5 Minutes (M5)',
    'm15': '15 Minutes (M15)',
    'h1': '1 Hour (H1)',
    'h4': '4 Hours (H4)',
    'd1': 'Daily (D1)',
    'w1': 'Weekly (W1)',
    'm1': 'Monthly (M1)'
  };
  
  return timeframeDisplayMap[timeframe] || timeframe;
};

export default function TradeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isOverMaxRisk, setIsOverMaxRisk] = useState(false);
  
  const getStrategyName = (strategyId: string | undefined): string => {
    if (!strategyId) return 'No Strategy';
    
    const strategy = getStrategyById(strategyId);
    return strategy ? strategy.name : strategyId;
  };
  
  const getTargetStatusDisplay = () => {
    if (!trade || !trade.status === 'closed' || !trade.takeProfit || !metrics) {
      return null;
    }
    
    const targetPrice = parseFloat(trade.takeProfit.toString());
    const entryPrice = parseFloat(trade.entryPrice.toString());
    const exitPrice = trade.exitPrice ? parseFloat(trade.exitPrice.toString()) : null;
    const direction = trade.direction === 'long' ? 1 : -1;
    
    const quantity = parseFloat(trade.quantity.toString());
    const pointValue = trade.type === 'futures' && trade.contractDetails?.tickValue 
      ? parseFloat(trade.contractDetails.tickValue.toString()) 
      : 1;
    
    let missedValue = 0;
    if (exitPrice && trade.targetReached && !trade.targetReachedBeforeExit) {
      const priceDiff = Math.abs(targetPrice - exitPrice);
      missedValue = priceDiff * quantity * pointValue;
    }
    
    if (trade.targetReached) {
      if (trade.targetReachedBeforeExit) {
        return (
          <div className="flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-1.5 text-green-500" />
            <p className="font-medium text-green-600">Target reached before exit</p>
          </div>
        );
      } else {
        return (
          <div>
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1.5 text-yellow-500" />
              <p className="font-medium text-yellow-600">Target reached after exit</p>
            </div>
            {missedValue > 0 && (
              <p className="text-xs text-muted-foreground ml-6 mt-1">
                Missed additional profit: ${missedValue.toFixed(2)}
              </p>
            )}
          </div>
        );
      }
    } else {
      return (
        <div className="flex items-center">
          <XCircle className="h-4 w-4 mr-1.5 text-orange-500" />
          <p className="font-medium text-orange-600">Target not reached</p>
        </div>
      );
    }
  };
  
  useEffect(() => {
    if (!id) {
      console.error('No trade ID provided in URL');
      setIsLoading(false);
      return;
    }
    
    const loadTrade = () => {
      console.log(`Attempting to load trade with ID: ${id}, retry: ${retryCount}`);
      const tradeData = getTradeById(id);
      if (tradeData) {
        console.log('Trade found:', tradeData.symbol);
        setTrade(tradeData);
        setIsLoading(false);
      } else {
        console.error('Trade not found with ID:', id);
        
        if (retryCount < 2) {
          console.log(`Retry ${retryCount + 1} scheduled for trade ID: ${id}`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 500);
        } else {
          setIsLoading(false);
          toast.error('Trade could not be found. It may have been deleted or not saved properly.');
        }
      }
    };
    
    loadTrade();
    
    const handleTradeUpdated = () => {
      console.log('Trade updated event received, reloading trade data');
      loadTrade();
    };
    
    document.addEventListener('trade-updated', handleTradeUpdated);
    window.addEventListener('trades-updated', handleTradeUpdated);
    
    return () => {
      document.removeEventListener('trade-updated', handleTradeUpdated);
      window.removeEventListener('trades-updated', handleTradeUpdated);
    };
  }, [id, retryCount]);
  
  useEffect(() => {
    if (trade && trade.status === 'open') {
      const metrics = calculateTradeMetrics(trade);
      const maxRisk = getCurrentMaxRisk();
      
      if (maxRisk !== null && metrics.riskedAmount > maxRisk) {
        setIsOverMaxRisk(true);
      } else {
        setIsOverMaxRisk(false);
      }
    }
  }, [trade]);
  
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <p>Loading trade details...</p>
      </div>
    );
  }
  
  if (!trade) {
    return (
      <div className="py-8 text-center">
        <p>Trade not found</p>
        <Button onClick={() => navigate('/')}>Go Back to Dashboard</Button>
      </div>
    );
  }
  
  const handleEditClick = () => {
    navigate(`/trade/${id}/edit`);
  };
  
  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageViewerOpen(true);
  };

  const handleImageClose = () => {
    setIsImageViewerOpen(false);
  };
  
  const metrics = trade ? calculateTradeMetrics(trade) : null;
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/trade/${id}`}>Trade Details</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">
            {trade.symbol} {trade.type === 'futures' ? '(Futures)' : 
                         trade.type === 'options' ? '(Options)' : 
                         trade.type === 'forex' ? '(Forex)' : 
                         '(Stock)'}
          </h1>
          <div className="flex items-center space-x-4 mt-1">
            {trade.account && (
              <span className="px-3 py-1 bg-muted rounded-full text-sm">{trade.account || 'Not specified'}</span>
            )}
            <span className="px-3 py-1 bg-muted rounded-full text-sm">{trade.status === 'closed' ? 'Closed' : 'Open'}</span>
            <span className="px-3 py-1 bg-muted rounded-full text-sm">{getStrategyName(trade.strategy)}</span>
            {trade.grade && (
              <span className="flex items-center px-3 py-1 bg-muted rounded-full text-sm">
                <Star className="h-3.5 w-3.5 mr-1 text-yellow-500 fill-yellow-500" />
                Grade: {trade.grade === 'A' ? 'A - Excellent' : 
                        trade.grade === 'B' ? 'B - Good' : 
                        trade.grade === 'C' ? 'C - Average' : 
                        trade.grade === 'D' ? 'D - Poor' : 
                        trade.grade === 'F' ? 'F - Failed' : 
                        trade.grade}
              </span>
            )}
          </div>
        </div>
        <Button onClick={handleEditClick}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Trade
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Trade Details</CardTitle>
            <CardDescription>Key information about this trade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Account</p>
                <p className="font-medium">{trade.account || 'Not specified'}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Strategy</p>
                <p className="font-medium">{getStrategyName(trade.strategy)}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Entry Date</p>
                <p className="font-medium">{format(new Date(trade.entryDate), 'MM/dd/yyyy')}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Entry Price</p>
                <p className="font-medium">{trade.entryPrice}</p>
              </div>
              
              {trade.exitDate && trade.exitPrice && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Exit Date</p>
                    <p className="font-medium">{format(new Date(trade.exitDate), 'MM/dd/yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Exit Price</p>
                    <p className="font-medium">{trade.exitPrice}</p>
                  </div>
                </>
              )}
              
              <div>
                <p className="text-sm text-muted-foreground">Quantity</p>
                <p className="font-medium">{trade.quantity}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">
                  {trade.type === 'stock' ? 'Stock' : 
                   trade.type === 'futures' ? 'Futures' : 
                   trade.type === 'options' ? 'Options' : 
                   trade.type === 'forex' ? 'Forex' : 
                   trade.type.charAt(0).toUpperCase() + trade.type.slice(1)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Direction</p>
                <p className="font-medium">{trade.direction === 'long' ? 'Long' : 'Short'}</p>
              </div>
              
              {trade.timeframe && (
                <div>
                  <p className="text-sm text-muted-foreground">Timeframe</p>
                  <p className="font-medium">{getTimeframeDisplayValue(trade.timeframe)}</p>
                </div>
              )}
              
              {trade.pspTime && (
                <div>
                  <p className="text-sm text-muted-foreground">PSP Time</p>
                  <p className="font-medium">{trade.pspTime}</p>
                </div>
              )}
              
              {trade.ssmtQuarters && (
                <div>
                  <p className="text-sm text-muted-foreground">SSMT Quarters</p>
                  <p className="font-medium">{trade.ssmtQuarters}</p>
                </div>
              )}
              
              {trade.grade && (
                <div>
                  <p className="text-sm text-muted-foreground">Grade</p>
                  <p className="font-medium">{trade.grade === 'A' ? 'A - Excellent' : 
                                            trade.grade === 'B' ? 'B - Good' : 
                                            trade.grade === 'C' ? 'C - Average' : 
                                            trade.grade === 'D' ? 'D - Poor' : 
                                            trade.grade === 'F' ? 'F - Failed' : 
                                            trade.grade}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Risk & Reward</CardTitle>
            <CardDescription>Trade performance and risk metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-y-4 mb-6">
              {trade.stopLoss && (
                <div>
                  <p className="text-sm text-muted-foreground">Current Stop Loss</p>
                  <p className="font-medium">{trade.stopLoss}</p>
                </div>
              )}
              
              {trade.initialStopLoss && (
                <div>
                  <p className="text-sm text-muted-foreground">Initial Stop Loss</p>
                  <p className="font-medium">{trade.initialStopLoss}</p>
                  <p className="text-xs text-muted-foreground">Used for R calculation</p>
                </div>
              )}
              
              {trade.takeProfit && (
                <div>
                  <p className="text-sm text-muted-foreground">Take Profit</p>
                  <p className="font-medium">{trade.takeProfit}</p>
                  {trade.status === 'closed' && trade.targetReached !== undefined && (
                    getTargetStatusDisplay()
                  )}
                </div>
              )}
              
              {trade.fees !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">Fees</p>
                  <p className="font-medium">${trade.fees.toFixed(2)}</p>
                </div>
              )}
              
              {metrics && metrics.riskedAmount !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">Current Risked Amount</p>
                  <p className="font-medium">${metrics.riskedAmount.toFixed(2)}</p>
                </div>
              )}
              
              {metrics && metrics.initialRiskedAmount !== undefined && 
               metrics.initialRiskedAmount !== metrics.riskedAmount && (
                <div>
                  <p className="text-sm text-muted-foreground">Initial Risked Amount</p>
                  <p className="font-medium">${metrics.initialRiskedAmount.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Based on initial stop</p>
                </div>
              )}
              
              {metrics && metrics.maxPotentialGain !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">Potential Reward</p>
                  <p className="font-medium">${metrics.maxPotentialGain.toFixed(2)}</p>
                </div>
              )}
              
              {metrics && metrics.riskRewardRatio !== undefined && metrics.riskRewardRatio > 0 && (
                <div className="col-span-2 bg-muted/30 p-3 rounded-md flex items-center">
                  <Ratio className="h-5 w-5 mr-2 text-primary" />
                  <div>
                    <span className="font-medium">Risk-Reward Ratio: </span>
                    <span className="font-mono">{metrics.riskRewardRatio.toFixed(2)}:1</span>
                    <p className="text-xs text-muted-foreground mt-1">Calculated using initial stop loss</p>
                  </div>
                </div>
              )}
            </div>
            
            {trade?.status === 'open' && isOverMaxRisk && (
              <Alert variant="destructive" className="mb-4 bg-destructive/10 border-destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="ml-2">
                  Warning: This trade exceeds your maximum risk threshold.
                </AlertDescription>
              </Alert>
            )}
            
            {metrics && (
              <>
                <div className="border-t pt-4 mb-4">
                  <h3 className="font-medium mb-3">Trade Results</h3>
                  <div className="grid grid-cols-2 gap-y-4">
                    {metrics.profitLoss !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">P&L</p>
                        <p className={`font-medium ${metrics.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                          ${metrics.profitLoss.toFixed(2)}
                        </p>
                      </div>
                    )}
                    
                    {metrics.profitLossPercentage !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">P&L %</p>
                        <p className={`font-medium ${metrics.profitLossPercentage >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatPercentage(metrics.profitLossPercentage)}
                        </p>
                      </div>
                    )}
                    
                    {metrics.rMultiple !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">R Multiple</p>
                        <p className={`font-medium ${metrics.rMultiple >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {metrics.rMultiple > 0 ? `+${metrics.rMultiple.toFixed(2)}` : metrics.rMultiple.toFixed(2)}R
                        </p>
                      </div>
                    )}

                    {trade.status === 'closed' && trade.takeProfit && (
                      <div>
                        <p className="text-sm text-muted-foreground">Target Status</p>
                        <div className="flex items-center">
                          {trade.targetReached === true ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                              <p className="font-medium text-green-600">Target Reached</p>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-1 text-orange-500" />
                              <p className="font-medium text-orange-600">Target Not Reached</p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4 mb-4">
                  <h3 className="font-medium mb-3 flex items-center">
                    <Target className="h-4 w-4 mr-1.5 text-blue-500" />
                    Price Excursions
                  </h3>
                  <div className="grid grid-cols-2 gap-y-4">
                    {metrics.maxFavorableExcursion > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Max Favorable</p>
                        <p className="font-medium text-green-600">
                          ${metrics.maxFavorableExcursion.toFixed(2)}
                        </p>
                        {metrics.capturedProfitPercent > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Captured {metrics.capturedProfitPercent.toFixed(0)}% of max move
                          </p>
                        )}
                      </div>
                    )}
                    
                    {metrics.maxAdverseExcursion > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Max Adverse ("Heat")</p>
                        <p className="font-medium text-red-600">
                          ${metrics.maxAdverseExcursion.toFixed(2)}
                        </p>
                        {metrics.initialRiskedAmount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {((metrics.maxAdverseExcursion / metrics.initialRiskedAmount) * 100).toFixed(0)}% of risk used
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <button 
                  className="w-full flex justify-between items-center px-4 py-2 border rounded-md"
                  onClick={() => setShowCalculationDetails(!showCalculationDetails)}
                >
                  <span>Calculation Details</span>
                  {showCalculationDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                
                {showCalculationDetails && (
                  <div className="mt-4 p-3 bg-muted/30 rounded-md text-sm whitespace-pre-wrap">
                    {metrics.calculationExplanation ? (
                      <div>
                        <div className="mb-2">
                          {metrics.calculationExplanation}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          <p>Entry: {trade.entryPrice} | Exit: {metrics.weightedExitPrice?.toFixed(4) || trade.exitPrice}</p>
                          <p>Stop Loss: {trade.stopLoss} | Risk per share: ${Math.abs(parseFloat(trade.entryPrice.toString()) - parseFloat(trade.stopLoss.toString())).toFixed(4)}</p>
                          <p>P&L: ${metrics.profitLoss.toFixed(2)} | Risked: ${metrics.riskedAmount.toFixed(2)}</p>
                          <p>R-Multiple = P&L ÷ Risked Amount = {metrics.rMultiple.toFixed(4)}</p>
                        </div>
                      </div>
                    ) : (
                      "No calculation details available."
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
        
        {trade.type === 'futures' && trade.contractDetails && (
          <Card>
            <CardHeader>
              <CardTitle>Contract Specifications</CardTitle>
              <CardDescription>Futures contract details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-4">
                {trade.contractDetails.exchange && (
                  <div>
                    <p className="text-sm text-muted-foreground">Exchange</p>
                    <p className="font-medium">{trade.contractDetails.exchange}</p>
                  </div>
                )}
                
                {trade.contractDetails.tickSize && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tick Size</p>
                    <p className="font-medium">{trade.contractDetails.tickSize}</p>
                  </div>
                )}
                
                {trade.contractDetails.contractSize && (
                  <div>
                    <p className="text-sm text-muted-foreground">Contract Size</p>
                    <p className="font-medium">{trade.contractDetails.contractSize}</p>
                  </div>
                )}
                
                {trade.contractDetails.tickValue && (
                  <div>
                    <p className="text-sm text-muted-foreground">Point Value</p>
                    <p className="font-medium">${trade.contractDetails.tickValue}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {trade.type === 'options' && trade.contractDetails && (
          <Card>
            <CardHeader>
              <CardTitle>Contract Specifications</CardTitle>
              <CardDescription>Options contract details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-4">
                {trade.contractDetails.exchange && (
                  <div>
                    <p className="text-sm text-muted-foreground">Exchange</p>
                    <p className="font-medium">{trade.contractDetails.exchange}</p>
                  </div>
                )}
                
                {trade.contractDetails.tickSize && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tick Size</p>
                    <p className="font-medium">{trade.contractDetails.tickSize}</p>
                  </div>
                )}
                
                {trade.contractDetails.contractSize && (
                  <div>
                    <p className="text-sm text-muted-foreground">Contract Size</p>
                    <p className="font-medium">{trade.contractDetails.contractSize}</p>
                  </div>
                )}
                
                {trade.contractDetails.tickValue && (
                  <div>
                    <p className="text-sm text-muted-foreground">Point Value</p>
                    <p className="font-medium">${trade.contractDetails.tickValue}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {trade.type === 'forex' && trade.contractDetails && (
          <Card>
            <CardHeader>
              <CardTitle>Contract Specifications</CardTitle>
              <CardDescription>Forex contract details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-4">
                {trade.contractDetails.exchange && (
                  <div>
                    <p className="text-sm text-muted-foreground">Exchange</p>
                    <p className="font-medium">{trade.contractDetails.exchange}</p>
                  </div>
                )}
                
                {trade.contractDetails.tickSize && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tick Size</p>
                    <p className="font-medium">{trade.contractDetails.tickSize}</p>
                  </div>
                )}
                
                {trade.contractDetails.contractSize && (
                  <div>
                    <p className="text-sm text-muted-foreground">Contract Size</p>
                    <p className="font-medium">{trade.contractDetails.contractSize}</p>
                  </div>
                )}
                
                {trade.contractDetails.tickValue && (
                  <div>
                    <p className="text-sm text-muted-foreground">Point Value</p>
                    <p className="font-medium">${trade.contractDetails.tickValue}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {trade.notes ? (
              <ContentRenderer content={trade.notes} />
            ) : (
              <p className="text-muted-foreground">No notes for this trade.</p>
            )}
          </CardContent>
        </Card>

        {trade.mistakes && trade.mistakes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Mistakes Analysis</CardTitle>
              <CardDescription>Learning from what went wrong</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {trade.mistakes.map((mistake, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {mistake}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Trade Metrics</CardTitle>
            <CardDescription>Performance and risk metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <TradeMetrics trade={trade} extended={true} />
          </CardContent>
        </Card>
      </div>
      
      {trade.partialExits && trade.partialExits.length > 0 && (
        <div className="mt-6">
          <PartialExitsList trade={trade} onUpdate={() => {}} allowEditing={false} />
        </div>
      )}
      
      {trade.images && trade.images.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Trade Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {trade.images.map((image, index) => (
                  <div 
                    key={index} 
                    className="overflow-hidden rounded-md border hover:opacity-90 transition-opacity cursor-pointer"
                    onClick={() => handleImageClick(index)}
                  >
                    <img 
                      src={image} 
                      alt={`Trade chart ${index + 1}`} 
                      className="h-auto w-full object-cover" 
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {trade.images && trade.images.length > 0 && selectedImageIndex >= 0 && (
        <ImageViewerDialog 
          images={trade.images}
          currentIndex={selectedImageIndex}
          isOpen={!!isOpen}
          onClose={handleImageClose}
          onIndexChange={setSelectedImageIndex}
          image=""
        />
      )}
    </div>
  );
}
