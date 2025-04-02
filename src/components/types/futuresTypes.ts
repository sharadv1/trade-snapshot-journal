
import { FuturesContractDetails } from '@/types';

export interface FuturesContractSelectorProps {
  selectedValue?: string;
  value?: string;
  onSelect?: (details: Partial<FuturesContractDetails>) => void;
  onChange?: (value: string) => void;
}

export interface FuturesContractDetailsProps {
  details?: Partial<FuturesContractDetails>;
  contractDetails?: Partial<FuturesContractDetails>;
  value?: number;
  pointValue?: number;
  symbol?: string;
  onChange?: (details: Partial<FuturesContractDetails>) => void;
}
