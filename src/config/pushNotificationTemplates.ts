const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;

export const PUSH_NOTIFICATION_TEMPLATES = {
    "welcome_message": {
        "title": "Welcome to [App Name]! 🎉",
        "content": "Ready to meet new people? Start your first video call now and get 50 free coins!",
        "delay": 5 * MINUTE,
        "url": "https://meetmingle.onelink.me",
    },
    "female_waiting": {
        "title": "[Female Name] misses you!",
        "content": "[Female Name] is waiting for you to continue your conversation. Reconnect now!",
        "delay": 15 * MINUTE,
        "url": "https://meetmingle.onelink.me"
    },
    // Sent from cron
    "low_coins_alert": {
        "title": "Low Coin Alert!",
        "content": "You only have 20 coins left! Complete tasks to earn more.",
        "delay": 0,
        "url": "https://meetmingle.onelink.me/transaction"
    },
    // Sent from cron
    "subscription_renewal": {
        "title": "Your [Plan Name] Subscription is Renewing Soon",
        "content": "Your subscription will renew in 3 days. Enjoy uninterrupted access to premium features!",
        "delay": 0,
        "url": "https://meetmingle.onelink.me/subscription"
    },
    // Sent from cron
    "daily_coin_collection": {
        "title": "Free Coins Available! ✨",
        "content": "Your daily reward is ready! Join a free call today and collect 20 bonus coins.",
        "delay": 0,
        "url": "https://meetmingle.onelink.me/earn"
    }
}