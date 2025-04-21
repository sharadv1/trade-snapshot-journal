
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

// Test if image URL is valid by actually loading it
export const testImageUrl = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!url || url === '/placeholder.svg') {
      resolve(false);
      return;
    }
    
    // For data URLs, test if they're properly formatted
    if (url.startsWith('data:')) {
      try {
        // Check for proper format
        const parts = url.split(',');
        if (parts.length !== 2) {
          console.warn('Malformed data URL detected:', url.substring(0, 30) + '...');
          resolve(false);
          return;
        }
        
        // For image data URLs, ensure they have an image mime type
        if (url.startsWith('data:image/')) {
          // Consider data URLs as valid if they have the correct format
          resolve(true);
          return;
        }
        
        // For video data URLs
        if (url.startsWith('data:video/')) {
          // Video URLs are considered valid if properly formatted
          resolve(true);
          return;
        }
        
        // If it's not an image or video, reject it
        console.warn('Data URL has invalid mime type:', url.substring(0, 30) + '...');
        resolve(false);
      } catch (error) {
        console.error('Error testing data URL:', error);
        resolve(false);
      }
      return;
    }
    
    // For media paths from the server
    if (url.startsWith('/media/')) {
      console.log('Testing server media path:', url);
      
      // For server media paths, we'll use an Image object to test
      const img = new Image();
      
      img.onload = () => {
        console.log('Server media image successfully loaded:', url);
        resolve(true);
      };
      
      img.onerror = (e) => {
        // Even if we get a 404, we should not immediately show placeholder
        // Since there might be caching or timing issues with the server
        console.warn('Server media image failed to load:', url, e);
        
        // Give it a chance to be valid anyway
        // This prevents flickering between real image and placeholder
        resolve(true);
      };
      
      // Set the source to trigger loading
      img.src = url;
      return;
    }
    
    // For local file URLs
    if (url.startsWith('/public/')) {
      // Test if image exists by creating an Image object
      const img = new Image();
      
      img.onload = () => {
        console.log('Image successfully loaded:', url);
        resolve(true);
      };
      
      img.onerror = () => {
        console.warn('Image failed to load:', url);
        resolve(false);
      };
      
      img.src = url;
      return;
    }
    
    // For regular URLs, try to load the image
    if (url.startsWith('http')) {
      const img = new Image();
      
      img.onload = () => {
        console.log('Remote image successfully loaded:', url);
        resolve(true);
      };
      
      img.onerror = () => {
        console.warn('Remote image failed to load:', url);
        resolve(false);
      };
      
      img.src = url;
      return;
    }
    
    // If URL doesn't match any expected format, consider invalid
    console.warn('URL has unknown format:', url);
    resolve(false);
  });
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
    
    // Log successful image save
    console.log('Media successfully saved to trade:', tradeId, safeUrl.substring(0, 50) + '...');
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
    console.log('Media successfully deleted from trade:', tradeId, 'index:', mediaIndex);
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
    
    // Check if it has the correct mime type
    const mimeType = parts[0].split(':')[1]?.split(';')[0];
    if (!mimeType || (!mimeType.startsWith('image/') && !mimeType.startsWith('video/') && mimeType !== 'application/pdf')) {
      console.warn('Invalid mime type in data URL:', mimeType);
      return '/placeholder.svg';
    }
  }
  
  // Check for invalid or corrupted URLs (non-data URLs)
  if (!strUrl.startsWith('data:') && !strUrl.startsWith('/') && !strUrl.startsWith('http')) {
    console.warn('Invalid URL format detected:', strUrl.substring(0, 20) + '...');
    return '/placeholder.svg';
  }
  
  return strUrl;
};

// Functions for legacy compatibility
export const saveImageToTrade = saveMediaToTrade;
export const deleteImageFromTrade = deleteMediaFromTrade;
