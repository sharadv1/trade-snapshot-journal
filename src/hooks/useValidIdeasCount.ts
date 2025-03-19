
import { useEffect, useState } from 'react';
import { getIdeas, syncIdeasWithServer } from '@/utils/ideaStorage';
import { isUsingServerSync } from '@/utils/storage/serverSync';

export function useValidIdeasCount() {
  const [validIdeasCount, setValidIdeasCount] = useState<number>(0);

  useEffect(() => {
    const countValidIdeas = () => {
      const ideas = getIdeas();
      const validIdeas = ideas.filter(idea => idea.status === 'still valid');
      setValidIdeasCount(validIdeas.length);
    };

    // If server sync is enabled, sync ideas first
    const syncAndCount = async () => {
      if (isUsingServerSync()) {
        try {
          await syncIdeasWithServer();
        } catch (error) {
          console.error('Error syncing ideas:', error);
        }
      }
      countValidIdeas();
    };

    // Initial count
    syncAndCount();

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
