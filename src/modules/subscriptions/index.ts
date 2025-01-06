import { CustomHono } from "@/types/app.js"
import { AppError, createJsonBody, createSuccessRouteDefinition, defaultResponses, ERROR_CODES, sendSuccess } from "@/utils/response.js"
import { createRoute } from "@hono/zod-openapi"
import { z } from "zod"
import { createUserSubscription, getActivePlansWithFeatures, getSubscriptionPlan, getUserActiveSubscription, getUserActiveSubscriptionWithPlan } from "./subscription.service.js"
import { CustomHonoAppFactory } from "@/utils/customHonoAppFactory.js"
import { isAuthenticated } from "@/middlewares/authenticated.js"
import { StatusCodes } from "http-status-codes"
import { verifyGooglePurchase } from "./purchaseVerify.service.js"

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
    features: z.array(planFeatureSchema),
    user_status: z.enum(['active', 'inactive'])
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
        ],
        user_status: "active",
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
    const plans = await getActivePlansWithFeatures();
    const userId = c.get('user').id

    const activeUserSubscriptionPlan = await getUserActiveSubscriptionWithPlan(userId)

    const plansWithUserStatus = plans.map(plan => ({
        ...plan,
        user_status: activeUserSubscriptionPlan?.plan?.code === plan.code ? 'active' : 'inactive'
    }))

    return sendSuccess(c, plansWithUserStatus, 'Subscription plans retrieved successfully')
})

// Status

// Status
const subscriptionStatusResponseSchema = z.object({
    has_active_subscription: z.boolean(),
    subscription: z.object({
      id: z.number(),
      plan_id: z.number(),
      status: z.string(),
      start_date: z.string(),
      end_date: z.string(),
      auto_renewal: z.boolean(),
      plan: z.object({
        code: z.string(),
        name: z.string(),
        description: z.string().nullable(),
        duration_days: z.number(),
        price: z.number(),
        icon: z.string().nullable()
      })
    }).nullable()
  }).openapi({
    example: {
      has_active_subscription: true,
      subscription: {
        id: 1,
        plan_id: 2,
        status: 'active',
        start_date: '2024-03-13T00:00:00Z',
        end_date: '2024-04-12T00:00:00Z',
        auto_renewal: true,
        plan: {
          code: 'PREMIUM',
          name: 'Premium Plan',
          description: 'Access all premium features',
          duration_days: 30,
          price: 9.99,
          icon: '/assets/icons/premium.svg'
        }
      }
    }
  })
  
  const getStatusRoute = createRoute({
    method: 'get',
    path: '/status',
    tags: [moduleTag],
    security: [{ bearerAuth: [] }],
    middleware: [isAuthenticated] as const,
    responses: {
      200: createSuccessRouteDefinition(subscriptionStatusResponseSchema, 'User subscription status'),
      ...defaultResponses
    }
  })
  
  app.openapi(getStatusRoute, async (c) => {
    const userId = c.get('user').id
    const subscriptionStatus = await getUserActiveSubscriptionWithPlan(userId)

    if(!subscriptionStatus) throw new AppError(StatusCodes.NOT_FOUND, ERROR_CODES.NOT_FOUND, 'Subscription status not found')

    return sendSuccess(c, subscriptionStatus, 'Subscription status retrieved successfully')
  })

// Create Subscription
const createSubscriptionSchema = z.object({
    plan_code: z.string(),
    purchase_token: z.string()
}).openapi({
    example: {
        plan_code: 'FREE',
        purchase_token: "google_purchase_token_here"
    }
})

const createSubscriptionResponseSchema = z.object({
    subscription_id: z.number(),
    plan_code: z.string(),
    status: z.string(),
    start_date: z.string(),
    end_date: z.string()
}).openapi({
    example: {
        subscription_id: 1,
        plan_code: "FREE",
        status: 'active',
        start_date: '2024-03-13T00:00:00Z',
        end_date: '2024-04-12T00:00:00Z'
    }
})

const createSubscriptionRoute = createRoute({
    method: 'post',
    path: '/',
    tags: [moduleTag],
    security: [{ bearerAuth: [] }],
    middleware: [isAuthenticated] as const,
    request: {
        body: createJsonBody(createSubscriptionSchema)
    },
    responses: {
        200: createSuccessRouteDefinition(createSubscriptionResponseSchema, 'Subscription created successfully'),
        ...defaultResponses
    }
})

app.openapi(createSubscriptionRoute, async (c) => {
    const { plan_code, purchase_token } = c.req.valid('json')
    const userId = c.get('user').id

    // Check if user already has active subscription
    const activeSubscription = await getUserActiveSubscription(userId)
    if (activeSubscription) {
        throw new AppError(
            StatusCodes.CONFLICT,
            ERROR_CODES.DUPLICATE_RESOURCE,
            'User already has an active subscription'
        )
    }

    // 1. Check if plan exists and is active
    const plan = await getSubscriptionPlan(plan_code)
    if (!plan || !plan.is_active) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            'Subscription plan not found or inactive'
        )
    }

    // 2. Verify purchase with Google Play
    const isValid = await verifyGooglePurchase(purchase_token)
    if (!isValid) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            ERROR_CODES.INVALID_PURCHASE,
            'Invalid purchase token'
        )
    }

    // 3. Create subscription
    const subscription = await createUserSubscription({
        userId,
        plan_code,
        purchaseToken: purchase_token
    })

    return sendSuccess(c, subscription, 'Subscription created successfully')
})

// Google Webhook

// TODO: Add Google webhook route schemas and handler

// Apple Webhook

// TODO: Add Apple webhook route schemas and handler