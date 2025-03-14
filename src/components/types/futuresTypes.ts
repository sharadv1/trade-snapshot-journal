
import { FuturesContractDetails } from '@/types';

export interface FuturesContractSelectorProps {
  selectedValue?: string;
  value?: string; 
  onSelect: (value: FuturesContractDetails) => void;
  onChange?: (value: any) => void;
}

export interface FuturesContractDetailsProps {
  details: Partial<FuturesContractDetails>;
  value?: number;
  symbol?: string;
  contractDetails?: Partial<FuturesContractDetails>;
  pointValue?: number;
}
