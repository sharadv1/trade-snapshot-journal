
import { TradeIdea } from '@/types';
import { toast } from './toast';
import { isUsingServerSync, getServerUrl } from './storage/serverSync';

// Local storage key
const IDEAS_STORAGE_KEY = 'trade-journal-ideas';

// Custom event for notifying other components in same window
const IDEAS_UPDATED_EVENT = new Event('ideas-updated');

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

// Save ideas to storage (localStorage)
export const saveIdeas = (ideas: TradeIdea[]): void => {
  try {
    // Always save to localStorage
    localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(ideas));
    
    // Dispatch storage events to notify components
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(IDEAS_UPDATED_EVENT);
  } catch (error) {
    console.error('Error saving trade ideas:', error);
    toast.error('Failed to save trade ideas');
  }
};

// Add a new idea
export const addIdea = (idea: TradeIdea): void => {
  const ideas = getIdeas();
  ideas.push(idea);
  saveIdeas(ideas);
};

// Update an existing idea
export const updateIdea = (updatedIdea: TradeIdea): void => {
  const ideas = getIdeas();
  const index = ideas.findIndex(idea => idea.id === updatedIdea.id);
  
  if (index !== -1) {
    ideas[index] = updatedIdea;
    saveIdeas(ideas);
  }
};

// Delete an idea
export const deleteIdea = (ideaId: string): void => {
  const ideas = getIdeas();
  const filteredIdeas = ideas.filter(idea => idea.id !== ideaId);
  saveIdeas(filteredIdeas);
};

// Get a single idea by ID
export const getIdeaById = (ideaId: string): TradeIdea | undefined => {
  const ideas = getIdeas();
  return ideas.find(idea => idea.id === ideaId);
};

// Update idea status to "taken" when assigned to a trade
export const markIdeaAsTaken = (ideaId: string): void => {
  const idea = getIdeaById(ideaId);
  if (idea && idea.status !== 'taken') {
    updateIdea({
      ...idea,
      status: 'taken'
    });
  }
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
