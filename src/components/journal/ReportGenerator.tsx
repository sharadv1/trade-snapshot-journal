
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { TradeWithMetrics } from '@/types';
import { formatCurrency } from '@/utils/calculations/formatters';
import { format } from 'date-fns';

// Define the report data interface
export interface ReportData {
  title: string;
  dateRange: string;
  trades: TradeWithMetrics[];
  metrics: {
    totalPnL: number;
    winRate: number;
    totalR: number;
    tradeCount: number;
    winningTrades: number;
    losingTrades: number;
  };
}

// Extend jsPDF type to include autotable methods
declare module 'jspdf' {
  interface jsPDF {
    autoTable: Function;
    lastAutoTable: {
      finalY: number;
    };
  }
}

/**
 * Generate a PDF report for trading performance
 * @param data Report data including trades and metrics
 * @param filename Filename for download
 * @returns boolean indicating if report generation was successful
 */
export function generatePDFReport(data: ReportData, filename: string): boolean {
  try {
    // Create new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    
    // Set up styles
    const primaryColor = [41, 98, 255]; // Blue
    const secondaryColor = [75, 85, 99]; // Gray
    const successColor = [16, 185, 129]; // Green
    const dangerColor = [239, 68, 68]; // Red
    
    // Helper to convert RGB to hex
    const rgbToHex = (r: number, g: number, b: number) => {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };
    
    // Helper for common heading styles
    const addHeading = (text: string, y: number, size = 18, color = primaryColor) => {
      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFontSize(size);
      doc.setFont('helvetica', 'bold');
      doc.text(text, pageWidth / 2, y, { align: 'center' });
      return y + size / 3;
    };
    
    // Helper for common text styles
    const addText = (text: string, x: number, y: number, size = 12, color = secondaryColor) => {
      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFontSize(size);
      doc.setFont('helvetica', 'normal');
      doc.text(text, x, y);
      return y + size / 1.5;
    };
    
    // Helper to add metric box
    const addMetricBox = (
      title: string, 
      value: string, 
      x: number, 
      y: number, 
      width: number, 
      height: number,
      color = primaryColor,
      valueColor = primaryColor
    ) => {
      // Box background (very light)
      doc.setFillColor(color[0], color[1], color[2], 0.05);
      doc.roundedRect(x, y, width, height, 3, 3, 'F');
      
      // Border
      doc.setDrawColor(color[0], color[1], color[2], 0.2);
      doc.roundedRect(x, y, width, height, 3, 3, 'S');
      
      // Title
      doc.setFontSize(10);
      doc.setTextColor(color[0], color[1], color[2], 0.9);
      doc.setFont('helvetica', 'bold');
      doc.text(title, x + width / 2, y + 10, { align: 'center' });
      
      // Value
      doc.setFontSize(14);
      doc.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(value, x + width / 2, y + 25, { align: 'center' });
    };
    
    // Add title
    let yPos = 20;
    yPos = addHeading(data.title, yPos);
    
    // Add date range
    yPos = addText(data.dateRange, pageWidth / 2, yPos + 10, 12, secondaryColor);
    doc.setFont('helvetica', 'normal');
    
    // Add divider
    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    
    // Add summary metrics section title
    yPos = addHeading('Trading Performance Summary', yPos, 14);
    yPos += 5;
    
    // Layout metrics in a grid with 3 metrics per row
    const boxMargin = 5;
    const boxWidth = (pageWidth - margin * 2 - boxMargin * 2) / 3;
    const boxHeight = 35;
    
    // First row of metrics
    let currentY = yPos;
    
    // Total P&L
    const pnlColor = data.metrics.totalPnL >= 0 ? successColor : dangerColor;
    addMetricBox(
      'Total P&L', 
      formatCurrency(data.metrics.totalPnL), 
      margin, 
      currentY, 
      boxWidth, 
      boxHeight,
      primaryColor,
      pnlColor
    );
    
    // Win Rate
    const winRateColor = data.metrics.winRate >= 50 ? successColor : dangerColor;
    addMetricBox(
      'Win Rate', 
      `${data.metrics.winRate.toFixed(1)}%`, 
      margin + boxWidth + boxMargin, 
      currentY, 
      boxWidth, 
      boxHeight,
      primaryColor,
      winRateColor
    );
    
    // Total R
    const rColor = data.metrics.totalR >= 0 ? successColor : dangerColor;
    addMetricBox(
      'Total R', 
      `${data.metrics.totalR.toFixed(2)}R`, 
      margin + (boxWidth + boxMargin) * 2, 
      currentY, 
      boxWidth, 
      boxHeight,
      primaryColor,
      rColor
    );
    
    // Second row of metrics
    currentY += boxHeight + boxMargin;
    
    // Number of Trades
    addMetricBox(
      'Number of Trades', 
      `${data.metrics.tradeCount}`, 
      margin, 
      currentY, 
      boxWidth, 
      boxHeight
    );
    
    // Winning Trades
    addMetricBox(
      'Winning Trades', 
      `${data.metrics.winningTrades}`, 
      margin + boxWidth + boxMargin, 
      currentY, 
      boxWidth, 
      boxHeight,
      successColor
    );
    
    // Losing Trades
    addMetricBox(
      'Losing Trades', 
      `${data.metrics.losingTrades}`, 
      margin + (boxWidth + boxMargin) * 2, 
      currentY, 
      boxWidth, 
      boxHeight,
      dangerColor
    );
    
    // Update Y position
    yPos = currentY + boxHeight + 15;
    
    // Add trades table
    if (data.trades.length > 0) {
      // Add trades section title
      yPos = addHeading('Weekly Trades', yPos, 14);
      yPos += 5;
      
      // Prepare columns and rows for table
      const columns = [
        { header: 'Symbol', dataKey: 'symbol' },
        { header: 'Direction', dataKey: 'direction' },
        { header: 'Entry Date', dataKey: 'entryDate' },
        { header: 'Exit Date', dataKey: 'exitDate' },
        { header: 'P&L', dataKey: 'pnl' },
        { header: 'R-Multiple', dataKey: 'r' }
      ];
      
      const rows = data.trades.map(trade => {
        const pnl = trade.metrics?.profitLoss || 0;
        const r = trade.metrics?.rMultiple || 0;
        
        return {
          symbol: trade.symbol,
          direction: trade.direction === 'long' ? '🔼 Long' : '🔽 Short',
          entryDate: format(new Date(trade.entryDate), 'MM/dd/yyyy'),
          exitDate: trade.exitDate ? format(new Date(trade.exitDate), 'MM/dd/yyyy') : 'Open',
          pnl: formatCurrency(pnl),
          r: r.toFixed(2) + 'R'
        };
      });
      
      // Add table
      doc.autoTable({
        startY: yPos,
        head: [columns.map(col => col.header)],
        body: rows.map(row => columns.map(col => row[col.dataKey as keyof typeof row])),
        theme: 'grid',
        headStyles: {
          fillColor: [41, 98, 255],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [240, 245, 255]
        },
        margin: { left: margin, right: margin },
        styles: {
          cellPadding: 5,
          fontSize: 10,
          lineColor: [220, 220, 220]
        },
        columnStyles: {
          pnl: {
            halign: 'right'
          },
          r: {
            halign: 'right'
          }
        },
        didParseCell: function(data) {
          // Color P&L cells based on value
          if (data.column.dataKey === 'pnl') {
            const value = data.cell.raw as string;
            if (value.includes('-')) {
              data.cell.styles.textColor = [239, 68, 68]; // Red for negative
            } else if (value !== '$0.00') {
              data.cell.styles.textColor = [16, 185, 129]; // Green for positive
            }
          }
          
          // Color R-Multiple cells based on value
          if (data.column.dataKey === 'r' && data.section === 'body') {
            const value = parseFloat((data.cell.raw as string).replace('R', ''));
            if (value < 0) {
              data.cell.styles.textColor = [239, 68, 68]; // Red for negative
            } else if (value > 0) {
              data.cell.styles.textColor = [16, 185, 129]; // Green for positive
            }
          }
        }
      });
      
      // Get the last Y position after the table
      yPos = doc.lastAutoTable.finalY + 15;
    }
    
    // Add footer with generation date
    const footerY = pageHeight - 15;
    addText(
      `Generated: ${format(new Date(), 'MMMM d, yyyy')}`, 
      margin, 
      footerY, 
      8, 
      secondaryColor
    );
    
    addText(
      'Created with TraderSync', 
      pageWidth - margin, 
      footerY, 
      8, 
      primaryColor
    );
    
    // Save the PDF
    doc.save(filename);
    return true;
    
  } catch (error) {
    console.error('Error generating PDF report:', error);
    return false;
  }
}
