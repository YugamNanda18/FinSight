"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavingsController = void 0;
const SavingsGoal_model_1 = require("../models/SavingsGoal.model");
const Transaction_model_1 = require("../models/Transaction.model");
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
class SavingsController {
    async createGoal(req, res) {
        try {
            const goal = new SavingsGoal_model_1.SavingsGoal({
                ...req.body,
                userId: req.user?.id,
                currentAmount: 0,
            });
            await goal.save();
            return res.status(201).json({
                success: true,
                data: goal,
            });
        }
        catch (error) {
            logger_1.default.error('Create savings goal error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }
    async getGoals(req, res) {
        try {
            const goals = await SavingsGoal_model_1.SavingsGoal.find({ userId: req.user?.id })
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
        }
        catch (error) {
            logger_1.default.error('Get savings goals error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }
    async updateGoal(req, res) {
        try {
            const goal = await SavingsGoal_model_1.SavingsGoal.findOneAndUpdate({ _id: req.params.id, userId: req.user?.id }, { $set: req.body }, { new: true });
            if (!goal) {
                return res.status(404).json({ message: 'Goal not found' });
            }
            return res.json({
                success: true,
                data: goal,
            });
        }
        catch (error) {
            logger_1.default.error('Update savings goal error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }
    async addContribution(req, res) {
        try {
            const { amount, description } = req.body;
            const goal = await SavingsGoal_model_1.SavingsGoal.findOne({
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
            await Transaction_model_1.Transaction.create({
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
        }
        catch (error) {
            logger_1.default.error('Add contribution error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }
    async deleteGoal(req, res) {
        try {
            const goal = await SavingsGoal_model_1.SavingsGoal.findOneAndDelete({
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
        }
        catch (error) {
            logger_1.default.error('Delete savings goal error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }
    calculateMonthlyRecommended(goal) {
        const monthsRemaining = Math.max(1, this.getMonthsRemaining(goal.targetDate));
        const remainingAmount = goal.targetAmount - goal.currentAmount;
        return remainingAmount / monthsRemaining;
    }
    async calculateProjectedCompletion(goal, userId) {
        try {
            if (goal.currentAmount === 0)
                return null;
            const monthlySavings = await this.getAverageMonthlySavings(userId);
            if (monthlySavings === 0)
                return null;
            const remainingAmount = goal.targetAmount - goal.currentAmount;
            const monthsNeeded = remainingAmount / monthlySavings;
            const completionDate = new Date();
            completionDate.setMonth(completionDate.getMonth() + monthsNeeded);
            return completionDate;
        }
        catch (error) {
            logger_1.default.error('Calculate projected completion error:', error);
            return null;
        }
    }
    getMonthsRemaining(targetDate) {
        const now = new Date();
        const months = (targetDate.getFullYear() - now.getFullYear()) * 12;
        return months + (targetDate.getMonth() - now.getMonth());
    }
    async getAverageMonthlySavings(userId) {
        try {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            const transactions = await Transaction_model_1.Transaction.find({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                date: { $gte: sixMonthsAgo },
            });
            if (transactions.length === 0)
                return 0;
            const monthlyIncome = transactions
                .filter(t => t.type === 'credit')
                .reduce((sum, t) => sum + t.amount, 0) / 6;
            const monthlyExpenses = transactions
                .filter(t => t.type === 'debit')
                .reduce((sum, t) => sum + t.amount, 0) / 6;
            return Math.max(0, monthlyIncome - monthlyExpenses);
        }
        catch (error) {
            logger_1.default.error('Get average monthly savings error:', error);
            return 0;
        }
    }
}
exports.SavingsController = SavingsController;
exports.default = SavingsController;
//# sourceMappingURL=savings.controller.js.map