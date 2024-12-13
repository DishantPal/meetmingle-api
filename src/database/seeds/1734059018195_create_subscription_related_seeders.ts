import { Kysely } from 'kysely'

interface SubscriptionPlan {
  code: string
  name: string
  description: string
  duration_days: number
  price: number
  icon: string | null
  is_active: boolean
  store_product_id_ios: string | null
  store_product_id_android: string | null
}

interface PlanFeature {
  plan_id: bigint
  code: string
  name: string
  description: string
  icon: string | null
  feature_value: string | null
  is_active: boolean
}

export async function seed(db: Kysely<any>): Promise<void> {
  try {
    // Insert Subscription Plans
    const subscriptionPlans: SubscriptionPlan[] = [
      {
        code: 'FREE',
        name: 'Free Plan',
        description: 'Basic features for getting started',
        duration_days: 0, // Unlimited duration for free plan
        price: 0,
        icon: 'https://samplelib.com/lib/preview/png/sample-red-100x75.png',
        is_active: true,
        store_product_id_ios: null,
        store_product_id_android: null
      },
      {
        code: 'PREMIUM',
        name: 'Premium Plan',
        description: 'Access all premium features and unlimited matches',
        duration_days: 30, // 30 days subscription
        price: 9.99, // Example price
        icon: 'https://samplelib.com/lib/preview/png/sample-blue-100x75.png',
        is_active: true,
        store_product_id_ios: 'com.app.premium.monthly',
        store_product_id_android: 'premium_monthly_subscription'
      }
    ]

    // Insert plans
    await db
      .insertInto('subscription_plans')
      .values(subscriptionPlans)
      .execute()

    // Get plan IDs using separate queries
    const freePlan = await db
      .selectFrom('subscription_plans')
      .select(['id'])
      .where('code', '=', 'FREE')
      .executeTakeFirst()

    const premiumPlan = await db
      .selectFrom('subscription_plans')
      .select(['id'])
      .where('code', '=', 'PREMIUM')
      .executeTakeFirst()

    if (!freePlan || !premiumPlan) {
      throw new Error('Failed to retrieve plan IDs')
    }

    const freePlanId = freePlan.id
    const premiumPlanId = premiumPlan.id

    // Insert Plan Features
    const planFeatures: PlanFeature[] = [
      // Free Plan Features
      {
        plan_id: freePlanId,
        code: 'LIMITED_MATCHES',
        name: 'Limited Audio & Video matches',
        description: 'Access to basic audio and video matching with daily limits',
        icon: 'https://samplelib.com/lib/preview/png/sample-red-100x75.png',
        feature_value: null,
        is_active: true
      },
      {
        plan_id: freePlanId,
        code: 'BASIC_FILTERS',
        name: 'Basic filters',
        description: 'Access to basic matching filters',
        icon: 'https://samplelib.com/lib/preview/png/sample-red-100x75.png',
        feature_value: null,
        is_active: true
      },
      {
        plan_id: freePlanId,
        code: 'ADS_INCLUDED',
        name: 'Ads included',
        description: 'Service supported by advertisements',
        icon: 'https://samplelib.com/lib/preview/png/sample-red-100x75.png',
        feature_value: null,
        is_active: true
      },

      // Premium Plan Features
      {
        plan_id: premiumPlanId,
        code: 'UNLIMITED_MATCHES',
        name: 'Unlimited Audio & Video matches',
        description: 'Unlimited access to audio and video matching',
        icon: 'https://samplelib.com/lib/preview/png/sample-red-100x75.png',
        feature_value: null,
        is_active: true
      },
      {
        plan_id: premiumPlanId,
        code: 'STATE_FILTERS',
        name: 'Unlimited access to state filters',
        description: 'Filter matches by state location',
        icon: 'https://samplelib.com/lib/preview/png/sample-red-100x75.png',
        feature_value: null,
        is_active: true
      },
      {
        plan_id: premiumPlanId,
        code: 'AGE_FILTERS',
        name: 'Unlimited access to age filters',
        description: 'Filter matches by age range',
        icon: 'https://samplelib.com/lib/preview/png/sample-red-100x75.png',
        feature_value: null,
        is_active: true
      },
      {
        plan_id: premiumPlanId,
        code: 'LANGUAGE_FILTERS',
        name: 'Unlimited access to language filters',
        description: 'Filter matches by preferred languages',
        icon: 'https://samplelib.com/lib/preview/png/sample-red-100x75.png',
        feature_value: null,
        is_active: true
      },
      {
        plan_id: premiumPlanId,
        code: 'GENDER_FILTERS',
        name: 'Unlimited access to gender filters',
        description: 'Filter matches by gender preference',
        icon: 'https://samplelib.com/lib/preview/png/sample-red-100x75.png',
        feature_value: null,
        is_active: true
      },
      {
        plan_id: premiumPlanId,
        code: 'COUNTRY_FILTERS',
        name: 'Unlimited access to country filters',
        description: 'Filter matches by country',
        icon: 'https://samplelib.com/lib/preview/png/sample-red-100x75.png',
        feature_value: null,
        is_active: true
      },
      {
        plan_id: premiumPlanId,
        code: 'NO_ADS',
        name: 'No ads',
        description: 'Ad-free experience',
        icon: 'https://samplelib.com/lib/preview/png/sample-red-100x75.png',
        feature_value: null,
        is_active: true
      },
      {
        plan_id: premiumPlanId,
        code: 'VIP_BADGES',
        name: 'Exclusive VIP badges',
        description: 'Show off your premium status with exclusive badges',
        icon: 'https://samplelib.com/lib/preview/png/sample-red-100x75.png',
        feature_value: null,
        is_active: true
      },
      {
        plan_id: premiumPlanId,
        code: 'REAR_CAMERA',
        name: 'Rear Camera during Video Calls',
        description: 'Use rear camera during video calls',
        icon: 'https://samplelib.com/lib/preview/png/sample-red-100x75.png',
        feature_value: null,
        is_active: true
      }
    ]

    await db
      .insertInto('subscription_plan_features')
      .values(planFeatures)
      .execute()

    console.log('Successfully seeded subscription plans and features')
  } catch (error) {
    console.error('Error seeding subscription data:', error)
    throw error
  }
}