import { Request, Response } from 'express';
import { Transaction } from '../models/Transaction.model';
import { AIService } from '../services/ai.service';
import { cacheService } from '../config/redis';
import logger from '../utils/logger';

const aiService = new AIService();

export class AnalyticsController {
  async getDashboardData(req: Request, res: Response): Promise<Response> {
    try {
      const { timeRange = 'month' } = req.query;
      const cacheKey = `dashboard:${req.user?.id}:${timeRange}`;
      
      // Check cache
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return res.json({ success: true, ...cached });
      }
      
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(now.setMonth(now.getMonth() - 1));
      }
      
      // Get all transactions
      const transactions = await Transaction.find({
        userId: req.user?.id,
        date: { $gte: startDate },
      });
      
      // Calculate metrics
      const totalBalance = transactions.reduce((sum, t) => 
        t.type === 'credit' ? sum + t.amount : sum - t.amount, 0
      );
      
      const monthlyIncome = transactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthlyExpenses = transactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const savingsRate = monthlyIncome > 0 
        ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 
        : 0;
      
      // Spending by category
      const spendingByCategory = await Transaction.aggregate([
        { $match: { userId: req.user?.id, type: 'debit', date: { $gte: startDate } } },
        { $group: { _id: '$category', value: { $sum: '$amount' } } },
        { $project: { name: '$_id', value: 1, _id: 0 } },
        { $sort: { value: -1 } },
        { $limit: 6 },
      ]);
      
      // Monthly trend
      const monthlyTrend = await Transaction.aggregate([
        { $match: { userId: req.user?.id, date: { $gte: startDate } } },
        { $group: {
          _id: { month: { $month: '$date' }, year: { $year: '$date' } },
          income: { $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] } },
          expenses: { $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] } },
        }},
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $project: {
          month: { $concat: [
            { $toString: '$_id.month' },
            '/',
            { $toString: '$_id.year' }
          ] },
          income: 1,
          expenses: 1,
        }},
      ]);
      
      // Budget status
      const budgetStatus = await Transaction.aggregate([
        { $match: { userId: req.user?.id, type: 'debit', date: { $gte: startDate } } },
        { $group: { _id: '$category', spent: { $sum: '$amount' } } },
        { $project: { category: '$_id', spent: 1, budget: { $multiply: ['$spent', 1.2] } } },
        { $addFields: { percentage: { $multiply: [{ $divide: ['$spent', '$budget'] }, 100] } } },
      ]);
      
      // Recent transactions
      const recentTransactions = await Transaction.find({ userId: req.user?.id })
        .sort({ date: -1 })
        .limit(10);
      
      // AI Recommendations
      const aiInsights = await aiService.generateSpendingInsights(req.user!.id);
      
      const dashboardData = {
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        savingsRate,
        spendingByCategory,
        monthlyTrend,
        budgetStatus,
        recentTransactions,
        aiRecommendations: aiInsights.recommendations,
      };
      
      // Cache for 5 minutes
      await cacheService.set(cacheKey, dashboardData, 300);
      
      return res.json({
        success: true,
        ...dashboardData,
      });
    } catch (error) {
      logger.error('Get dashboard data error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
  
  async getSpendingInsights(req: Request, res: Response): Promise<Response> {
    try {
      const insights = await aiService.generateSpendingInsights(req.user!.id);
      return res.json({ success: true, ...insights });
    } catch (error) {
      logger.error('Get spending insights error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
  
  async getCashFlow(req: Request, res: Response): Promise<Response> {
    try {
      const { months = 6 } = req.query;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - parseInt(months as string));
      
      const cashFlow = await Transaction.aggregate([
        { $match: { userId: req.user?.id, date: { $gte: startDate } } },
        { $group: {
          _id: { month: { $month: '$date' }, year: { $year: '$date' } },
          inflows: { $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] } },
          outflows: { $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] } },
        }},
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $project: {
          month: { $concat: [
            { $toString: '$_id.month' },
            '/',
            { $toString: '$_id.year' }
          ] },
          inflow: '$inflows',
          outflow: '$outflows',
          net: { $subtract: ['$inflows', '$outflows'] },
        }},
      ]);
      
      return res.json({ success: true, data: cashFlow });
    } catch (error) {
      logger.error('Get cash flow error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
}