import cron from 'node-cron';
import { RecurringService } from '../services/recurring.service';
import { User } from '../models/User.model';
import logger from '../utils/logger';

export const recurringDetectionJob = cron.schedule('0 2 * * 0', async () => {
  logger.info('Starting recurring expense detection job');
  
  try {
    const recurringService = new RecurringService();
    const users = await User.find();
    
    for (const user of users) {
      try {
        await recurringService.detectRecurringExpenses(user._id.toString());
        logger.info(`Recurring expenses detected for user ${user._id}`);
      } catch (error) {
        logger.error(`Failed to detect recurring expenses for user ${user._id}:`, error);
      }
    }
    
    logger.info('Recurring expense detection completed');
  } catch (error) {
    logger.error('Recurring detection job failed:', error);
  }
});