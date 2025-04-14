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
  const [exitPrice, setExitPrice] = useState<number>(0);
  const [exitQuantity, setExitQuantity] = useState<number>(0);
  const [exitDate, setExitDate] = useState<string>(getCurrentCentralTime());
  const [fees, setFees] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const handleSetExitPrice = (value: string | number) => {
    setExitPrice(typeof value === 'string' ? parseFloat(value) || 0 : value);
  };
  
  const handleSetExitQuantity = (value: string | number) => {
    setExitQuantity(typeof value === 'string' ? parseFloat(value) || 0 : value);
  };

  const getCurrentCentralTime = () => {
    return formatInTimeZone(new Date(), 'America/Chicago', "yyyy-MM-dd'T'HH:mm");
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
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (exitQuantity <= 0) {
      toast.error("Exit quantity must be greater than zero.");
      setIsSubmitting(false);
      return;
    }

    if (exitPrice <= 0) {
      toast.error("Exit price must be greater than zero.");
      setIsSubmitting(false);
      return;
    }

    try {
      const latestTrade = getTradeById(trade.id);
      if (!latestTrade) {
        toast.error("Failed to retrieve latest trade data");
        return;
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

      const updatedPartialExits = [...(latestTrade.partialExits || []), newPartialExit];

      const updatedTrade: Trade = {
        ...latestTrade,
        partialExits: updatedPartialExits
      };

      let exitedQty = 0;
      updatedPartialExits.forEach(exit => {
        const exitQty = typeof exit.quantity === 'string' ? parseFloat(exit.quantity.toString()) : exit.quantity;
        const exitQtyNumber = isNaN(exitQty) ? 0 : exitQty;
        exitedQty += exitQtyNumber;
      });

      const totalTradeQuantity = typeof updatedTrade.quantity === 'string' ?
        parseFloat(updatedTrade.quantity.toString()) :
        updatedTrade.quantity;

      // Auto-detect if target was reached based on exit price
      if (trade.takeProfit) {
        const targetPrice = typeof trade.takeProfit === 'string' ? parseFloat(trade.takeProfit.toString()) : trade.takeProfit;
        const targetPriceNum = isNaN(targetPrice) ? 0 : targetPrice;
        const currentExitPrice = typeof exitPrice === 'string' ? parseFloat(exitPrice.toString()) : exitPrice;
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
          const exitPrice = typeof exit.exitPrice === 'string' ? parseFloat(exit.exitPrice.toString()) : exit.exitPrice;
          const exitQuantity = typeof exit.quantity === 'string' ? parseFloat(exit.quantity.toString()) : exit.quantity;
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
      onSuccess();
      
      setExitPrice(0);
      setExitQuantity(0);
      setExitDate(getCurrentCentralTime());
      setFees(undefined);
      setNotes('');

    } catch (error) {
      console.error("Error adding partial exit:", error);
      toast.error("Failed to add partial exit");
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
