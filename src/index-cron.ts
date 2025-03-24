import { CronJob } from 'cron';
import sendLowCoinAlertNotifications from './cronFunctions/sendLowCoinAlertNotifications.js';
import sendSubscriptionRenewalNotifications from './cronFunctions/sendSubscriptionRenewalNotifications.js';
import sendDailyCoinCollectionNotifications from './cronFunctions/sendDailyCoinCollectionNotifications.js';

// Low coin alert - Run daily at 10:00 AM
CronJob.from({
    cronTime: '0 10 * * *',
    onTick: async () => {
        console.log('Running low coin alert notifications');
        try {
            await sendLowCoinAlertNotifications();
        } catch (error) {
            console.error('Error in low coin alert notifications:', error);
        }
    },
    start: true,
    timeZone: 'Asia/Kolkata'
});

// Subscription renewal - Run daily at 11:00 AM
CronJob.from({
    cronTime: '0 11 * * *',
    onTick: async () => {
        console.log('Running subscription renewal notifications');
        try {
            await sendSubscriptionRenewalNotifications();
        } catch (error) {
            console.error('Error in subscription renewal notifications:', error);
        }
    },
    start: true,
    timeZone: 'Asia/Kolkata'
});

// Daily coin collection - Run daily at 9:00 AM
CronJob.from({
    cronTime: '0 9 * * *',
    onTick: async () => {
        console.log('Running daily coin collection notifications');
        try {
            await sendDailyCoinCollectionNotifications();
        } catch (error) {
            console.error('Error in daily coin collection notifications:', error);
        }
    },
    start: true,
    timeZone: 'Asia/Kolkata'
});

console.log('Cron jobs scheduled successfully');