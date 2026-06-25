"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetService = exports.BudgetService = void 0;
const Budget_model_1 = require("../models/Budget.model");
const Transaction_model_1 = require("../models/Transaction.model");
const User_model_1 = require("../models/User.model");
const Notification_model_1 = require("../models/Notification.model");
const redis_1 = require("../config/redis");
const email_service_1 = require("./email.service");
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
class BudgetService {
    /**
     * Create a new budget
     */
    async createBudget(budgetData) {
        try {
            const targetMonth = budgetData.month !== undefined ? budgetData.month : new Date().getMonth();
            const targetYear = budgetData.year !== undefined ? budgetData.year : new Date().getFullYear();
            const existingBudget = await Budget_model_1.Budget.findOne({
                userId: budgetData.userId,
                category: budgetData.category,
                month: targetMonth,
                year: targetYear,
            });
            if (existingBudget) {
                throw new Error(`Budget already exists for category "${budgetData.category}" in this month`);
            }
            const budget = new Budget_model_1.Budget({
                ...budgetData,
                month: targetMonth,
                year: targetYear,
            });
            await budget.save();
            await this.invalidateBudgetCache(budgetData.userId.toString());
            logger_1.default.info(`Budget created for user ${budgetData.userId}, category: ${budgetData.category}`);
            return budget;
        }
        catch (error) {
            logger_1.default.error('Create budget error:', error);
            throw error;
        }
    }
    /**
     * Get budgets for a specific month with real-time spending data
     */
    async getBudgets(userId, month, year) {
        try {
            const targetMonth = month !== undefined ? month : new Date().getMonth();
            const targetYear = year !== undefined ? year : new Date().getFullYear();
            const cacheKey = `budgets:${userId}:${targetMonth}:${targetYear}`;
            const cached = await redis_1.cacheService.get(cacheKey);
            if (cached) {
                return cached;
            }
            const budgets = await Budget_model_1.Budget.find({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                month: targetMonth,
                year: targetYear,
            });
            if (budgets.length === 0) {
                return [];
            }
            const budgetsWithSpending = await Promise.all(budgets.map(async (budget) => {
                const spending = await Transaction_model_1.Transaction.aggregate([
                    {
                        $match: {
                            userId: new mongoose_1.default.Types.ObjectId(userId),
                            category: budget.category,
                            type: 'debit',
                            date: {
                                $gte: new Date(targetYear, targetMonth, 1),
                                $lt: new Date(targetYear, targetMonth + 1, 1),
                            },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$amount' },
                            count: { $sum: 1 },
                        },
                    },
                ]);
                const spent = spending.length > 0 ? spending[0].total : 0;
                const transactionCount = spending.length > 0 ? spending[0].count : 0;
                const remaining = budget.amount - spent;
                const percentageUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
                let status = 'on_track';
                if (percentageUsed >= 100) {
                    status = 'exceeded';
                }
                else if (percentageUsed >= (budget.alertThreshold || 80)) {
                    status = 'warning';
                }
                return {
                    _id: budget._id,
                    userId: budget.userId,
                    category: budget.category,
                    amount: budget.amount,
                    spent,
                    remaining,
                    percentageUsed,
                    status,
                    transactionCount,
                    month: budget.month,
                    year: budget.year,
                    alerts: budget.alerts,
                    alertThreshold: budget.alertThreshold,
                    createdAt: budget.createdAt,
                    updatedAt: budget.updatedAt,
                };
            }));
            budgetsWithSpending.sort((a, b) => b.percentageUsed - a.percentageUsed);
            await redis_1.cacheService.set(cacheKey, budgetsWithSpending, 900);
            return budgetsWithSpending;
        }
        catch (error) {
            logger_1.default.error('Get budgets error:', error);
            throw error;
        }
    }
    /**
     * Update an existing budget
     */
    async updateBudget(budgetId, userId, updates) {
        try {
            const budget = await Budget_model_1.Budget.findOneAndUpdate({ _id: budgetId, userId: new mongoose_1.default.Types.ObjectId(userId) }, { $set: updates }, { new: true, runValidators: true });
            if (budget) {
                await this.invalidateBudgetCache(userId);
                logger_1.default.info(`Budget updated for user ${userId}, budget ID: ${budgetId}`);
            }
            return budget;
        }
        catch (error) {
            logger_1.default.error('Update budget error:', error);
            throw error;
        }
    }
    /**
     * Delete a budget
     */
    async deleteBudget(budgetId, userId) {
        try {
            const result = await Budget_model_1.Budget.findOneAndDelete({
                _id: budgetId,
                userId: new mongoose_1.default.Types.ObjectId(userId),
            });
            if (result) {
                await this.invalidateBudgetCache(userId);
                logger_1.default.info(`Budget deleted for user ${userId}, budget ID: ${budgetId}`);
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.default.error('Delete budget error:', error);
            throw error;
        }
    }
    /**
     * Check all budgets for alerts and send notifications
     */
    async checkBudgetAlerts(userId) {
        try {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const currentDay = new Date().getDate();
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            const monthProgress = currentDay / daysInMonth;
            const budgets = await this.getBudgets(userId, currentMonth, currentYear);
            const alerts = [];
            for (const budget of budgets) {
                const threshold = budget.alertThreshold || 80;
                if (budget.percentageUsed >= threshold && budget.percentageUsed < 100) {
                    const alert = {
                        budgetId: budget._id.toString(),
                        category: budget.category,
                        spent: budget.spent,
                        budgetAmount: budget.amount,
                        percentage: budget.percentageUsed,
                        message: `${budget.category}: ${budget.percentageUsed.toFixed(1)}% used (₹${budget.spent.toFixed(2)} / ₹${budget.amount.toFixed(2)})`,
                    };
                    alerts.push(alert);
                    await this.createBudgetNotification(userId, budget, 'warning');
                }
                if (budget.percentageUsed >= 100) {
                    const alert = {
                        budgetId: budget._id.toString(),
                        category: budget.category,
                        spent: budget.spent,
                        budgetAmount: budget.amount,
                        percentage: budget.percentageUsed,
                        message: `⚠️ ${budget.category}: Budget exceeded by ₹${(budget.spent - budget.amount).toFixed(2)}`,
                    };
                    alerts.push(alert);
                    await this.createBudgetNotification(userId, budget, 'exceeded');
                }
                if (monthProgress > 0.5 && budget.percentageUsed > 70 && budget.percentageUsed < threshold && budget.alerts) {
                    const alert = {
                        budgetId: budget._id.toString(),
                        category: budget.category,
                        spent: budget.spent,
                        budgetAmount: budget.amount,
                        percentage: budget.percentageUsed,
                        message: `${budget.category}: ${budget.percentageUsed.toFixed(1)}% used at mid-month`,
                    };
                    alerts.push(alert);
                }
            }
            const criticalAlerts = alerts.filter(a => a.percentage >= 90);
            if (criticalAlerts.length > 0 && budgets.length > 0) {
                await this.sendBudgetAlertEmail(userId, criticalAlerts);
            }
            return alerts;
        }
        catch (error) {
            logger_1.default.error('Check budget alerts error:', error);
            throw error;
        }
    }
    /**
     * Get AI-powered budget recommendations
     */
    async getBudgetRecommendations(userId) {
        try {
            const recommendations = [];
            const last3Months = [];
            const now = new Date();
            for (let i = 1; i <= 3; i++) {
                const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const budgets = await this.getBudgets(userId, month.getMonth(), month.getFullYear());
                last3Months.push(budgets);
            }
            const currentBudgets = await this.getBudgets(userId, now.getMonth(), now.getFullYear());
            const allCategories = new Set();
            last3Months.forEach(monthBudgets => {
                monthBudgets.forEach(budget => allCategories.add(budget.category));
            });
            for (const category of allCategories) {
                const historicalSpending = [];
                for (const monthBudgets of last3Months) {
                    const budget = monthBudgets.find(b => b.category === category);
                    if (budget) {
                        historicalSpending.push(budget.spent);
                    }
                }
                if (historicalSpending.length >= 2) {
                    const avgSpending = historicalSpending.reduce((a, b) => a + b, 0) / historicalSpending.length;
                    const currentBudget = currentBudgets.find(b => b.category === category);
                    if (currentBudget && avgSpending > currentBudget.amount * 1.2) {
                        recommendations.push({
                            type: 'increase_budget',
                            category,
                            currentBudget: currentBudget.amount,
                            recommendedBudget: Math.ceil(avgSpending * 1.1),
                            currentSpending: avgSpending,
                            reason: `Your average spending in ${category} is ${Math.round((avgSpending / currentBudget.amount - 1) * 100)}% higher than your budget`,
                            priority: 'high',
                        });
                    }
                    else if (currentBudget && avgSpending < currentBudget.amount * 0.6) {
                        recommendations.push({
                            type: 'decrease_budget',
                            category,
                            currentBudget: currentBudget.amount,
                            recommendedBudget: Math.ceil(avgSpending * 1.2),
                            currentSpending: avgSpending,
                            potentialSavings: currentBudget.amount - Math.ceil(avgSpending * 1.2),
                            reason: `You consistently spend ${Math.round((1 - avgSpending / currentBudget.amount) * 100)}% less than budgeted in ${category}`,
                            priority: 'medium',
                        });
                    }
                    else if (!currentBudget && avgSpending > 5000) {
                        recommendations.push({
                            type: 'create_budget',
                            category,
                            recommendedBudget: Math.ceil(avgSpending * 1.1),
                            currentSpending: avgSpending,
                            reason: `You spend ₹${avgSpending.toFixed(0)} on average in ${category}. Consider creating a budget to track this expense.`,
                            priority: 'high',
                        });
                    }
                }
            }
            for (const budget of currentBudgets) {
                if (budget.percentageUsed > 80 && budget.percentageUsed < 100) {
                    recommendations.push({
                        type: 'optimize_spending',
                        category: budget.category,
                        currentSpending: budget.spent,
                        currentBudget: budget.amount,
                        potentialSavings: budget.spent * 0.15,
                        reason: `You're close to exceeding your ${budget.category} budget. Consider reducing discretionary spending in this category.`,
                        priority: 'medium',
                    });
                }
            }
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
            return recommendations.slice(0, 5);
        }
        catch (error) {
            logger_1.default.error('Get budget recommendations error:', error);
            return [];
        }
    }
    /**
     * Get budget summary statistics
     */
    async getBudgetSummary(userId) {
        try {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const budgets = await this.getBudgets(userId, currentMonth, currentYear);
            if (budgets.length === 0) {
                return {
                    totalBudget: 0,
                    totalSpent: 0,
                    totalRemaining: 0,
                    averageUtilization: 0,
                    categoriesAtRisk: 0,
                    categoriesExceeded: 0,
                    categoriesOnTrack: 0,
                    topSpendingCategories: [],
                    recommendations: [],
                    monthlyComparison: null,
                };
            }
            const summary = {
                totalBudget: 0,
                totalSpent: 0,
                totalRemaining: 0,
                averageUtilization: 0,
                categoriesAtRisk: 0,
                categoriesExceeded: 0,
                categoriesOnTrack: 0,
                topSpendingCategories: [],
                recommendations: [],
                monthlyComparison: null,
            };
            for (const budget of budgets) {
                summary.totalBudget += budget.amount;
                summary.totalSpent += budget.spent;
                summary.totalRemaining += budget.remaining;
                if (budget.status === 'warning')
                    summary.categoriesAtRisk++;
                if (budget.status === 'exceeded')
                    summary.categoriesExceeded++;
                if (budget.status === 'on_track')
                    summary.categoriesOnTrack++;
            }
            summary.averageUtilization = summary.totalBudget > 0
                ? (summary.totalSpent / summary.totalBudget) * 100
                : 0;
            summary.topSpendingCategories = budgets
                .sort((a, b) => b.spent - a.spent)
                .slice(0, 5)
                .map(b => ({
                category: b.category,
                spent: b.spent,
                budget: b.amount,
                percentage: b.percentageUsed,
                status: b.status,
            }));
            summary.recommendations = await this.getBudgetRecommendations(userId);
            summary.monthlyComparison = await this.getMonthlyComparison(userId);
            return summary;
        }
        catch (error) {
            logger_1.default.error('Get budget summary error:', error);
            throw error;
        }
    }
    /**
     * Compare current month with previous month
     */
    async getMonthlyComparison(userId) {
        try {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            const [currentBudgets, previousBudgets] = await Promise.all([
                this.getBudgets(userId, currentMonth, currentYear),
                this.getBudgets(userId, previousMonth, previousYear),
            ]);
            if (currentBudgets.length === 0 && previousBudgets.length === 0) {
                return null;
            }
            const currentTotal = currentBudgets.reduce((sum, b) => sum + b.spent, 0);
            const previousTotal = previousBudgets.reduce((sum, b) => sum + b.spent, 0);
            const totalChange = previousTotal > 0
                ? ((currentTotal - previousTotal) / previousTotal) * 100
                : 0;
            const categoryComparisons = [];
            const categories = new Set([
                ...currentBudgets.map(b => b.category),
                ...previousBudgets.map(b => b.category),
            ]);
            for (const category of categories) {
                const current = currentBudgets.find(b => b.category === category);
                const previous = previousBudgets.find(b => b.category === category);
                if (current && previous) {
                    const change = previous.spent > 0
                        ? ((current.spent - previous.spent) / previous.spent) * 100
                        : 0;
                    categoryComparisons.push({
                        category,
                        currentSpent: current.spent,
                        previousSpent: previous.spent,
                        change,
                        trend: change > 10 ? 'increase' : change < -10 ? 'decrease' : 'stable',
                    });
                }
                else if (current && !previous) {
                    categoryComparisons.push({
                        category,
                        currentSpent: current.spent,
                        previousSpent: 0,
                        change: 100,
                        trend: 'increase',
                    });
                }
                else if (!current && previous) {
                    categoryComparisons.push({
                        category,
                        currentSpent: 0,
                        previousSpent: previous.spent,
                        change: -100,
                        trend: 'decrease',
                    });
                }
            }
            return {
                currentMonth: new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' }),
                previousMonth: new Date(previousYear, previousMonth).toLocaleString('default', { month: 'long', year: 'numeric' }),
                currentTotal,
                previousTotal,
                totalChange,
                categoryComparisons: categoryComparisons.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)),
                insights: this.generateComparisonInsights(totalChange, categoryComparisons),
            };
        }
        catch (error) {
            logger_1.default.error('Get monthly comparison error:', error);
            return null;
        }
    }
    /**
     * Bulk create budgets for common categories
     */
    async createDefaultBudgets(userId) {
        try {
            const defaultBudgets = [
                { category: 'Food & Dining', amount: 8000, alertThreshold: 80 },
                { category: 'Shopping', amount: 5000, alertThreshold: 80 },
                { category: 'Transportation', amount: 3000, alertThreshold: 80 },
                { category: 'Entertainment', amount: 2000, alertThreshold: 80 },
                { category: 'Bills & Utilities', amount: 4000, alertThreshold: 85 },
                { category: 'Healthcare', amount: 2000, alertThreshold: 80 },
                { category: 'Education', amount: 3000, alertThreshold: 80 },
            ];
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const createdBudgets = [];
            for (const defaultBudget of defaultBudgets) {
                try {
                    const budget = await this.createBudget({
                        userId: new mongoose_1.default.Types.ObjectId(userId),
                        ...defaultBudget,
                        month: currentMonth,
                        year: currentYear,
                        alerts: true,
                    });
                    createdBudgets.push(budget);
                }
                catch (error) {
                    logger_1.default.warn(`Could not create default budget for ${defaultBudget.category}:`, error);
                }
            }
            logger_1.default.info(`Created ${createdBudgets.length} default budgets for user ${userId}`);
            return createdBudgets;
        }
        catch (error) {
            logger_1.default.error('Create default budgets error:', error);
            throw error;
        }
    }
    /**
     * Get budget vs actual variance analysis
     */
    async getVarianceAnalysis(userId) {
        try {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const budgets = await this.getBudgets(userId, currentMonth, currentYear);
            const varianceAnalysis = budgets.map(budget => ({
                category: budget.category,
                budgeted: budget.amount,
                actual: budget.spent,
                variance: budget.amount - budget.spent,
                variancePercentage: budget.amount > 0
                    ? ((budget.spent - budget.amount) / budget.amount) * 100
                    : 0,
                status: budget.spent <= budget.amount ? 'under_budget' : 'over_budget',
                recommendation: this.getVarianceRecommendation(budget),
            }));
            const totalBudgeted = varianceAnalysis.reduce((sum, v) => sum + v.budgeted, 0);
            const totalActual = varianceAnalysis.reduce((sum, v) => sum + v.actual, 0);
            const totalVariance = totalBudgeted - totalActual;
            return {
                categories: varianceAnalysis,
                summary: {
                    totalBudgeted,
                    totalActual,
                    totalVariance,
                    totalVariancePercentage: totalBudgeted > 0
                        ? (totalVariance / totalBudgeted) * 100
                        : 0,
                    categoriesUnderBudget: varianceAnalysis.filter(v => v.status === 'under_budget').length,
                    categoriesOverBudget: varianceAnalysis.filter(v => v.status === 'over_budget').length,
                },
            };
        }
        catch (error) {
            logger_1.default.error('Get variance analysis error:', error);
            throw error;
        }
    }
    /**
     * Private helper methods
     */
    async invalidateBudgetCache(userId) {
        try {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const keysToInvalidate = [
                `budgets:${userId}:${currentMonth}:${currentYear}`,
                `budgets:${userId}:${currentMonth - 1}:${currentYear}`,
                `budgets:${userId}:${currentMonth + 1}:${currentYear}`,
            ];
            for (const key of keysToInvalidate) {
                await redis_1.cacheService.del(key);
            }
        }
        catch (error) {
            logger_1.default.error('Invalidate budget cache error:', error);
        }
    }
    async createBudgetNotification(userId, budget, type) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const existingNotification = await Notification_model_1.Notification.findOne({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                type: 'budget_alert',
                'metadata.budgetId': budget._id,
                createdAt: { $gte: today },
            });
            if (existingNotification) {
                return;
            }
            const notification = new Notification_model_1.Notification({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                title: type === 'warning' ? 'Budget Warning' : 'Budget Exceeded',
                message: type === 'warning'
                    ? `${budget.category} budget is at ${budget.percentageUsed.toFixed(1)}%`
                    : `${budget.category} budget has been exceeded by ₹${(budget.spent - budget.amount).toFixed(2)}`,
                type: 'budget_alert',
                metadata: {
                    budgetId: budget._id,
                    category: budget.category,
                    spent: budget.spent,
                    budgetAmount: budget.amount,
                    percentage: budget.percentageUsed,
                },
            });
            await notification.save();
        }
        catch (error) {
            logger_1.default.error('Create budget notification error:', error);
        }
    }
    async sendBudgetAlertEmail(userId, alerts) {
        try {
            const user = await User_model_1.User.findById(userId);
            if (!user || !user.preferences?.notificationEnabled)
                return;
            await email_service_1.emailService.sendBudgetAlert(user.email, alerts.map(a => a.message));
        }
        catch (error) {
            logger_1.default.error('Send budget alert email error:', error);
        }
    }
    getVarianceRecommendation(budget) {
        if (budget.spent > budget.amount) {
            const overspend = budget.spent - budget.amount;
            if (overspend > budget.amount * 0.5) {
                return `Critical overspending in ${budget.category}. Review all expenses in this category immediately.`;
            }
            else if (overspend > budget.amount * 0.2) {
                return `Significant overspending in ${budget.category}. Consider reducing non-essential purchases.`;
            }
            else {
                return `Minor overspending in ${budget.category}. Small adjustments can bring you back on track.`;
            }
        }
        else {
            const underspend = budget.amount - budget.spent;
            if (underspend > budget.amount * 0.3) {
                return `Great job saving in ${budget.category}! Consider reallocating surplus to savings or debt.`;
            }
            else {
                return `Good job staying within budget in ${budget.category}.`;
            }
        }
    }
    generateComparisonInsights(totalChange, categoryComparisons) {
        const insights = [];
        if (totalChange > 10) {
            insights.push(`Total spending increased by ${totalChange.toFixed(1)}% compared to last month. Review your expenses.`);
        }
        else if (totalChange < -10) {
            insights.push(`Excellent! Total spending decreased by ${Math.abs(totalChange).toFixed(1)}% compared to last month.`);
        }
        const biggestIncrease = categoryComparisons[0];
        if (biggestIncrease && biggestIncrease.change > 20) {
            insights.push(`Your ${biggestIncrease.category} spending increased the most (${biggestIncrease.change.toFixed(1)}%). Consider why.`);
        }
        const biggestDecrease = categoryComparisons[categoryComparisons.length - 1];
        if (biggestDecrease && biggestDecrease.change < -20) {
            insights.push(`Your ${biggestDecrease.category} spending decreased the most (${Math.abs(biggestDecrease.change).toFixed(1)}%). Great job!`);
        }
        return insights;
    }
}
exports.BudgetService = BudgetService;
exports.budgetService = new BudgetService();
//# sourceMappingURL=budget.service.js.map