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
    security: [{ bearerAuth: [] }],
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

// New Server-Authenticated Route
const serverAuthRoute = createRoute({
    method: 'get',
    path: '/server/{id}',
    request: {
        params: ParamsSchema,
        headers: z.object({
            'x-server-secret': z.string().openapi({
                param: {
                    name: 'x-server-secret',  // Changed to match the case in the header definition
                    in: 'header',
                    required: true,
                    description: 'Server-level authentication secret'
                },
                example: 'supersecret1'
            })
        })
    },
    tags: ['users'],
    security: [{ apiKeyHeader: ['x-server-secret'] }],
    summary: 'Get user information (Server Authentication)',
    description: 'Retrieve user information - requires server-level authentication',
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: UserSchema,
                },
            },
            description: 'Successfully retrieved user information',
        },
        401: {
            description: 'Unauthorized - Valid server authentication credentials are required',
        },
        403: {
            description: 'Forbidden - Invalid server secret',
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

// Server-authenticated endpoint implementation
app.openapi(serverAuthRoute, (c) => {
    const { id } = c.req.valid('param')
    const serverSecret = c.req.header('x-server-secret')  // Changed to match the case in the schema
    
    // Check server secret - in production, use a secure comparison method
    if (serverSecret !== 'supersecret123') {
        return c.json(
            { error: 'Invalid server secret' },
            403
        )
    }

    return c.json(
        {
            id,
            age: 20,
            name: 'Ultra-man',
            // Server-level sensitive information
            internalId: 'INT-123456',
            systemAccess: 'LEVEL_A',
            lastSync: new Date().toISOString(),
            metaData: {
                createdAt: '2024-01-01T00:00:00Z',
                modifiedAt: '2024-01-02T00:00:00Z',
                version: '1.0.0'
            }
        },
        200
    )
})

export default app