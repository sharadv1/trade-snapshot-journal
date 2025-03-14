
import { FuturesContractDetails } from '@/types';

export interface FuturesContractSelectorProps {
  selectedValue?: string;
  onSelect: (value: FuturesContractDetails) => void;
}

export interface FuturesContractDetailsProps {
  details: Partial<FuturesContractDetails>;
  value?: number;
}
