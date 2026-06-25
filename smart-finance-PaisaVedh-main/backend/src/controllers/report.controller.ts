import { Request, Response } from 'express';
import { Transaction } from '../models/Transaction.model';
import { emailService } from '../services/email.service';
import logger from '../utils/logger';
import PDFDocument from 'pdfkit';

export class ReportController {
  async generateReport(req: Request, res: Response): Promise<Response> {
    try {
      const { type, startDate, endDate, format = 'json' } = req.query;
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      const transactions = await Transaction.find({
        userId: req.user?.id,
        date: { $gte: start, $lte: end },
      });
      
      const reportData = {
        period: { startDate: start, endDate: end },
        summary: {
          totalIncome: transactions
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + t.amount, 0),
          totalExpenses: transactions
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + t.amount, 0),
          netSavings: 0,
          transactionCount: transactions.length,
        },
        categoryBreakdown: await this.getCategoryBreakdown(transactions),
        topMerchants: await this.getTopMerchants(transactions),
        dailySpending: await this.getDailySpending(transactions),
      };
      
      reportData.summary.netSavings = 
        reportData.summary.totalIncome - reportData.summary.totalExpenses;
      
      if (format === 'pdf') {
        const pdf = await this.generatePDF(reportData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report-${Date.now()}.pdf`);
        return res.send(pdf);
      }
      
      return res.json({
        success: true,
        data: reportData,
      });
    } catch (error) {
      logger.error('Generate report error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
  
  async sendReport(req: Request, res: Response): Promise<Response> {
    try {
      const { email, reportData } = req.body;
      
      await emailService.sendMonthlyReport(email, reportData);
      
      return res.json({
        success: true,
        message: 'Report sent successfully',
      });
    } catch (error) {
      logger.error('Send report error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
  
  async getExportData(req: Request, res: Response): Promise<Response> {
    try {
      const { startDate, endDate, format = 'csv' } = req.query;
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      const transactions = await Transaction.find({
        userId: req.user?.id,
        date: { $gte: start, $lte: end },
      }).lean();
      
      if (format === 'csv') {
        const csv = this.convertToCSV(transactions);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=transactions-${Date.now()}.csv`);
        return res.send(csv);
      }
      
      if (format === 'excel') {
        const excel = await this.convertToExcel(transactions);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=transactions-${Date.now()}.xlsx`);
        return res.send(excel);
      }
      
      return res.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      logger.error('Export data error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
  
  private async getCategoryBreakdown(transactions: any[]): Promise<any[]> {
    const breakdown = new Map();
    
    transactions.forEach(t => {
      if (t.type === 'debit') {
        const current = breakdown.get(t.category) || 0;
        breakdown.set(t.category, current + t.amount);
      }
    });
    
    return Array.from(breakdown.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0)) * 100,
    }));
  }
  
  private async getTopMerchants(transactions: any[]): Promise<any[]> {
    const merchantMap = new Map();
    
    transactions.forEach(t => {
      if (t.type === 'debit') {
        const current = merchantMap.get(t.merchant) || 0;
        merchantMap.set(t.merchant, current + t.amount);
      }
    });
    
    return Array.from(merchantMap.entries())
      .map(([merchant, amount]) => ({ merchant, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }
  
  private async getDailySpending(transactions: any[]): Promise<any[]> {
    const dailyMap = new Map();
    
    transactions.forEach(t => {
      if (t.type === 'debit') {
        const dateKey = t.date.toISOString().split('T')[0];
        const current = dailyMap.get(dateKey) || 0;
        dailyMap.set(dateKey, current + t.amount);
      }
    });
    
    return Array.from(dailyMap.entries()).map(([date, amount]) => ({
      date,
      amount,
    }));
  }
  
  private async generatePDF(data: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      
      // Add content to PDF
      doc.fontSize(20).text('Financial Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Period: ${data.period.startDate.toDateString()} - ${data.period.endDate.toDateString()}`);
      doc.moveDown();
      
      doc.fontSize(16).text('Summary');
      doc.fontSize(12).text(`Total Income: ₹${data.summary.totalIncome.toFixed(2)}`);
      doc.text(`Total Expenses: ₹${data.summary.totalExpenses.toFixed(2)}`);
      doc.text(`Net Savings: ₹${data.summary.netSavings.toFixed(2)}`);
      doc.text(`Total Transactions: ${data.summary.transactionCount}`);
      
      doc.moveDown();
      doc.fontSize(16).text('Category Breakdown');
      data.categoryBreakdown.forEach((cat: any) => {
        doc.fontSize(12).text(`${cat.category}: ₹${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)`);
      });
      
      doc.end();
    });
  }
  
  private convertToCSV(transactions: any[]): string {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const rows = transactions.map(t => [
      t.date.toISOString().split('T')[0],
      t.description,
      t.category,
      t.type,
      t.amount,
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
  
  private async convertToExcel(transactions: any[]): Promise<Buffer> {
    // Simple CSV for now (in production, use exceljs library)
    const csv = this.convertToCSV(transactions);
    return Buffer.from(csv, 'utf-8');
  }
}