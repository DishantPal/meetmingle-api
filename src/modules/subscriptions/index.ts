import { CustomHono } from "@/types/app.js"
import { createSuccessRouteDefinition, defaultResponses, sendSuccess } from "@/utils/response.js"
import { createRoute } from "@hono/zod-openapi"
import { z } from "zod"
import { getActivePlansWithFeatures } from "./subscription.service.js"
import { CustomHonoAppFactory } from "@/utils/customHonoAppFactory.js"
import { isAuthenticated } from "@/middlewares/authenticated.js"

const app = CustomHonoAppFactory()
export { app as subscriptionRoutes }

const moduleTag = 'subscription'

// List Plans

const planFeatureSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  feature_value: z.string().nullable(),
  is_active: z.boolean()
}).openapi({
  example: {
    id: 1,
    code: "UNLIMITED_MATCHES",
    name: "Unlimited Audio & Video matches",
    description: "Unlimited access to audio and video matching",
    icon: "/assets/icons/unlimited-matches.svg",
    feature_value: null,
    is_active: true
  }
})

const subscriptionPlanSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  duration_days: z.number(),
  price: z.number(),
  icon: z.string().nullable(),
  is_active: z.boolean(),
  store_product_id_ios: z.string().nullable(),
  store_product_id_android: z.string().nullable(),
  features: z.array(planFeatureSchema)
}).openapi({
  example: {
    id: 1,
    code: "PREMIUM",
    name: "Premium Plan",
    description: "Access all premium features",
    duration_days: 30,
    price: 9.99,
    icon: "https://storage.app.com/assets/icons/premium.svg",
    is_active: true,
    store_product_id_ios: "com.app.premium.monthly",
    store_product_id_android: "premium_monthly_subscription",
    features: [
      {
        id: 1,
        code: "UNLIMITED_MATCHES",
        name: "Unlimited Audio & Video matches",
        description: "Unlimited access to audio and video matching",
        icon: "https://storage.app.com/assets/icons/unlimited-matches.svg",
        feature_value: null,
        is_active: true
      }
    ]
  }
})

const listPlansRoute = createRoute({
  method: 'get',
  path: '/list',
  tags: [moduleTag],
  security: [{ bearerAuth: [] }],
  middleware: [isAuthenticated] as const,
  responses: {
    200: createSuccessRouteDefinition(
      z.array(subscriptionPlanSchema),
      'List of available subscription plans'
    ),
    ...defaultResponses
  }
})

app.openapi(listPlansRoute, async (c) => {
  const plans = await getActivePlansWithFeatures()
  return sendSuccess(c, plans, 'Subscription plans retrieved successfully')
})

// Status

// TODO: Add status route schemas and handler

// Create Subscription 

// TODO: Add create subscription route schemas and handler

// Google Webhook

// TODO: Add Google webhook route schemas and handler

// Apple Webhook

// TODO: Add Apple webhook route schemas and handler