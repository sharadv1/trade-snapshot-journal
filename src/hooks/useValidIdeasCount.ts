
import { useEffect, useState } from 'react';
import { getIdeas } from '@/utils/ideaStorage';

export function useValidIdeasCount() {
  const [validIdeasCount, setValidIdeasCount] = useState<number>(0);

  useEffect(() => {
    const countValidIdeas = () => {
      const ideas = getIdeas();
      const validIdeas = ideas.filter(idea => idea.status === 'still valid');
      setValidIdeasCount(validIdeas.length);
    };

    // Initial count
    countValidIdeas();

    // Listen for storage events to update the count when ideas change
    const handleStorageChange = () => {
      countValidIdeas();
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen to our custom storage event for same-window updates
    window.addEventListener('ideas-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ideas-updated', handleStorageChange);
    };
  }, []);

  return validIdeasCount;
}
