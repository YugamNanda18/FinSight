"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const Transaction_model_1 = require("../models/Transaction.model");
const transaction_service_1 = require("../services/transaction.service");
const redis_1 = require("../config/redis");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = __importDefault(require("../utils/logger"));
const upload = (0, multer_1.default)({ dest: 'uploads/' });
const transactionService = new transaction_service_1.TransactionService();
class TransactionController {
    async getTransactions(req, res) {
        try {
            const { page = 1, limit = 20, startDate, endDate, category, type } = req.query;
            const query = { userId: req.user?.id };
            if (startDate || endDate) {
                query.date = {};
                if (startDate)
                    query.date.$gte = new Date(startDate);
                if (endDate)
                    query.date.$lte = new Date(endDate);
            }
            if (category)
                query.category = category;
            if (type)
                query.type = type;
            const skip = (Number(page) - 1) * Number(limit);
            const [transactions, total] = await Promise.all([
                Transaction_model_1.Transaction.find(query)
                    .sort({ date: -1 })
                    .skip(skip)
                    .limit(Number(limit)),
                Transaction_model_1.Transaction.countDocuments(query),
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
        }
        catch (error) {
            logger_1.default.error('Get transactions error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }
    async createTransaction(req, res) {
        try {
            const transaction = new Transaction_model_1.Transaction({
                ...req.body,
                userId: req.user?.id,
            });
            await transaction.save();
            // Invalidate cache
            await redis_1.redisClient.del(`transactions:${req.user?.id}`);
            return res.status(201).json({
                success: true,
                data: transaction,
            });
        }
        catch (error) {
            logger_1.default.error('Create transaction error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }
    async uploadCSV(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }
            const result = await transactionService.processCSVUpload(req.file.path, req.user.id);
            // Clean up uploaded file
            fs_1.default.unlinkSync(req.file.path);
            return res.json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            logger_1.default.error('CSV upload error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }
    async updateTransaction(req, res) {
        try {
            const transaction = await Transaction_model_1.Transaction.findOneAndUpdate({ _id: req.params.id, userId: req.user?.id }, { $set: req.body }, { new: true, runValidators: true });
            if (!transaction) {
                return res.status(404).json({ message: 'Transaction not found' });
            }
            // Invalidate cache
            await redis_1.redisClient.del(`transactions:${req.user?.id}`);
            return res.json({
                success: true,
                data: transaction,
            });
        }
        catch (error) {
            logger_1.default.error('Update transaction error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }
    async deleteTransaction(req, res) {
        try {
            const transaction = await Transaction_model_1.Transaction.findOneAndDelete({
                _id: req.params.id,
                userId: req.user?.id,
            });
            if (!transaction) {
                return res.status(404).json({ message: 'Transaction not found' });
            }
            // Invalidate cache
            await redis_1.redisClient.del(`transactions:${req.user?.id}`);
            return res.json({
                success: true,
                message: 'Transaction deleted successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Delete transaction error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }
    async getTransactionStats(req, res) {
        try {
            const stats = await Transaction_model_1.Transaction.aggregate([
                { $match: { userId: req.user?.id } },
                { $group: {
                        _id: '$category',
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 },
                        averageAmount: { $avg: '$amount' },
                    } },
                { $sort: { totalAmount: -1 } },
            ]);
            return res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            logger_1.default.error('Get transaction stats error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }
}
exports.TransactionController = TransactionController;
//# sourceMappingURL=transaction.controller.js.map