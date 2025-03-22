import sendLowCoinAlertNotifications from './src/cron/sendLowCoinAlertNotifications.js';
import { sendOneSignalNotification } from "./src/utils/onesignal.js";

(async () => {
    await sendOneSignalNotification(
        'paldishant101@gmail.com',
        "This is a test notification",
        'This is content',
        "https://meetmingle.onelink.me/subscription"
    );
    process.exit(1)
})()