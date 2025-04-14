
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trade, PartialExit } from '@/types';
import { formatCurrency } from '@/utils/tradeCalculations';
import { EditPartialExitModal } from './trade-exit/EditPartialExitModal';
import { DeletePartialExitButton } from './trade-exit/DeletePartialExitButton';
import { useEffect, useState } from 'react';
import { getTradeById } from '@/utils/storage/tradeOperations';
import { Badge } from '@/components/ui/badge';
import { formatTradeDate, formatTradeDateWithTime, getRemainingQuantity } from '@/utils/calculations/tradeStatus';

interface PartialExitsListProps {
  trade: Trade;
  onUpdate: () => void;
  allowEditing?: boolean;
}

export function PartialExitsList({ trade, onUpdate, allowEditing = false }: PartialExitsListProps) {
  const [currentTrade, setCurrentTrade] = useState<Trade>(trade);
  
  // Force refresh of trade data when storage changes
  useEffect(() => {
    const refreshTrade = () => {
      const updatedTrade = getTradeById(trade.id);
      if (updatedTrade) {
        setCurrentTrade(updatedTrade);
      }
    };
    
    // Initial load
    refreshTrade();
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'trade-journal-trades') {
        refreshTrade();
        onUpdate();
      }
    };
    
    // Listen for custom event too
    const handleTradeUpdated = () => {
      refreshTrade();
      onUpdate();
    };
    
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('trade-updated', handleTradeUpdated);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('trade-updated', handleTradeUpdated);
    };
  }, [trade.id, onUpdate]);

  if (!currentTrade.partialExits || currentTrade.partialExits.length === 0) {
    return null;
  }

  // Sort partial exits by date (newest first)
  const sortedExits = [...currentTrade.partialExits].sort((a, b) => {
    // Handle potential invalid dates
    const dateA = new Date(a.exitDate || (a.date || '')).getTime() || 0;
    const dateB = new Date(b.exitDate || (b.date || '')).getTime() || 0;
    return dateB - dateA;
  });

  // Calculate total quantity exited so far
  const totalExitedQuantity = sortedExits.reduce(
    (total, exit) => {
      // Convert exit quantity to number
      const exitQuantity = typeof exit.quantity === 'string' ? parseFloat(exit.quantity) : exit.quantity;
      return total + exitQuantity;
    }, 
    0
  );

  // Calculate remaining quantity
  const remainingQuantity = getRemainingQuantity(currentTrade);

  // Determine if the trade should be fully exited through partial exits
  const isFullyExited = remainingQuantity <= 0;

  // Calculate max quantity for each exit (original quantity + current exit quantity)
  const getMaxQuantityForExit = (currentExit: PartialExit) => {
    const exitQuantity = typeof currentExit.quantity === 'string' ? 
      parseFloat(currentExit.quantity.toString()) : 
      currentExit.quantity;
    return remainingQuantity + exitQuantity;
  };

  const handleExitUpdate = () => {
    // Refresh trade data
    const updatedTrade = getTradeById(trade.id);
    if (updatedTrade) {
      setCurrentTrade(updatedTrade);
    }
    // Call the parent's onUpdate handler
    onUpdate();
  };

  // Update status display to accurately reflect the trade state
  let statusLabel = currentTrade.status === 'closed' ? 'closed' : 'open';
  let statusColor = currentTrade.status === 'closed' ? 'text-red-500' : 'text-green-500';
  
  // If we're fully exited through partials but status doesn't reflect it, show a warning color
  if (isFullyExited && currentTrade.status === 'open') {
    statusColor = 'text-orange-500';
    statusLabel = 'needs closure';
  }

  return (
    <Card className="shadow-subtle border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Exit History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-muted/30 p-3 rounded-md">
            <div className="flex justify-between text-sm">
              <span>Total Position:</span>
              <span className="font-medium">{currentTrade.quantity} units</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Exited:</span>
              <span className="font-medium">{totalExitedQuantity} units</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Remaining:</span>
              <span className="font-medium">{remainingQuantity} units</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>Status:</span>
              <span className={`font-medium ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
          </div>

          <div className="divide-y">
            {sortedExits.map((exit) => (
              <div key={exit.id} className="py-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-medium">
                      {exit.quantity} units @ {formatCurrency(typeof exit.exitPrice === 'string' ? parseFloat(exit.exitPrice) : exit.exitPrice)}
                    </span>
                    <div className="text-sm text-muted-foreground">
                      {formatTradeDateWithTime(exit.exitDate || (exit.date || ''))}
                    </div>
                    
                    {exit.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{exit.notes}</p>
                    )}
                    
                    {exit.fees !== undefined && exit.fees > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Fees: {formatCurrency(exit.fees)}
                      </div>
                    )}
                  </div>
                  
                  {allowEditing && (
                    <div className="flex space-x-1">
                      <EditPartialExitModal 
                        trade={currentTrade} 
                        partialExit={exit} 
                        onSuccess={handleExitUpdate}
                        maxQuantity={getMaxQuantityForExit(exit)}
                      />
                      <DeletePartialExitButton 
                        trade={currentTrade} 
                        exitId={exit.id} 
                        onSuccess={handleExitUpdate}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
