
import { useEffect, useState } from 'react';
import { getIdeas } from '@/utils/ideaStorage';
import { TradeIdea } from '@/types';

export function useValidIdeasCount() {
  const [validIdeasCount, setValidIdeasCount] = useState<number>(0);

  useEffect(() => {
    const countValidIdeas = () => {
      const ideas = getIdeas();
      const validIdeas = ideas.filter(idea => idea.status === 'still valid');
      setValidIdeasCount(validIdeas.length);
    };

    // Count valid ideas on initial render
    countValidIdeas();

    // Listen for storage events to update the count when ideas change
    const handleStorageChange = () => {
      countValidIdeas();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return validIdeasCount;
}
