import { Request, Response } from 'express';
import { Transaction } from '../models/Transaction.model';
import { TransactionService } from '../services/transaction.service';
import { redisClient } from '../config/redis';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';

const upload = multer({ dest: 'uploads/' });
const transactionService = new TransactionService();

export class TransactionController {
  async getTransactions(req: Request, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 20, startDate, endDate, category, type } = req.query;
      
      const query: any = { userId: req.user?.id };
      
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate as string);
        if (endDate) query.date.$lte = new Date(endDate as string);
      }
      
      if (category) query.category = category;
      if (type) query.type = type;
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const [transactions, total] = await Promise.all([
        Transaction.find(query)
          .sort({ date: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Transaction.countDocuments(query),
      ]);
      
      return res.json({
        success: true,
        data: transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Get transactions error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
  
  async createTransaction(req: Request, res: Response): Promise<Response> {
    try {
      const transaction = new Transaction({
        ...req.body,
        userId: req.user?.id,
      });
      
      await transaction.save();
      
      // Invalidate cache
      await redisClient.del(`transactions:${req.user?.id}`);
      
      return res.status(201).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      logger.error('Create transaction error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
  
  async uploadCSV(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const result = await transactionService.processCSVUpload(
        req.file.path,
        req.user!.id
      );
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      return res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error('CSV upload error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
  
  async updateTransaction(req: Request, res: Response): Promise<Response> {
    try {
      const transaction = await Transaction.findOneAndUpdate(
        { _id: req.params.id, userId: req.user?.id },
        { $set: req.body },
        { new: true, runValidators: true }
      );
      
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      // Invalidate cache
      await redisClient.del(`transactions:${req.user?.id}`);
      
      return res.json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      logger.error('Update transaction error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
  
  async deleteTransaction(req: Request, res: Response): Promise<Response> {
    try {
      const transaction = await Transaction.findOneAndDelete({
        _id: req.params.id,
        userId: req.user?.id,
      });
      
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      // Invalidate cache
      await redisClient.del(`transactions:${req.user?.id}`);
      
      return res.json({
        success: true,
        message: 'Transaction deleted successfully',
      });
    } catch (error) {
      logger.error('Delete transaction error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
  
  async getTransactionStats(req: Request, res: Response): Promise<Response> {
    try {
      const stats = await Transaction.aggregate([
        { $match: { userId: req.user?.id } },
        { $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          averageAmount: { $avg: '$amount' },
        }},
        { $sort: { totalAmount: -1 } },
      ]);
      
      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Get transaction stats error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
}