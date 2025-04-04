
import { useState, useEffect, useCallback } from 'react';
import { Trade, PartialExit } from '@/types';
import { updateTrade, getTradeById } from '@/utils/storage/tradeOperations';
import { toast } from '@/utils/toast';
import { generateUUID } from '@/utils/generateUUID';
import { getRemainingQuantity } from '@/utils/calculations/tradeStatus';

export function useExitTradeLogic(trade: Trade, onUpdate: () => void, onClose: () => void) {
  // State variables for full exit
  const [exitPrice, setExitPrice] = useState<number | undefined>(trade.exitPrice);
  const [exitDate, setExitDate] = useState<string>(trade.exitDate || new Date().toISOString().slice(0, 16));
  const [fees, setFees] = useState<number | undefined>(trade.fees);
  const [notes, setNotes] = useState<string | undefined>(trade.notes);
  
  // State variables for partial exit
  const [partialQuantity, setPartialQuantity] = useState<number>(1);
  const [partialExitPrice, setPartialExitPrice] = useState<number | undefined>(undefined);
  const [partialExitDate, setPartialExitDate] = useState<string>(new Date().toISOString().slice(0, 16));
  const [partialFees, setPartialFees] = useState<number | undefined>(undefined);
  const [partialNotes, setPartialNotes] = useState<string | undefined>(undefined);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<string>('full');
  
  // Calculate remaining quantity
  const [remainingQuantity, setRemainingQuantity] = useState<number>(getRemainingQuantity(trade));
  
  // Update remaining quantity when trade changes
  useEffect(() => {
    const quantity = getRemainingQuantity(trade);
    setRemainingQuantity(quantity);
    
    // If there's no remaining quantity, force the "full" tab
    if (quantity <= 0 && activeTab === 'partial') {
      setActiveTab('full');
    }

    // Set initial partial quantity to 1 or remaining (whichever is smaller)
    if (quantity > 0) {
      setPartialQuantity(Math.min(1, quantity));
    }

    // Reset exit price if not set
    if (exitPrice === undefined && trade.exitPrice) {
      setExitPrice(trade.exitPrice);
    }
  }, [trade, activeTab, exitPrice]);
  
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
  
  const handleFullExit = async () => {
    console.log('handleFullExit called with exitPrice:', exitPrice);
    
    try {
      // Get the latest version of the trade
      const latestTrade = getTradeById(trade.id);
      
      if (!latestTrade) {
        toast.error("Trade not found. It may have been deleted.");
        return false;
      }
      
      // Calculate remaining quantity based on partial exits
      const currentRemainingQuantity = getRemainingQuantity(latestTrade);
      console.log('Current remaining quantity:', currentRemainingQuantity);
      
      // For fully exited trades that are still open, just mark as closed
      if (currentRemainingQuantity <= 0 && latestTrade.status === 'open') {
        console.log('Trade fully exited via partials but still open, closing without additional exit');
        
        // Create weighted average exit price from all exits
        const partialExits = latestTrade.partialExits || [];
        const totalQuantity = partialExits.reduce((sum, exit) => sum + exit.quantity, 0);
        const weightedExitPrice = partialExits.reduce(
          (sum, exit) => sum + (exit.exitPrice * exit.quantity),
          0
        ) / totalQuantity;
        
        // Close the trade with existing partial exits
        const updatedTrade: Trade = {
          ...latestTrade,
          status: 'closed',
          exitPrice: weightedExitPrice,
          exitDate: new Date().toISOString(),
          fees: partialExits.reduce((sum, exit) => sum + (exit.fees || 0), 0)
        };
        
        console.log('Closing fully exited trade:', updatedTrade);
        await updateTrade(updatedTrade);
        
        toast.success("Trade closed successfully");
        dispatchUpdateEvents();
        
        // Call onClose if provided (with a delay to ensure UI updates)
        if (onClose) {
          setTimeout(() => onClose(), 300);
        }
        
        return true;
      }
      
      // For trades with remaining quantity that need a price
      if (!exitPrice && currentRemainingQuantity > 0) {
        toast.error("Please enter an exit price");
        return false;
      }
      
      // If the trade has partial exits and remaining quantity, create a final partial exit 
      // for the remaining quantity, then close the trade
      if (latestTrade.partialExits && latestTrade.partialExits.length > 0 && currentRemainingQuantity > 0) {
        const finalExit: PartialExit = {
          id: generateUUID(),
          date: exitDate,
          exitDate: exitDate,
          exitPrice: exitPrice || 0,
          price: exitPrice || 0,
          quantity: currentRemainingQuantity,
          fees: fees || 0,
          notes: notes
        };
        
        const updatedPartialExits = [...latestTrade.partialExits, finalExit];
        
        // Create weighted average exit price from all exits
        const totalQuantity = updatedPartialExits.reduce((sum, exit) => sum + exit.quantity, 0);
        const weightedExitPrice = updatedPartialExits.reduce(
          (sum, exit) => sum + (exit.exitPrice * exit.quantity),
          0
        ) / totalQuantity;
        
        const updatedTrade: Trade = {
          ...latestTrade,
          status: 'closed',
          exitPrice: weightedExitPrice,
          exitDate: exitDate,
          fees: updatedPartialExits.reduce((sum, exit) => sum + (exit.fees || 0), 0),
          partialExits: updatedPartialExits,
          notes: notes !== undefined ? notes : latestTrade.notes
        };
        
        console.log('Updating trade with full exit (remaining units):', updatedTrade);
        await updateTrade(updatedTrade);
      } else if (currentRemainingQuantity > 0) {
        // Create a single exit record for the full quantity
        const fullExit: PartialExit = {
          id: generateUUID(),
          date: exitDate,
          exitDate: exitDate,
          price: exitPrice || 0,
          exitPrice: exitPrice || 0,
          quantity: latestTrade.quantity,
          fees: fees || 0,
          notes: notes
        };
        
        // If no partial exits or the trade is being closed directly, just close the trade with the exit price
        const updatedTrade: Trade = {
          ...latestTrade,
          status: 'closed',
          exitPrice: exitPrice,
          exitDate: exitDate,
          fees: fees !== undefined ? fees : latestTrade.fees,
          partialExits: [fullExit],
          notes: notes !== undefined ? notes : latestTrade.notes
        };
        
        console.log('Updating trade with full exit (all units):', updatedTrade);
        await updateTrade(updatedTrade);
      }
      
      toast.success("Trade closed successfully");
      
      dispatchUpdateEvents();
      
      console.log("Calling onClose callback from handleFullExit");
      // Always call onClose after successful completion
      if (onClose) {
        setTimeout(() => onClose(), 300);
      }
      
      return true;
    } catch (error) {
      console.error("Error closing trade:", error);
      toast.error("Failed to close trade");
      return false;
    }
  };
  
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
    
    if (partialQuantity > remainingQuantity) {
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
      
      // Calculate current remaining quantity from the latest trade data
      const currentRemainingQuantity = getRemainingQuantity(latestTrade);
      
      // Additional check to ensure we're not exiting more than available
      if (partialQuantity > currentRemainingQuantity) {
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
      
      // If all quantity has been exited, close the trade
      const updatedTrade: Trade = {
        ...latestTrade,
        partialExits: updatedPartialExits,
        status: updatedRemainingQuantity <= 0 ? 'closed' : 'open'
      };
      
      // If closing the trade, calculate the weighted average exit price
      if (updatedRemainingQuantity <= 0) {
        const totalQuantity = updatedPartialExits.reduce((sum, exit) => sum + exit.quantity, 0);
        updatedTrade.exitPrice = updatedPartialExits.reduce(
          (sum, exit) => sum + (exit.exitPrice * exit.quantity),
          0
        ) / totalQuantity;
        
        updatedTrade.exitDate = new Date().toISOString();
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
      
      // If the trade is now closed after this partial exit, close the modal
      if (updatedRemainingQuantity <= 0) {
        if (onClose) {
          console.log("Trade fully exited via partials, calling onClose");
          setTimeout(() => onClose(), 300);
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error recording partial exit:", error);
      toast.error("Failed to record partial exit");
      return false;
    }
  };
  
  const handleReopenTrade = async () => {
    try {
      // Get the latest version of the trade
      const latestTrade = getTradeById(trade.id);
      
      if (!latestTrade) {
        toast.error("Trade not found. It may have been deleted.");
        return false;
      }
      
      const updatedTrade: Trade = {
        ...latestTrade,
        status: 'open',
        exitDate: undefined,
        exitPrice: undefined
      };
      
      console.log('Reopening trade:', updatedTrade);
      await updateTrade(updatedTrade);
      
      toast.success("Trade reopened successfully");
      
      dispatchUpdateEvents();
      
      // Always call onClose after successful completion
      if (onClose) {
        setTimeout(() => onClose(), 300);
      }
      
      return true;
    } catch (error) {
      console.error("Error reopening trade:", error);
      toast.error("Failed to reopen trade");
      return false;
    }
  };
  
  return {
    activeTab,
    setActiveTab,
    exitPrice,
    setExitPrice,
    exitDate,
    setExitDate,
    fees,
    setFees,
    notes,
    setNotes,
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
    handleFullExit,
    handlePartialExit,
    handleReopenTrade
  };
}
