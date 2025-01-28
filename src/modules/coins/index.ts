import { CustomHono } from "@/types/app.js"
import { AppError, createJsonBody, createSuccessRouteDefinition, defaultResponses, ERROR_CODES, sendSuccess } from "@/utils/response.js"
import { createRoute } from "@hono/zod-openapi"
import { z } from "zod"
import { createCoinTransaction, createPurchaseTransaction, createRewardClaim, getActivePackage, getActivePackages, getActiveRewards, getRewardByCode, getUserCoinBalance, getUserRewardStatuses, getUserTransactions, isRewardClaimed } from "./coin.service.js"
import { CustomHonoAppFactory } from "@/utils/customHonoAppFactory.js"
import { isAuthenticated } from "@/middlewares/authenticated.js"
import { StatusCodes } from "http-status-codes"
import { verifyAndroidPurchase, verifyIosPurchase } from "./purchase-verification.service.js"

const app = CustomHonoAppFactory()
export { app as coinRoutes }

const moduleTag = 'coins'

// Coin Package
const coinPackageSchema = z.object({
  id: z.number(),
  name: z.string(),
  coins: z.number(),
  price: z.number(),
  currency: z.string(),
  playstore_id: z.string(),
  icon: z.string(),
  is_active: z.boolean()
}).openapi({
  example: {
    id: 1,
    name: "Mini Pack",
    coins: 10,
    price: 29,
    currency: "INR",
    playstore_id: "com.app.coins.10",
    icon: "https://storage.app.com/coins/mini.png",
    is_active: true
  }
})

const listPackagesRoute = createRoute({
  method: 'get',
  path: '/packages',
  tags: [moduleTag],
  security: [{ bearerAuth: [] }],
  middleware: [isAuthenticated] as const,
  responses: {
    200: createSuccessRouteDefinition(
      z.array(coinPackageSchema),
      'List of available coin packages'
    ),
    ...defaultResponses
  }
})

app.openapi(listPackagesRoute, async (c) => {
  const packages = await getActivePackages()
  return sendSuccess(c, packages, 'Coin packages retrieved successfully')
})


// Rewards List
const rewardSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  code: z.string(),
  coins: z.number(),
  icon: z.string(),
  link: z.string().nullable(),
  button_label: z.string(),
  reward_type: z.enum(['one_time', 'multiple', 'daily']),
  is_active: z.boolean(),
  user_status: z.enum(['pending', 'awarded', 'declined', 'expired']).nullable(),
  claimed_at: z.string().nullable()
}).openapi({
  example: {
    id: 1,
    title: "Daily Login Bonus",
    description: "Login daily to earn coins",
    code: "DAILY_LOGIN",
    coins: 50,
    icon: "https://storage.app.com/rewards/daily-login.png",
    button_label: "Claim Now",
    link: null,
    reward_type: "daily",
    is_active: true,
    user_status: "awarded",
    claimed_at: "2024-12-12T10:00:00Z"
  }
})

const listRewardsRoute = createRoute({
  method: 'get',
  path: '/rewards',
  tags: [moduleTag],
  security: [{ bearerAuth: [] }],
  middleware: [isAuthenticated] as const,
  responses: {
    200: createSuccessRouteDefinition(
      z.array(rewardSchema),
      'List of available rewards with user status'
    ),
    ...defaultResponses
  }
})

app.openapi(listRewardsRoute, async (c) => {
  const userId = c.get('user').id

  // Get rewards and user statuses
  const [rewards, userRewards] = await Promise.all([
    getActiveRewards(),
    getUserRewardStatuses(userId)
  ])

  // Create a map of user rewards for easy lookup
  const userRewardsMap = new Map(
    userRewards.map(reward => [reward.reward_code, reward])
  )

  // Combine the data
  const transformedRewards = rewards.map(reward => ({
    ...reward,
    user_status: reward.reward_type === 'multiple' ? null : (userRewardsMap.get(reward.code)?.status || null),
    claimed_at: reward.reward_type === 'multiple' ? null : (userRewardsMap.get(reward.code)?.created_at ?
      new Date(userRewardsMap.get(reward.code)!.created_at).toISOString() :
      null)
  }))

  return sendSuccess(c, transformedRewards, 'Rewards retrieved successfully')
})

// Reward Claim
const claimRewardRequestSchema = z.object({
  reward_code: z.string().openapi({
    example: "DAILY_LOGIN",
    description: "Code of the reward to claim"
  })
})

const claimRewardResponseSchema = z.object({
  coins_awarded: z.number()
}).openapi({
  example: {
    coins_awarded: 50
  }
})

const claimRewardRoute = createRoute({
  method: 'post',
  path: '/rewards-claim',
  tags: [moduleTag],
  security: [{ bearerAuth: [] }],
  middleware: [isAuthenticated] as const,
  request: {
    body: createJsonBody(claimRewardRequestSchema)
  },
  responses: {
    200: createSuccessRouteDefinition(claimRewardResponseSchema, 'Reward claimed successfully'),
    ...defaultResponses
  }
})

app.openapi(claimRewardRoute, async (c) => {
  const userId = c.get('user').id
  const { reward_code } = c.req.valid('json')

  const reward = await getRewardByCode(reward_code)
  if (!reward) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
      'Reward not found'
    )
  }

  const isClaimed = await isRewardClaimed(userId, reward_code, reward.reward_type)
  if (isClaimed) {
    throw new AppError(
      StatusCodes.CONFLICT,
      ERROR_CODES.NOT_ALLOWED,
      reward.reward_type === 'daily' ? 'Daily reward already claimed today' : 'Reward already claimed'
    )
  }

  await createRewardClaim(userId, reward_code)
  await createCoinTransaction(userId, reward.coins, reward.code, reward.title)

  return sendSuccess(
    c,
    { coins_awarded: reward.coins },
    'Reward claimed successfully'
  )
})

// coin balance
const coinBalanceResponseSchema = z.object({
  balance: z.number(),
}).openapi({
  example: {
    balance: 1500
  }
})

const getCoinBalanceRoute = createRoute({
  method: 'get',
  path: '/balance',
  tags: [moduleTag],
  security: [{ bearerAuth: [] }],
  middleware: [isAuthenticated] as const,
  responses: {
    200: createSuccessRouteDefinition(coinBalanceResponseSchema, 'User coin balance'),
    ...defaultResponses
  }
})

app.openapi(getCoinBalanceRoute, async (c) => {
  const userId = c.get('user').id
  const balance = await getUserCoinBalance(userId)

  return sendSuccess(
    c,
    { balance },
    'Coin balance retrieved successfully'
  )
})


// coin transactions api 
const transactionSchema = z.object({
  transaction_id: z.string(),
  transaction_type: z.enum(['credit', 'debit']),
  action_type: z.string(),
  amount: z.number(),
  running_balance: z.number(),
  description: z.string(),
  reference_id: z.string().nullable(),
  created_at: z.string()
}).openapi({
  example: {
    transaction_id: "TXN_123456",
    transaction_type: "credit",
    action_type: "reward",
    amount: 50,
    running_balance: 1500,
    description: "Earned 50 coins from Daily Login",
    reference_id: "DAILY_LOGIN",
    created_at: "2024-12-12T10:00:00Z"
  }
})

const transactionListQuerySchema = z.object({
  transaction_type: z.enum(['credit', 'debit']).optional(),
  action_type: z.string().optional(),
  sort_by: z.enum(['asc', 'desc']).default('desc'),
  page: z.string().transform(val => parseInt(val, 10)).default('1'),
  limit: z.string().transform(val => parseInt(val, 10)).default('10')
}).openapi({
  example: {
    transaction_type: "credit",
    action_type: "reward",
    sort_by: "desc",
    page: "1",
    limit: "10"
  }
})

const transactionListResponseSchema = z.object({
  transactions: z.array(transactionSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    total_pages: z.number()
  })
}).openapi({
  example: {
    transactions: [
      {
        transaction_id: "TXN_123456",
        transaction_type: "credit",
        action_type: "reward",
        amount: 50,
        running_balance: 1500,
        description: "Earned 50 coins from Daily Login",
        reference_id: "DAILY_LOGIN",
        created_at: "2024-12-12T10:00:00Z"
      }
    ],
    pagination: {
      total: 50,
      page: 1,
      limit: 10,
      total_pages: 5
    }
  }
})

const getTransactionsRoute = createRoute({
  method: 'get',
  path: '/transactions',
  tags: [moduleTag],
  security: [{ bearerAuth: [] }],
  middleware: [isAuthenticated] as const,
  request: {
    query: transactionListQuerySchema
  },
  responses: {
    200: createSuccessRouteDefinition(transactionListResponseSchema, 'List of coin transactions'),
    ...defaultResponses
  }
})

app.openapi(getTransactionsRoute, async (c) => {
  const userId = c.get('user').id
  const query = c.req.valid('query')

  // Validate limit
  const limit = Math.min(query.limit, 100)

  const { transactions, total } = await getUserTransactions(userId, {
    transaction_type: query.transaction_type || null,
    action_type: query.action_type,
    sort_by: query.sort_by,
    page: query.page,
    limit
  })

  // Format response
  const response = {
    transactions: transactions.map(t => ({
      ...t,
      created_at: new Date(t.created_at).toISOString()
    })),
    pagination: {
      total,
      page: query.page,
      limit,
      total_pages: Math.ceil(total / limit)
    }
  }

  return sendSuccess(c, response, 'Transactions retrieved successfully')
})


// Purchase api
const purchaseCoinRequestSchema = z.object({
  package_id: z.number().openapi({
    example: 1,
    description: "ID of the coin package purchased"
  }),
  platform: z.enum(['android', 'ios']).openapi({
    example: 'android',
    description: "Platform where purchase was made"
  }),
  purchase_token: z.string().openapi({
    example: "gpa.3378-9273-9273-47832",
    description: "Purchase verification token from the platform"
  })
})

const purchaseResponseSchema = z.object({
  coins_credited: z.number(),
  current_balance: z.number()
}).openapi({
  example: {
    coins_credited: 100,
    current_balance: 1500
  }
})

const purchaseCoinRoute = createRoute({
  method: 'post',
  path: '/purchase',
  tags: [moduleTag],
  security: [{ bearerAuth: [] }],
  middleware: [isAuthenticated] as const,
  request: {
    body: createJsonBody(purchaseCoinRequestSchema)
  },
  responses: {
    200: createSuccessRouteDefinition(purchaseResponseSchema, 'Coins credited successfully'),
    ...defaultResponses
  }
})

app.openapi(purchaseCoinRoute, async (c) => {
  const userId = c.get('user').id
  const { package_id, platform, purchase_token } = c.req.valid('json')

  // 1. Verify package exists and is active
  const packageDetails = await getActivePackage(package_id)
  if (!packageDetails) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
      'Package not found'
    )
  }

  // 2. Verify purchase token based on platform
  let isValid = false
  if (platform === 'android') {
    isValid = await verifyAndroidPurchase(purchase_token, package_id)
  } else {
    isValid = await verifyIosPurchase(purchase_token, package_id)
  }

  if (!isValid) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid purchase token'
    )
  }

  // 3. Process purchase
  await createPurchaseTransaction(userId, packageDetails, platform, purchase_token)

  // 4. Get updated balance
  const currentBalance = await getUserCoinBalance(userId)

  return sendSuccess(
    c,
    {
      coins_credited: packageDetails.coins,
      current_balance: currentBalance
    },
    'Coins credited successfully'
  )
})