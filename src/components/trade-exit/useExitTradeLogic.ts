import { useState, useEffect } from 'react';
import { Trade, PartialExit } from '@/types';
import { updateTrade, getTradeById } from '@/utils/tradeStorage';
import { toast } from '@/utils/toast';
import { dispatchStorageEvents } from '@/utils/storage/storageUtils';

export function useExitTradeLogic(trade: Trade, onUpdate: () => void, onClose: () => void) {
  // State variables for full exit
  const [exitPrice, setExitPrice] = useState<number | undefined>(trade.exitPrice);
  const [exitDate, setExitDate] = useState<string>(trade.exitDate || new Date().toISOString());
  const [fees, setFees] = useState<number | undefined>(trade.fees);
  const [notes, setNotes] = useState<string | undefined>(trade.notes);
  
  // State variables for partial exit
  const [partialQuantity, setPartialQuantity] = useState<number | undefined>(undefined);
  const [partialExitPrice, setPartialExitPrice] = useState<number | undefined>(undefined);
  const [partialExitDate, setPartialExitDate] = useState<string>(new Date().toISOString());
  const [partialFees, setPartialFees] = useState<number | undefined>(undefined);
  const [partialNotes, setPartialNotes] = useState<string | undefined>(undefined);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<string>('full');
  
  // Calculate remaining quantity
  const [remainingQuantity, setRemainingQuantity] = useState<number>(trade.quantity);
  
  useEffect(() => {
    // Calculate remaining quantity based on partial exits
    const partialQuantitySum = trade.partialExits ? 
      trade.partialExits.reduce((sum, exit) => sum + exit.quantity, 0) : 0;
    
    setRemainingQuantity(trade.quantity - partialQuantitySum);
  }, [trade, remainingQuantity]);
  
  const handleFullExit = async () => {
    console.log('handleFullExit called with exitPrice:', exitPrice);
    if (!exitPrice) {
      toast.error("Please enter an exit price");
      return;
    }
    
    if (!exitDate) {
      toast.error("Please enter an exit date");
      return;
    }
    
    try {
      // Get the latest version of the trade
      const latestTrade = getTradeById(trade.id);
      
      if (!latestTrade) {
        toast.error("Trade not found. It may have been deleted.");
        return;
      }
      
      // Calculate remaining quantity based on partial exits
      const partialQuantitySum = latestTrade.partialExits ? 
        latestTrade.partialExits.reduce((sum, exit) => sum + exit.quantity, 0) : 0;
      
      const currentRemainingQuantity = latestTrade.quantity - partialQuantitySum;
      
      if (currentRemainingQuantity <= 0) {
        toast.error("No remaining quantity to exit");
        return;
      }
      
      // If there are partial exits and remaining quantity, create a final partial exit 
      // for the remaining quantity, then close the trade
      if (latestTrade.partialExits && latestTrade.partialExits.length > 0) {
        const finalExit: PartialExit = {
          id: Date.now().toString(),
          date: exitDate,
          exitDate: exitDate,
          exitPrice: exitPrice,
          quantity: currentRemainingQuantity,
          fees: fees || 0,
          price: exitPrice
        };
        
        const updatedPartialExits = [...latestTrade.partialExits, finalExit];
        
        // Create weighted average exit price from all exits
        const totalQuantity = updatedPartialExits.reduce((sum, exit) => sum + exit.quantity, 0);
        const weightedExitPrice = updatedPartialExits.reduce(
          (sum, exit) => sum + (exit.price * exit.quantity),
          0
        ) / totalQuantity;
        
        const updatedTrade: Trade = {
          ...latestTrade,
          status: 'closed',
          exitPrice: weightedExitPrice,
          exitDate: exitDate,
          fees: updatedPartialExits.reduce((sum, exit) => sum + (exit.fees || 0), 0),
          partialExits: updatedPartialExits,
          notes: notes ? notes : latestTrade.notes
        };
        
        console.log('Updating trade with full exit (remaining units):', updatedTrade);
        await updateTrade(updatedTrade);
      } else {
        const fullExit: PartialExit = {
          id: Date.now().toString(),
          date: exitDate,
          exitDate: exitDate,
          price: exitPrice,
          exitPrice: exitPrice,
          quantity: latestTrade.quantity,
          fees: fees || 0
        };
        
        // If no partial exits, just close the trade with the exit price
        const updatedTrade: Trade = {
          ...latestTrade,
          status: 'closed',
          exitPrice: exitPrice,
          exitDate: exitDate,
          fees: fees !== undefined ? fees : latestTrade.fees,
          partialExits: [fullExit],
          notes: notes ? notes : latestTrade.notes
        };
        
        console.log('Updating trade with full exit (all units):', updatedTrade);
        await updateTrade(updatedTrade);
      }
      
      toast.success("Trade closed successfully");
      
      // Trigger storage events to notify other components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'trade-journal-trades'
      }));
      
      console.log("Calling onUpdate and onClose callbacks");
      if (onUpdate) onUpdate();
      if (onClose) onClose();
    } catch (error) {
      console.error("Error closing trade:", error);
      toast.error("Failed to close trade");
    }
  };
  
  const handlePartialExit = async () => {
    if (!partialQuantity || partialQuantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    
    if (!partialExitPrice) {
      toast.error("Please enter an exit price");
      return;
    }
    
    if (!partialExitDate) {
      toast.error("Please enter an exit date");
      return;
    }
    
    if (partialQuantity > remainingQuantity) {
      toast.error(`Cannot exit more than the remaining quantity (${remainingQuantity})`);
      return;
    }
    
    try {
      // Get the latest version of the trade
      const latestTrade = getTradeById(trade.id);
      
      if (!latestTrade) {
        toast.error("Trade not found. It may have been deleted.");
        return;
      }
      
      const partialExit: PartialExit = {
        id: Date.now().toString(),
        date: partialExitDate,
        price: partialExitPrice,
        quantity: partialQuantity,
        fees: partialFees || 0,
        notes: partialNotes
      };
      
      const updatedPartialExits = latestTrade.partialExits ? 
        [...latestTrade.partialExits, partialExit] : [partialExit];
      
      // Calculate remaining quantity
      const partialQuantitySum = updatedPartialExits.reduce((sum, exit) => sum + exit.quantity, 0);
      const updatedRemainingQuantity = latestTrade.quantity - partialQuantitySum;
      
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
          (sum, exit) => sum + (exit.price * exit.quantity),
          0
        ) / totalQuantity;
        
        updatedTrade.exitDate = new Date().toISOString();
        updatedTrade.fees = updatedPartialExits.reduce((sum, exit) => sum + (exit.fees || 0), 0);
      } else {
        // If not closing, make sure these fields are undefined
        if (updatedTrade.exitDate !== undefined) updatedTrade.exitDate = undefined;
        if (updatedTrade.exitPrice !== undefined) updatedTrade.exitPrice = undefined;
      }
      
      console.log('Updating trade with partial exit:', updatedTrade);
      await updateTrade(updatedTrade);
      
      // Trigger storage events to notify other components
      dispatchStorageEvents();
      
      toast.success("Partial exit recorded successfully");
      
      // Reset partial exit form
      setPartialQuantity(undefined);
      setPartialExitPrice(undefined);
      setPartialExitDate(new Date().toISOString());
      setPartialFees(undefined);
      setPartialNotes(undefined);
      
      onUpdate();
    } catch (error) {
      console.error("Error recording partial exit:", error);
      toast.error("Failed to record partial exit");
    }
  };
  
  const handleReopenTrade = async () => {
    try {
      // Get the latest version of the trade
      const latestTrade = getTradeById(trade.id);
      
      if (!latestTrade) {
        toast.error("Trade not found. It may have been deleted.");
        return;
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
      
      // Trigger storage events to notify other components
      dispatchStorageEvents();
      
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error reopening trade:", error);
      toast.error("Failed to reopen trade");
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
