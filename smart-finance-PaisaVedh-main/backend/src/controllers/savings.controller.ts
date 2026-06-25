import { Request, Response } from 'express';
import { SavingsGoal } from '../models/SavingsGoal.model';
import { Transaction } from '../models/Transaction.model';
import mongoose from 'mongoose';
import logger from '../utils/logger';

export class SavingsController {
  async createGoal(req: Request, res: Response): Promise<Response> {
    try {
      const goal = new SavingsGoal({
        ...req.body,
        userId: req.user?.id,
        currentAmount: 0,
      });
      
      await goal.save();
      
      return res.status(201).json({
        success: true,
        data: goal,
      });
    } catch (error) {
      logger.error('Create savings goal error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
  
  async getGoals(req: Request, res: Response): Promise<Response> {
    try {
      const goals = await SavingsGoal.find({ userId: req.user?.id })
        .sort({ targetDate: 1 });
      
      // Calculate progress for each goal
      const goalsWithProgress = await Promise.all(goals.map(async (goal) => ({
        ...goal.toObject(),
        progress: (goal.currentAmount / goal.targetAmount) * 100,
        monthlyRecommended: this.calculateMonthlyRecommended(goal),
        projectedCompletion: await this.calculateProjectedCompletion(goal, req.user?.id),
      })));
      
      return res.json({
        success: true,
        data: goalsWithProgress,
      });
    } catch (error) {
      logger.error('Get savings goals error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
  
  async updateGoal(req: Request, res: Response): Promise<Response> {
    try {
      const goal = await SavingsGoal.findOneAndUpdate(
        { _id: req.params.id, userId: req.user?.id },
        { $set: req.body },
        { new: true }
      );
      
      if (!goal) {
        return res.status(404).json({ message: 'Goal not found' });
      }
      
      return res.json({
        success: true,
        data: goal,
      });
    } catch (error) {
      logger.error('Update savings goal error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
  
  async addContribution(req: Request, res: Response): Promise<Response> {
    try {
      const { amount, description } = req.body;
      const goal = await SavingsGoal.findOne({
        _id: req.params.id,
        userId: req.user?.id,
      });
      
      if (!goal) {
        return res.status(404).json({ message: 'Goal not found' });
      }
      
      goal.currentAmount += amount;
      goal.contributions.push({
        amount,
        date: new Date(),
        description,
      });
      
      await goal.save();
      
      // Create transaction record
      await Transaction.create({
        userId: req.user?.id,
        amount,
        type: 'debit',
        category: 'Savings',
        description: `Savings contribution: ${description || goal.name}`,
        merchant: 'Savings Goal',
        date: new Date(),
        tags: ['savings', 'goal'],
      });
      
      return res.json({
        success: true,
        data: goal,
        progress: (goal.currentAmount / goal.targetAmount) * 100,
      });
    } catch (error) {
      logger.error('Add contribution error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
  
  async deleteGoal(req: Request, res: Response): Promise<Response> {
    try {
      const goal = await SavingsGoal.findOneAndDelete({
        _id: req.params.id,
        userId: req.user?.id,
      });
      
      if (!goal) {
        return res.status(404).json({ message: 'Goal not found' });
      }
      
      return res.json({
        success: true,
        message: 'Goal deleted successfully',
      });
    } catch (error) {
      logger.error('Delete savings goal error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
  
  private calculateMonthlyRecommended(goal: any): number {
    const monthsRemaining = Math.max(1, this.getMonthsRemaining(goal.targetDate));
    const remainingAmount = goal.targetAmount - goal.currentAmount;
    return remainingAmount / monthsRemaining;
  }
  
  private async calculateProjectedCompletion(goal: any, userId: string): Promise<Date | null> {
    try {
      if (goal.currentAmount === 0) return null;
      
      const monthlySavings = await this.getAverageMonthlySavings(userId);
      if (monthlySavings === 0) return null;
      
      const remainingAmount = goal.targetAmount - goal.currentAmount;
      const monthsNeeded = remainingAmount / monthlySavings;
      
      const completionDate = new Date();
      completionDate.setMonth(completionDate.getMonth() + monthsNeeded);
      
      return completionDate;
    } catch (error) {
      logger.error('Calculate projected completion error:', error);
      return null;
    }
  }
  
  private getMonthsRemaining(targetDate: Date): number {
    const now = new Date();
    const months = (targetDate.getFullYear() - now.getFullYear()) * 12;
    return months + (targetDate.getMonth() - now.getMonth());
  }
  
  private async getAverageMonthlySavings(userId: string): Promise<number> {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const transactions = await Transaction.find({
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: sixMonthsAgo },
      });
      
      if (transactions.length === 0) return 0;
      
      const monthlyIncome = transactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0) / 6;
      
      const monthlyExpenses = transactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0) / 6;
      
      return Math.max(0, monthlyIncome - monthlyExpenses);
    } catch (error) {
      logger.error('Get average monthly savings error:', error);
      return 0;
    }
  }
}

export default SavingsController;