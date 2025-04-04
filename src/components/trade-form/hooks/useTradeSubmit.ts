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
  const handleSubmit = (e: React.FormEvent, onSuccess?: (tradeId: string) => void): boolean => {
    e.preventDefault();
    console.log('Trade form submitted with data:', trade);
    
    // Validate required fields
    if (!trade.symbol || !trade.entryPrice || !trade.quantity) {
      toast.error("Please fill in all required fields");
      return false;
    }
    
    try {
      // Ensure strategy has a default value if empty
      const finalStrategy = trade.strategy || 'default-strategy';
      
      // Filter out any extremely large data URLs to prevent storage quota issues
      // But keep server media paths (they start with "/media/")
      const filteredImages = images.filter(img => {
        // Always keep server media paths
        if (img.startsWith('/media/')) {
          return true;
        }
        
        // Check if image is a data URL and if it's too large (>2MB)
        if (img.startsWith('data:') && img.length > 2 * 1024 * 1024) {
          console.warn('Skipping large data URL to prevent storage quota issues');
          return false;
        }
        return true;
      });
      
      if (filteredImages.length < images.length) {
        toast.warning("Some media files were too large and won't be saved to prevent storage issues");
      }
      
      const tradeToSave = {
        ...trade,
        strategy: finalStrategy,
        images: filteredImages,
        mistakes: trade.mistakes || [],
        ssmtQuarters: trade.ssmtQuarters || '', // Include SSMT Quarters in saved trade
        contractDetails: trade.type === 'futures' ? contractDetails : undefined
      };
      
      console.log('Processing trade data before save:', tradeToSave);
      
      // Update idea status if an idea is associated with this trade
      if (trade.ideaId) {
        markIdeaAsTaken(trade.ideaId);
      }
      
      let tradeId: string;
      
      if (isEditing && initialTrade) {
        const updatedTrade = { 
          ...initialTrade, 
          ...tradeToSave,
          partialExits: initialTrade.partialExits || [] 
        } as Trade;
        
        console.log('Updating existing trade:', updatedTrade);
        updateTrade(updatedTrade);
        toast.success("Trade updated successfully");
        tradeId = updatedTrade.id;
      } else {
        const newId = generateUUID();
        const newTrade = {
          ...tradeToSave,
          id: newId,
          partialExits: [],
          status: 'open' // Ensure new trades are created with an open status
        } as Trade;
        
        console.log('Adding new trade:', newTrade);
        addTrade(newTrade);
        toast.success("Trade added successfully");
        tradeId = newId;
      }
      
      // Call onSuccess callback with trade ID if provided
      if (onSuccess) {
        onSuccess(tradeId);
      }
      
      return true;
    } catch (error) {
      console.error("Error saving trade:", error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        toast.error("Storage limit exceeded. Try removing some images or videos before saving.");
      } else {
        toast.error("Failed to save trade: " + (error instanceof Error ? error.message : "Unknown error"));
      }
      return false;
    }
  };

  return { handleSubmit };
}
