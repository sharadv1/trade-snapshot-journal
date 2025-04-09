
import { Trade } from '@/types';
import { addTrade, updateTrade } from '@/utils/tradeStorage';
import { markIdeaAsTaken } from '@/utils/ideaStorage';
import { toast } from '@/utils/toast';
import { generateUUID } from '@/utils/generateUUID';
import { getContractPointValue } from '@/utils/calculations/contractUtils';

export function useTradeSubmit(
  trade: Partial<Trade>,
  images: string[],
  contractDetails: Partial<any>,
  isEditing: boolean,
  initialTrade?: Trade
) {
  const handleSubmit = async (e: React.FormEvent, onSuccess?: (tradeId: string) => void): Promise<boolean> => {
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
      const filteredImages = images ? images.filter(img => {
        // Always keep server media paths
        if (img.startsWith('/media/')) {
          return true;
        }
        
        // Check if media is a data URL and if it's too large
        if (img.startsWith('data:')) {
          const isVideo = img.startsWith('data:video/');
          const sizeLimit = isVideo ? 20 * 1024 * 1024 : 2 * 1024 * 1024; // 20MB for videos, 2MB for images
          
          if (img.length > sizeLimit) {
            console.warn(`Skipping large ${isVideo ? 'video' : 'image'} data URL to prevent storage quota issues`);
            return false;
          }
        }
        return true;
      }) : [];
      
      if (filteredImages.length < (images?.length || 0)) {
        toast.warning("Some media files were too large and won't be saved to prevent storage issues");
      }
      
      // If this is a futures trade, make sure we have proper contract details including point value
      let futuresContractDetails = trade.type === 'futures' ? contractDetails : undefined;
      
      // For futures trades, ensure we have a point value saved in contract details
      if (trade.type === 'futures') {
        // Create a temporary trade object to calculate point value if needed
        const tempTrade = { ...trade, id: initialTrade?.id || 'temp' } as Trade;
        
        // If contract details doesn't have tickValue (point value), add it
        if (!futuresContractDetails?.tickValue) {
          const pointValue = getContractPointValue(tempTrade);
          console.log(`Saving trade with calculated point value: ${pointValue} for ${trade.symbol}`);
          
          futuresContractDetails = {
            ...futuresContractDetails,
            tickValue: pointValue,
            // Add minimal required contract details
            exchange: futuresContractDetails?.exchange || 'DEFAULT',
            contractSize: futuresContractDetails?.contractSize || 1,
            tickSize: futuresContractDetails?.tickSize || 0.01
          };
        }
      }
      
      const tradeToSave = {
        ...trade,
        strategy: finalStrategy,
        images: filteredImages,
        mistakes: trade.mistakes || [],
        ssmtQuarters: trade.ssmtQuarters || '', // Include SSMT Quarters in saved trade
        contractDetails: futuresContractDetails
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
        await updateTrade(updatedTrade);
        
        // Trigger storage events to update UI
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'trade-journal-trades'
        }));
        
        // Explicitly dispatch the custom event for trade updates
        document.dispatchEvent(new CustomEvent('trade-updated'));
        window.dispatchEvent(new Event('trades-updated'));
        
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
        await addTrade(newTrade);
        
        // Trigger storage events to update UI
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'trade-journal-trades'
        }));
        
        // Explicitly dispatch the custom event for trade updates
        document.dispatchEvent(new CustomEvent('trade-updated'));
        window.dispatchEvent(new Event('trades-updated'));
        
        tradeId = newId;
      }
      
      // Call onSuccess callback with trade ID if provided
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(tradeId);
      }
      
      return true;
    } catch (error) {
      console.error("Error saving trade:", error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        toast.error("Storage limit exceeded. Try removing some media files or videos before saving.");
      } else {
        toast.error("Failed to save trade: " + (error instanceof Error ? error.message : "Unknown error"));
      }
      return false;
    }
  };

  return { handleSubmit };
}
