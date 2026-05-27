import cron from 'node-cron';
import Task from '../models/Task.js';
import { sendReminderEmail } from '../services/emailService.js';

/**
 * Initializes the automated email reminder background cron worker.
 * Scans every 1 minute for tasks that are expiring within the next 2 hours.
 */
export const initReminderWorker = () => {
  console.log('[Worker] Initializing Email Reminder Background Worker...');

  // Run every minute
  cron.schedule('*/1 * * * *', async () => {
    try {
      const now = new Date();
      // Calculate exactly 2 hours from now
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      // Find tasks that expire between now and 2 hours from now, are not completed, and reminder hasn't been sent
      const upcomingTasks = await Task.find({
        deadline: { $gte: now, $lte: twoHoursLater },
        status: { $ne: 'Completed' },
        emailSent: false,
      }).populate('user');

      if (upcomingTasks.length > 0) {
        console.log(`[Worker] Found ${upcomingTasks.length} upcoming task deadlines approaching within 2 hours!`);

        for (const task of upcomingTasks) {
          // If task doesn't have a valid user, skip
          if (!task.user || !task.user.email) {
            console.warn(`[Worker Warning] Task "${task.title}" has no linked user or email. Marking as sent to avoid infinite retries.`);
            task.emailSent = true;
            await task.save();
            continue;
          }

          console.log(`[Worker] Dispatching reminder email to ${task.user.email} for task: "${task.title}"`);
          
          const emailResult = await sendReminderEmail({
            to: task.user.email,
            username: task.user.username,
            taskTitle: task.title,
            deadline: task.deadline,
          });

          if (emailResult.success) {
            task.emailSent = true;
            await task.save();
            console.log(`[Worker] Marked task "${task.title}" reminder as sent in database.`);
          } else {
            console.error(`[Worker Error] Failed to send reminder to ${task.user.email} for task "${task.title}": ${emailResult.error}`);
            // We do not mark emailSent as true here so the system can retry in the next run.
          }
        }
      }
    } catch (error) {
      console.error(`[Worker Exception Error] Cron reminder scan failed: ${error.message}`);
    }
  });

  console.log('[Worker] Background Cron Scheduled: Runs every minute.');
};

export default initReminderWorker;
