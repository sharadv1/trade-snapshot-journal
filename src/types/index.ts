
export interface Trade {
  id: string;
  symbol: string;
  entryDate: string;
  exitDate?: string;
  entryPrice: number | string;
  exitPrice?: number | string;
  quantity: number | string;
  stopLoss?: number | string;
  initialStopLoss?: number | string;
  takeProfit?: number | string;
  direction: 'long' | 'short';
  type: 'stock' | 'futures' | 'forex' | 'options' | 'crypto';
  status: 'open' | 'closed';
  notes?: string;
  grade?: 'A' | 'B' | 'C' | 'D' | 'F';
  timeframe?: string;
  fees?: number;
  strategy?: string;
  images?: string[];
  contractDetails?: ContractDetails;
  partialExits?: PartialExit[];
  mistakes?: string[];
  account?: string;
  pspTime?: string;
  ssmtQuarters?: string;
  maxFavorablePrice?: number | string;
  maxAdversePrice?: number | string;
  targetReached?: boolean;
  targetReachedBeforeExit?: boolean;
  ideaId?: string;
  tags?: string[];
  riskRewardRatio?: number;
}

export interface TradeWithMetrics extends Trade {
  metrics?: {
    profitLoss: number;
    riskRewardRatio: number;
    rMultiple: number;
    profitLossPercentage: number;
    riskedAmount: number;
    initialRiskedAmount: number;
    maxPotentialGain: number;
    calculationExplanation: string;
    weightedExitPrice?: number;
    latestExitDate?: string;
    maxFavorableExcursion: number;
    maxAdverseExcursion: number;
    capturedProfitPercent: number;
  };
}

export interface Strategy {
  id: string;
  name: string;
  description?: string;
  rules?: string;
  createdAt: Date;
  color?: string; 
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: string;
}

export interface WeeklyReflection {
  id: string;
  date?: string; // Make date optional
  reflection: string;
  weeklyPlan?: string;
  grade?: string;
  weekId?: string;
  weekStart?: string;
  weekEnd?: string;
  totalPnL?: number;
  totalR?: number;
  tradeIds?: string[];
  isPlaceholder?: boolean;
  lastUpdated?: string;
  actions?: React.ReactNode;
}

export interface MonthlyReflection {
  id: string;
  date?: string; // Make date optional
  reflection: string;
  monthlyPlan?: string;
  grade?: string;
  monthId?: string;
  monthStart?: string;
  monthEnd?: string;
  totalPnL?: number;
  totalR?: number;
  tradeIds?: string[];
  isPlaceholder?: boolean;
  lastUpdated?: string;
  actions?: React.ReactNode;
}

export interface PartialExit {
  id: string;
  exitPrice: number | string;
  quantity: number | string;
  exitDate: string;
  fees?: number;
  notes?: string;
  price?: number | string;
  date?: string;
}

export interface ContractDetails {
  exchange: string;
  tickSize: string | number;
  contractSize: string | number;
  tickValue: string | number;
}

// Added alias for backwards compatibility
export type FuturesContractDetails = ContractDetails;

export interface Lesson {
  id: string;
  title: string;
  description: string;
  date: string;
  tags?: string[];
  media?: LessonMedia[];
  types?: string[];
  content?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonMedia {
  id: string;
  type: 'image' | 'video' | 'pdf';
  url: string;
  name?: string;
  caption?: string;
}

export interface TradeIdea {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  dateCreated: string;
  status: 'pending' | 'executed' | 'invalid' | 'expired' | 'still valid' | 'invalidated' | 'taken' | 'missed' | 'open';
  strategy?: string;
  description?: string;
  timeframe?: string;
  images?: string[];
  entryConditions?: string;
  stopLossConditions?: string;
  takeProfitConditions?: string;
  tradeId?: string;
  date?: string;
  createdAt?: string;
  entryPrice?: number | string;
  stopLoss?: number | string;
  takeProfit?: number | string;
}

// Define trade types
export type TradeType = 'stock' | 'futures' | 'forex' | 'options' | 'crypto';

export const TRADE_TYPES: TradeType[] = ['stock', 'futures', 'forex', 'options', 'crypto'];

// Common futures contracts data
export interface CommonFuturesContract {
  symbol: string;
  name: string;
  exchange?: string;
  tickSize?: number;
  pointValue: number;
  contractSize?: number;
  description?: string;
}

export const COMMON_FUTURES_CONTRACTS: CommonFuturesContract[] = [
  {
    symbol: "ES",
    name: "E-mini S&P 500",
    exchange: "CME",
    tickSize: 0.25,
    pointValue: 50,
    contractSize: 1
  },
  {
    symbol: "NQ",
    name: "E-mini NASDAQ-100",
    exchange: "CME",
    tickSize: 0.25,
    pointValue: 20,
    contractSize: 1
  },
  {
    symbol: "YM",
    name: "E-mini Dow",
    exchange: "CBOT",
    tickSize: 1,
    pointValue: 5,
    contractSize: 1
  },
  {
    symbol: "RTY",
    name: "E-mini Russell 2000",
    exchange: "CME",
    tickSize: 0.1,
    pointValue: 50,
    contractSize: 1
  },
  {
    symbol: "MES",
    name: "Micro E-mini S&P 500",
    exchange: "CME",
    tickSize: 0.25,
    pointValue: 5,
    contractSize: 1
  },
  {
    symbol: "MNQ",
    name: "Micro E-mini NASDAQ-100",
    exchange: "CME",
    tickSize: 0.25,
    pointValue: 2,
    contractSize: 1
  },
  {
    symbol: "MYM",
    name: "Micro E-mini Dow",
    exchange: "CBOT",
    tickSize: 1,
    pointValue: 0.5,
    contractSize: 1
  },
  {
    symbol: "M2K",
    name: "Micro E-mini Russell 2000",
    exchange: "CME",
    tickSize: 0.1,
    pointValue: 5,
    contractSize: 1
  },
  {
    symbol: "CL",
    name: "Crude Oil",
    exchange: "NYMEX",
    tickSize: 0.01,
    pointValue: 1000,
    contractSize: 1000
  },
  {
    symbol: "GC",
    name: "Gold",
    exchange: "COMEX",
    tickSize: 0.1,
    pointValue: 100,
    contractSize: 100
  },
  {
    symbol: "SI",
    name: "Silver",
    exchange: "COMEX",
    tickSize: 0.005,
    pointValue: 5000,
    contractSize: 5000
  },
  {
    symbol: "ZB",
    name: "30-Year U.S. Treasury Bond",
    exchange: "CBOT",
    tickSize: 1/32,
    pointValue: 1000,
    contractSize: 1
  },
  {
    symbol: "ZN",
    name: "10-Year U.S. Treasury Note",
    exchange: "CBOT",
    tickSize: 1/64,
    pointValue: 1000,
    contractSize: 1
  },
  {
    symbol: "ZF",
    name: "5-Year U.S. Treasury Note",
    exchange: "CBOT",
    tickSize: 1/64,
    pointValue: 1000,
    contractSize: 1
  },
  {
    symbol: "ZC",
    name: "Corn",
    exchange: "CBOT",
    tickSize: 0.25,
    pointValue: 50,
    contractSize: 5000
  },
  {
    symbol: "ZS",
    name: "Soybeans",
    exchange: "CBOT",
    tickSize: 0.25,
    pointValue: 50,
    contractSize: 5000
  },
  {
    symbol: "ZW",
    name: "Wheat",
    exchange: "CBOT",
    tickSize: 0.25,
    pointValue: 50,
    contractSize: 5000
  },
  {
    symbol: "6E",
    name: "Euro FX",
    exchange: "CME",
    tickSize: 0.0001,
    pointValue: 125000,
    contractSize: 125000
  },
  {
    symbol: "6J",
    name: "Japanese Yen",
    exchange: "CME",
    tickSize: 0.0000005,
    pointValue: 12500000,
    contractSize: 12500000
  },
  {
    symbol: "MCL",
    name: "Micro WTI Crude Oil",
    exchange: "NYMEX",
    tickSize: 0.01,
    pointValue: 100,
    contractSize: 100
  },
  {
    symbol: "MGC",
    name: "Micro Gold",
    exchange: "COMEX",
    tickSize: 0.1,
    pointValue: 10,
    contractSize: 10
  },
  {
    symbol: "SIL",
    name: "Micro Silver",
    exchange: "COMEX",
    tickSize: 0.005,
    pointValue: 1000,
    contractSize: 1000
  }
];

// Define interface for MediaFile which is used in some components
export interface MediaFile {
  url: string;
  type: 'image' | 'video' | 'pdf'; // Updated to include 'pdf'
}

// Define the ReflectionDeleteDialogProps for the DeleteDialog component
export interface ReflectionDeleteDialogProps {
  type: 'weekly' | 'monthly';
  onConfirm: () => void;
}

// Define props for components that are missing definitions
export interface RichTextEditorProps {
  id: string;
  content?: string;
  initialContent?: string; // Added initialContent for compatibility
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export interface WeeklySummaryMetricsProps {
  trades: TradeWithMetrics[];
  totalPnL?: number; // Made optional for compatibility
  totalR?: number; // Made optional for compatibility
}

export interface TradeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeId?: string;
  trade?: TradeWithMetrics;
}
