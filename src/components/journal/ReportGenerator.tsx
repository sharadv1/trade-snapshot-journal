import { formatCurrency } from '@/utils/calculations/formatters';
import { Trade, TradeWithMetrics } from '@/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface ReportData {
  title: string;
  dateRange: string;
  trades: TradeWithMetrics[];
  metrics: {
    totalPnL: number;
    winRate: number;
    totalR: number;
    tradeCount: number;
    avgR?: number;
    largestWin?: number;
    largestLoss?: number;
    winningTrades?: number;
    losingTrades?: number;
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

export const generatePDFReport = (data: ReportData, filename: string) => {
  const {
    title,
    dateRange,
    trades,
    metrics
  } = data;

  try {
    // Create a new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Add title
    doc.setFontSize(18);
    doc.text(title, pageWidth / 2, 15, { align: 'center' });
    
    // Add date range
    doc.setFontSize(12);
    doc.text(dateRange, pageWidth / 2, 22, { align: 'center' });
    
    // Add metrics summary table
    doc.setFontSize(14);
    doc.text('Performance Summary', 14, 35);
    
    // Calculate additional metrics
    const avgR = metrics.tradeCount > 0 ? metrics.totalR / metrics.tradeCount : 0;
    const winningTrades = trades.filter(t => (t.metrics?.profitLoss || 0) > 0).length;
    const losingTrades = trades.filter(t => (t.metrics?.profitLoss || 0) < 0).length;
    
    const profitableTrades = trades.filter(t => (t.metrics?.profitLoss || 0) > 0);
    const losingTradesList = trades.filter(t => (t.metrics?.profitLoss || 0) < 0);
    
    const largestWin = profitableTrades.length > 0 
      ? Math.max(...profitableTrades.map(t => t.metrics?.profitLoss || 0)) 
      : 0;
      
    const largestLoss = losingTradesList.length > 0 
      ? Math.min(...losingTradesList.map(t => t.metrics?.profitLoss || 0)) 
      : 0;

    // Metrics table
    autoTable(doc, {
      startY: 40,
      head: [['Metric', 'Value']],
      body: [
        ['Total P&L', formatCurrency(metrics.totalPnL)],
        ['Win Rate', `${metrics.winRate.toFixed(1)}%`],
        ['Total R', `${metrics.totalR.toFixed(2)}R`],
        ['Average R per Trade', `${avgR.toFixed(2)}R`],
        ['Number of Trades', metrics.tradeCount.toString()],
        ['Winning Trades', winningTrades.toString()],
        ['Losing Trades', losingTrades.toString()],
        ['Largest Win', formatCurrency(largestWin)],
        ['Largest Loss', formatCurrency(largestLoss)]
      ],
      theme: 'striped',
      headStyles: { fillColor: [66, 66, 66] },
      margin: { top: 40 },
    });
    
    // Direction distribution
    const longTrades = trades.filter(t => t.direction === 'long').length;
    const shortTrades = trades.filter(t => t.direction === 'short').length;
    
    if (metrics.tradeCount > 0) {
      const longPercentage = (longTrades / metrics.tradeCount) * 100;
      const shortPercentage = (shortTrades / metrics.tradeCount) * 100;
      
      doc.text('Trade Direction Distribution', 14, doc.lastAutoTable.finalY + 15);
      
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Direction', 'Count', 'Percentage']],
        body: [
          ['Long', longTrades.toString(), `${longPercentage.toFixed(1)}%`],
          ['Short', shortTrades.toString(), `${shortPercentage.toFixed(1)}%`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [66, 66, 66] }
      });
    }
    
    // Symbol distribution (top 5)
    const symbolCounts: Record<string, number> = {};
    trades.forEach(trade => {
      symbolCounts[trade.symbol] = (symbolCounts[trade.symbol] || 0) + 1;
    });
    
    const topSymbols = Object.entries(symbolCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
      
    if (topSymbols.length > 0) {
      doc.text('Top Traded Symbols', 14, doc.lastAutoTable.finalY + 15);
      
      const symbolRows = topSymbols.map(([symbol, count]) => {
        const percentage = (count / metrics.tradeCount) * 100;
        return [symbol, count.toString(), `${percentage.toFixed(1)}%`];
      });
      
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Symbol', 'Count', 'Percentage']],
        body: symbolRows,
        theme: 'striped',
        headStyles: { fillColor: [66, 66, 66] }
      });
    }

    // R-Multiple Distribution
    const rMultiples = trades
      .filter(t => t.metrics?.rMultiple !== undefined)
      .map(t => t.metrics?.rMultiple || 0);
    
    if (rMultiples.length > 0) {
      // Group R-multiples into ranges
      const ranges: Record<string, number> = {
        '>2R': 0,
        '1R to 2R': 0,
        '0R to 1R': 0,
        '-1R to 0R': 0,
        '-2R to -1R': 0,
        '<-2R': 0
      };
      
      rMultiples.forEach(r => {
        if (r > 2) ranges['>2R']++;
        else if (r > 1) ranges['1R to 2R']++;
        else if (r > 0) ranges['0R to 1R']++;
        else if (r > -1) ranges['-1R to 0R']++;
        else if (r > -2) ranges['-2R to -1R']++;
        else ranges['<-2R']++;
      });
      
      doc.text('R-Multiple Distribution', 14, doc.lastAutoTable.finalY + 15);
      
      const rRows = Object.entries(ranges).map(([range, count]) => {
        const percentage = (count / rMultiples.length) * 100;
        return [range, count.toString(), `${percentage.toFixed(1)}%`];
      });
      
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [['R-Multiple', 'Count', 'Percentage']],
        body: rRows,
        theme: 'striped',
        headStyles: { fillColor: [66, 66, 66] }
      });
    }
    
    // Add trades table on a new page
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Trade Details', 14, 15);
    
    const tradeRows = trades.map(trade => {
      const profitLoss = trade.metrics?.profitLoss || 0;
      const rMultiple = trade.metrics?.rMultiple || 0;
      const entryDate = new Date(trade.entryDate).toLocaleDateString();
      const exitDate = trade.exitDate ? new Date(trade.exitDate).toLocaleDateString() : 'Open';
      
      return [
        trade.symbol,
        trade.direction.toUpperCase(),
        entryDate,
        exitDate,
        formatCurrency(profitLoss),
        `${rMultiple.toFixed(2)}R`,
        trade.grade || 'N/A'
      ];
    });
    
    autoTable(doc, {
      startY: 20,
      head: [['Symbol', 'Direction', 'Entry Date', 'Exit Date', 'P&L', 'R', 'Grade']],
      body: tradeRows,
      theme: 'striped',
      headStyles: { fillColor: [66, 66, 66] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 20 },
        4: { cellWidth: 25 },
      }
    });
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }
    
    // Save the PDF
    doc.save(filename);
    return true;
  } catch (error) {
    console.error('Error generating PDF report:', error);
    toast.error('Error generating PDF report');
    return false;
  }
};
