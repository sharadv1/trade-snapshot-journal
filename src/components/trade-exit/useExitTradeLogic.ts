
import { useState, useEffect } from 'react';
import { Trade, PartialExit } from '@/types';
import { updateTrade, getTradeById } from '@/utils/tradeStorage';
import { toast } from '@/utils/toast';

export function useExitTradeLogic(trade: Trade, onUpdate: () => void, onClose: () => void) {
  const [activeTab, setActiveTab] = useState('full');
  const [exitPrice, setExitPrice] = useState<number | undefined>(trade.exitPrice);
  const [exitDate, setExitDate] = useState<string>(
    trade.exitDate || new Date().toISOString().slice(0, 16)
  );
  const [fees, setFees] = useState<number | undefined>(trade.fees);
  const [notes, setNotes] = useState<string>('');

  // Partial exit state
  const [partialQuantity, setPartialQuantity] = useState<number>(
    Math.floor(trade.quantity / 2) // Default to half the position
  );
  const [partialExitPrice, setPartialExitPrice] = useState<number | undefined>(undefined);
  const [partialExitDate, setPartialExitDate] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [partialFees, setPartialFees] = useState<number | undefined>(undefined);
  const [partialNotes, setPartialNotes] = useState<string>('');

  // Calculate total quantity exited so far
  const totalExitedQuantity = (trade.partialExits || []).reduce(
    (total, exit) => total + exit.quantity, 
    0
  );
  
  // Calculate remaining quantity
  const remainingQuantity = trade.quantity - totalExitedQuantity;

  // When trade changes, update the default partial quantity
  useEffect(() => {
    if (remainingQuantity > 0) {
      setPartialQuantity(Math.min(remainingQuantity, Math.floor(trade.quantity / 2)));
    }
  }, [trade, remainingQuantity]);
  
  const handleFullExit = async () => {
    if (!exitPrice) {
      toast.error("Please enter an exit price");
      return;
    }

    try {
      // Fetch the latest trade data to make sure we have all partial exits
      const latestTrade = getTradeById(trade.id);
      if (!latestTrade) {
        toast.error("Failed to retrieve latest trade data");
        return;
      }
      
      // Recalculate the total exited quantity to ensure we're using the latest data
      const partialExitedQuantity = (latestTrade.partialExits || []).reduce(
        (total, exit) => total + exit.quantity, 0
      );
      
      // If there are partial exits that account for the full position,
      // warn the user and prevent the full exit
      if (partialExitedQuantity >= latestTrade.quantity) {
        toast.error("All units have already been exited through partial exits");
        return;
      }
      
      // If there are some partial exits, create a final partial exit for the remaining units
      if (partialExitedQuantity > 0) {
        const remainingUnits = latestTrade.quantity - partialExitedQuantity;
        
        const finalPartialExit: PartialExit = {
          id: crypto.randomUUID ? crypto.randomUUID() : generateUUID(),
          exitDate: exitDate,
          exitPrice: exitPrice,
          quantity: remainingUnits,
          fees: fees,
          notes: notes
        };
        
        const partialExits = [...(latestTrade.partialExits || []), finalPartialExit];
        
        // Create a weighted average exit price for the main trade
        let weightedSum = 0;
        partialExits.forEach(exit => {
          weightedSum += exit.exitPrice * exit.quantity;
        });
        
        const updatedTrade: Trade = {
          ...latestTrade,
          status: 'closed',
          exitDate: exitDate,
          exitPrice: weightedSum / latestTrade.quantity, // Set to weighted average
          fees: fees, // Store the final fees
          partialExits: partialExits,
          notes: notes ? (latestTrade.notes ? `${latestTrade.notes}\n\nExit Notes: ${notes}` : notes) : latestTrade.notes
        };
        
        updateTrade(updatedTrade);
      } else {
        // If no partial exits, simply close the trade but also add it as a single full exit
        // This ensures consistency in how we track exits
        const fullExit: PartialExit = {
          id: crypto.randomUUID ? crypto.randomUUID() : generateUUID(),
          exitDate: exitDate,
          exitPrice: exitPrice,
          quantity: latestTrade.quantity, // Exit the full quantity
          fees: fees,
          notes: notes
        };
        
        const updatedTrade: Trade = {
          ...latestTrade,
          exitPrice,
          exitDate,
          fees,
          status: 'closed',
          partialExits: [...(latestTrade.partialExits || []), fullExit],
          notes: notes ? (latestTrade.notes ? `${latestTrade.notes}\n\nExit Notes: ${notes}` : notes) : latestTrade.notes
        };
        
        updateTrade(updatedTrade);
      }
      
      toast.success("Trade closed successfully");
      
      // Dispatch a storage event to ensure updates are detected
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'trade-journal-trades',
        newValue: JSON.stringify(localStorage.getItem('trade-journal-trades'))
      }));
      
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error closing trade:", error);
      toast.error("Failed to close trade");
    }
  };

  const handlePartialExit = async () => {
    if (!partialExitPrice) {
      toast.error("Please enter an exit price");
      return;
    }

    if (partialQuantity <= 0 || partialQuantity > remainingQuantity) {
      toast.error(`Quantity must be between 1 and ${remainingQuantity}`);
      return;
    }

    try {
      // Fetch the latest trade data to make sure we have all partial exits
      const latestTrade = getTradeById(trade.id);
      if (!latestTrade) {
        toast.error("Failed to retrieve latest trade data");
        return;
      }
      
      const newPartialExit: PartialExit = {
        id: crypto.randomUUID ? crypto.randomUUID() : generateUUID(),
        exitDate: partialExitDate,
        exitPrice: partialExitPrice,
        quantity: partialQuantity,
        fees: partialFees,
        notes: partialNotes
      };

      const partialExits = [...(latestTrade.partialExits || []), newPartialExit];
      
      // Recalculate the remaining quantity after this exit
      const newTotalExitedQuantity = partialExits.reduce(
        (total, exit) => total + exit.quantity, 
        0
      );
      
      const updatedTrade: Trade = {
        ...latestTrade,
        partialExits
      };
      
      // Only close the trade if all units are exited
      if (newTotalExitedQuantity === latestTrade.quantity) {
        // Calculate weighted average exit price
        let weightedSum = 0;
        partialExits.forEach(exit => {
          weightedSum += exit.exitPrice * exit.quantity;
        });
        
        updatedTrade.status = 'closed';
        updatedTrade.exitDate = partialExitDate;
        updatedTrade.exitPrice = weightedSum / latestTrade.quantity;
      } else {
        // Make sure trade is open if not all units are exited
        updatedTrade.status = 'open';
        // Only clear these if they exist to avoid triggering unnecessary re-renders
        if (updatedTrade.exitDate) updatedTrade.exitDate = undefined;
        if (updatedTrade.exitPrice !== undefined) updatedTrade.exitPrice = undefined;
      }
      
      updateTrade(updatedTrade);
      
      // Dispatch a storage event to ensure updates are detected
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'trade-journal-trades',
        newValue: JSON.stringify(localStorage.getItem('trade-journal-trades'))
      }));
      
      toast.success("Partial exit recorded successfully");
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error recording partial exit:", error);
      toast.error("Failed to record partial exit");
    }
  };

  // Simple UUID generator that doesn't rely on crypto.randomUUID
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, 
            v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

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
    handlePartialExit
  };
}
