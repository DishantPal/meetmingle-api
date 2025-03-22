import { db } from "@/database/database.js";
import { sendOneSignalNotification } from "@/utils/onesignal.js";
import { PUSH_NOTIFICATION_TEMPLATES } from "@/config/pushNotificationTemplates.js";

export async function sendDailyCoinCollectionNotifications(): Promise<void> {
    try {
        // Get all active users
        const users = await db
            .selectFrom("users")
            .select(["id", "email"])
            .where("deleted_at", "is", null)
            .execute();

        // Exit if no users found
        if (!users.length) {
            console.log('No users found to send daily coin collection notifications');
            return;
        }

        console.log(`Found ${users.length} users for daily coin collection notification`);

        // Get notification template
        const template = PUSH_NOTIFICATION_TEMPLATES.daily_coin_collection;

        // Process in batches of 100
        const batchSize = 100;
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);

            // Get emails for this batch
            const userEmails = batch
                .map(user => user.email)
                .filter((email): email is string => email !== null);

            if (userEmails.length === 0) continue;

            // Send notification
            await sendOneSignalNotification(
                userEmails,
                template.title,
                template.content,
                template.url,
                template.delay
            );

            // Add delay between batches
            if (i + batchSize < users.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`Sent daily coin collection notifications to ${users.length} users`);
    } catch (error) {
        console.error('Error sending daily coin collection notifications:', error);
    }
}

export default sendDailyCoinCollectionNotifications;