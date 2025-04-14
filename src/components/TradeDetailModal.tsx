
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
import { getTradeById } from '@/utils/tradeStorage';
import { Trade } from '@/types';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/calculations/formatters';
import { calculateTradeMetrics } from '@/utils/calculations';

interface TradeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeId?: string;
}

export const TradeDetailModal: React.FC<TradeDetailModalProps> = ({
  isOpen,
  onClose,
  tradeId
}) => {
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && tradeId) {
      setLoading(true);
      
      try {
        const fetchedTrade = getTradeById(tradeId);
        setTrade(fetchedTrade || null);
      } catch (error) {
        console.error('Error fetching trade:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setTrade(null);
    }
  }, [isOpen, tradeId]);

  const metrics = trade ? calculateTradeMetrics(trade) : null;
  
  return (
    <Dialog open={isOpen === true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !trade ? (
          <div className="p-6 text-center">
            <p>Trade not found</p>
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
                      {metrics?.profitLoss ? formatCurrency(metrics.profitLoss) : 'N/A'}
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
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
