"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.monthlyReportJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const User_model_1 = require("../models/User.model");
const Transaction_model_1 = require("../models/Transaction.model");
const email_service_1 = require("../services/email.service");
const logger_1 = __importDefault(require("../utils/logger"));
exports.monthlyReportJob = node_cron_1.default.schedule('0 9 1 * *', async () => {
    logger_1.default.info('Starting monthly report generation job');
    try {
        const users = await User_model_1.User.find({ 'preferences.notificationEnabled': true });
        for (const user of users) {
            try {
                const lastMonth = new Date();
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                const startOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
                const endOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
                const transactions = await Transaction_model_1.Transaction.find({
                    userId: user._id,
                    date: { $gte: startOfMonth, $lte: endOfMonth },
                });
                const totalIncome = transactions
                    .filter(t => t.type === 'credit')
                    .reduce((sum, t) => sum + t.amount, 0);
                const totalExpenses = transactions
                    .filter(t => t.type === 'debit')
                    .reduce((sum, t) => sum + t.amount, 0);
                const categoryBreakdown = await Transaction_model_1.Transaction.aggregate([
                    { $match: { userId: user._id, date: { $gte: startOfMonth, $lte: endOfMonth }, type: 'debit' } },
                    { $group: { _id: '$category', total: { $sum: '$amount' } } },
                    { $sort: { total: -1 } },
                    { $limit: 5 },
                ]);
                await email_service_1.emailService.sendMonthlyReport(user.email, {
                    month: lastMonth.toLocaleString('default', { month: 'long' }),
                    year: lastMonth.getFullYear(),
                    totalIncome,
                    totalExpenses,
                    savings: totalIncome - totalExpenses,
                    topCategories: categoryBreakdown,
                    transactionCount: transactions.length,
                });
                logger_1.default.info(`Monthly report sent to ${user.email}`);
            }
            catch (error) {
                logger_1.default.error(`Failed to send report to ${user.email}:`, error);
            }
        }
        logger_1.default.info('Monthly report generation completed');
    }
    catch (error) {
        logger_1.default.error('Monthly report job failed:', error);
    }
});
//# sourceMappingURL=monthlyReport.job.js.map