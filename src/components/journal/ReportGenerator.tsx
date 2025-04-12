import { formatCurrency } from '@/utils/calculations/formatters';
import { Trade, TradeWithMetrics } from '@/types';

interface ReportData {
  title: string;
  dateRange: string;
  reflection: string;
  weeklyPlan?: string;
  grade?: string;
  trades: TradeWithMetrics[];
  metrics: {
    totalPnL: number;
    winRate: number;
    totalR: number;
    tradeCount: number;
  };
}

export const generateHTMLReport = (data: ReportData): string => {
  const {
    title,
    dateRange,
    reflection,
    weeklyPlan,
    grade,
    trades,
    metrics
  } = data;

  const tradeRows = trades.map(trade => {
    const profitLoss = trade.metrics?.profitLoss || 0;
    const rMultiple = trade.metrics?.rMultiple || 0;
    
    return `
      <tr>
        <td>${trade.symbol}</td>
        <td>${trade.direction}</td>
        <td>${trade.entryPrice}</td>
        <td>${trade.exitPrice || '-'}</td>
        <td class="${profitLoss >= 0 ? 'profit' : 'loss'}">${formatCurrency(profitLoss)}</td>
        <td class="${rMultiple >= 0 ? 'profit' : 'loss'}">${rMultiple.toFixed(2)}R</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
        }
        .report-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 10px;
          border-bottom: 2px solid #eee;
        }
        .date-range {
          font-size: 16px;
          color: #666;
          margin-top: 5px;
        }
        .metrics-card {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
        }
        .metric-item {
          text-align: center;
        }
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .metric-label {
          font-size: 14px;
          color: #666;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 18px;
          margin-bottom: 15px;
          padding-bottom: 5px;
          border-bottom: 1px solid #eee;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f2f2f2;
        }
        .reflection-content {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
        }
        .profit {
          color: green;
        }
        .loss {
          color: red;
        }
        .grade-badge {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 3px;
          font-weight: bold;
        }
        .grade-a {
          background-color: #d4edda;
          color: #155724;
        }
        .grade-b {
          background-color: #d1ecf1;
          color: #0c5460;
        }
        .grade-c {
          background-color: #fff3cd;
          color: #856404;
        }
        .grade-d, .grade-f {
          background-color: #f8d7da;
          color: #721c24;
        }
        .logo {
          max-width: 150px;
          margin-bottom: 10px;
        }
        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <h1>${title}</h1>
        <div class="date-range">${dateRange}</div>
        ${grade ? `<div class="grade-badge grade-${grade.toLowerCase()}">Grade: ${grade}</div>` : ''}
      </div>
      
      <div class="metrics-card">
        <div class="metric-item">
          <div class="metric-value ${metrics.totalPnL >= 0 ? 'profit' : 'loss'}">${formatCurrency(metrics.totalPnL)}</div>
          <div class="metric-label">Total P&L</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${metrics.winRate.toFixed(1)}%</div>
          <div class="metric-label">Win Rate</div>
        </div>
        <div class="metric-item">
          <div class="metric-value ${metrics.totalR >= 0 ? 'profit' : 'loss'}">${metrics.totalR.toFixed(1)}R</div>
          <div class="metric-label">Total R</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${metrics.tradeCount}</div>
          <div class="metric-label">Trades</div>
        </div>
      </div>
      
      ${weeklyPlan ? `
      <div class="section">
        <h2 class="section-title">Weekly Plan</h2>
        <div class="reflection-content">${weeklyPlan}</div>
      </div>
      ` : ''}
      
      <div class="section">
        <h2 class="section-title">Weekly Reflection</h2>
        <div class="reflection-content">${reflection}</div>
      </div>
      
      <div class="section">
        <h2 class="section-title">Trades (${trades.length})</h2>
        ${trades.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Direction</th>
              <th>Entry</th>
              <th>Exit</th>
              <th>P&L</th>
              <th>R</th>
            </tr>
          </thead>
          <tbody>
            ${tradeRows}
          </tbody>
        </table>
        ` : '<p>No trades for this period.</p>'}
      </div>
      
      <div class="section no-print">
        <p style="text-align: center; color: #666; font-size: 12px;">
          Generated on ${new Date().toLocaleDateString()} with Trading Journal
        </p>
      </div>
    </body>
    </html>
  `;
};

export const downloadReport = (htmlContent: string, filename: string) => {
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};
