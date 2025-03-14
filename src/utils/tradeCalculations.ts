import { Trade, TradeMetrics, PerformanceMetrics, TradeWithMetrics, PartialExit, FuturesContractDetails, COMMON_FUTURES_CONTRACTS } from '@/types';

// Calculate metrics for a single trade
export const calculateTradeMetrics = (trade: Trade): TradeMetrics => {
  const metrics: TradeMetrics = {
    profitLoss: 0,
    profitLossPercentage: 0,
    riskRewardRatio: undefined,
    riskedAmount: undefined,
    maxPotentialGain: undefined,
    calculationExplanation: ''
  };

  const direction = trade.direction === 'long' ? 1 : -1;
  let totalPL = 0;
  let totalExitValue = 0;
  let totalEntryValue = 0;
  let totalExitedQuantity = 0;

  // Calculate P&L from partial exits
  if (trade.partialExits && trade.partialExits.length > 0) {
    trade.partialExits.forEach(exit => {
      const exitValue = exit.exitPrice * exit.quantity;
      const entryValue = trade.entryPrice * exit.quantity;
      const partialPL = (exitValue - entryValue) * direction - (exit.fees || 0);
      
      totalPL += partialPL;
      totalExitValue += exitValue;
      totalEntryValue += entryValue;
      totalExitedQuantity += exit.quantity;
    });
  }

  // Add P&L from final exit if trade is closed
  if (trade.status === 'closed' && trade.exitPrice) {
    const remainingQuantity = trade.quantity - totalExitedQuantity;
    const exitValue = trade.exitPrice * remainingQuantity;
    const entryValue = trade.entryPrice * remainingQuantity;
    const finalPL = (exitValue - entryValue) * direction - (trade.fees || 0);
    
    totalPL += finalPL;
    totalExitValue += exitValue;
    totalEntryValue += entryValue;
  }

  // Set the calculated P&L
  metrics.profitLoss = totalPL;
  
  // Calculate P&L percentage if we have any exits
  if (totalEntryValue > 0 && (totalExitedQuantity > 0 || trade.status === 'closed')) {
    metrics.profitLossPercentage = (totalPL / totalEntryValue) * 100;
  }

  // Calculate risk metrics differently based on trade type
  if (trade.stopLoss) {
    let calculationSteps: string[] = [];
    
    if (trade.type === 'futures' && trade.contractDetails) {
      // Get contract info
      const pointValue = getContractPointValue(trade);
      
      // Calculate risk in points
      const riskInPoints = Math.abs(trade.entryPrice - trade.stopLoss);
      // Convert points to money based on contract value
      metrics.riskedAmount = riskInPoints * pointValue * trade.quantity;
      
      calculationSteps.push(`Risk Calculation (Futures):`);
      calculationSteps.push(`Risk in Points = |Entry Price - Stop Loss| = |${trade.entryPrice.toFixed(2)} - ${trade.stopLoss.toFixed(2)}| = ${riskInPoints.toFixed(2)} points`);
      calculationSteps.push(`Point Value = ${pointValue}`);
      calculationSteps.push(`Risked Amount = Risk in Points × Point Value × Quantity = ${riskInPoints.toFixed(2)} × ${pointValue} × ${trade.quantity} = $${metrics.riskedAmount.toFixed(2)}`);
      
      // Calculate R:R ratio if take profit is defined
      if (trade.takeProfit) {
        const rewardInPoints = Math.abs(trade.takeProfit - trade.entryPrice);
        metrics.maxPotentialGain = rewardInPoints * pointValue * trade.quantity;
        metrics.riskRewardRatio = rewardInPoints / riskInPoints;
        
        calculationSteps.push(`\nReward Calculation (Futures):`);
        calculationSteps.push(`Reward in Points = |Take Profit - Entry Price| = |${trade.takeProfit.toFixed(2)} - ${trade.entryPrice.toFixed(2)}| = ${rewardInPoints.toFixed(2)} points`);
        calculationSteps.push(`Max Potential Gain = Reward in Points × Point Value × Quantity = ${rewardInPoints.toFixed(2)} × ${pointValue} × ${trade.quantity} = $${metrics.maxPotentialGain.toFixed(2)}`);
        calculationSteps.push(`Risk:Reward Ratio = Reward in Points / Risk in Points = ${rewardInPoints.toFixed(2)} / ${riskInPoints.toFixed(2)} = ${metrics.riskRewardRatio.toFixed(2)}`);
      }
    } else {
      // Standard calculation for non-futures
      const riskPerUnit = Math.abs(trade.entryPrice - trade.stopLoss);
      metrics.riskedAmount = riskPerUnit * trade.quantity;
      
      calculationSteps.push(`Risk Calculation (${trade.type}):`);
      calculationSteps.push(`Risk Per Unit = |Entry Price - Stop Loss| = |${trade.entryPrice.toFixed(2)} - ${trade.stopLoss.toFixed(2)}| = $${riskPerUnit.toFixed(2)}`);
      calculationSteps.push(`Risked Amount = Risk Per Unit × Quantity = $${riskPerUnit.toFixed(2)} × ${trade.quantity} = $${metrics.riskedAmount.toFixed(2)}`);
      
      if (trade.takeProfit) {
        const rewardPerUnit = Math.abs(trade.takeProfit - trade.entryPrice);
        metrics.maxPotentialGain = rewardPerUnit * trade.quantity;
        metrics.riskRewardRatio = rewardPerUnit / riskPerUnit;
        
        calculationSteps.push(`\nReward Calculation (${trade.type}):`);
        calculationSteps.push(`Reward Per Unit = |Take Profit - Entry Price| = |${trade.takeProfit.toFixed(2)} - ${trade.entryPrice.toFixed(2)}| = $${rewardPerUnit.toFixed(2)}`);
        calculationSteps.push(`Max Potential Gain = Reward Per Unit × Quantity = $${rewardPerUnit.toFixed(2)} × ${trade.quantity} = $${metrics.maxPotentialGain.toFixed(2)}`);
        calculationSteps.push(`Risk:Reward Ratio = Reward Per Unit / Risk Per Unit = ${rewardPerUnit.toFixed(2)} / ${riskPerUnit.toFixed(2)} = ${metrics.riskRewardRatio.toFixed(2)}`);
      }
    }
    
    metrics.calculationExplanation = calculationSteps.join('\n');
  }

  return metrics;
};

// Helper function to get contract point value 
export const getContractPointValue = (trade: Trade): number => {
  // For futures contracts, get the contract details
  if (trade.type === 'futures' && trade.symbol) {
    // First, try to find the contract in common contracts
    const commonContract = COMMON_FUTURES_CONTRACTS.find(c => c.symbol === trade.symbol);
    
    if (commonContract) {
      return commonContract.pointValue; // Use the pointValue directly now
    }
    
    // If contract details are available, use them as a fallback
    if (trade.contractDetails?.tickSize && trade.contractDetails?.tickValue) {
      return trade.contractDetails.tickValue / trade.contractDetails.tickSize;
    }
  }
  
  // Default value if we can't determine
  return 1;
};

// Calculate overall performance metrics from a list of trades
export const calculatePerformanceMetrics = (trades: TradeWithMetrics[]): PerformanceMetrics => {
  // Filter to only closed trades
  const closedTrades = trades.filter(trade => trade.status === 'closed');
  
  if (closedTrades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakEvenTrades: 0,
      winRate: 0,
      averageWin: 0,
      averageLoss: 0,
      profitFactor: 0,
      expectancy: 0,
      sortinoRatio: 0,
      largestWin: 0,
      largestLoss: 0,
      netProfit: 0
    };
  }

  // Categorize trades
  const winningTrades = closedTrades.filter(trade => trade.metrics.profitLoss > 0);
  const losingTrades = closedTrades.filter(trade => trade.metrics.profitLoss < 0);
  const breakEvenTrades = closedTrades.filter(trade => trade.metrics.profitLoss === 0);
  
  // Calculate metrics
  const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0);
  const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.metrics.profitLoss, 0));
  
  const largestWin = winningTrades.length > 0 
    ? Math.max(...winningTrades.map(trade => trade.metrics.profitLoss))
    : 0;
    
  const largestLoss = losingTrades.length > 0 
    ? Math.min(...losingTrades.map(trade => trade.metrics.profitLoss))
    : 0;
  
  const winRate = (winningTrades.length / closedTrades.length) * 100;
  const averageWin = winningTrades.length > 0 
    ? totalProfit / winningTrades.length 
    : 0;
    
  const averageLoss = losingTrades.length > 0 
    ? totalLoss / losingTrades.length 
    : 0;
    
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
  
  // Calculate expectancy: (Win% * Average Win) - (Loss% * Average Loss)
  const expectancy = (winRate / 100 * averageWin) - ((100 - winRate) / 100 * averageLoss);
  
  // Calculate Sortino Ratio - measures return adjusted for downside risk
  // Formula: (Average Return - Risk-Free Rate) / Downside Deviation
  const riskFreeRate = 0; // Assuming 0 for simplicity
  const averageReturn = closedTrades.reduce((sum, trade) => sum + trade.metrics.profitLossPercentage, 0) / closedTrades.length;
  
  // Calculate downside deviation (standard deviation of negative returns only)
  const negativeReturns = closedTrades
    .filter(trade => trade.metrics.profitLossPercentage < 0)
    .map(trade => trade.metrics.profitLossPercentage);
  
  let downsideDeviation = 0;
  if (negativeReturns.length > 0) {
    const avgNegativeReturn = negativeReturns.reduce((sum, ret) => sum + ret, 0) / negativeReturns.length;
    const squaredDifferences = negativeReturns.map(ret => Math.pow(ret - avgNegativeReturn, 2));
    const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / negativeReturns.length;
    downsideDeviation = Math.sqrt(variance);
  }
  
  const sortinoRatio = downsideDeviation > 0 ? (averageReturn - riskFreeRate) / downsideDeviation : 0;
  
  return {
    totalTrades: closedTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    breakEvenTrades: breakEvenTrades.length,
    winRate,
    averageWin,
    averageLoss,
    profitFactor,
    expectancy,
    sortinoRatio,
    largestWin,
    largestLoss,
    netProfit: totalProfit - totalLoss
  };
};

// Format currency
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Format percentage
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100);
};

// Generate dummy trades for testing
export const generateDummyTrades = (): Trade[] => {
  const dummyTrades: Trade[] = [
    // Equity trades
    {
      id: "1",
      symbol: "AAPL",
      type: "equity",
      direction: "long",
      entryDate: "2023-10-15T10:30",
      entryPrice: 178.50,
      exitDate: "2023-10-30T15:45",
      exitPrice: 186.75,
      quantity: 10,
      fees: 9.95,
      stopLoss: 170.00,
      takeProfit: 190.00,
      strategy: "Trend Following",
      notes: "Bought after strong earnings report. Market was showing bullish momentum.",
      images: [],
      tags: ["tech", "earnings", "momentum"],
      status: "closed"
    },
    {
      id: "2",
      symbol: "MSFT",
      type: "equity",
      direction: "long",
      entryDate: "2023-11-05T09:15",
      entryPrice: 365.25,
      exitDate: "2023-11-20T11:30",
      exitPrice: 378.90,
      quantity: 5,
      fees: 7.95,
      stopLoss: 355.00,
      takeProfit: 385.00,
      strategy: "Breakout",
      notes: "Entered on breakout of key resistance level with high volume.",
      images: [],
      tags: ["tech", "breakout", "cloud"],
      status: "closed"
    },
    {
      id: "3",
      symbol: "NVDA",
      type: "equity",
      direction: "long",
      entryDate: "2023-12-01T10:00",
      entryPrice: 465.75,
      quantity: 4,
      fees: 6.95,
      stopLoss: 445.00,
      takeProfit: 500.00,
      strategy: "Momentum",
      notes: "AI theme continues to drive semiconductor sector. Strong relative strength.",
      images: [],
      tags: ["tech", "semiconductor", "AI"],
      status: "open"
    },
    
    // Futures trades
    {
      id: "4",
      symbol: "MES",
      type: "futures",
      direction: "long",
      entryDate: "2023-09-10T09:20",
      entryPrice: 4550.25,
      exitDate: "2023-09-10T14:30",
      exitPrice: 4575.75,
      quantity: 2,
      fees: 4.20,
      stopLoss: 4530.00,
      takeProfit: 4580.00,
      strategy: "Scalping",
      notes: "Quick intraday trade on market pullback. Entered at support level.",
      images: [],
      tags: ["day-trade", "scalp", "index"],
      status: "closed",
      contractDetails: {
        exchange: "CME",
        contractSize: 1,
        tickSize: 0.25,
        tickValue: 1.25
      }
    },
    {
      id: "5",
      symbol: "MNQ",
      type: "futures",
      direction: "short",
      entryDate: "2023-10-05T11:15",
      entryPrice: 15720.50,
      exitDate: "2023-10-06T10:30",
      exitPrice: 15650.75,
      quantity: 1,
      fees: 2.95,
      stopLoss: 15760.00,
      takeProfit: 15640.00,
      strategy: "Mean Reversion",
      notes: "Shorted at resistance after overbought conditions. Closed at target the next day.",
      images: [],
      tags: ["swing-trade", "tech-index"],
      status: "closed",
      contractDetails: {
        exchange: "CME",
        contractSize: 1,
        tickSize: 0.25,
        tickValue: 0.5
      }
    },
    {
      id: "6",
      symbol: "MGC",
      type: "futures",
      direction: "long",
      entryDate: "2023-11-15T13:30",
      entryPrice: 1975.60,
      quantity: 1,
      fees: 1.95,
      stopLoss: 1950.00,
      takeProfit: 2020.00,
      strategy: "Trend Following",
      notes: "Long gold on inflation concerns and technical breakout. Looking for continuation.",
      images: [],
      tags: ["gold", "inflation", "commodity"],
      status: "open",
      contractDetails: {
        exchange: "COMEX",
        contractSize: 1,
        tickSize: 0.1,
        tickValue: 1
      }
    },
    
    // Option trades
    {
      id: "7",
      symbol: "SPY 450 C 12/15",
      type: "option",
      direction: "long",
      entryDate: "2023-11-01T11:00",
      entryPrice: 5.25,
      exitDate: "2023-11-30T15:30",
      exitPrice: 8.70,
      quantity: 5,
      fees: 3.75,
      strategy: "Momentum",
      notes: "Bought calls on market pullback with strong technical support.",
      images: [],
      tags: ["options", "call", "index"],
      status: "closed"
    },
    {
      id: "8",
      symbol: "AMZN 140 P 01/19",
      type: "option",
      direction: "short",
      entryDate: "2023-12-01T10:15",
      entryPrice: 3.80,
      quantity: 2,
      fees: 2.50,
      strategy: "Income Generation",
      notes: "Sold puts after stock pullback, looking to collect premium or get assigned at support.",
      images: [],
      tags: ["options", "put", "income"],
      status: "open"
    },
    
    // Trade with partial exits
    {
      id: "9",
      symbol: "MES",
      type: "futures",
      direction: "long",
      entryDate: "2023-12-05T09:30",
      entryPrice: 4680.25,
      quantity: 3,
      fees: 6.30,
      stopLoss: 4650.00,
      takeProfit: 4720.00,
      strategy: "Swing Trading",
      notes: "Entered on pullback to moving average with positive divergence.",
      images: [],
      tags: ["futures", "swing-trade", "partial-exits"],
      status: "open",
      contractDetails: {
        exchange: "CME",
        contractSize: 1,
        tickSize: 0.25,
        tickValue: 1.25
      },
      partialExits: [
        {
          id: "9-1",
          exitDate: "2023-12-06T10:45",
          exitPrice: 4700.50,
          quantity: 1,
          fees: 1.95,
          notes: "Took partial profit at first target"
        }
      ]
    },
    
    // Complex trade with multiple partial exits
    {
      id: "10",
      symbol: "QQQ",
      type: "equity",
      direction: "long",
      entryDate: "2023-12-10T09:45",
      entryPrice: 380.50,
      quantity: 20,
      fees: 9.95,
      stopLoss: 370.00,
      takeProfit: 400.00,
      strategy: "Position Trading",
      notes: "Building position in tech ETF on sector rotation. Planning to scale out at different levels.",
      images: [],
      tags: ["etf", "position-sizing", "tech"],
      status: "open",
      partialExits: [
        {
          id: "10-1",
          exitDate: "2023-12-15T14:30",
          exitPrice: 385.75,
          quantity: 5,
          fees: 4.95,
          notes: "Took 25% off at first target"
        },
        {
          id: "10-2",
          exitDate: "2023-12-18T11:15",
          exitPrice: 390.25,
          quantity: 5,
          fees: 4.95,
          notes: "Took another 25% at second target"
        }
      ]
    }
  ];
  
  return dummyTrades;
};
