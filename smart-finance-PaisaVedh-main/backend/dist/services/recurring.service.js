"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurringService = void 0;
const Transaction_model_1 = require("../models/Transaction.model");
const RecurringExpense_model_1 = require("../models/RecurringExpense.model");
const mongoose_1 = __importDefault(require("mongoose"));
class RecurringService {
    async detectRecurringExpenses(userId) {
        // Get last 6 months of transactions
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const transactions = await Transaction_model_1.Transaction.aggregate([
            { $match: {
                    userId: new mongoose_1.default.Types.ObjectId(userId),
                    type: 'debit',
                    date: { $gte: sixMonthsAgo }
                } },
            { $group: {
                    _id: {
                        merchant: '$merchant',
                        amount: '$amount'
                    },
                    transactions: { $push: '$$ROOT' },
                    count: { $sum: 1 },
                    dates: { $push: '$date' }
                } },
            { $match: { count: { $gte: 3 } } } // At least 3 occurrences
        ]);
        const patterns = [];
        for (const group of transactions) {
            const frequency = this.detectFrequency(group.dates);
            const confidence = this.calculateConfidence(group.dates, frequency);
            if (confidence > 0.7) { // 70% confidence threshold
                patterns.push({
                    merchant: group._id.merchant,
                    amount: group._id.amount,
                    frequency,
                    confidence,
                    transactionIds: group.transactions.map((t) => t._id.toString())
                });
            }
        }
        // Save detected patterns
        await this.saveRecurringPatterns(userId, patterns);
        return patterns;
    }
    detectFrequency(dates) {
        if (dates.length < 2)
            return 'monthly';
        // Sort dates
        const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
        // Calculate average interval in days
        let totalDays = 0;
        for (let i = 1; i < sortedDates.length; i++) {
            const diffDays = (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 3600 * 24);
            totalDays += diffDays;
        }
        const avgInterval = totalDays / (sortedDates.length - 1);
        // Determine frequency
        if (avgInterval <= 1.5)
            return 'daily';
        if (avgInterval <= 8)
            return 'weekly';
        if (avgInterval <= 35)
            return 'monthly';
        return 'yearly';
    }
    calculateConfidence(dates, frequency) {
        if (dates.length < 2)
            return 0;
        let expectedIntervals = [];
        switch (frequency) {
            case 'daily':
                expectedIntervals = [1];
                break;
            case 'weekly':
                expectedIntervals = [7, 14, 21, 28];
                break;
            case 'monthly':
                expectedIntervals = [28, 29, 30, 31, 35];
                break;
            case 'yearly':
                expectedIntervals = [365];
                break;
        }
        // Calculate variance from expected intervals
        const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
        let totalVariance = 0;
        for (let i = 1; i < sortedDates.length; i++) {
            const diffDays = (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 3600 * 24);
            const closestExpected = expectedIntervals.reduce((prev, curr) => Math.abs(curr - diffDays) < Math.abs(prev - diffDays) ? curr : prev);
            const variance = Math.abs(diffDays - closestExpected) / closestExpected;
            totalVariance += variance;
        }
        const avgVariance = totalVariance / (sortedDates.length - 1);
        return Math.max(0, Math.min(1, 1 - avgVariance));
    }
    async saveRecurringPatterns(userId, patterns) {
        for (const pattern of patterns) {
            // Check if pattern already exists
            const exists = await RecurringExpense_model_1.RecurringExpense.findOne({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                merchant: pattern.merchant,
                amount: pattern.amount,
                isActive: true
            });
            if (!exists) {
                // Get next expected date
                const lastTransaction = await Transaction_model_1.Transaction.findById(pattern.transactionIds[pattern.transactionIds.length - 1]);
                const nextExpectedDate = this.calculateNextDate(lastTransaction.date, pattern.frequency);
                await RecurringExpense_model_1.RecurringExpense.create({
                    userId: new mongoose_1.default.Types.ObjectId(userId),
                    merchant: pattern.merchant,
                    amount: pattern.amount,
                    frequency: pattern.frequency,
                    category: 'Subscription', // Auto-detect category
                    nextExpectedDate,
                    isActive: true,
                    confidence: pattern.confidence,
                    transactionHistory: pattern.transactionIds
                });
            }
        }
    }
    calculateNextDate(lastDate, frequency) {
        const nextDate = new Date(lastDate);
        switch (frequency) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + 1);
                break;
            case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            case 'yearly':
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                break;
        }
        return nextDate;
    }
}
exports.RecurringService = RecurringService;
//# sourceMappingURL=recurring.service.js.map