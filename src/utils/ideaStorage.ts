
import { TradeIdea } from '@/types';
import { toast } from './toast';
import { isUsingServerSync, getServerUrl } from './storage/serverSync';

// Local storage key
const IDEAS_STORAGE_KEY = 'trade-journal-ideas';

// Custom event for notifying other components in same window
const IDEAS_UPDATED_EVENT = new Event('ideas-updated');

// Maximum size for ideas storage (5MB in characters, approximately)
const MAX_STORAGE_SIZE = 5 * 1024 * 1024;

// Get ideas from storage (localStorage)
export const getIdeas = (): TradeIdea[] => {
  try {
    const ideasJson = localStorage.getItem(IDEAS_STORAGE_KEY);
    if (!ideasJson) return [];
    return JSON.parse(ideasJson);
  } catch (error) {
    console.error('Error getting trade ideas:', error);
    toast.error('Failed to load trade ideas');
    return [];
  }
};

// Get storage size estimation
const getIdeasStorageSize = (ideas: TradeIdea[]): number => {
  try {
    const jsonString = JSON.stringify(ideas);
    return jsonString.length;
  } catch (error) {
    console.error('Error calculating ideas storage size:', error);
    return 0;
  }
};

// Check if adding an idea would exceed storage limits
const wouldExceedStorageLimit = (ideas: TradeIdea[], newIdea: TradeIdea): boolean => {
  // Make a copy of the ideas array and add the new idea
  const updatedIdeas = [...ideas, newIdea];
  const storageSize = getIdeasStorageSize(updatedIdeas);
  return storageSize > MAX_STORAGE_SIZE;
};

// Save ideas to storage (localStorage)
export const saveIdeas = (ideas: TradeIdea[]): boolean => {
  try {
    const jsonString = JSON.stringify(ideas);
    
    // Check if the stringified data is too large
    if (jsonString.length > MAX_STORAGE_SIZE) {
      toast.error('Storage limit exceeded. Try removing some images or text before saving.');
      return false;
    }
    
    // Try to save to localStorage
    localStorage.setItem(IDEAS_STORAGE_KEY, jsonString);
    
    // Dispatch storage events to notify components
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(IDEAS_UPDATED_EVENT);
    
    return true;
  } catch (error) {
    console.error('Error saving trade ideas:', error);
    
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      toast.error('Storage limit exceeded. Try removing some ideas, images, or text before saving.');
    } else {
      toast.error('Failed to save trade ideas');
    }
    
    return false;
  }
};

// Add a new idea with size checking
export const addIdea = (idea: TradeIdea): boolean => {
  const ideas = getIdeas();
  
  // Check if adding this idea would exceed storage limits
  if (wouldExceedStorageLimit(ideas, idea)) {
    toast.error('This idea would exceed storage limits. Try using fewer or smaller images.');
    return false;
  }
  
  ideas.push(idea);
  return saveIdeas(ideas);
};

// Update an existing idea with size checking
export const updateIdea = (updatedIdea: TradeIdea): boolean => {
  const ideas = getIdeas();
  const index = ideas.findIndex(idea => idea.id === updatedIdea.id);
  
  if (index !== -1) {
    // Remove the existing idea first
    const existingIdea = ideas[index];
    ideas.splice(index, 1);
    
    // Check if updating this idea would exceed storage limits
    if (wouldExceedStorageLimit(ideas, updatedIdea)) {
      // Put the original idea back
      ideas.splice(index, 0, existingIdea);
      toast.error('This update would exceed storage limits. Try using fewer or smaller images.');
      return false;
    }
    
    // It's safe to update
    ideas[index] = updatedIdea;
    return saveIdeas(ideas);
  }
  
  return false;
};

// Delete an idea
export const deleteIdea = (ideaId: string): boolean => {
  const ideas = getIdeas();
  const filteredIdeas = ideas.filter(idea => idea.id !== ideaId);
  return saveIdeas(filteredIdeas);
};

// Get a single idea by ID
export const getIdeaById = (ideaId: string): TradeIdea | undefined => {
  const ideas = getIdeas();
  return ideas.find(idea => idea.id === ideaId);
};

// Update idea status to "taken" when assigned to a trade
export const markIdeaAsTaken = (ideaId: string): boolean => {
  const idea = getIdeaById(ideaId);
  if (idea && idea.status !== 'taken') {
    return updateIdea({
      ...idea,
      status: 'taken'
    });
  }
  return false;
};

// Sync ideas with server (for server sync implementation)
export const syncIdeasWithServer = async (): Promise<boolean> => {
  if (!isUsingServerSync() || !getServerUrl()) {
    return false;
  }
  
  try {
    const serverUrl = `${getServerUrl().replace(/\/trades$/, '')}/ideas`;
    console.log('Syncing ideas with server at:', serverUrl);
    const response = await fetch(serverUrl);
    
    if (response.ok) {
      const serverIdeas = await response.json();
      localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(serverIdeas));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(IDEAS_UPDATED_EVENT);
      console.log('Ideas synced with server successfully');
      return true;
    } else {
      console.error('Server returned an error status when syncing ideas', response.status);
      return false;
    }
  } catch (error) {
    console.error('Error syncing ideas with server:', error);
    return false;
  }
};
