
import { 
  saveWeeklyReflection, 
  getWeeklyReflection, 
  saveMonthlyReflection, 
  getMonthlyReflection 
} from './journalStorage';
import { TradeWithMetrics } from '@/types';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  isWithinInterval,
  parseISO
} from 'date-fns';
import { toast } from './toast';
import { 
  calculateWinRate, 
  calculateTotalPnL, 
  calculateTotalR, 
  calculateAverageWin,
  calculateAverageLoss,
} from '@/pages/dashboard/dashboardUtils';

/**
 * Automatically generate weekly and monthly reflections based on trade data
 * @param trades All trades with metrics
 * @returns Object with counts of reflections generated
 */
export function generateMissingReflections(trades: TradeWithMetrics[]) {
  // Skip if no trades
  if (!trades.length) return { weekly: 0, monthly: 0 };
  
  // Filter to closed trades with exit dates
  const closedTrades = trades.filter(trade => 
    trade.status === 'closed' && trade.exitDate
  );
  
  if (!closedTrades.length) return { weekly: 0, monthly: 0 };

  console.log(`Generating reflections for ${closedTrades.length} closed trades`);
  
  // Track unique weeks and months
  const weeks = new Map<string, TradeWithMetrics[]>();
  const months = new Map<string, TradeWithMetrics[]>();
  
  // Group trades by week and month
  closedTrades.forEach(trade => {
    if (!trade.exitDate) return;
    
    const exitDate = new Date(trade.exitDate);
    
    // Weekly grouping
    const weekStart = startOfWeek(exitDate, { weekStartsOn: 1 }); // Week starts on Monday
    const weekEnd = endOfWeek(exitDate, { weekStartsOn: 1 });
    const weekId = format(weekStart, 'yyyy-MM-dd');
    
    if (!weeks.has(weekId)) {
      weeks.set(weekId, []);
    }
    weeks.get(weekId)?.push(trade);
    
    // Monthly grouping
    const monthId = format(exitDate, 'yyyy-MM');
    if (!months.has(monthId)) {
      months.set(monthId, []);
    }
    months.get(monthId)?.push(trade);
  });
  
  // Generate reflections
  let weeklyGenerated = 0;
  let monthlyGenerated = 0;
  
  // Generate weekly reflections
  for (const [weekId, weekTrades] of weeks.entries()) {
    if (!weekTrades.length) continue;
    
    // Check if reflection already exists
    const existingReflection = getWeeklyReflection(weekId);
    if (existingReflection && existingReflection.reflection) {
      continue; // Skip if reflection exists
    }
    
    // Generate reflection for week
    const weekStart = format(parseISO(weekId), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(parseISO(weekId), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    
    // Calculate weekly metrics
    const totalPnL = calculateTotalPnL(weekTrades);
    const winRate = calculateWinRate(weekTrades);
    const totalWins = weekTrades.filter(t => (t.metrics.profitLoss || 0) > 0).length;
    const totalLosses = weekTrades.filter(t => (t.metrics.profitLoss || 0) <= 0).length;
    const totalR = calculateTotalR(weekTrades);
    const avgWin = calculateAverageWin(weekTrades);
    const avgLoss = calculateAverageLoss(weekTrades);
    
    // Determine weekly grade based on performance
    let grade = 'C';
    if (totalPnL > 0 && winRate > 60) grade = 'A';
    else if (totalPnL > 0) grade = 'B';
    else if (totalPnL < 0 && winRate < 30) grade = 'F';
    else if (totalPnL < 0) grade = 'D';
    
    // Generate weekly reflection content
    const reflection = generateWeeklyReflectionContent(weekTrades, {
      totalPnL,
      winRate,
      totalWins,
      totalLosses,
      totalR,
      avgWin,
      avgLoss,
      totalTrades: weekTrades.length
    });
    
    // Save the reflection
    saveWeeklyReflection(
      weekId, 
      reflection, 
      grade,
      generateWeeklyPlanContent(weekTrades, grade),
      weekTrades.map(t => t.id)
    );
    
    weeklyGenerated++;
  }
  
  // Generate monthly reflections
  for (const [monthId, monthTrades] of months.entries()) {
    if (!monthTrades.length) continue;
    
    // Check if reflection already exists
    const existingReflection = getMonthlyReflection(monthId);
    if (existingReflection && existingReflection.reflection) {
      continue; // Skip if reflection exists
    }
    
    // Calculate monthly metrics
    const totalPnL = calculateTotalPnL(monthTrades);
    const winRate = calculateWinRate(monthTrades);
    const totalWins = monthTrades.filter(t => (t.metrics.profitLoss || 0) > 0).length;
    const totalLosses = monthTrades.filter(t => (t.metrics.profitLoss || 0) <= 0).length;
    const totalR = calculateTotalR(monthTrades);
    
    // Determine monthly grade based on performance
    let grade = 'C';
    if (totalPnL > 0 && winRate > 60) grade = 'A';
    else if (totalPnL > 0) grade = 'B';
    else if (totalPnL < 0 && winRate < 30) grade = 'F';
    else if (totalPnL < 0) grade = 'D';
    
    // Generate monthly reflection content
    const reflection = generateMonthlyReflectionContent(monthTrades, {
      totalPnL,
      winRate,
      totalWins,
      totalLosses,
      totalR,
      totalTrades: monthTrades.length
    });
    
    // Save the reflection
    saveMonthlyReflection(monthId, reflection, grade);
    
    monthlyGenerated++;
  }
  
  // Show toast if reflections were generated
  if (weeklyGenerated > 0 || monthlyGenerated > 0) {
    toast.success(`Generated ${weeklyGenerated} weekly and ${monthlyGenerated} monthly reflections`);
  }
  
  return { weekly: weeklyGenerated, monthly: monthlyGenerated };
}

// Helper functions to generate reflection content
function generateWeeklyReflectionContent(trades: TradeWithMetrics[], metrics: {
  totalPnL: number;
  winRate: number;
  totalWins: number;
  totalLosses: number;
  totalR: number;
  avgWin: number;
  avgLoss: number;
  totalTrades: number;
}) {
  const isProfitable = metrics.totalPnL > 0;
  const symbols = [...new Set(trades.map(t => t.symbol))];
  const strategies = [...new Set(trades.map(t => t.strategy).filter(Boolean))] as string[];
  
  return `<h2>Weekly Trading Summary</h2>
<p>This week I traded ${metrics.totalTrades} positions across ${symbols.length} different symbols
${strategies.length ? `using ${strategies.length} different strategies (${strategies.join(', ')})` : ''}.
My performance was ${isProfitable ? 'profitable' : 'unprofitable'} with a ${metrics.winRate.toFixed(1)}% win rate.</p>

<h3>Performance Metrics</h3>
<ul>
  <li>Total P&L: ${isProfitable ? '+' : ''}$${Math.abs(metrics.totalPnL).toFixed(2)}</li>
  <li>Win Rate: ${metrics.winRate.toFixed(1)}%</li>
  <li>Wins/Losses: ${metrics.totalWins}/${metrics.totalLosses}</li>
  <li>Average Win: $${metrics.avgWin.toFixed(2)}</li>
  <li>Average Loss: $${Math.abs(metrics.avgLoss).toFixed(2)}</li>
  <li>Total R: ${metrics.totalR > 0 ? '+' : ''}${metrics.totalR.toFixed(2)}R</li>
</ul>

<h3>What Went Well</h3>
<p>${isProfitable 
  ? 'I maintained discipline with my trading plan and executed my setups properly.'
  : 'I tracked all my trades and followed my risk management rules.'}</p>

<h3>What Could Be Improved</h3>
<p>${isProfitable 
  ? 'I could improve my performance by being more selective with entries.'
  : 'I need to analyze my losing trades to identify patterns and improve my strategy.'}</p>

<h3>Lessons Learned</h3>
<p>This week reinforced the importance of ${isProfitable 
  ? 'patience and waiting for high-probability setups.' 
  : 'proper risk management and sticking to my trading plan.'}</p>`;
}

function generateWeeklyPlanContent(trades: TradeWithMetrics[], grade: string) {
  const isGoodWeek = grade === 'A' || grade === 'B';
  
  return `<h2>Next Week's Trading Plan</h2>

<h3>Focus Areas</h3>
<ul>
  <li>${isGoodWeek 
    ? 'Continue executing my current strategy with discipline'
    : 'Review losing trades to identify common mistakes'}</li>
  <li>Be more selective with trade entries</li>
  <li>Focus on high-probability setups</li>
</ul>

<h3>Risk Management</h3>
<ul>
  <li>Maintain consistent position sizing</li>
  <li>Set clear stop losses on all trades</li>
  <li>Aim for minimum 1:2 risk-reward ratio</li>
</ul>

<h3>Goals</h3>
<ul>
  <li>Achieve at least 50% win rate</li>
  <li>Review trading journal daily</li>
  <li>Document lessons after each trade</li>
</ul>`;
}

function generateMonthlyReflectionContent(trades: TradeWithMetrics[], metrics: {
  totalPnL: number;
  winRate: number;
  totalWins: number;
  totalLosses: number;
  totalR: number;
  totalTrades: number;
}) {
  const isProfitable = metrics.totalPnL > 0;
  const symbols = [...new Set(trades.map(t => t.symbol))];
  const strategies = [...new Set(trades.map(t => t.strategy).filter(Boolean))] as string[];
  
  return `<h2>Monthly Trading Performance Summary</h2>
<p>This month I completed ${metrics.totalTrades} trades across ${symbols.length} different symbols
${strategies.length ? `using primarily ${strategies.slice(0, 3).join(', ')} strategies` : ''}.
My overall performance was ${isProfitable ? 'profitable' : 'unprofitable'} with a net P&L of 
${isProfitable ? '+' : ''}$${Math.abs(metrics.totalPnL).toFixed(2)} and a ${metrics.winRate.toFixed(1)}% win rate.</p>

<h3>Key Performance Metrics</h3>
<ul>
  <li>Total P&L: ${isProfitable ? '+' : ''}$${Math.abs(metrics.totalPnL).toFixed(2)}</li>
  <li>Win Rate: ${metrics.winRate.toFixed(1)}%</li>
  <li>Wins/Losses: ${metrics.totalWins}/${metrics.totalLosses}</li>
  <li>Total R: ${metrics.totalR > 0 ? '+' : ''}${metrics.totalR.toFixed(2)}R</li>
</ul>

<h3>Monthly Review</h3>
<p>${isProfitable 
  ? 'This was a positive month that demonstrated the effectiveness of my trading strategy when executed with discipline. I found success in maintaining consistent position sizing and focusing on high-probability setups.'
  : 'This was a challenging month that highlighted areas where my trading approach needs refinement. I need to focus on improving my trade selection criteria and ensuring I\'m only taking high-probability setups.'}</p>

<h3>Strengths</h3>
<p>${isProfitable 
  ? 'My strongest performance came from maintaining discipline and following my trading plan consistently. I was patient with entries and exits, which contributed significantly to my positive results.'
  : 'Despite the overall performance, I maintained consistent risk management and position sizing, which prevented larger losses. I also documented all trades thoroughly for future analysis.'}</p>

<h3>Areas for Improvement</h3>
<p>${isProfitable 
  ? 'I could improve my consistency by being more selective with my trades and avoiding lower-probability setups. I should also consider scaling position sizes on higher-conviction trades.'
  : 'I need to be more selective with my trades and avoid trading during unfavorable market conditions. I should also review my entry criteria to ensure I\'m only taking high-probability setups.'}</p>

<h3>Plan for Next Month</h3>
<p>${isProfitable 
  ? 'Next month, I plan to continue executing my current strategy while being even more selective with my trade entries. I will focus on high-conviction setups and consider scaling position sizes on my best setups.'
  : 'For the coming month, I will focus on improving my trade selection process, being more patient with entries, and avoiding trading during unfavorable market conditions. I will also review my losing trades to identify common patterns that I can avoid in the future.'}</p>`;
}
