
import { TradeIdea } from '@/types';

export interface IdeaFormData extends Partial<TradeIdea> {
  date: string;
  symbol: string;
  description: string;
  status: string;
  direction: 'long' | 'short';
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
