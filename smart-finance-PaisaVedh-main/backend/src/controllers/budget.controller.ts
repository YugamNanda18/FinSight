import { Request, Response } from 'express';
import { Budget } from '../models/Budget.model';
import { Transaction } from '../models/Transaction.model';
import logger from '../utils/logger';

export class BudgetController {
  async createBudget(req: Request, res: Response): Promise<Response> {
    try {
      const budget = new Budget({
        ...req.body,
        userId: req.user?.id,
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
      });
      
      await budget.save();
      
      return res.status(201).json({
        success: true,
        data: budget,
      });
    } catch (error) {
      logger.error('Create budget error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
  
  async getBudgets(req: Request, res: Response): Promise<Response> {
    try {
      const { month, year } = req.query;
      const currentMonth = month ? parseInt(month as string) : new Date().getMonth();
      const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
      
      const budgets = await Budget.aggregate([
        { $match: {
          userId: req.user?.id,
          month: currentMonth,
          year: currentYear,
        }},
        { $lookup: {
          from: 'transactions',
          let: { category: '$category' },
          pipeline: [
            { $match: {
              $expr: {
                $and: [
                  { $eq: ['$userId', req.user?.id] },
                  { $eq: ['$category', '$$category'] },
                  { $eq: [{ $month: '$date' }, currentMonth] },
                  { $eq: [{ $year: '$date' }, currentYear] },
                ],
              },
            }},
            { $group: {
              _id: null,
              spent: { $sum: '$amount' },
              count: { $sum: 1 },
            }},
          ],
          as: 'spending',
        }},
        { $addFields: {
          spent: { $ifNull: [{ $arrayElemAt: ['$spending.spent', 0] }, 0] },
          transactionCount: { $ifNull: [{ $arrayElemAt: ['$spending.count', 0] }, 0] },
          remaining: { $subtract: ['$amount', { $ifNull: [{ $arrayElemAt: ['$spending.spent', 0] }, 0] }] },
          percentageUsed: {
            $multiply: [
              { $divide: [{ $ifNull: [{ $arrayElemAt: ['$spending.spent', 0] }, 0] }, '$amount'] },
              100,
            ],
          },
        }},
      ]);
      
      return res.json({
        success: true,
        data: budgets,
      });
    } catch (error) {
      logger.error('Get budgets error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
  
  async updateBudget(req: Request, res: Response): Promise<Response> {
    try {
      const budget = await Budget.findOneAndUpdate(
        { _id: req.params.id, userId: req.user?.id },
        { $set: req.body },
        { new: true }
      );
      
      if (!budget) {
        return res.status(404).json({ message: 'Budget not found' });
      }
      
      return res.json({
        success: true,
        data: budget,
      });
    } catch (error) {
      logger.error('Update budget error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
  
  async deleteBudget(req: Request, res: Response): Promise<Response> {
    try {
      const budget = await Budget.findOneAndDelete({
        _id: req.params.id,
        userId: req.user?.id,
      });
      
      if (!budget) {
        return res.status(404).json({ message: 'Budget not found' });
      }
      
      return res.json({
        success: true,
        message: 'Budget deleted successfully',
      });
    } catch (error) {
      logger.error('Delete budget error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
  
  async getBudgetAlerts(req: Request, res: Response): Promise<Response> {
    try {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const budgets = await Budget.aggregate([
        { $match: {
          userId: req.user?.id,
          month: currentMonth,
          year: currentYear,
        }},
        { $lookup: {
          from: 'transactions',
          let: { category: '$category' },
          pipeline: [
            { $match: {
              $expr: {
                $and: [
                  { $eq: ['$userId', req.user?.id] },
                  { $eq: ['$category', '$$category'] },
                  { $eq: [{ $month: '$date' }, currentMonth] },
                  { $eq: [{ $year: '$date' }, currentYear] },
                ],
              },
            }},
            { $group: {
              _id: null,
              spent: { $sum: '$amount' },
            }},
          ],
          as: 'spending',
        }},
        { $addFields: {
          spent: { $ifNull: [{ $arrayElemAt: ['$spending.spent', 0] }, 0] },
          percentage: {
            $multiply: [
              { $divide: [{ $ifNull: [{ $arrayElemAt: ['$spending.spent', 0] }, 0] }, '$amount'] },
              100,
            ],
          },
        }},
        { $match: { percentage: { $gte: 80 } } },
      ]);
      
      const alerts = budgets.map(budget => ({
        category: budget.category,
        spent: budget.spent,
        budget: budget.amount,
        percentage: budget.percentage,
        message: budget.percentage >= 100
          ? `Budget exceeded for ${budget.category} by ₹${(budget.spent - budget.amount).toFixed(2)}`
          : `Close to budget limit for ${budget.category} (${budget.percentage.toFixed(1)}% used)`,
      }));
      
      return res.json({
        success: true,
        alerts,
      });
    } catch (error) {
      logger.error('Get budget alerts error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
}