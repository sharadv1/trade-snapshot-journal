
import { Trade } from '@/types';
import { addTrade, updateTrade } from '@/utils/tradeStorage';
import { markIdeaAsTaken } from '@/utils/ideaStorage';
import { toast } from '@/utils/toast';
import { generateUUID } from '@/utils/generateUUID';

export function useTradeSubmit(
  trade: Partial<Trade>,
  images: string[],
  contractDetails: Partial<any>,
  isEditing: boolean,
  initialTrade?: Trade
) {
  const handleSubmit = (e: React.FormEvent): boolean => {
    e.preventDefault();
    console.log('Trade form submitted with data:', trade);
    
    if (!trade.symbol || !trade.entryPrice || !trade.quantity) {
      toast.error("Please fill in all required fields");
      return false;
    }
    
    try {
      // Ensure strategy has a default value if empty
      const finalStrategy = trade.strategy || 'default-strategy';
      
      const tradeToSave = {
        ...trade,
        strategy: finalStrategy,
        images,
        contractDetails: trade.type === 'futures' ? contractDetails : undefined
      };
      
      console.log('Processing trade data before save:', tradeToSave);
      
      // Update idea status if an idea is associated with this trade
      if (trade.ideaId) {
        markIdeaAsTaken(trade.ideaId);
      }
      
      if (isEditing && initialTrade) {
        const updatedTrade = { 
          ...initialTrade, 
          ...tradeToSave,
          partialExits: initialTrade.partialExits || [] 
        } as Trade;
        
        console.log('Updating existing trade:', updatedTrade);
        updateTrade(updatedTrade);
        toast.success("Trade updated successfully");
      } else {
        const newTrade = {
          ...tradeToSave,
          id: generateUUID(),
          partialExits: []
        } as Trade;
        
        console.log('Adding new trade:', newTrade);
        addTrade(newTrade);
        toast.success("Trade added successfully");
      }
      
      return true;
    } catch (error) {
      console.error("Error saving trade:", error);
      toast.error("Failed to save trade: " + (error instanceof Error ? error.message : "Unknown error"));
      return false;
    }
  };

  return { handleSubmit };
}
