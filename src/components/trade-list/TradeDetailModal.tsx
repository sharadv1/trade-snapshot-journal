
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getTradeById } from '@/utils/storage/tradeOperations';
import { Trade } from '@/types';
import { Loader2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/utils/calculations/formatters';
import { calculateTradeMetrics } from '@/utils/calculations';
import { Link } from 'react-router-dom';

interface TradeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeId?: string | null;
}

export const TradeDetailModal: React.FC<TradeDetailModalProps> = ({
  isOpen,
  onClose,
  tradeId
}) => {
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    if (isOpen && tradeId) {
      setLoading(true);
      setError(null);
      
      try {
        // Attempt to fetch trade
        console.log(`Attempting to load trade with ID: ${tradeId}, retry: ${retryCount}`);
        const fetchedTrade = getTradeById(tradeId);
        
        if (isMounted) {
          if (fetchedTrade) {
            setTrade(fetchedTrade);
            setLoading(false);
          } else {
            // If trade not found and we haven't exceeded retry attempts, schedule a retry
            if (retryCount < 2) {
              console.log(`Retry ${retryCount + 1} scheduled for trade ID: ${tradeId}`);
              setTimeout(() => {
                if (isMounted) {
                  setRetryCount(prev => prev + 1);
                }
              }, 300);
            } else {
              setError(`Trade with ID ${tradeId} could not be found`);
              setLoading(false);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching trade:', err);
        if (isMounted) {
          setError('Failed to load trade details');
          setLoading(false);
        }
      }
    } else {
      setTrade(null);
      setError(null);
      setRetryCount(0);
    }
    
    return () => {
      isMounted = false;
    };
  }, [isOpen, tradeId, retryCount]);

  const metrics = trade ? calculateTradeMetrics(trade) : null;
  
  return (
    <Dialog open={isOpen === true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <p className="text-lg font-medium mb-4">{error}</p>
            <p className="text-muted-foreground mb-6">
              The trade may have been deleted or there might be a data synchronization issue.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button asChild>
                <Link to="/trades">View All Trades</Link>
              </Button>
            </div>
          </div>
        ) : !trade ? (
          <div className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <p className="text-lg font-medium mb-4">Trade not found</p>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center">
                {trade.symbol} - {trade.direction.charAt(0).toUpperCase() + trade.direction.slice(1)}
              </DialogTitle>
              <DialogDescription>
                Trade details from journal
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Entry Details</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-sm">Entry Price:</div>
                    <div className="text-sm font-medium">{formatCurrency(trade.entryPrice || 0)}</div>
                    
                    <div className="text-sm">Exit Price:</div>
                    <div className="text-sm font-medium">{trade.exitPrice ? formatCurrency(trade.exitPrice) : 'Still Open'}</div>
                    
                    <div className="text-sm">Quantity:</div>
                    <div className="text-sm font-medium">{trade.quantity}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium">Performance</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-sm">P&L:</div>
                    <div className={`text-sm font-medium ${metrics?.profitLoss && metrics.profitLoss > 0 ? 'text-green-600' : metrics?.profitLoss && metrics.profitLoss < 0 ? 'text-red-600' : ''}`}>
                      {metrics?.profitLoss !== undefined ? formatCurrency(metrics.profitLoss) : 'N/A'}
                    </div>
                    
                    <div className="text-sm">R Multiple:</div>
                    <div className={`text-sm font-medium ${metrics?.rMultiple && metrics.rMultiple > 0 ? 'text-green-600' : metrics?.rMultiple && metrics.rMultiple < 0 ? 'text-red-600' : ''}`}>
                      {metrics?.rMultiple ? `${metrics.rMultiple.toFixed(2)}R` : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
              
              {trade.notes && (
                <div>
                  <h3 className="font-medium mb-2">Notes</h3>
                  <div className="text-sm p-3 bg-secondary/20 rounded-md whitespace-pre-wrap">
                    {trade.notes}
                  </div>
                </div>
              )}
              
              {trade.images && trade.images.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {trade.images.map((image, index) => (
                      <img 
                        key={index}
                        src={image}
                        alt={`Trade image ${index + 1}`}
                        className="rounded-md w-full h-auto object-cover max-h-40"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button asChild>
                <Link to={`/trade/${trade.id}`}>View Details</Link>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
