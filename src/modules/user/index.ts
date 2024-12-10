import { CustomHono } from "@/types/app.js"
import { createSuccessRouteDefinition, defaultResponses, sendSuccess, AppError, createJsonBody } from "@/utils/response.js"
import { createRoute } from "@hono/zod-openapi"
import { z } from "zod"
import { 
  checkUserExists,
  getUserProfileById, 
  getUserProfileByName, 
  blockUser, 
  unblockUser, 
  reportUser,
  getUserBlockStatus,
  getReportReason, 
  checkUserReportExists
} from "./user.service.js"
import { CustomHonoAppFactory } from "@/utils/customHonoAppFactory.js"
import { isAuthenticated } from "@/middlewares/authenticated.js"
import { StatusCodes } from "http-status-codes"
import { ERROR_CODES } from "@/utils/response.js"

const app = CustomHonoAppFactory()
export { app as userRoutes }

const moduleTag = 'user'

// TODO: Multiple reports allowed fix that

// Profile by ID
const profileByIdParamsSchema = z.object({
  user_id: z.string().transform(val => parseInt(val, 10))
    .openapi({ example: '123' })
})

const userProfileSchema = z.object({
  id: z.number(),
  email: z.string(),
  profile: z.object({
    bio: z.string().nullable(),
    country: z.string().nullable(),
    dob: z.string().nullable(),
    gender: z.string().nullable(),
    hashtags: z.array(z.string()).nullable(),
    interests: z.array(z.string()).nullable(),
    is_drinking: z.boolean().nullable(),
    is_fitness_enthusiast: z.boolean().nullable(),
    is_smoking: z.boolean().nullable(),
    looking_for: z.array(z.string()).nullable(),
    personality_traits: z.array(z.string()).nullable(),
    pet_info: z.string().nullable(),
    preferred_language: z.string().nullable(),
    profile_image_url: z.string().nullable(),
    profile_name: z.string().nullable(),
    relationship_status: z.string().nullable(),
    state: z.string().nullable()
  })
}).openapi({
  example: {
    id: 123,
    email: "user@example.com",
    profile: {
      bio: "Love traveling and photography",
      country: "US",
      dob: "1990-01-01",
      gender: "male",
      hashtags: ["#travel", "#photography"],
      interests: ["Photography", "Travel", "Music"],
      is_drinking: false,
      is_fitness_enthusiast: true,
      is_smoking: false,
      looking_for: ["Friendship", "Networking"],
      personality_traits: ["Creative", "Adventurous"],
      pet_info: "Dog lover",
      preferred_language: "en",
      profile_image_url: "https://example.com/profile.jpg",
      profile_name: "traveler_123",
      relationship_status: "single",
      state: "CA"
    }
  }
})

const getProfileByIdRoute = createRoute({
  method: 'get',
  path: '/:user_id/profile',
  tags: [moduleTag],
  security: [{ bearerAuth: [] }],
  middleware: [isAuthenticated] as const,
  request: {
    params: profileByIdParamsSchema
  },
  responses: {
    200: createSuccessRouteDefinition(userProfileSchema, 'User profile details'),
    ...defaultResponses
  }
})

app.openapi(getProfileByIdRoute, async (c) => {
  const { user_id } = c.req.valid('param')
  const currentUser = c.get('user')?.id

  const userProfile = await getUserProfileById(user_id)
  if (!userProfile) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
      'User not found'
    )
  }

  console.log("🚀 ~ app.openapi ~ currentUser:", currentUser)
  if (currentUser) {
    const isBlocked = await getUserBlockStatus(currentUser, user_id)
    console.log("🚀 ~ app.openapi ~ isBlocked:", isBlocked)
    if (isBlocked) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        ERROR_CODES.USER_BLOCKED,
        'Unable to view profile'
      )
    }
  }

  const transformedProfile = {
    ...userProfile,
    profile: {
      ...userProfile.profile,
      is_drinking: userProfile.profile.is_drinking === 1,
      is_smoking: userProfile.profile.is_smoking === 1,
      is_fitness_enthusiast: userProfile.profile.is_fitness_enthusiast === 1
    }
  }

  return sendSuccess(c, transformedProfile, 'User profile retrieved successfully')
})

// Profile by Name
const profileByNameParamsSchema = z.object({
  profile_name: z.string().openapi({ 
    example: 'johndoe',
    description: 'User profile name'
  })
})

const getProfileByNameRoute = createRoute({
  method: 'get',
  path: '/profile/:profile_name',
  tags: [moduleTag],
  security: [{ bearerAuth: [] }],
  middleware: [isAuthenticated] as const,
  request: {
    params: profileByNameParamsSchema
  },
  responses: {
    200: createSuccessRouteDefinition(userProfileSchema, 'User profile details'),
    ...defaultResponses
  }
})

app.openapi(getProfileByNameRoute, async (c) => {
  const { profile_name } = c.req.valid('param')
  const currentUser = c.get('user')?.id

  const userProfile = await getUserProfileByName(profile_name)
  if (!userProfile) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
      'User not found'
    )
  }

  if (currentUser) {
    const isBlocked = await getUserBlockStatus(currentUser, userProfile.id)
    if (isBlocked) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        ERROR_CODES.USER_BLOCKED,
        'Unable to view profile'
      )
    }
  }

  const transformedProfile = {
    ...userProfile,
    profile: {
      ...userProfile.profile,
      is_drinking: userProfile.profile.is_drinking === 1,
      is_smoking: userProfile.profile.is_smoking === 1,
      is_fitness_enthusiast: userProfile.profile.is_fitness_enthusiast === 1
    }
  }

  return sendSuccess(c, transformedProfile, 'User profile retrieved successfully')
})

// User Block
const blockUserRequestSchema = z.object({
  user_id: z.number().openapi({ 
    example: 123,
    description: 'ID of user to block'
  })
})

const blockUserResponseSchema = z.object({})

const blockUserRoute = createRoute({
  method: 'post',
  path: '/block',
  tags: [moduleTag],
  security: [{ bearerAuth: [] }],
  middleware: [isAuthenticated] as const,
  request: {
    body: createJsonBody(blockUserRequestSchema)
  },
  responses: {
    200: createSuccessRouteDefinition(blockUserResponseSchema, 'User blocked successfully'),
    ...defaultResponses
  }
})

app.openapi(blockUserRoute, async (c) => {
  const { user_id: targetUser } = c.req.valid('json')
  const currentUser = c.get('user').id

  const userExists = await checkUserExists(targetUser)
  if (!userExists) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
      'User not found'
    )
  }

  if (currentUser === targetUser) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      ERROR_CODES.NOT_ALLOWED,
      'Cannot block yourself'
    )
  }

  const isBlocked = await getUserBlockStatus(targetUser, currentUser)
  if (isBlocked) {
    throw new AppError(
      StatusCodes.CONFLICT,
      ERROR_CODES.DUPLICATE_RESOURCE,
      'User is already blocked'
    )
  }

  await blockUser(currentUser, targetUser)
  return sendSuccess(c, {}, 'User blocked successfully')
})

// User Unblock
const unblockUserRequestSchema = z.object({
  user_id: z.number().openapi({ 
    example: 123,
    description: 'ID of user to unblock'
  })
})

const unblockUserResponseSchema = z.object({})

const unblockUserRoute = createRoute({
  method: 'post',
  path: '/unblock',
  tags: [moduleTag],
  security: [{ bearerAuth: [] }],
  middleware: [isAuthenticated] as const,
  request: {
    body: createJsonBody(unblockUserRequestSchema)
  },
  responses: {
    200: createSuccessRouteDefinition(unblockUserResponseSchema, 'User unblocked successfully'),
    ...defaultResponses
  }
})

app.openapi(unblockUserRoute, async (c) => {
  const { user_id: targetUser } = c.req.valid('json')
  const currentUser = c.get('user').id

  const userExists = await checkUserExists(targetUser)
  if (!userExists) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
      'User not found'
    )
  }

  await unblockUser(currentUser, targetUser)
  return sendSuccess(c, {}, 'User unblocked successfully')
})

// User Report
const reportUserRequestSchema = z.object({
  user_id: z.number().openapi({ 
    example: 123,
    description: 'ID of user to report'
  }),
  code: z.string().openapi({ 
    example: 'OFFENSIVE_CONTENT',
    description: 'Report reason code'
  })
})

const reportUserResponseSchema = z.object({})

const reportUserRoute = createRoute({
  method: 'post',
  path: '/report',
  tags: [moduleTag],
  security: [{ bearerAuth: [] }],
  middleware: [isAuthenticated] as const,
  request: {
    body: createJsonBody(reportUserRequestSchema)
  },
  responses: {
    200: createSuccessRouteDefinition(reportUserResponseSchema, 'User reported successfully'),
    ...defaultResponses
  }
})

app.openapi(reportUserRoute, async (c) => {
  const { user_id: targetUser, code } = c.req.valid('json')
  const currentUser = c.get('user').id

  const userExists = await checkUserExists(targetUser)
  if (!userExists) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
      'User not found'
    )
  }

  if (currentUser === targetUser) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      ERROR_CODES.NOT_ALLOWED,
      'Cannot report yourself'
    )
  }

  const reason = await getReportReason(code)
  if (!reason) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
      'Invalid report reason'
    )
  }

  const userReportExists = await checkUserReportExists(currentUser, targetUser)
  if (userReportExists) {
    throw new AppError(
      StatusCodes.CONFLICT,
      ERROR_CODES.DUPLICATE_RESOURCE,
      'User has already been reported'
    )
  }

  await reportUser(currentUser, targetUser, code)
  return sendSuccess(c, {}, 'User reported successfully')
})