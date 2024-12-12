import type { Kysely } from 'kysely'

interface Reward {
  title: string
  description: string
  code: string
  coins: number
  icon: string
  link?: string
  reward_type: 'one_time' | 'multiple' | 'daily'
  is_active: boolean
  updated_at: Date
}

export async function seed(db: Kysely<any>): Promise<void> {
  try {
    const rewards: Reward[] = [
      // Daily rewards
      {
        title: 'Daily Login Bonus',
        description: 'Login daily to earn coins',
        code: 'DAILY_LOGIN',
        coins: 50,
        icon: 'https://storage.app.com/rewards/daily-login.png',
        reward_type: 'daily',
        is_active: true,
        updated_at: new Date()
      },
      {
        title: 'Daily App Usage',
        description: 'Use app for at least 30 minutes',
        code: 'DAILY_APP_USAGE',
        coins: 100,
        icon: 'https://storage.app.com/rewards/daily-usage.png',
        reward_type: 'daily',
        is_active: true,
        updated_at: new Date()
      },
      // One-time rewards
      {
        title: 'Welcome Bonus',
        description: 'Welcome to our platform!',
        code: 'WELCOME_BONUS',
        coins: 500,
        icon: 'https://storage.app.com/rewards/welcome.png',
        reward_type: 'one_time',
        is_active: true,
        updated_at: new Date()
      },
      {
        title: 'Complete Profile',
        description: 'Complete your profile to earn coins',
        code: 'PROFILE_COMPLETE',
        coins: 200,
        icon: 'https://storage.app.com/rewards/profile.png',
        reward_type: 'one_time',
        is_active: true,
        updated_at: new Date()
      },
      {
        title: 'Profile Verification',
        description: 'Get verified to earn coins',
        code: 'PROFILE_VERIFIED',
        coins: 1000,
        icon: 'https://storage.app.com/rewards/verified.png',
        reward_type: 'one_time',
        is_active: true,
        updated_at: new Date()
      },
      {
        title: 'Rate on Play Store',
        description: 'Rate us on Play Store',
        code: 'PLAYSTORE_RATE',
        coins: 300,
        icon: 'https://storage.app.com/rewards/playstore.png',
        link: 'https://play.google.com/store/apps/details?id=com.app',
        reward_type: 'one_time',
        is_active: true,
        updated_at: new Date()
      },
      // Multiple rewards
      {
        title: 'Watch Ad',
        description: 'Watch an advertisement',
        code: 'WATCH_AD',
        coins: 25,
        icon: 'https://storage.app.com/rewards/ad.png',
        reward_type: 'multiple',
        is_active: true,
        updated_at: new Date()
      },
      {
        title: 'Successful Match',
        description: 'Successfully match with another user',
        code: 'SUCCESSFUL_MATCH',
        coins: 50,
        icon: 'https://storage.app.com/rewards/match.png',
        reward_type: 'multiple',
        is_active: true,
        updated_at: new Date()
      }
    ]

    await db
      .insertInto('rewards')
      .values(rewards)
      .execute()

    console.log('Successfully seeded rewards')
  } catch (error) {
    console.error('Error seeding rewards:', error)
    throw error
  }
}