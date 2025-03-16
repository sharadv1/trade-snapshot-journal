
import { TradeIdea } from '@/types';
import { toast } from './toast';

// Local storage key
const IDEAS_STORAGE_KEY = 'trade-journal-ideas';

// Get ideas from storage
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

// Save ideas to storage
export const saveIdeas = (ideas: TradeIdea[]): void => {
  try {
    localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(ideas));
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
