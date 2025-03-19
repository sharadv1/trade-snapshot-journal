
import { getTradeById, updateTrade } from './tradeOperations';

// Save image to a trade
export const saveImageToTrade = async (tradeId: string, imageBase64: string): Promise<void> => {
  const trade = getTradeById(tradeId);
  
  if (trade) {
    const updatedTrade = {
      ...trade,
      images: [...trade.images, imageBase64]
    };
    await updateTrade(updatedTrade);
  }
};

// Delete image from a trade
export const deleteImageFromTrade = async (tradeId: string, imageIndex: number): Promise<void> => {
  const trade = getTradeById(tradeId);
  
  if (trade) {
    const updatedImages = [...trade.images];
    updatedImages.splice(imageIndex, 1);
    
    const updatedTrade = {
      ...trade,
      images: updatedImages
    };
    await updateTrade(updatedTrade);
  }
};
