import { config } from "@/config/index.js";

// Time constants (in seconds)
export const MINUTE = 60;
export const HOUR = 3600;
export const DAY = 86400;

// API configuration
const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1/notifications';

export const sendOneSignalNotification = async (
    recipients: string | string[],
    title: string,
    content: string,
    url: string,
    delay: number = 0
): Promise<any> => {
    try {
        const externalIds = Array.isArray(recipients) ? recipients : [recipients];

        const payload: Record<string, any> = {
            app_id: config.onesignal.APP_ID,
            headings: { en: title },
            contents: { en: content },
            include_aliases: { "external_id": externalIds },
            target_channel: "push",
        };

        if (delay > 0) {
            const deliveryTime = new Date(Date.now() + (delay * 1000));
            payload.send_after = deliveryTime.toISOString();
        }

        const response = await fetch(ONESIGNAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${config.onesignal.REST_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`OneSignal API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('OneSignal notification error:', error);
        throw error;
    }
};