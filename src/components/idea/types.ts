
import { TradeIdea } from '@/types';

export interface IdeaFormData {
  id?: string;
  date: string;
  symbol: string;
  description: string;
  status: 'still valid' | 'invalidated' | 'taken' | 'missed';
  direction: 'long' | 'short';  // This is now required, no undefined
  images: string[];
}

export interface IdeaDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialIdea?: TradeIdea;
  onIdeaAdded?: () => void;
  trigger?: React.ReactNode;
  mode?: 'edit' | 'view' | 'add';
}
