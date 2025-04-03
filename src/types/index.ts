
import { ReactNode } from 'react';

export interface Trade {
  id: string;
  symbol: string;
  date?: string; // For backward compatibility
  entryDate: string;
  exitDate?: string;
  entryPrice: number;
  exitPrice?: number;
  stopLoss?: number; // Now required in the UI but keeping optional in the type for backwards compatibility
  takeProfit?: number;
  quantity: number;
  fees?: number;
  notes?: string;
  status: 'open' | 'closed';
  type: 'stock' | 'option' | 'futures' | 'crypto' | 'forex';
  direction?: 'long' | 'short';
  images?: string[];
  contractDetails?: FuturesContractDetails;
  strategy?: string;
  tags?: string[];
  timeframe?: string;
  commission?: number;
  grade?: 'A' | 'B' | 'C' | 'D' | 'F';
  results?: string;
  mistakes?: string[];
  partialExits?: PartialExit[];
  ideaId?: string;
  ssmtQuarters?: string; // SSMT Quarters
  pspTime?: string; // PSP Time
  account?: string; // Added the account property
}

export interface TradeWithMetrics extends Trade {
  metrics: {
    profitLoss?: number;
    profitLossPercentage?: number;
    riskedAmount?: number;
    rMultiple?: number;
    riskRewardRatio?: number;
    maxPotentialGain?: number;
    calculationExplanation?: string;
  };
}

export interface PartialExit {
  id: string;
  date: string;
  price: number;
  quantity: number;
  fees?: number;
  notes?: string;
}

export interface FuturesContractDetails {
  exchange?: string;
  contractSize?: number;
  tickSize?: number;
  tickValue?: number;
  margin?: number;
  maintenanceMargin?: number;
  expirationDate?: string;
}

export interface Strategy {
  id: string;
  name: string;
  description?: string;
  color?: string;
  tags?: string[];
}

export interface TradeIdea {
  id: string;
  symbol: string;
  description?: string;
  images?: string[];
  status: 'open' | 'taken' | 'expired' | 'invalid';
  createdAt: string;
  direction?: 'long' | 'short';
  tradeId?: string;
  notes?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface MenuItem {
  title: string;
  href: string;
  icon?: React.ElementType;
  disabled?: boolean;
  external?: boolean;
  label?: string;
}

export interface SidebarNavItem {
  title: string;
  disabled?: boolean;
  external?: boolean;
  icon?: keyof typeof icons;
  href?: string;
  items?: SidebarNavItem[];
}

export interface NavItem {
  title: string;
  href?: string;
  disabled?: boolean;
  external?: boolean;
  icon?: React.ReactNode;
  label?: string;
  description?: string;
  items?: NavItem[];
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[];
}

export interface FooterItem {
  title: string;
  items: {
    title: string;
    href: string;
    external?: boolean;
  }[];
}

export interface Metadata {
  title: string;
  description: string;
  cardImage: string;
}

export interface ReflectionEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  type: 'weekly' | 'monthly';
  tags?: string[];
}

export interface TradeComment {
  id: string;
  tradeId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TradingJournalConfig {
  userId?: string;
  serverUrl?: string;
  autoSync?: boolean;
  syncFrequency?: number; // in minutes
  apiKey?: string;
}

export interface ImageProps {
  width: number;
  height?: number;
  className?: string;
  src: string;
  alt: string;
  priority?: boolean;
}

export interface Symbol {
  symbol: string;
  name?: string;
  exchange?: string;
  type?: 'stock' | 'futures' | 'forex' | 'crypto' | 'option';
  sector?: string;
  industry?: string;
  contractDetails?: FuturesContractDetails;
}
