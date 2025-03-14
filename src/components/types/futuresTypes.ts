
import { FuturesContractDetails } from '@/types';

export interface FuturesContractSelectorProps {
  selectedValue?: string;
  value?: string; // Added to match usage in TradeDetailsForm
  onSelect: (value: FuturesContractDetails) => void;
  onChange?: (value: any) => void; // Added to match usage in TradeDetailsForm
}

export interface FuturesContractDetailsProps {
  details: Partial<FuturesContractDetails>;
  value?: number;
  symbol?: string; // Added to match usage in TradeDetailsForm
  contractDetails?: Partial<FuturesContractDetails>; // Added to match usage in TradeDetailsForm
  pointValue?: number; // Added to match usage in TradeDetailsForm
}
