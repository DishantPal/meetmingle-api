import { db } from "@/database/database.js"
import { Selectable, sql } from "kysely"
import { SubscriptionPlanFeatures, SubscriptionPlans, UserSubscriptions } from "@/database/db.js"
import { jsonObjectFrom } from "kysely/helpers/mysql"

type PlanWithFeatures = Selectable<SubscriptionPlans & { features: Selectable<SubscriptionPlanFeatures>[] }>

export const getActivePlansWithFeatures = async (): Promise<PlanWithFeatures[]> => {
    // Get all active plans
    const plans = await db
        .selectFrom("subscription_plans")
        .selectAll()
        .where("is_active", "=", 1)
        .execute()

    // Get all active features for all plans in one query
    const features = await db
        .selectFrom("subscription_plan_features")
        .selectAll()
        .where("is_active", "=", 1)
        .where("plan_id", "in", plans.map(plan => plan.id))
        .execute()

    // Map features to their respective plans
    const plansWithFeatures = plans.map(plan => ({
        ...plan,
        features: features.filter(feature => feature.plan_id === plan.id)
    }))

    return plansWithFeatures
}

export const getUserActiveSubscription = async (userId: number): Promise<Selectable<UserSubscriptions> | undefined> => {
    return await db
        .selectFrom("user_subscriptions")
        .selectAll()
        .where("user_id", "=", userId)
        .where("status", "=", "active")
        .where((eb) => eb.or([
            eb("start_date", "is", null),
            eb("start_date", "<=", () => sql`now()`)
        ]))
        .where((eb) => eb.or([
            eb("end_date", "is", null),
            eb("end_date", ">", () => sql`now()`)
        ]))
        .orderBy("created_at", "desc")
        .executeTakeFirst();
}

export const getSubscriptionPlan = async (plan_code: string): Promise<Selectable<SubscriptionPlans> | undefined> => {
    return await db
        .selectFrom("subscription_plans")
        .selectAll()
        .where("code", "=", plan_code)
        .executeTakeFirst()
}

interface CreateSubscriptionParams {
    userId: number
    plan_code: string
    purchaseToken: string
}

export const createUserSubscription = async (params: CreateSubscriptionParams): Promise<Selectable<UserSubscriptions>> => {
    const { userId, plan_code, purchaseToken } = params

    // Get plan details for duration
    const plan = await getSubscriptionPlan(plan_code)
    if (!plan) throw new Error('Plan not found')

    let startDate = null;
    let endDate = null;

    if (plan.duration_days > 0) {
        startDate = new Date()
        startDate.setDate(startDate.getDate())

        endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + plan.duration_days)
    }

    const subscription = await db
        .insertInto('user_subscriptions')
        .values({
            user_id: userId,
            plan_id: plan.id,
            status: 'active',
            start_date: startDate,
            end_date: endDate,
            auto_renewal: 1,
            payment_provider: 'google',
            payment_provider_subscription_id: purchaseToken
        })
        .execute()

    // For MySQL, we need to get the inserted record
    const insertedSubscription = await db
        .selectFrom('user_subscriptions')
        .selectAll()
        .where('user_id', '=', userId)
        .where('plan_id', '=', plan.id)
        .where('payment_provider_subscription_id', '=', purchaseToken)
        .orderBy('created_at', 'desc')
        .executeTakeFirst()

    if (!insertedSubscription) {
        throw new Error('Failed to create subscription')
    }

    return insertedSubscription
}

export const getUserActiveSubscriptionWithPlan = async (userId: number) => {
    return await db
        .selectFrom("user_subscriptions")
        .selectAll()
        .select((eb) => [
            jsonObjectFrom(
                eb.selectFrom('subscription_plans')
                    .select([
                        "name",
                        "description",
                        "code",
                        "duration_days",
                        "price",
                        "icon"
                    ])
                    .whereRef('subscription_plans.id', '=', 'user_subscriptions.plan_id')
            ).as('plan')
        ])
        .where("status", "=", "active")
        .where("user_id", "=", userId)
        .where((eb) => eb.or([
            eb("start_date", "is", null),
            eb("start_date", "<=", () => sql`now()`)
        ]))
        .where((eb) => eb.or([
            eb("end_date", "is", null),
            eb("end_date", ">", () => sql`now()`)
        ]))
        .orderBy("created_at", "desc")
        .executeTakeFirst();
}