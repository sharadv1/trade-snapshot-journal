
import { getTradeById, updateTrade } from './tradeOperations';

// Enhanced check if a media URL is a video - Safari compatibility
export const isVideo = (url: string): boolean => {
  if (!url) return false;
  
  // Handle undefined or empty URLs (prevents errors in Safari)
  url = url.toString();
  
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
    // Make sure the URL is valid and well-formed (for Safari)
    const safeUrl = ensureSafeUrl(mediaUrl);
    
    // If this is a video and it's very large, warn in console (but still save)
    if (isVideo(safeUrl) && safeUrl.length > 10 * 1024 * 1024) {
      console.warn('Saving a very large video to trade. This may cause storage issues.');
    }
    
    const updatedTrade = {
      ...trade,
      images: [...trade.images, safeUrl]
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

// Helper function to ensure URL is valid even in Safari
export const ensureSafeUrl = (url: string): string => {
  if (!url) return '';
  
  // Convert to string to handle any non-string values
  const strUrl = String(url);
  
  // For data URLs, ensure they have the correct format
  if (strUrl.startsWith('data:')) {
    // Check if the data URL is properly formed
    const parts = strUrl.split(',');
    if (parts.length !== 2) {
      console.warn('Malformed data URL detected, attempting to fix');
      // Return a placeholder instead of a broken URL
      return '/placeholder.svg';
    }
  }
  
  return strUrl;
};

// Functions for legacy compatibility
export const saveImageToTrade = saveMediaToTrade;
export const deleteImageFromTrade = deleteMediaFromTrade;
