
import { TradeIdea } from '@/types';
import { toast } from './toast';
import { isUsingServerSync, getServerUrl } from './storage/serverSync';

// Local storage key
const IDEAS_STORAGE_KEY = 'trade-journal-ideas';

// Get ideas from storage (localStorage and/or server)
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

// Save ideas to storage (localStorage and/or server)
export const saveIdeas = (ideas: TradeIdea[]): void => {
  try {
    // Always save to localStorage as a fallback
    localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(ideas));
    
    // If server sync is enabled, also save to server
    if (isUsingServerSync() && getServerUrl()) {
      const serverUrl = `${getServerUrl().replace(/\/trades$/, '')}/ideas`;
      console.log('Saving ideas to server:', serverUrl);
      
      fetch(serverUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ideas),
      })
      .then(response => {
        if (!response.ok) {
          console.error('Error saving ideas to server:', response.statusText);
          toast.error('Failed to sync ideas with server');
        } else {
          console.log('Ideas synced with server successfully');
        }
      })
      .catch(error => {
        console.error('Error syncing ideas with server:', error);
        toast.error('Server sync failed for ideas, but saved locally');
      });
    }
    
    // Dispatch a storage event to notify other tabs
    window.dispatchEvent(new Event('storage'));
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

// Sync ideas with server (force pull)
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
