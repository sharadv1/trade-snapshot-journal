
import { useState, useCallback } from 'react';
import { toast } from '@/utils/toast';
import { Trade } from '@/types';
import { getTradeById, updateTrade } from '@/utils/storage/tradeOperations';
import { generateUUID } from '@/utils/generateUUID';
import { formatInTimeZone } from 'date-fns-tz';

interface UseExitTradeLogicProps {
  trade: Trade;
  onSuccess: () => void;
}

export const useExitTradeLogic = ({ trade, onSuccess }: UseExitTradeLogicProps) => {
  // Helper function to get current time in Central timezone
  const getCurrentCentralTime = () => {
    return formatInTimeZone(new Date(), 'America/Chicago', "yyyy-MM-dd'T'HH:mm");
  };

  const [exitPrice, setExitPrice] = useState<number>(0);
  const [exitQuantity, setExitQuantity] = useState<number>(1); // Default to 1 instead of 0
  const [exitDate, setExitDate] = useState<string>(getCurrentCentralTime());
  const [fees, setFees] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const handleSetExitPrice = (value: string | number) => {
    setExitPrice(typeof value === 'string' ? parseFloat(value) || 0 : value);
  };
  
  const handleSetExitQuantity = (value: string | number) => {
    // Ensure we have a valid number greater than 0
    const parsedValue = typeof value === 'string' ? parseFloat(value) : value;
    setExitQuantity(isNaN(parsedValue) ? 0 : parsedValue);
  };

  const handleExitDateFocus = () => {
    if (!exitDate) {
      setExitDate(getCurrentCentralTime());
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleFeesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFees(value === '' ? undefined : parseFloat(value));
  };

  const handleSubmit = useCallback(async () => {
    console.log("Exit trade handleSubmit called with values:", { exitPrice, exitQuantity, exitDate });
    
    if (isSubmitting) {
      console.log("Submit already in progress, ignoring duplicate submit");
      return false;
    }
    
    setIsSubmitting(true);

    try {
      // Validate exit quantity
      if (!exitQuantity || exitQuantity <= 0) {
        toast.error("Exit quantity must be greater than zero");
        console.error("Exit quantity validation failed:", exitQuantity);
        setIsSubmitting(false);
        return false;
      }

      // Validate exit price
      if (!exitPrice || exitPrice <= 0) {
        toast.error("Exit price must be greater than zero");
        console.error("Exit price validation failed:", exitPrice);
        setIsSubmitting(false);
        return false;
      }

      const latestTrade = getTradeById(trade.id);
      if (!latestTrade) {
        toast.error("Failed to retrieve latest trade data");
        console.error("Failed to get trade by ID:", trade.id);
        setIsSubmitting(false);
        return false;
      }

      const newPartialExit = {
        id: generateUUID(),
        exitPrice: exitPrice,
        quantity: exitQuantity,
        exitDate: exitDate,
        fees: fees,
        notes: notes,
        date: exitDate,
        price: exitPrice
      };

      console.log("Creating new partial exit:", newPartialExit);

      const updatedPartialExits = [...(latestTrade.partialExits || []), newPartialExit];

      const updatedTrade: Trade = {
        ...latestTrade,
        partialExits: updatedPartialExits
      };

      let exitedQty = 0;
      updatedPartialExits.forEach(exit => {
        const exitQty = typeof exit.quantity === 'number' ? exit.quantity : parseFloat(String(exit.quantity));
        const exitQtyNumber = isNaN(exitQty) ? 0 : exitQty;
        exitedQty += exitQtyNumber;
      });

      const totalTradeQuantity = typeof updatedTrade.quantity === 'number' ?
        updatedTrade.quantity : 
        parseFloat(String(updatedTrade.quantity));

      // Auto-detect if target was reached based on exit price
      if (trade.takeProfit) {
        const targetPrice = typeof trade.takeProfit === 'number' ? 
          trade.takeProfit : parseFloat(String(trade.takeProfit));
        const targetPriceNum = isNaN(targetPrice) ? 0 : targetPrice;
        const currentExitPrice = typeof exitPrice === 'number' ? 
          exitPrice : parseFloat(String(exitPrice));
        const currentExitPriceNum = isNaN(currentExitPrice) ? 0 : currentExitPrice;
        
        const isLong = trade.direction === 'long';
        const targetReached = isLong 
          ? currentExitPriceNum >= targetPriceNum 
          : currentExitPriceNum <= targetPriceNum;

        if (targetReached) {
          updatedTrade.targetReached = true;
        }
      }

      if (exitedQty >= totalTradeQuantity) {
        updatedTrade.status = 'closed';

        let weightedSum = 0;

        updatedPartialExits.forEach(exit => {
          const exitPrice = typeof exit.exitPrice === 'number' ? exit.exitPrice : parseFloat(String(exit.exitPrice));
          const exitQuantity = typeof exit.quantity === 'number' ? exit.quantity : parseFloat(String(exit.quantity));
          weightedSum += (isNaN(exitPrice) ? 0 : exitPrice) * (isNaN(exitQuantity) ? 0 : exitQuantity);
        });

        updatedTrade.exitPrice = weightedSum / exitedQty;

        const sortedExits = [...updatedPartialExits].sort((a, b) =>
          new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime()
        );

        if (sortedExits.length > 0) {
          updatedTrade.exitDate = sortedExits[0].exitDate;
        }

        updatedTrade.fees = updatedPartialExits.reduce(
          (sum, exit) => sum + (exit.fees || 0), 0
        );
      }

      console.log('Updating trade after partial exit:', updatedTrade);
      await updateTrade(updatedTrade);

      document.dispatchEvent(new CustomEvent('trade-updated'));
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'trade-journal-trades'
      }));

      toast.success("Partial exit added successfully");
      
      if (onSuccess && typeof onSuccess === 'function') {
        console.log("Calling onSuccess callback");
        onSuccess();
      }
      
      setExitPrice(0);
      setExitQuantity(1); // Reset to 1 instead of 0
      setExitDate(getCurrentCentralTime());
      setFees(undefined);
      setNotes('');
      
      return true;
    } catch (error) {
      console.error("Error adding partial exit:", error);
      toast.error("Failed to add partial exit");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [trade, exitPrice, exitQuantity, exitDate, fees, notes, onSuccess, isSubmitting]);

  return {
    exitPrice,
    exitQuantity,
    exitDate,
    fees,
    notes,
    isSubmitting,
    handleSetExitPrice,
    handleSetExitQuantity,
    handleExitDateFocus,
    handleNotesChange,
    handleFeesChange,
    handleSubmit
  };
};
