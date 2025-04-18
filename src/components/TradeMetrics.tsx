
import { Trade, TradeWithMetrics } from '@/types';
import { calculateTradeMetrics } from '@/utils/calculations';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, TrendingDown, Target, AlertTriangle, 
  ChevronRight, ChevronDown, BarChart2, Thermometer,
  CheckCircle2, XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface TradeMetricsProps {
  trade: Trade;
  extended?: boolean; // Show all metrics
}

export function TradeMetrics({ trade, extended = false }: TradeMetricsProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (trade) {
      try {
        const calculatedMetrics = calculateTradeMetrics(trade);
        setMetrics(calculatedMetrics);
        setError(null);
      } catch (err) {
        console.error("Error calculating metrics:", err);
        setError("Failed to calculate metrics");
      }
    }
  }, [trade]);
  
  if (error) {
    return (
      <div className="p-4 bg-background border rounded-lg shadow-sm">
        <div className="flex items-center text-red-600">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  if (!metrics) return null;
  
  // Safely extract metrics with fallback values to prevent undefined errors
  const {
    profitLoss = 0,
    riskRewardRatio = 0,
    rMultiple = 0,
    riskedAmount = 0,
    initialRiskedAmount = 0,
    maxPotentialGain = 0,
    calculationExplanation = '',
    maxFavorableExcursion = 0,
    maxAdverseExcursion = 0,
    capturedProfitPercent = 0
  } = metrics;
  
  // Safely format rMultiple with validation
  const rMultipleDisplay = (rMultiple !== undefined && rMultiple !== null && !isNaN(rMultiple)) ? 
    rMultiple.toFixed(2) : 'N/A';
  
  // Safely format profitLoss with validation
  const formattedProfitLoss = (() => {
    try {
      if (profitLoss !== undefined && profitLoss !== null && !isNaN(profitLoss)) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(profitLoss);
      }
      return '$0.00';
    } catch (e) {
      console.error("Error formatting profit/loss:", e);
      return '$0.00';
    }
  })();
  
  const isProfit = profitLoss > 0;
  const isLoss = profitLoss < 0;
  const isBigWin = rMultiple && rMultiple >= 2;
  const isBigLoss = rMultiple && rMultiple <= -1;
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const showExtended = extended || isExpanded;
  
  const renderTargetStatus = () => {
    if (trade.status !== 'closed' || !trade.takeProfit) {
      return null;
    }
    
    // Safely handle potentially undefined values
    if (trade.targetReached === undefined) {
      return (
        <>
          <XCircle className="h-3.5 w-3.5 mr-1 text-gray-500" />
          <p className="text-base text-gray-600">Status unknown</p>
        </>
      );
    }
    
    let missedValue = 0;
    if (trade.exitPrice && trade.targetReached === true && trade.targetReachedBeforeExit === false) {
      try {
        const targetPrice = typeof trade.takeProfit === 'string' ? parseFloat(trade.takeProfit) : trade.takeProfit;
        const exitPrice = typeof trade.exitPrice === 'string' ? parseFloat(trade.exitPrice) : trade.exitPrice;
        const quantity = typeof trade.quantity === 'string' ? parseFloat(trade.quantity.toString()) : trade.quantity;
        
        // Check for contractDetails and tickValue existence before accessing
        const pointValue = trade.type === 'futures' && trade.contractDetails?.tickValue 
          ? (typeof trade.contractDetails.tickValue === 'string' ? 
              parseFloat(trade.contractDetails.tickValue) : 
              trade.contractDetails.tickValue)
          : 1;
        
        // Safety check - ensure these are valid numbers
        if (!isNaN(targetPrice) && !isNaN(exitPrice) && !isNaN(quantity) && !isNaN(pointValue)) {
          // Account for direction (long vs short) when calculating price difference
          const directionMultiplier = trade.direction === 'long' ? 1 : -1;
          const priceDiff = Math.abs((targetPrice - exitPrice) * directionMultiplier);
          missedValue = priceDiff * quantity * pointValue;
        }
      } catch (err) {
        console.error("Error calculating missed value:", err);
        missedValue = 0;
      }
    }
    
    if (trade.targetReached === true) {
      if (trade.targetReachedBeforeExit === true) {
        return (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-green-500" />
            <p className="text-base text-green-600">Reached before exit</p>
          </>
        );
      } else {
        return (
          <div>
            <div className="flex items-center">
              <AlertTriangle className="h-3.5 w-3.5 mr-1 text-yellow-500" />
              <p className="text-base text-yellow-600">Reached after exit</p>
            </div>
            {missedValue > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Missed: ${missedValue.toFixed(2)}
              </p>
            )}
          </div>
        );
      }
    } else {
      return (
        <>
          <XCircle className="h-3.5 w-3.5 mr-1 text-orange-500" />
          <p className="text-base text-orange-600">Not Reached</p>
        </>
      );
    }
  };
  
  // Safe formatter function for numerical values - prevent toString errors
  const formatMetricValue = (value: any, prefix = '$', decimals = 2) => {
    if (value === undefined || value === null || isNaN(value)) {
      return 'N/A';
    }
    try {
      return `${prefix}${value.toFixed(decimals)}`;
    } catch (err) {
      console.error("Error formatting value:", value, err);
      return 'Error';
    }
  };
  
  return (
    <div className="p-4 bg-background border rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold flex items-center">
          <BarChart2 className="h-4 w-4 mr-1.5" />
          Trade Metrics
        </h3>
        {!extended && (
          <button 
            onClick={toggleExpand} 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Profit/Loss</p>
          <p className={`text-lg font-medium ${isProfit ? 'text-green-600' : isLoss ? 'text-red-600' : ''}`}>
            {formattedProfitLoss}
          </p>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">R-Multiple</p>
          <div className="flex items-center">
            <p className={`text-lg font-medium ${
              isBigWin ? 'text-green-600' : 
              isBigLoss ? 'text-red-600' : 
              isProfit ? 'text-green-500' : 
              isLoss ? 'text-red-500' : ''
            }`}>
              {rMultipleDisplay}
            </p>
            {isBigWin && <Badge className="ml-2 bg-green-600 hover:bg-green-700">Big Win</Badge>}
            {isBigLoss && <Badge className="ml-2 bg-red-600 hover:bg-red-700">Big Loss</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">Based on initial stop loss</p>
        </div>
      </div>
      
      {showExtended && (
        <>
          <Separator className="my-4" />
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1 text-amber-500" />
                  Current Risk
                </p>
                <p className="text-base">
                  {formatMetricValue(riskedAmount)}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1 text-amber-500" />
                  Initial Risk
                </p>
                <p className="text-base font-medium">
                  {formatMetricValue(initialRiskedAmount)}
                </p>
                <p className="text-xs text-muted-foreground">Used for R-multiple calculation</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center">
                  <Target className="h-3.5 w-3.5 mr-1 text-blue-500" />
                  Potential Gain
                </p>
                <p className="text-base">
                  {formatMetricValue(maxPotentialGain)}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center">
                  <TrendingUp className="h-3.5 w-3.5 mr-1 text-indigo-500" />
                  R:R Ratio
                </p>
                <p className="text-base">
                  {riskRewardRatio ? `${riskRewardRatio.toFixed(2)}:1` : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground font-medium">Based on initial stop loss</p>
              </div>
              
              {trade.status === 'closed' && trade.takeProfit && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Target className="h-3.5 w-3.5 mr-1 text-green-500" />
                    Target Status
                  </p>
                  <div className="flex items-center">
                    {renderTargetStatus()}
                  </div>
                </div>
              )}
            </div>

            {(maxFavorableExcursion > 0 || maxAdverseExcursion > 0) && (
              <>
                <Separator className="my-4" />
                <h4 className="text-sm font-medium mb-3">Price Excursion</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  {maxFavorableExcursion > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center">
                        <TrendingUp className="h-3.5 w-3.5 mr-1 text-green-500" />
                        Max Favorable
                      </p>
                      <p className="text-base">
                        {formatMetricValue(maxFavorableExcursion)}
                      </p>
                      {capturedProfitPercent > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Captured {capturedProfitPercent.toFixed(0)}% of max move
                        </p>
                      )}
                    </div>
                  )}
                  
                  {maxAdverseExcursion > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Thermometer className="h-3.5 w-3.5 mr-1 text-red-500" />
                        Max Adverse ("Heat")
                      </p>
                      <p className="text-base">
                        {formatMetricValue(maxAdverseExcursion)}
                      </p>
                      {initialRiskedAmount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {((maxAdverseExcursion / initialRiskedAmount) * 100).toFixed(0)}% of risk used
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
            
            <div className="mt-2 text-xs text-muted-foreground">
              <p>{calculationExplanation || 'No calculation details available'}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
