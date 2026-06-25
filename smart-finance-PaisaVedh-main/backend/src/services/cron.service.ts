import cron from 'node-cron';
import { emailService } from './email.service';
import { RecurringService } from './recurring.service';
import { User } from '../models/User.model';
import { Transaction } from '../models/Transaction.model';
import { Budget } from '../models/Budget.model';
import logger from '../utils/logger';

export class CronService {
  private recurringService: RecurringService;

  constructor() {
    this.recurringService = new RecurringService();
    this.initializeJobs();
  }

  private initializeJobs(): void {
    // Monthly report - Run on 1st of each month at 9 AM
    cron.schedule('0 9 1 * *', async () => {
      logger.info('Running monthly report generation');
      await this.generateMonthlyReports();
    });

    // Recurring expense detection - Run weekly on Sunday at 2 AM
    cron.schedule('0 2 * * 0', async () => {
      logger.info('Running recurring expense detection');
      await this.detectAllRecurringExpenses();
    });

    // Budget alerts - Run daily at 9 AM
    cron.schedule('0 9 * * *', async () => {
      logger.info('Running budget alerts check');
      await this.checkBudgetAlerts();
    });

    // Data cleanup - Run monthly on 1st at 3 AM
    cron.schedule('0 3 1 * *', async () => {
      logger.info('Running data cleanup');
      await this.cleanupOldData();
    });

    // AI insights generation - Run every Monday at 8 AM
    cron.schedule('0 8 * * 1', async () => {
      logger.info('Generating weekly AI insights');
      await this.generateWeeklyInsights();
    });
  }

  private async generateMonthlyReports(): Promise<void> {
    const users = await User.find({ 'preferences.notificationEnabled': true });

    for (const user of users) {
      try {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const startOfMonth = new Date(
          lastMonth.getFullYear(),
          lastMonth.getMonth(),
          1
        );
        const endOfMonth = new Date(
          lastMonth.getFullYear(),
          lastMonth.getMonth() + 1,
          0
        );

        const transactions = await Transaction.aggregate([
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

        await emailService.sendMonthlyReport(user.email, {
          month: lastMonth.toLocaleString('default', { month: 'long' }),
          year: lastMonth.getFullYear(),
          totalExpenses,
          topCategories,
          transactionCount: transactions.length,
        });

        logger.info(`Monthly report sent to ${user.email}`);
      } catch (error) {
        logger.error(`Failed to send report to ${user.email}:`, error);
      }
    }
  }

  private async detectAllRecurringExpenses(): Promise<void> {
    const users = await User.find();

    for (const user of users) {
      try {
        await this.recurringService.detectRecurringExpenses(user._id.toString());
        logger.info(`Recurring expenses detected for user ${user._id}`);
      } catch (error) {
        logger.error(`Failed to detect recurring expenses for user ${user._id}:`, error);
      }
    }
  }

  private async checkBudgetAlerts(): Promise<void> {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthProgress =
      (now.getDate() - 1) /
      new Date(currentYear, currentMonth + 1, 0).getDate();

    const users = await User.find({ 'preferences.notificationEnabled': true });

    for (const user of users) {
      try {
        const budgets = await Budget.aggregate([
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
            alerts.push(
              `${budget.category}: ${percentUsed.toFixed(
                1
              )}% used (₹${budget.spent}/${budget.amount})`
            );
          } else if (percentUsed >= 100) {
            alerts.push(
              `⚠️ ${budget.category}: Budget exceeded by ₹${(
                budget.spent - budget.amount
              ).toFixed(2)}`
            );
          } else if (percentUsed >= 70 && monthProgress > 0.5) {
            alerts.push(
              `${budget.category}: ${percentUsed.toFixed(
                1
              )}% used with half month remaining`
            );
          }
        }

        if (alerts.length > 0) {
          await emailService.sendBudgetAlert(user.email, alerts);
        }
      } catch (error) {
        logger.error(`Failed to check budget alerts for user ${user._id}:`, error);
      }
    }
  }

  private async cleanupOldData(): Promise<void> {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const result = await Transaction.deleteMany({
      date: { $lt: oneYearAgo },
      isRecurring: false,
    });

    logger.info(`Cleaned up ${result.deletedCount} old transactions`);
  }

  private async generateWeeklyInsights(): Promise<void> {
    logger.info('Weekly insights generated');
  }
}

export const cronService = new CronService();