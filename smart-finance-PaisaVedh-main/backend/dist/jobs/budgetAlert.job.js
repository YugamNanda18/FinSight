"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetAlertJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const User_model_1 = require("../models/User.model");
const Budget_model_1 = require("../models/Budget.model");
const email_service_1 = require("../services/email.service");
const logger_1 = __importDefault(require("../utils/logger"));
exports.budgetAlertJob = node_cron_1.default.schedule('0 9 * * *', async () => {
    logger_1.default.info('Starting budget alert check job');
    try {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthProgress = (new Date().getDate() - 1) /
            (new Date(currentYear, currentMonth + 1, 0).getDate());
        const users = await User_model_1.User.find({ 'preferences.notificationEnabled': true });
        for (const user of users) {
            try {
                const budgets = await Budget_model_1.Budget.aggregate([
                    { $match: { userId: user._id, month: currentMonth, year: currentYear } },
                    { $lookup: {
                            from: 'transactions',
                            let: { category: '$category' },
                            pipeline: [
                                { $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$userId', user._id] },
                                                { $eq: ['$category', '$$category'] },
                                                { $eq: [{ $month: '$date' }, currentMonth] },
                                                { $eq: [{ $year: '$date' }, currentYear] },
                                            ],
                                        },
                                    } },
                                { $group: { _id: null, spent: { $sum: '$amount' } } },
                            ],
                            as: 'spending',
                        } },
                    { $addFields: {
                            spent: { $ifNull: [{ $arrayElemAt: ['$spending.spent', 0] }, 0] },
                            percentage: {
                                $multiply: [
                                    { $divide: [{ $ifNull: [{ $arrayElemAt: ['$spending.spent', 0] }, 0] }, '$amount'] },
                                    100,
                                ],
                            },
                        } },
                ]);
                const alerts = [];
                for (const budget of budgets) {
                    if (budget.percentage >= 90 && budget.percentage < 100) {
                        alerts.push(`${budget.category}: ${budget.percentage.toFixed(1)}% used`);
                    }
                    else if (budget.percentage >= 100) {
                        alerts.push(`⚠️ ${budget.category}: Exceeded by ₹${(budget.spent - budget.amount).toFixed(2)}`);
                    }
                    else if (budget.percentage >= 70 && monthProgress > 0.5) {
                        alerts.push(`${budget.category}: ${budget.percentage.toFixed(1)}% used - halfway through month`);
                    }
                }
                if (alerts.length > 0) {
                    await email_service_1.emailService.sendBudgetAlert(user.email, alerts);
                    logger_1.default.info(`Budget alerts sent to ${user.email}`);
                }
            }
            catch (error) {
                logger_1.default.error(`Failed to send budget alerts to ${user.email}:`, error);
            }
        }
        logger_1.default.info('Budget alert check completed');
    }
    catch (error) {
        logger_1.default.error('Budget alert job failed:', error);
    }
});
//# sourceMappingURL=budgetAlert.job.js.map