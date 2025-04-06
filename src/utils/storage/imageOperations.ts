
import { getTradeById, updateTrade } from './tradeOperations';

// Check if a media URL is a video
export const isVideo = (url: string): boolean => {
  return url.includes('video') || 
         url.startsWith('data:video') || 
         url.endsWith('.mp4') || 
         url.endsWith('.webm') || 
         url.endsWith('.mov') ||
         url.endsWith('.avi') ||
         url.endsWith('.mkv');
};

// Save media to a trade
export const saveMediaToTrade = async (tradeId: string, mediaUrl: string): Promise<void> => {
  const trade = getTradeById(tradeId);
  
  if (trade) {
    // If this is a video and it's very large, warn in console (but still save)
    if (isVideo(mediaUrl) && mediaUrl.length > 10 * 1024 * 1024) {
      console.warn('Saving a very large video to trade. This may cause storage issues.');
    }
    
    const updatedTrade = {
      ...trade,
      images: [...trade.images, mediaUrl]
    };
    await updateTrade(updatedTrade);
  }
};

// Delete media from a trade
export const deleteMediaFromTrade = async (tradeId: string, mediaIndex: number): Promise<void> => {
  const trade = getTradeById(tradeId);
  
  if (trade) {
    const updatedImages = [...trade.images];
    updatedImages.splice(mediaIndex, 1);
    
    const updatedTrade = {
      ...trade,
      images: updatedImages
    };
    await updateTrade(updatedTrade);
  }
};

// Functions for legacy compatibility
export const saveImageToTrade = saveMediaToTrade;
export const deleteImageFromTrade = deleteMediaFromTrade;
