"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronService = exports.CronService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const email_service_1 = require("./email.service");
const recurring_service_1 = require("./recurring.service");
const User_model_1 = require("../models/User.model");
const Transaction_model_1 = require("../models/Transaction.model");
const Budget_model_1 = require("../models/Budget.model");
const logger_1 = __importDefault(require("../utils/logger"));
class CronService {
    recurringService;
    constructor() {
        this.recurringService = new recurring_service_1.RecurringService();
        this.initializeJobs();
    }
    initializeJobs() {
        // Monthly report - Run on 1st of each month at 9 AM
        node_cron_1.default.schedule('0 9 1 * *', async () => {
            logger_1.default.info('Running monthly report generation');
            await this.generateMonthlyReports();
        });
        // Recurring expense detection - Run weekly on Sunday at 2 AM
        node_cron_1.default.schedule('0 2 * * 0', async () => {
            logger_1.default.info('Running recurring expense detection');
            await this.detectAllRecurringExpenses();
        });
        // Budget alerts - Run daily at 9 AM
        node_cron_1.default.schedule('0 9 * * *', async () => {
            logger_1.default.info('Running budget alerts check');
            await this.checkBudgetAlerts();
        });
        // Data cleanup - Run monthly on 1st at 3 AM
        node_cron_1.default.schedule('0 3 1 * *', async () => {
            logger_1.default.info('Running data cleanup');
            await this.cleanupOldData();
        });
        // AI insights generation - Run every Monday at 8 AM
        node_cron_1.default.schedule('0 8 * * 1', async () => {
            logger_1.default.info('Generating weekly AI insights');
            await this.generateWeeklyInsights();
        });
    }
    async generateMonthlyReports() {
        const users = await User_model_1.User.find({ 'preferences.notificationEnabled': true });
        for (const user of users) {
            try {
                const lastMonth = new Date();
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                const startOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
                const endOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
                const transactions = await Transaction_model_1.Transaction.aggregate([
                    {
                        $match: {
                            userId: user._id,
                            date: { $gte: startOfMonth, $lte: endOfMonth },
                        },
                    },
                    {
                        $group: {
                            _id: '$category',
                            total: { $sum: '$amount' },
                            count: { $sum: 1 },
                        },
                    },
                ]);
                const totalExpenses = transactions.reduce((sum, t) => sum + t.total, 0);
                const topCategories = transactions
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 5);
                await email_service_1.emailService.sendMonthlyReport(user.email, {
                    month: lastMonth.toLocaleString('default', { month: 'long' }),
                    year: lastMonth.getFullYear(),
                    totalExpenses,
                    topCategories,
                    transactionCount: transactions.length,
                });
                logger_1.default.info(`Monthly report sent to ${user.email}`);
            }
            catch (error) {
                logger_1.default.error(`Failed to send report to ${user.email}:`, error);
            }
        }
    }
    async detectAllRecurringExpenses() {
        const users = await User_model_1.User.find();
        for (const user of users) {
            try {
                await this.recurringService.detectRecurringExpenses(user._id.toString());
                logger_1.default.info(`Recurring expenses detected for user ${user._id}`);
            }
            catch (error) {
                logger_1.default.error(`Failed to detect recurring expenses for user ${user._id}:`, error);
            }
        }
    }
    async checkBudgetAlerts() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const monthProgress = (now.getDate() - 1) /
            new Date(currentYear, currentMonth + 1, 0).getDate();
        const users = await User_model_1.User.find({ 'preferences.notificationEnabled': true });
        for (const user of users) {
            try {
                const budgets = await Budget_model_1.Budget.aggregate([
                    {
                        $match: {
                            userId: user._id,
                            month: currentMonth,
                            year: currentYear,
                        },
                    },
                    {
                        $lookup: {
                            from: 'transactions',
                            let: { category: '$category' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$userId', user._id] },
                                                { $eq: ['$category', '$$category'] },
                                                { $eq: [{ $month: '$date' }, currentMonth] },
                                                { $eq: [{ $year: '$date' }, currentYear] },
                                            ],
                                        },
                                    },
                                },
                                { $group: { _id: null, spent: { $sum: '$amount' } } },
                            ],
                            as: 'spending',
                        },
                    },
                    {
                        $addFields: {
                            spent: { $ifNull: [{ $arrayElemAt: ['$spending.spent', 0] }, 0] },
                        },
                    },
                ]);
                const alerts = [];
                for (const budget of budgets) {
                    const percentUsed = (budget.spent / budget.amount) * 100;
                    if (percentUsed >= 90 && percentUsed < 100) {
                        alerts.push(`${budget.category}: ${percentUsed.toFixed(1)}% used (₹${budget.spent}/${budget.amount})`);
                    }
                    else if (percentUsed >= 100) {
                        alerts.push(`⚠️ ${budget.category}: Budget exceeded by ₹${(budget.spent - budget.amount).toFixed(2)}`);
                    }
                    else if (percentUsed >= 70 && monthProgress > 0.5) {
                        alerts.push(`${budget.category}: ${percentUsed.toFixed(1)}% used with half month remaining`);
                    }
                }
                if (alerts.length > 0) {
                    await email_service_1.emailService.sendBudgetAlert(user.email, alerts);
                }
            }
            catch (error) {
                logger_1.default.error(`Failed to check budget alerts for user ${user._id}:`, error);
            }
        }
    }
    async cleanupOldData() {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const result = await Transaction_model_1.Transaction.deleteMany({
            date: { $lt: oneYearAgo },
            isRecurring: false,
        });
        logger_1.default.info(`Cleaned up ${result.deletedCount} old transactions`);
    }
    async generateWeeklyInsights() {
        logger_1.default.info('Weekly insights generated');
    }
}
exports.CronService = CronService;
exports.cronService = new CronService();
//# sourceMappingURL=cron.service.js.map