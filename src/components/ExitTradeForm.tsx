
import { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trade } from '@/types';
import { CalendarClock, Check } from 'lucide-react';
import { PartialExitForm } from './trade-exit/PartialExitForm';
import { useExitTradeLogic } from './trade-exit/useExitTradeLogic';
import { PartialExitsList } from './PartialExitsList';
import { Badge } from '@/components/ui/badge';
import { getRemainingQuantity, isTradeFullyExited } from '@/utils/calculations/tradeStatus';
import { formatCurrency } from '@/utils/tradeCalculations';

interface ExitTradeFormProps {
  trade: Trade;
  onClose: () => void;
  onUpdate: () => void;
  remainingQuantity?: number;
}

export function ExitTradeForm({ trade, onClose, onUpdate, remainingQuantity: propRemainingQuantity }: ExitTradeFormProps) {
  const {
    exitQuantity,
    exitPrice,
    exitDate,
    fees: partialFees,
    notes: partialNotes,
    isSubmitting,
    handleSetExitQuantity: setPartialQuantity,
    handleSetExitPrice: setPartialExitPrice,
    handleExitDateFocus,
    handleNotesChange,
    handleFeesChange,
    handleSubmit
  } = useExitTradeLogic({ 
    trade, 
    onSuccess: () => {
      console.log("Exit success callback fired");
      onUpdate();
    }
  });

  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // Calculate remaining quantity or use the prop if provided
  const calculatedRemainingQuantity = getRemainingQuantity(trade);
  const actualRemainingQuantity = Math.max(
    propRemainingQuantity !== undefined ? propRemainingQuantity : calculatedRemainingQuantity,
    0
  );
  
  const isClosed = trade.status === 'closed';
  const isFullyExited = isTradeFullyExited(trade);

  useEffect(() => {
    console.log('ExitTradeForm mounted for trade:', trade.id, 'Status:', trade.status);
    console.log('Remaining quantity:', actualRemainingQuantity);
    console.log('Is fully exited:', isFullyExited);
    
    return () => {
      console.log('ExitTradeForm unmounted for trade:', trade.id);
    };
  }, [trade.id, trade.status, actualRemainingQuantity, isFullyExited]);

  const handleSubmitPartialExit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Recording partial exit with quantity:', exitQuantity, 'at price:', exitPrice);
    
    try {
      const success = await handleSubmit();
      if (success) {
        console.log("Partial exit successful");
        setUpdateSuccess(true);
        
        // Reset success state after a delay
        setTimeout(() => {
          setUpdateSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Error submitting partial exit:", error);
    }
  };

  // Helper function to ensure numbers are displayed properly
  const formatPrice = (price: string | number | undefined): number => {
    if (price === undefined) return 0;
    return typeof price === 'string' ? parseFloat(price) : price;
  };

  const setPartialExitDate = (date: string) => {
    // This just passes the date to the form
    // The actual logic is handled in useExitTradeLogic
  };

  const setPartialFees = (fees: number | undefined) => {
    // Handle in the form
  };

  const setPartialNotes = (notes: string | undefined) => {
    // Handle in the form
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Exit Trade: {trade.symbol}</CardTitle>
            {isClosed && (
              <div className="mt-1 flex items-center">
                <Badge variant="destructive" className="mr-2">Closed</Badge>
                {trade.exitDate && (
                  <span className="text-xs text-muted-foreground flex items-center">
                    <CalendarClock className="h-3 w-3 mr-1" />
                    {new Date(trade.exitDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Show existing partial exits if they exist */}
        {trade.partialExits && trade.partialExits.length > 0 && (
          <PartialExitsList 
            trade={trade}
            onUpdate={onUpdate}
            allowEditing={true}
          />
        )}
        
        {/* For closed trades without partials, create a virtual partial exit for display */}
        {isClosed && (!trade.partialExits || trade.partialExits.length === 0) && trade.exitPrice && (
          <div>
            <Card className="shadow-subtle border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Exit Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted/30 p-3 rounded-md">
                    <div className="flex justify-between text-sm">
                      <span>Total Position:</span>
                      <span className="font-medium">{trade.quantity} units</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Status:</span>
                      <span className="font-medium text-red-500">closed</span>
                    </div>
                  </div>
                  
                  <div className="py-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-sm font-medium">
                          {trade.quantity} units @ {formatCurrency(formatPrice(trade.exitPrice))}
                        </span>
                        <div className="text-sm text-muted-foreground">
                          {trade.exitDate ? new Date(trade.exitDate).toLocaleString() : 'No exit date recorded'}
                        </div>
                        
                        {trade.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{trade.notes}</p>
                        )}
                        
                        {trade.fees !== undefined && trade.fees > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Fees: {formatCurrency(trade.fees)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Add a form to edit the exit details if needed */}
            <div className="mt-4 space-y-2 bg-muted/30 p-3 rounded-md">
              <p className="text-sm">You can edit the exit details if needed:</p>
              
              <form id="partial-exit-form" onSubmit={handleSubmitPartialExit}>
                <PartialExitForm 
                  trade={trade}
                  remainingQuantity={typeof trade.quantity === 'string' ? parseFloat(trade.quantity) : trade.quantity}
                  partialQuantity={typeof trade.quantity === 'string' ? parseFloat(trade.quantity) : trade.quantity}
                  setPartialQuantity={setPartialQuantity}
                  partialExitPrice={typeof trade.exitPrice === 'string' ? parseFloat(String(trade.exitPrice)) : trade.exitPrice}
                  setPartialExitPrice={setPartialExitPrice}
                  partialExitDate={trade.exitDate || new Date().toISOString()}
                  setPartialExitDate={setPartialExitDate}
                  partialFees={trade.fees}
                  setPartialFees={setPartialFees}
                  partialNotes={trade.notes}
                  setPartialNotes={setPartialNotes}
                  isClosedTradeConversion={true}
                />
                
                <div className="flex justify-end mt-4 items-center gap-3">
                  {updateSuccess && (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-medium">
                      <Check className="h-4 w-4" />
                      <span>Updated successfully!</span>
                    </div>
                  )}
                  <Button 
                    type="submit"
                    form="partial-exit-form"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Processing...' : 'Update Exit Details'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* For non-fully exited trades, show the partial exit form */}
        {!isClosed && actualRemainingQuantity > 0 && (
          <form id="partial-exit-form" onSubmit={handleSubmitPartialExit}>
            <PartialExitForm 
              trade={trade}
              remainingQuantity={actualRemainingQuantity}
              partialQuantity={exitQuantity || 1} 
              setPartialQuantity={setPartialQuantity}
              partialExitPrice={exitPrice}
              setPartialExitPrice={setPartialExitPrice}
              partialExitDate={exitDate}
              setPartialExitDate={setPartialExitDate}
              partialFees={partialFees}
              setPartialFees={setPartialFees}
              partialNotes={partialNotes}
              setPartialNotes={setPartialNotes}
            />
            
            <div className="flex justify-end mt-4 items-center gap-3">
              {updateSuccess && (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-medium">
                  <Check className="h-4 w-4" />
                  <span>Updated successfully!</span>
                </div>
              )}
              <Button 
                type="submit"
                form="partial-exit-form"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Record Exit'}
              </Button>
            </div>
          </form>
        )}
        
        {/* For fully exited trades through partials, just show message */}
        {(actualRemainingQuantity <= 0 || isFullyExited) && !isClosed && (
          <div className="text-sm text-muted-foreground py-2">
            This trade has been fully exited through partial exits. Update the status to closed.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
