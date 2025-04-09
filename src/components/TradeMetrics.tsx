
import { Trade, TradeWithMetrics } from '@/types';
import { calculateTradeMetrics } from '@/utils/calculations';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, TrendingDown, Target, AlertTriangle, 
  ChevronRight, ChevronDown, BarChart2, Thermometer
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface TradeMetricsProps {
  trade: Trade;
  extended?: boolean; // Show all metrics
}

export function TradeMetrics({ trade, extended = false }: TradeMetricsProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    if (trade) {
      const calculatedMetrics = calculateTradeMetrics(trade);
      setMetrics(calculatedMetrics);
    }
  }, [trade]);
  
  if (!metrics) return null;
  
  const {
    profitLoss,
    riskRewardRatio,
    rMultiple,
    riskedAmount,
    initialRiskedAmount,
    maxPotentialGain,
    calculationExplanation,
    maxFavorableExcursion,
    maxAdverseExcursion,
    capturedProfitPercent
  } = metrics;
  
  // If rMultiple is NaN, zero or undefined, display 'N/A'
  const rMultipleDisplay = rMultiple && !isNaN(rMultiple) ? rMultiple.toFixed(2) : 'N/A';
  
  // Format the profit/loss amount
  const formattedProfitLoss = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(profitLoss);
  
  // Determine if this trade was successful
  const isProfit = profitLoss > 0;
  const isLoss = profitLoss < 0;
  const isBigWin = rMultiple && rMultiple >= 2;
  const isBigLoss = rMultiple && rMultiple <= -1;
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Always show expanded view if extended is true
  const showExtended = extended || isExpanded;
  
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
          <p className={`text-lg font-medium ${
            isBigWin ? 'text-green-600' : 
            isBigLoss ? 'text-red-600' : 
            isProfit ? 'text-green-500' : 
            isLoss ? 'text-red-500' : ''
          }`}>
            {rMultipleDisplay}
            {isBigWin && <Badge className="ml-2 bg-green-600 hover:bg-green-700">Big Win</Badge>}
            {isBigLoss && <Badge className="ml-2 bg-red-600 hover:bg-red-700">Big Loss</Badge>}
          </p>
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
                  {riskedAmount ? `$${riskedAmount.toFixed(2)}` : 'N/A'}
                </p>
              </div>
              
              {initialRiskedAmount !== undefined && initialRiskedAmount !== riskedAmount && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1 text-amber-500" />
                    Initial Risk
                  </p>
                  <p className="text-base">
                    {initialRiskedAmount ? `$${initialRiskedAmount.toFixed(2)}` : 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">Used for R-multiple calculation</p>
                </div>
              )}
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center">
                  <Target className="h-3.5 w-3.5 mr-1 text-blue-500" />
                  Potential Gain
                </p>
                <p className="text-base">
                  {maxPotentialGain ? `$${maxPotentialGain.toFixed(2)}` : 'N/A'}
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
                <p className="text-xs text-muted-foreground">Based on initial stop loss</p>
              </div>
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
                        ${maxFavorableExcursion.toFixed(2)}
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
                        ${maxAdverseExcursion.toFixed(2)}
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
              <p>{calculationExplanation}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
