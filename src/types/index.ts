import { ReactNode } from 'react';

export const COMMON_FUTURES_CONTRACTS = [
  {
    symbol: 'ES',
    name: 'E-mini S&P 500',
    exchange: 'CME',
    tickSize: 0.25,
    pointValue: 50,
    description: 'E-mini S&P 500 Futures'
  },
  {
    symbol: 'MES',
    name: 'Micro E-mini S&P 500',
    exchange: 'CME',
    tickSize: 0.25,
    pointValue: 5,
    description: 'Micro E-mini S&P 500 Futures'
  },
  {
    symbol: 'NQ',
    name: 'E-mini Nasdaq 100',
    exchange: 'CME',
    tickSize: 0.25,
    pointValue: 20,
    description: 'E-mini Nasdaq 100 Futures'
  },
  {
    symbol: 'MNQ',
    name: 'Micro E-mini Nasdaq 100',
    exchange: 'CME',
    tickSize: 0.25,
    pointValue: 2,
    description: 'Micro E-mini Nasdaq 100 Futures'
  },
  {
    symbol: 'YM',
    name: 'E-mini Dow Jones',
    exchange: 'CBOT',
    tickSize: 1.0,
    pointValue: 5,
    description: 'E-mini Dow Jones Futures'
  },
  {
    symbol: 'MYM',
    name: 'Micro E-mini Dow Jones',
    exchange: 'CBOT',
    tickSize: 1.0,
    pointValue: 0.5,
    description: 'Micro E-mini Dow Jones Futures'
  },
  {
    symbol: 'RTY',
    name: 'E-mini Russell 2000',
    exchange: 'CME',
    tickSize: 0.10,
    pointValue: 50,
    description: 'E-mini Russell 2000 Futures'
  },
  {
    symbol: 'M2K',
    name: 'Micro E-mini Russell 2000',
    exchange: 'CME',
    tickSize: 0.10,
    pointValue: 5,
    description: 'Micro E-mini Russell 2000 Futures'
  },
  {
    symbol: 'CL',
    name: 'Crude Oil',
    exchange: 'NYMEX',
    tickSize: 0.01,
    pointValue: 1000,
    description: 'Crude Oil Futures'
  },
  {
    symbol: 'MCL',
    name: 'Micro WTI Crude Oil',
    exchange: 'NYMEX',
    tickSize: 0.01,
    pointValue: 100,
    description: 'Micro WTI Crude Oil Futures'
  },
  {
    symbol: 'GC',
    name: 'Gold',
    exchange: 'COMEX',
    tickSize: 0.10,
    pointValue: 100,
    description: 'Gold Futures'
  },
  {
    symbol: 'MGC',
    name: 'Micro Gold',
    exchange: 'COMEX',
    tickSize: 0.10,
    pointValue: 10,
    description: 'Micro Gold Futures'
  }
];

export interface Trade {
  id: string;
  symbol: string;
  date?: string;
  entryDate: string;
  exitDate?: string;
  entryPrice: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  quantity: number;
  fees?: number;
  notes?: string;
  status: 'open' | 'closed';
  type: 'stock' | 'options' | 'futures' | 'crypto' | 'forex'; // Changed 'option' to 'options'
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
  ssmtQuarters?: string;
  pspTime?: string;
  account?: string;
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
    latestExitDate?: string; // Added for trade calendar
    weightedExitPrice?: number; // Added for metrics calculator
  };
}

// Fixed PartialExit interface to not use getters/setters which aren't allowed in interfaces
export interface PartialExit {
  id: string;
  date: string;
  price: number;
  quantity: number;
  fees?: number;
  notes?: string;
  // These fields are provided for backward compatibility
  exitDate?: string;
  exitPrice?: number;
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
  status: 'open' | 'taken' | 'expired' | 'invalid' | 'still valid' | 'invalidated' | 'missed'; // Combining all status types
  createdAt: string;
  direction?: 'long' | 'short';
  tradeId?: string;
  notes?: string;
  // For backward compatibility with older idea formats that used date instead of createdAt
  date?: string;
}

export type LegacyTradeIdeaStatus = 'still valid' | 'invalidated' | 'taken' | 'missed';

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
  icon?: string;
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
  // Added fields for weekly reflections
  weekId?: string; // this can be optional in base type
  weekStart?: string;
  weekEnd?: string;
  reflection?: string;
  weeklyPlan?: string;
  grade?: string;
  // Added fields for monthly reflections
  monthId?: string;
  monthStart?: string;
  monthEnd?: string;
  // Common fields for both reflection types
  lastUpdated?: string;
  tradeIds?: string[];
}

// Create specific types with non-optional required fields
export interface WeeklyReflection extends ReflectionEntry {
  weekId: string; // Make this required in WeeklyReflection
}

export interface MonthlyReflection extends ReflectionEntry {
  monthId: string; // Make this required in MonthlyReflection
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
  syncFrequency?: number;
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

// Lesson types
export interface Lesson {
  id: string;
  title: string;
  description: string;
  types: string[];
  media: LessonMedia[];
  createdAt: string;
  updatedAt: string;
}

export interface LessonMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  caption?: string;
}
