import { db } from "@/database/database.js"
import { Selectable } from "kysely"
import { SubscriptionPlanFeatures, SubscriptionPlans } from "@/database/db.js"

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