import { CustomHono } from "@/types/app.js"
import { createRoute } from "@hono/zod-openapi"
import { z } from "zod"

export const app = new CustomHono()

export const moduleDetails = {
    name: 'users',
    description: '`user` is also an entity, but NOT a contextual entity.',
}

// Schema Definitions
const ParamsSchema = z.object({
    id: z
        .string()
        .min(3)
        .openapi({
            param: {
                name: 'id',
                in: 'path',
            },
            example: '1212121',
        }),
})

const UserSchema = z
    .object({
        id: z.string().openapi({
            example: '123',
        }),
        name: z.string().openapi({
            example: 'John Doe',
        }),
        age: z.number().openapi({
            example: 42,
        }),
    })
    .openapi('User')

// Public Route - Get Basic User Info
const publicRoute = createRoute({
    method: 'get',
    path: '/basic/{id}',
    request: {
        params: ParamsSchema,
    },
    tags: ['users'],
    summary: 'Get basic user information (Public)',
    description: 'Retrieve basic user information without authentication',
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: UserSchema,
                },
            },
            description: 'Successfully retrieved basic user information',
        },
    },
})

// Protected Route - Get Detailed User Info
const protectedRoute = createRoute({
    method: 'get',
    path: '/detailed/{id}',
    request: {
        params: ParamsSchema,
    },
    tags: ['users'],
    security: [{ bearerAuth: [] }],  // This specifies that this route requires authentication
    summary: 'Get detailed user information (Protected)',
    description: 'Retrieve detailed user information - requires authentication',
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: UserSchema,
                },
            },
            description: 'Successfully retrieved detailed user information',
        },
        401: {
            description: 'Unauthorized - Valid authentication credentials are required',
        },
        403: {
            description: 'Forbidden - Insufficient permissions to access this resource',
        },
    },
})

// Public endpoint implementation
app.openapi(publicRoute, (c) => {
    const { id } = c.req.valid('param')
    return c.json(
        {
            id,
            age: 20,
            name: 'Ultra-man',
        },
        200
    )
})

// Protected endpoint implementation
app.openapi(protectedRoute, (c) => {
    const { id } = c.req.valid('param')
    return c.json(
        {
            id,
            age: 20,
            name: 'Ultra-man',
            // Additional sensitive information that requires authentication
            email: 'ultraman@example.com',
            phoneNumber: '+1234567890',
            addressLine: '123 Hero Street'
        },
        200
    )
})

export default app;