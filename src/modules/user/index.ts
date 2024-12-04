import { CustomHono } from "@/types/app.js"
import { createRoute } from "@hono/zod-openapi"
import { z } from "zod"
import { mkdir, writeFile, chmod } from 'fs/promises'
import { dirname, join } from 'path'

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



// Schema for update profile response
const UpdateProfileResponseSchema = z.object({
    username: z.string().min(3).openapi({
        type: 'string',
        description: 'Username',
        example: 'johndoe'
    }),
    age: z.preprocess((val) => parseInt(val as string, 10), z.number().min(1).max(150)).openapi({
        type: 'integer',
        description: 'User age (1-150)',
        example: 25
    }),
    profilePicture: z.any().optional().openapi({
        type: 'string',
        format: 'binary',
        description: 'Profile picture file (PNG, JPG, JPEG)'
    })
}).openapi('UpdateProfileRequest')

// Form data schema for validation
const ProfileFormSchema = z.object({
    username: z.string().min(3),
    age: z.preprocess(
        (val) => parseInt(val as string, 10),
        z.number().min(1).max(150)
    ),
    profilePicture: z.any().optional()
})

// Update profile route definition
const updateProfileRoute = createRoute({
    method: 'put',
    path: '/profile/{id}',
    request: {
        params: ParamsSchema,
        body: {
            content: {
                // 'multipart/form-data': {
                'application/x-www-form-urlencoded': {
                    schema: UpdateProfileResponseSchema
                }
            }
        }
    },
    tags: ['users'],
    security: [{ bearerAuth: [] }],
    summary: 'Update user profile',
    description: 'Update user profile information including profile picture',
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: UpdateProfileResponseSchema
                }
            },
            description: 'Profile updated successfully'
        },
        400: {
            description: 'Invalid input data'
        },
        401: {
            description: 'Unauthorized - Valid authentication credentials are required'
        },
        403: {
            description: 'Forbidden - Insufficient permissions to update this profile'
        }
    }
})

// Update profile endpoint implementation
app.openapi(updateProfileRoute, async (c) => {
    const { id } = c.req.valid('param')
    
    // Get form data
    const formData = await c.req.formData()
    const formDataObj = {
        username: formData.get('username')?.toString() || '',
        age: formData.get('age')?.toString() || '',
        profilePicture: formData.get('profilePicture')
    }

    try {
        // Validate form data using the schema
        const validatedData = ProfileFormSchema.parse(formDataObj)
        const profilePicture = validatedData.profilePicture as File | null

        let profilePictureUrl = ''
        
        if (profilePicture) {
            // Validate file type
            const fileType = profilePicture.type
            if (!['image/png', 'image/jpeg', 'image/jpg'].includes(fileType)) {
                return c.json({ error: 'Invalid file type. Only PNG, JPG, and JPEG are allowed' }, 400)
            }

            // Get file extension
            const fileExt = profilePicture.name.split('.').pop()?.toLowerCase() || 'png'
            
            // Get base upload directory with fallback
            const baseUploadDir = process.env.UPLOAD_DIR || './storage'
            
            // Construct file path and URL
            const fileName = `${validatedData.username}.${fileExt}`
            const filePath = join(baseUploadDir, 'userprofile', fileName)
            const baseUrl = process.env.BASE_URL || 'https://mydomain.com'
            const fileUrl = `${baseUrl}/storage/userprofile/${fileName}`

            try {
                // Convert File to ArrayBuffer
                const arrayBuffer = await profilePicture.arrayBuffer()
                
                // Create directory if it doesn't exist
                await mkdir(dirname(filePath), { recursive: true })

                // Write the file
                const buffer = Buffer.from(arrayBuffer)
                await writeFile(filePath, buffer)

                // Set file permissions (optional, but recommended)
                await chmod(filePath, 0o644)
                
                profilePictureUrl = fileUrl
            } catch (error) {
                console.error('File system error:', error)
                return c.json({ error: 'Failed to save profile picture' }, 500)
            }
        }

        // Return updated profile data
        return c.json({
            username: validatedData.username,
            age: validatedData.age,
            profilePicture: profilePictureUrl || `${process.env.BASE_URL || 'https://mydomain.com'}/storage/userprofile/${validatedData.username}.png`
        }, 200)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Validation failed', details: error.errors }, 400)
        }
        return c.json({ error: 'Invalid input data' }, 400)
    }
})


export default app