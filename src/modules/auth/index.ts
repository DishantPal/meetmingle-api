import { CustomHono } from "@/types/app.js"
import { createAuthSuccessResponse, createJsonBody, createSuccessResponse } from "@/utils/response.js"
import { createRoute } from "@hono/zod-openapi"
import { z } from "zod"
import { findUserWithProfileByEmail } from "./auth.service.js"

export const app = new CustomHono()

export const moduleDetails = {
    name: 'auth',
    description: 'Authentication Apis',
}

const SignInRequestSchema = z.object({
    email: z
        .string()
        .email()
        .openapi({
            example: 'user@example.com',
        })
})

const SignInResponseSchema = z.object({
    token: z.string(),
    newUser: z.boolean()
})

const signInRoute = createRoute({
    method: 'post',
    path: '/sign-in',
    request: {
        body: createJsonBody(SignInRequestSchema)
    },
    tags: ['auth'],
    summary: 'Sign in or create user account',
    description: 'Sign in with email. Creates new account if user does not exist.',
    responses: {
        ...createAuthSuccessResponse(
            SignInResponseSchema,
            'Successfully signed in or created account'
        )
    }
})

app.openapi(signInRoute, async (c) => {
    try {
        const { email } = await c.req.valid('json')

        let userWithProfile = findUserWithProfileByEmail(email)

        const db = c.get('db')
        
        // Find or create user
        let user = await db.query.users.findFirst({
            where: eq(users.email, email),
            with: {
                profile: true
            }
        })
        
        if (!user) {
            // Create new user and profile
            const result = await db.transaction(async (tx) => {
                const [newUser] = await tx.insert(users)
                    .values({
                        email,
                        emailVerified: false,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    })
                    .returning()

                const [profile] = await tx.insert(userProfiles)
                    .values({
                        userId: newUser.id,
                        name: null,
                        image: null,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    })
                    .returning()

                return {
                    ...newUser,
                    profile
                }
            })
            
            user = result
        }
        
        // Generate JWT token
        const token = await generateJWT(user.id)
        
        // Return success response with user
        return sendSuccessWithAuthUser(
            c, 
            { token }, 
            user as AuthUser,
            'Successfully signed in'
        )
        
    } catch (error) {
        if (error instanceof z.ZodError) {
            return handleZodError(c, error)
        }
        console.error('Sign in error:', error)
        return sendError(
            c,
            'Failed to sign in',
            RESPONSE_CODES.INTERNAL_ERROR,
            StatusCodes.INTERNAL_SERVER_ERROR
        )
    }
})

export default app;