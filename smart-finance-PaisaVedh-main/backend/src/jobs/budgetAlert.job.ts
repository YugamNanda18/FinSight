import cron from 'node-cron';
import { User } from '../models/User.model';
import { Budget } from '../models/Budget.model';
import { Transaction } from '../models/Transaction.model';
import { emailService } from '../services/email.service';
import logger from '../utils/logger';

export const budgetAlertJob = cron.schedule('0 9 * * *', async () => {
  logger.info('Starting budget alert check job');
  
  try {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthProgress = (new Date().getDate() - 1) / 
      (new Date(currentYear, currentMonth + 1, 0).getDate());
    
    const users = await User.find({ 'preferences.notificationEnabled': true });
    
    for (const user of users) {
      try {
        const budgets = await Budget.aggregate([
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
              }},
              { $group: { _id: null, spent: { $sum: '$amount' } } },
            ],
            as: 'spending',
          }},
          { $addFields: {
            spent: { $ifNull: [{ $arrayElemAt: ['$spending.spent', 0] }, 0] },
            percentage: {
              $multiply: [
                { $divide: [{ $ifNull: [{ $arrayElemAt: ['$spending.spent', 0] }, 0] }, '$amount'] },
                100,
              ],
            },
          }},
        ]);
        
        const alerts = [];
        for (const budget of budgets) {
          if (budget.percentage >= 90 && budget.percentage < 100) {
            alerts.push(`${budget.category}: ${budget.percentage.toFixed(1)}% used`);
          } else if (budget.percentage >= 100) {
            alerts.push(`⚠️ ${budget.category}: Exceeded by ₹${(budget.spent - budget.amount).toFixed(2)}`);
          } else if (budget.percentage >= 70 && monthProgress > 0.5) {
            alerts.push(`${budget.category}: ${budget.percentage.toFixed(1)}% used - halfway through month`);
          }
        }
        
        if (alerts.length > 0) {
          await emailService.sendBudgetAlert(user.email, alerts);
          logger.info(`Budget alerts sent to ${user.email}`);
        }
      } catch (error) {
        logger.error(`Failed to send budget alerts to ${user.email}:`, error);
      }
    }
    
    logger.info('Budget alert check completed');
  } catch (error) {
    logger.error('Budget alert job failed:', error);
  }
});