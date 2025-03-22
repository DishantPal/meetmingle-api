import { db } from "@/database/database.js";
import { sendOneSignalNotification } from "@/utils/onesignal.js";
import { PUSH_NOTIFICATION_TEMPLATES } from "@/config/pushNotificationTemplates.js";
import { sql } from "kysely";

export async function sendLowCoinAlertNotifications(): Promise<void> {
    try {
        // Get threshold from app_settings table
        const thresholdSetting = await db
            .selectFrom("app_settings")
            .select("value")
            .where("key", "=", "low_coin_notification_threshold")
            .executeTakeFirst();

        // Use the threshold from settings or default to 20
        const threshold = thresholdSetting ? parseInt(thresholdSetting.value) : 20;

        // Get users with low balance
        const users = await db
            .with("RankedTransactions", (qb) =>
                qb.selectFrom("user_coin_transactions")
                    .select([
                        "user_id",
                        "running_balance",
                        sql<number>`ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC)`.as("rn")
                    ])
            )
            .selectFrom("RankedTransactions")
            .innerJoin("users", "users.id", "RankedTransactions.user_id")
            .select([
                "users.id as user_id",
                "users.email",
                "RankedTransactions.running_balance as current_balance"
            ])
            .where("RankedTransactions.rn", "=", 1)
            .where("RankedTransactions.running_balance", "<=", threshold)
            .where("users.deleted_at", "is", null)
            .execute();

        // Exit if no users found with low balance
        if (!users.length) {
            console.log('No users found with low coin balance');
            return;
        }

        console.log(`Found ${users.length} users with low coin balance (threshold: ${threshold})`);

        // Get notification template
        const template = PUSH_NOTIFICATION_TEMPLATES.low_coins_alert;

        // Process in batches of 100
        const batchSize = 100;
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            // Filter out null emails and convert to string array
            const userEmails = batch
                .map(user => user.email)
                .filter((email): email is string => email !== null);

            if (userEmails.length === 0) continue;

            await sendOneSignalNotification(
                userEmails,
                template.title,
                template.content,
                template.url,
                template.delay
            );

            if (i + batchSize < users.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`Sent low coin alert notifications to ${users.length} users`);
    } catch (error) {
        console.error('Error sending low coin alert notifications:', error);
    }
}

export default sendLowCoinAlertNotifications;