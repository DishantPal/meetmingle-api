import { db } from "@/database/database.js";
import { sendOneSignalNotification } from "@/utils/onesignal.js";
import { PUSH_NOTIFICATION_TEMPLATES } from "@/config/pushNotificationTemplates.js";

export async function sendSubscriptionRenewalNotifications(): Promise<void> {
    try {
        // Find users with subscriptions ending in 3 days
        const renewingUsers = await db
            .selectFrom("user_subscriptions")
            .innerJoin("users", "users.id", "user_subscriptions.user_id")
            .innerJoin("subscription_plans", "subscription_plans.id", "user_subscriptions.plan_id")
            .select([
                "users.email",
                "subscription_plans.name as plan_name"
            ])
            .where("user_subscriptions.status", "=", "active")
            .where("user_subscriptions.auto_renewal", "=", 1)
            .where("user_subscriptions.end_date", "<=", db.fn.addDays(3, db.fn.now()))
            .where("users.deleted_at", "is", null)
            .execute();

        // Exit if no users found
        if (!renewingUsers.length) {
            console.log('No subscriptions renewing in the next 3 days');
            return;
        }

        // Get notification template
        const template = PUSH_NOTIFICATION_TEMPLATES.subscription_renewal;

        // Process in batches of 100
        const batchSize = 100;
        for (let i = 0; i < renewingUsers.length; i += batchSize) {
            const batch = renewingUsers.slice(i, i + batchSize);

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
            if (i + batchSize < renewingUsers.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`Sent subscription renewal notifications to ${renewingUsers.length} users`);
    } catch (error) {
        console.error('Error sending subscription renewal notifications:', error);
    }
}

export default sendSubscriptionRenewalNotifications;