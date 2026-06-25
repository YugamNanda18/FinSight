"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recurringDetectionJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const recurring_service_1 = require("../services/recurring.service");
const User_model_1 = require("../models/User.model");
const logger_1 = __importDefault(require("../utils/logger"));
exports.recurringDetectionJob = node_cron_1.default.schedule('0 2 * * 0', async () => {
    logger_1.default.info('Starting recurring expense detection job');
    try {
        const recurringService = new recurring_service_1.RecurringService();
        const users = await User_model_1.User.find();
        for (const user of users) {
            try {
                await recurringService.detectRecurringExpenses(user._id.toString());
                logger_1.default.info(`Recurring expenses detected for user ${user._id}`);
            }
            catch (error) {
                logger_1.default.error(`Failed to detect recurring expenses for user ${user._id}:`, error);
            }
        }
        logger_1.default.info('Recurring expense detection completed');
    }
    catch (error) {
        logger_1.default.error('Recurring detection job failed:', error);
    }
});
//# sourceMappingURL=recurringDetection.job.js.map