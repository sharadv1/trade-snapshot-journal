
import { useState, useEffect } from 'react';
import { Trade, TradeWithMetrics } from '@/types';
import { getTradeById } from '@/utils/tradeStorage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Target, Thermometer, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TradeMetrics } from '@/components/TradeMetrics';
import { format } from 'date-fns';
import { getStrategyById } from '@/utils/strategyStorage';
import { calculateTradeMetrics } from '@/utils/calculations';

interface TradeDetailModalProps {
  tradeId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TradeDetailModal({ tradeId, isOpen, onClose }: TradeDetailModalProps) {
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Get strategy name helper
  const getStrategyName = (strategyId: string | undefined): string => {
    if (!strategyId) return 'No Strategy';
    
    const strategy = getStrategyById(strategyId);
    return strategy ? strategy.name : strategyId;
  };

  useEffect(() => {
    if (tradeId && isOpen) {
      setIsLoading(true);
      const foundTrade = getTradeById(tradeId);
      setTrade(foundTrade);
      setIsLoading(false);
    } else {
      setTrade(null);
    }
  }, [tradeId, isOpen]);

  const handleFullDetailClick = () => {
    if (trade?.id) {
      onClose();
      navigate(`/trade/${trade.id}`);
    }
  };

  if (!trade) {
    return null;
  }

  const metrics = calculateTradeMetrics(trade as TradeWithMetrics);

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <div>
              <span>{trade.symbol}</span>
              <span className={`ml-3 text-sm px-2 py-1 rounded ${
                trade.direction === 'long' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {trade.direction.toUpperCase()}
              </span>
              {trade.grade && (
                <span className="ml-3 text-sm px-2 py-1 rounded bg-blue-100 text-blue-800">
                  Grade: {trade.grade}
                </span>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleFullDetailClick}
              className="flex items-center"
            >
              Full Details
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Strategy</p>
                <p className="font-medium">{getStrategyName(trade.strategy)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entry Date</p>
                <p className="font-medium">{format(new Date(trade.entryDate), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entry Price</p>
                <p className="font-medium">{trade.entryPrice}</p>
              </div>
              {trade.exitPrice && (
                <div>
                  <p className="text-sm text-muted-foreground">Exit Price</p>
                  <p className="font-medium">{trade.exitPrice}</p>
                </div>
              )}
              {trade.status === 'closed' && trade.exitDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Exit Date</p>
                  <p className="font-medium">{format(new Date(trade.exitDate), 'MMM d, yyyy')}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{trade.status === 'open' ? 'Open' : 'Closed'}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3">Trade Metrics</h3>
              <TradeMetrics trade={trade as TradeWithMetrics} />
            </div>

            {/* Post-Entry Performance section - always show if metrics exist */}
            {metrics && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Post-Entry Performance</h3>
                <div className="grid grid-cols-2 gap-4">
                  {metrics.maxFavorableExcursion > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Target className="h-4 w-4 mr-1.5 text-green-500" />
                        High Water Mark
                      </p>
                      <p className="font-medium text-green-600">${metrics.maxFavorableExcursion.toFixed(2)}</p>
                      {metrics.capturedProfitPercent > 0 && (
                        <p className="text-xs text-muted-foreground">
                          You captured {metrics.capturedProfitPercent.toFixed(0)}% of the maximum potential move
                        </p>
                      )}
                    </div>
                  )}
                  
                  {metrics.maxAdverseExcursion > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Thermometer className="h-4 w-4 mr-1.5 text-red-500" />
                        Max Drawdown
                      </p>
                      <p className="font-medium text-red-600">${metrics.maxAdverseExcursion.toFixed(2)}</p>
                      {metrics.initialRiskedAmount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {((metrics.maxAdverseExcursion / metrics.initialRiskedAmount) * 100).toFixed(0)}% of risk used
                        </p>
                      )}
                    </div>
                  )}
                  
                  {trade.status === 'closed' && trade.takeProfit && trade.targetReached !== undefined && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Target Status</p>
                      <div className="flex items-center mt-1">
                        {trade.targetReached ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1.5 text-green-500" />
                            <p className="font-medium text-green-600">Target price of {trade.takeProfit} was reached</p>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-1.5 text-orange-500" />
                            <p className="font-medium text-orange-600">
                              Target price of {trade.takeProfit} was not reached
                              {metrics.maxFavorableExcursion > 0 && metrics.profitLoss > 0 && (
                                <span className="block text-xs mt-1">
                                  You missed additional profit by exiting before your target
                                </span>
                              )}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {trade.notes && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-2">Notes</h3>
                <div className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: trade.notes }} />
              </div>
            )}

            {trade.mistakes && trade.mistakes.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-2">Mistakes</h3>
                <ul className="text-sm text-muted-foreground list-disc pl-5">
                  {trade.mistakes.map((mistake, index) => (
                    <li key={index}>{mistake}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
