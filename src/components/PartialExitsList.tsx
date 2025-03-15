
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trade, PartialExit } from '@/types';
import { formatCurrency } from '@/utils/tradeCalculations';
import { EditPartialExitModal } from './trade-exit/EditPartialExitModal';
import { DeletePartialExitButton } from './trade-exit/DeletePartialExitButton';
import { useEffect, useState } from 'react';
import { getTradeById } from '@/utils/tradeStorage';

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
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [trade.id, onUpdate]);

  if (!currentTrade.partialExits || currentTrade.partialExits.length === 0) {
    return null;
  }

  // Sort partial exits by date (newest first)
  const sortedExits = [...currentTrade.partialExits].sort((a, b) => 
    new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime()
  );

  // Calculate total quantity exited so far
  const totalExitedQuantity = sortedExits.reduce(
    (total, exit) => total + exit.quantity, 
    0
  );

  // Calculate remaining quantity
  const remainingQuantity = currentTrade.quantity - totalExitedQuantity;

  // Calculate max quantity for each exit (original quantity + current exit quantity)
  const getMaxQuantityForExit = (currentExit: PartialExit) => {
    return remainingQuantity + currentExit.quantity;
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

  return (
    <Card className="shadow-subtle border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Partial Exits</CardTitle>
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
              <span className={`font-medium ${currentTrade.status === 'closed' ? 'text-red-500' : 'text-green-500'}`}>
                {currentTrade.status === 'closed' && remainingQuantity > 0 ? 'Error: Closed with remaining units' : currentTrade.status}
              </span>
            </div>
          </div>

          <div className="divide-y">
            {sortedExits.map((exit) => (
              <div key={exit.id} className="py-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-medium">
                      {exit.quantity} units @ {formatCurrency(exit.exitPrice)}
                    </span>
                    <div className="text-sm text-muted-foreground">
                      {new Date(exit.exitDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                      {' '}
                      {new Date(exit.exitDate).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
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
