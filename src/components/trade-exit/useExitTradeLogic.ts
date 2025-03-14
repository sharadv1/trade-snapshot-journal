
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
  
  const handleFullExit = () => {
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
      
      const updatedTrade: Trade = {
        ...latestTrade,
        exitPrice,
        exitDate,
        fees,
        status: 'closed',
        notes: notes ? (latestTrade.notes ? `${latestTrade.notes}\n\nExit Notes: ${notes}` : notes) : latestTrade.notes
      };
      
      updateTrade(updatedTrade);
      toast.success("Trade closed successfully");
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error closing trade:", error);
      toast.error("Failed to close trade");
    }
  };

  const handlePartialExit = () => {
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
        id: crypto.randomUUID(),
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
      const newRemainingQuantity = latestTrade.quantity - newTotalExitedQuantity;
      
      const updatedTrade: Trade = {
        ...latestTrade,
        partialExits
      };
      
      // Only close the trade if there's no remaining quantity
      if (newRemainingQuantity === 0) {
        updatedTrade.status = 'closed';
        updatedTrade.exitDate = partialExitDate;
        updatedTrade.exitPrice = partialExitPrice;
      }
      
      updateTrade(updatedTrade);
      toast.success("Partial exit recorded successfully");
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error recording partial exit:", error);
      toast.error("Failed to record partial exit");
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
    handlePartialExit
  };
}
