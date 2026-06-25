import cron from 'node-cron';
import { User } from '../models/User.model';
import { Transaction } from '../models/Transaction.model';
import { emailService } from '../services/email.service';
import logger from '../utils/logger';

export const monthlyReportJob = cron.schedule('0 9 1 * *', async () => {
  logger.info('Starting monthly report generation job');
  
  try {
    const users = await User.find({ 'preferences.notificationEnabled': true });
    
    for (const user of users) {
      try {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        const startOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
        const endOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
        
        const transactions = await Transaction.find({
          userId: user._id,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        });
        
        const totalIncome = transactions
          .filter(t => t.type === 'credit')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpenses = transactions
          .filter(t => t.type === 'debit')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const categoryBreakdown = await Transaction.aggregate([
          { $match: { userId: user._id, date: { $gte: startOfMonth, $lte: endOfMonth }, type: 'debit' } },
          { $group: { _id: '$category', total: { $sum: '$amount' } } },
          { $sort: { total: -1 } },
          { $limit: 5 },
        ]);
        
        await emailService.sendMonthlyReport(user.email, {
          month: lastMonth.toLocaleString('default', { month: 'long' }),
          year: lastMonth.getFullYear(),
          totalIncome,
          totalExpenses,
          savings: totalIncome - totalExpenses,
          topCategories: categoryBreakdown,
          transactionCount: transactions.length,
        });
        
        logger.info(`Monthly report sent to ${user.email}`);
      } catch (error) {
        logger.error(`Failed to send report to ${user.email}:`, error);
      }
    }
    
    logger.info('Monthly report generation completed');
  } catch (error) {
    logger.error('Monthly report job failed:', error);
  }
});