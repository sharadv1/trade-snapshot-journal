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

  const [partialQuantity, setPartialQuantity] = useState<number>(
    Math.floor(trade.quantity / 2) // Default to half the position
  );
  const [partialExitPrice, setPartialExitPrice] = useState<number | undefined>(undefined);
  const [partialExitDate, setPartialExitDate] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [partialFees, setPartialFees] = useState<number | undefined>(undefined);
  const [partialNotes, setPartialNotes] = useState<string>('');

  const totalExitedQuantity = (trade.partialExits || []).reduce(
    (total, exit) => total + exit.quantity, 
    0
  );
  
  const remainingQuantity = trade.quantity - totalExitedQuantity;

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
      const latestTrade = getTradeById(trade.id);
      if (!latestTrade) {
        toast.error("Failed to retrieve latest trade data");
        return;
      }
      
      const partialExitedQuantity = (latestTrade.partialExits || []).reduce(
        (total, exit) => total + exit.quantity, 0
      );
      
      if (partialExitedQuantity >= latestTrade.quantity) {
        toast.error("All units have already been exited through partial exits");
        return;
      }
      
      if (partialExitedQuantity > 0) {
        const remainingUnits = latestTrade.quantity - partialExitedQuantity;
        
        const finalPartialExit: PartialExit = {
          id: crypto.randomUUID ? crypto.randomUUID() : generateUUID(),
          date: exitDate,
          price: exitPrice,
          quantity: remainingUnits,
          fees: fees,
          notes: notes,
          exitDate: exitDate,
          exitPrice: exitPrice
        };
        
        const partialExits = [...(latestTrade.partialExits || []), finalPartialExit];
        
        let weightedSum = 0;
        partialExits.forEach(exit => {
          weightedSum += exit.price * exit.quantity;
        });
        
        const updatedTrade: Trade = {
          ...latestTrade,
          status: 'closed',
          exitDate: exitDate,
          exitPrice: weightedSum / latestTrade.quantity,
          fees: fees,
          partialExits: partialExits,
          notes: notes ? (latestTrade.notes ? `${latestTrade.notes}\n\nExit Notes: ${notes}` : notes) : latestTrade.notes
        };
        
        updateTrade(updatedTrade);
      } else {
        const fullExit: PartialExit = {
          id: crypto.randomUUID ? crypto.randomUUID() : generateUUID(),
          date: exitDate,
          price: exitPrice,
          quantity: latestTrade.quantity,
          fees: fees,
          notes: notes,
          exitDate: exitDate,
          exitPrice: exitPrice
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
      const latestTrade = getTradeById(trade.id);
      if (!latestTrade) {
        toast.error("Failed to retrieve latest trade data");
        return;
      }
      
      const newPartialExit: PartialExit = {
        id: crypto.randomUUID ? crypto.randomUUID() : generateUUID(),
        date: partialExitDate,
        price: partialExitPrice,
        quantity: partialQuantity,
        fees: partialFees,
        notes: partialNotes,
        exitDate: partialExitDate,
        exitPrice: partialExitPrice
      };

      const partialExits = [...(latestTrade.partialExits || []), newPartialExit];
      
      const newTotalExitedQuantity = partialExits.reduce(
        (total, exit) => total + exit.quantity, 
        0
      );
      
      const updatedTrade: Trade = {
        ...latestTrade,
        partialExits
      };
      
      if (newTotalExitedQuantity === latestTrade.quantity) {
        let weightedSum = 0;
        partialExits.forEach(exit => {
          weightedSum += exit.price * exit.quantity;
        });
        
        updatedTrade.status = 'closed';
        updatedTrade.exitDate = partialExitDate;
        updatedTrade.exitPrice = weightedSum / latestTrade.quantity;
      } else {
        updatedTrade.status = 'open';
        if (updatedTrade.exitDate) updatedTrade.exitDate = undefined;
        if (updatedTrade.exitPrice !== undefined) updatedTrade.exitPrice = undefined;
      }
      
      updateTrade(updatedTrade);
      
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
