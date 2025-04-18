
import { useState, useEffect } from 'react';
import { getIdeas } from '@/utils/ideaStorage';

export function useValidIdeasCount() {
  const [validIdeasCount, setValidIdeasCount] = useState(0);

  useEffect(() => {
    // Count valid ideas (those with status of 'still valid' or 'open')
    const ideas = getIdeas();
    const validCount = ideas.filter(idea => ['still valid', 'open'].includes(idea.status)).length;
    setValidIdeasCount(validCount);

    // Listen for storage events (when ideas are updated)
    const handleStorageChange = () => {
      const updatedIdeas = getIdeas();
      const updatedValidCount = updatedIdeas.filter(idea => 
        ['still valid', 'open'].includes(idea.status)
      ).length;
      setValidIdeasCount(updatedValidCount);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ideas-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ideas-updated', handleStorageChange);
    };
  }, []);

  return validIdeasCount;
}
