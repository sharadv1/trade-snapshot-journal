import { useState, useEffect, useCallback } from 'react';
import { Trade, PartialExit } from '@/types';
import { updateTrade, getTradeById } from '@/utils/storage/tradeOperations';
import { toast } from '@/utils/toast';
import { generateUUID } from '@/utils/generateUUID';
import { getRemainingQuantity } from '@/utils/calculations/tradeStatus';

export function useExitTradeLogic(trade: Trade, onUpdate: () => void, onClose?: () => void) {
  // State variables for partial exit
  const [partialQuantity, setPartialQuantity] = useState<number>(1);
  const [partialExitPrice, setPartialExitPrice] = useState<number | undefined>(undefined);
  const [partialExitDate, setPartialExitDate] = useState<string>(new Date().toISOString().slice(0, 16));
  const [partialFees, setPartialFees] = useState<number | undefined>(undefined);
  const [partialNotes, setPartialNotes] = useState<string | undefined>(undefined);
  
  // Calculate remaining quantity
  const [remainingQuantity, setRemainingQuantity] = useState<number>(getRemainingQuantity(trade));
  
  // Update state based on trade props when they change
  useEffect(() => {
    const quantity = getRemainingQuantity(trade);
    setRemainingQuantity(quantity);

    // Set initial partial quantity to 1 or remaining (whichever is smaller)
    if (quantity > 0) {
      setPartialQuantity(Math.min(1, quantity));
    }

    // If it's a closed trade with exitPrice but no partials, initialize the form with the existing data
    if (trade.status === 'closed' && trade.exitPrice && (!trade.partialExits || trade.partialExits.length === 0)) {
      setPartialQuantity(trade.quantity);
      setPartialExitPrice(trade.exitPrice);
      setPartialExitDate(trade.exitDate || new Date().toISOString());
      setPartialFees(trade.fees);
      setPartialNotes(trade.notes);
    }
  }, [trade]);
  
  const dispatchUpdateEvents = useCallback(() => {
    // Dispatch custom event to ensure UI updates
    document.dispatchEvent(new CustomEvent('trade-updated'));
    
    // Trigger storage events to notify other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'trade-journal-trades'
    }));
    
    // Call update callback
    if (onUpdate) onUpdate();
  }, [onUpdate]);
  
  const handlePartialExit = async () => {
    if (!partialQuantity || partialQuantity <= 0) {
      toast.error("Please enter a valid quantity");
      return false;
    }
    
    if (!partialExitPrice) {
      toast.error("Please enter an exit price");
      return false;
    }
    
    if (!partialExitDate) {
      toast.error("Please enter an exit date");
      return false;
    }
    
    // Skip this check for closed trades we're converting
    const isClosed = trade.status === 'closed';
    const isClosedWithoutPartials = isClosed && (!trade.partialExits || trade.partialExits.length === 0);
    
    if (!isClosedWithoutPartials && partialQuantity > remainingQuantity) {
      toast.error(`Cannot exit more than the remaining quantity (${remainingQuantity})`);
      return false;
    }
    
    try {
      // Get the latest version of the trade
      const latestTrade = getTradeById(trade.id);
      
      if (!latestTrade) {
        toast.error("Trade not found. It may have been deleted.");
        return false;
      }
      
      // Special case: converting a closed trade without partials to use the partial exit system
      if (isClosedWithoutPartials && latestTrade.exitPrice) {
        // Create a new partial exit record for the full quantity
        const conversionExit: PartialExit = {
          id: generateUUID(),
          date: partialExitDate,
          exitDate: partialExitDate,
          price: partialExitPrice,
          exitPrice: partialExitPrice,
          quantity: latestTrade.quantity,
          fees: partialFees || 0,
          notes: partialNotes
        };
        
        // Update the trade with this partial exit
        const updatedTrade: Trade = {
          ...latestTrade,
          partialExits: [conversionExit],
          // Keep the trade closed
          status: 'closed',
          exitPrice: partialExitPrice,
          exitDate: partialExitDate,
          fees: partialFees,
          notes: partialNotes
        };
        
        console.log('Converting closed trade to use partial exits:', updatedTrade);
        await updateTrade(updatedTrade);
        
        toast.success("Trade exit data updated successfully");
        dispatchUpdateEvents();
        return true;
      }
      
      // Regular partial exit case - for open trades
      // Calculate current remaining quantity from the latest trade data
      const currentRemainingQuantity = getRemainingQuantity(latestTrade);
      
      // Additional check to ensure we're not exiting more than available
      if (!isClosedWithoutPartials && partialQuantity > currentRemainingQuantity) {
        toast.error(`Cannot exit more than the remaining quantity (${currentRemainingQuantity})`);
        return false;
      }
      
      const partialExit: PartialExit = {
        id: generateUUID(),
        date: partialExitDate,
        exitDate: partialExitDate,
        price: partialExitPrice,
        exitPrice: partialExitPrice,
        quantity: partialQuantity,
        fees: partialFees || 0,
        notes: partialNotes
      };
      
      const updatedPartialExits = latestTrade.partialExits ? 
        [...latestTrade.partialExits, partialExit] : [partialExit];
      
      // Calculate remaining quantity after this exit
      const partialQuantitySum = updatedPartialExits.reduce((sum, exit) => sum + exit.quantity, 0);
      const updatedRemainingQuantity = Math.max(0, latestTrade.quantity - partialQuantitySum);
      
      // If all quantity has been exited, mark for closing the trade
      const shouldClose = updatedRemainingQuantity <= 0;
      
      const updatedTrade: Trade = {
        ...latestTrade,
        partialExits: updatedPartialExits,
        status: shouldClose ? 'closed' : 'open'
      };
      
      // If closing the trade, calculate the weighted average exit price
      if (shouldClose) {
        const totalQuantity = updatedPartialExits.reduce((sum, exit) => sum + exit.quantity, 0);
        updatedTrade.exitPrice = updatedPartialExits.reduce(
          (sum, exit) => sum + (exit.exitPrice * exit.quantity),
          0
        ) / totalQuantity;
        
        // Use the latest exit date as the trade exit date
        const sortedExits = [...updatedPartialExits].sort((a, b) => 
          new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime()
        );
        
        updatedTrade.exitDate = sortedExits[0].exitDate;
        updatedTrade.fees = updatedPartialExits.reduce((sum, exit) => sum + (exit.fees || 0), 0);
      }
      
      console.log('Updating trade with partial exit:', updatedTrade);
      await updateTrade(updatedTrade);
      
      toast.success("Partial exit recorded successfully");
      
      // Dispatch events to update UI
      dispatchUpdateEvents();
      
      // Reset partial exit form
      setPartialQuantity(1);
      setPartialExitPrice(undefined);
      setPartialExitDate(new Date().toISOString().slice(0, 16));
      setPartialFees(undefined);
      setPartialNotes(undefined);
      
      // Update the remaining quantity state
      setRemainingQuantity(updatedRemainingQuantity);
      
      // If the trade is now closed after this partial exit and there's a close callback, call it
      if (shouldClose && onClose) {
        console.log("Trade fully exited via partials, calling onClose");
        setTimeout(() => onClose(), 300);
      }
      
      return true;
    } catch (error) {
      console.error("Error recording partial exit:", error);
      toast.error("Failed to record partial exit");
      return false;
    }
  };
  
  return {
    partialQuantity,
    setPartialQuantity,
    partialExitPrice,
    setPartialExitPrice,
    partialExitDate,
    setPartialExitDate,
    partialFees,
    setPartialFees,
    partialNotes,
    setPartialNotes,
    remainingQuantity,
    handlePartialExit
  };
}
