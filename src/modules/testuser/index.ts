import { CustomHono, Env } from "@/types/app.js"
import { createRoute } from "@hono/zod-openapi"
import { z, ZodError } from "zod"
import { mkdir, writeFile, chmod } from 'fs/promises'
import { dirname, join } from 'path'
import { CustomHonoAppFactory } from "@/utils/customHonoAppFactory.js"
import { AppError, createJsonBody, defaultResponses, ERROR_CODES, sendSuccess, sendSuccessWithAuthUser, SuccessResponseSchema, ValidationError } from "@/utils/response.js"
import { Context, TypedResponse } from "hono"
import { StatusCode } from "hono/utils/http-status"
import { isAuthenticated } from "@/middlewares/authenticated.js"
import { StatusCodes } from "http-status-codes"

export const app = CustomHonoAppFactory()

export const moduleDetails = {
    name: 'users',
    description: '`user` is also an entity, but NOT a contextual entity.',
}

// Schema Definitions
// const ParamsSchema = z.object({
//     id: z
//         .string()
//         .min(3)
//         .openapi({
//             param: {
//                 name: 'id',
//                 in: 'path',
//             },
//             example: '1212121',
//         }),
// })

// const UserSchema = z
//     .object({
//         id: z.string().openapi({
//             example: '123',
//         }),
//         name: z.string().openapi({
//             example: 'John Doe',
//         }),
//         age: z.number().openapi({
//             example: 42,
//         }),
//     })
//     .openapi('User')

// // Public Route - Get Basic User Info
// const publicRoute = createRoute({
//     method: 'get',
//     path: '/basic/{id}',
//     request: {
//         params: ParamsSchema,
//     },
//     tags: ['users'],
//     summary: 'Get basic user information (Public)',
//     description: 'Retrieve basic user information without authentication',
//     responses: {
//         200: {
//             content: {
//                 'application/json': {
//                     schema: UserSchema,
//                 },
//             },
//             description: 'Successfully retrieved basic user information',
//         },
//     },
// })

// // Protected Route - Get Detailed User Info
// const protectedRoute = createRoute({
//     method: 'get',
//     path: '/detailed/{id}',
//     request: {
//         params: ParamsSchema,
//     },
//     tags: ['users'],
//     security: [{ bearerAuth: [] }],
//     summary: 'Get detailed user information (Protected)',
//     description: 'Retrieve detailed user information - requires authentication',
//     responses: {
//         200: {
//             content: {
//                 'application/json': {
//                     schema: UserSchema,
//                 },
//             },
//             description: 'Successfully retrieved detailed user information',
//         },
//         401: {
//             description: 'Unauthorized - Valid authentication credentials are required',
//         },
//         403: {
//             description: 'Forbidden - Insufficient permissions to access this resource',
//         },
//     },
// })

// // New Server-Authenticated Route
// const serverAuthRoute = createRoute({
//     method: 'get',
//     path: '/server/{id}',
//     request: {
//         params: ParamsSchema,
//         headers: z.object({
//             'x-server-secret': z.string().openapi({
//                 param: {
//                     name: 'x-server-secret',  // Changed to match the case in the header definition
//                     in: 'header',
//                     required: true,
//                     description: 'Server-level authentication secret'
//                 },
//                 example: 'supersecret1'
//             })
//         })
//     },
//     tags: ['users'],
//     security: [{ apiKeyHeader: ['x-server-secret'] }],
//     summary: 'Get user information (Server Authentication)',
//     description: 'Retrieve user information - requires server-level authentication',
//     responses: {
//         200: {
//             content: {
//                 'application/json': {
//                     schema: UserSchema,
//                 },
//             },
//             description: 'Successfully retrieved user information',
//         },
//         401: {
//             description: 'Unauthorized - Valid server authentication credentials are required',
//         },
//         403: {
//             description: 'Forbidden - Invalid server secret',
//         },
//     },
// })

// // Public endpoint implementation
// app.openapi(publicRoute, (c) => {
//     const { id } = c.req.valid('param')
//     return c.json(
//         {
//             id,
//             age: 20,
//             name: 'Ultra-man',
//         },
//         200
//     )
// })

// // Protected endpoint implementation
// app.openapi(protectedRoute, (c) => {
//     const { id } = c.req.valid('param')
//     return c.json(
//         {
//             id,
//             age: 20,
//             name: 'Ultra-man',
//             // Additional sensitive information that requires authentication
//             email: 'ultraman@example.com',
//             phoneNumber: '+1234567890',
//             addressLine: '123 Hero Street'
//         },
//         200
//     )
// })

// // Server-authenticated endpoint implementation
// app.openapi(serverAuthRoute, (c) => {
//     const { id } = c.req.valid('param')
//     const serverSecret = c.req.header('x-server-secret')  // Changed to match the case in the schema

//     // Check server secret - in production, use a secure comparison method
//     if (serverSecret !== 'supersecret123') {
//         return c.json(
//             { error: 'Invalid server secret' },
//             403
//         )
//     }

//     return c.json(
//         {
//             id,
//             age: 20,
//             name: 'Ultra-man',
//             // Server-level sensitive information
//             internalId: 'INT-123456',
//             systemAccess: 'LEVEL_A',
//             lastSync: new Date().toISOString(),
//             metaData: {
//                 createdAt: '2024-01-01T00:00:00Z',
//                 modifiedAt: '2024-01-02T00:00:00Z',
//                 version: '1.0.0'
//             }
//         },
//         200
//     )
// })



// // Schema for update profile response
// const UpdateProfileResponseSchema = z.object({
//     username: z.string().min(3).openapi({
//         type: 'string',
//         description: 'Username',
//         example: 'johndoe'
//     }),
//     age: z.preprocess((val) => parseInt(val as string, 10), z.number().min(1).max(150)).openapi({
//         type: 'integer',
//         description: 'User age (1-150)',
//         example: 25
//     }),
//     profilePicture: z.any().optional().openapi({
//         type: 'string',
//         format: 'binary',
//         description: 'Profile picture file (PNG, JPG, JPEG)'
//     })
// }).openapi('UpdateProfileRequest')

// // Form data schema for validation
// const ProfileFormSchema = z.object({
//     username: z.string().min(3),
//     age: z.preprocess(
//         (val) => parseInt(val as string, 10),
//         z.number().min(1).max(150)
//     ),
//     profilePicture: z.any().optional()
// })

// // Update profile route definition
// const updateProfileRoute = createRoute({
//     method: 'put',
//     path: '/profile/{id}',
//     request: {
//         params: ParamsSchema,
//         body: {
//             content: {
//                 // 'multipart/form-data': {
//                 'application/x-www-form-urlencoded': {
//                     schema: UpdateProfileResponseSchema
//                 }
//             }
//         }
//     },
//     tags: ['users'],
//     security: [{ bearerAuth: [] }],
//     summary: 'Update user profile',
//     description: 'Update user profile information including profile picture',
//     responses: {
//         200: {
//             content: {
//                 'application/json': {
//                     schema: UpdateProfileResponseSchema
//                 }
//             },
//             description: 'Profile updated successfully'
//         },
//         400: {
//             description: 'Invalid input data'
//         },
//         401: {
//             description: 'Unauthorized - Valid authentication credentials are required'
//         },
//         403: {
//             description: 'Forbidden - Insufficient permissions to update this profile'
//         }
//     }
// })

// // Update profile endpoint implementation
// app.openapi(updateProfileRoute, async (c) => {
//     const { id } = c.req.valid('param')

//     // Get form data
//     const formData = await c.req.formData()
//     const formDataObj = {
//         username: formData.get('username')?.toString() || '',
//         age: formData.get('age')?.toString() || '',
//         profilePicture: formData.get('profilePicture')
//     }

//     try {
//         // Validate form data using the schema
//         const validatedData = ProfileFormSchema.parse(formDataObj)
//         const profilePicture = validatedData.profilePicture as File | null

//         let profilePictureUrl = ''

//         if (profilePicture) {
//             // Validate file type
//             const fileType = profilePicture.type
//             if (!['image/png', 'image/jpeg', 'image/jpg'].includes(fileType)) {
//                 return c.json({ error: 'Invalid file type. Only PNG, JPG, and JPEG are allowed' }, 400)
//             }

//             // Get file extension
//             const fileExt = profilePicture.name.split('.').pop()?.toLowerCase() || 'png'

//             // Get base upload directory with fallback
//             const baseUploadDir = process.env.UPLOAD_DIR || './storage'

//             // Construct file path and URL
//             const fileName = `${validatedData.username}.${fileExt}`
//             const filePath = join(baseUploadDir, 'userprofile', fileName)
//             const baseUrl = process.env.BASE_URL || 'https://mydomain.com'
//             const fileUrl = `${baseUrl}/storage/userprofile/${fileName}`

//             try {
//                 // Convert File to ArrayBuffer
//                 const arrayBuffer = await profilePicture.arrayBuffer()

//                 // Create directory if it doesn't exist
//                 await mkdir(dirname(filePath), { recursive: true })

//                 // Write the file
//                 const buffer = Buffer.from(arrayBuffer)
//                 await writeFile(filePath, buffer)

//                 // Set file permissions (optional, but recommended)
//                 await chmod(filePath, 0o644)

//                 profilePictureUrl = fileUrl
//             } catch (error) {
//                 console.error('File system error:', error)
//                 return c.json({ error: 'Failed to save profile picture' }, 500)
//             }
//         }

//         // Return updated profile data
//         return c.json({
//             username: validatedData.username,
//             age: validatedData.age,
//             profilePicture: profilePictureUrl || `${process.env.BASE_URL || 'https://mydomain.com'}/storage/userprofile/${validatedData.username}.png`
//         }, 200)
//     } catch (error) {
//         if (error instanceof z.ZodError) {
//             return c.json({ error: 'Validation failed', details: error.errors }, 400)
//         }
//         return c.json({ error: 'Invalid input data' }, 400)
//     }
// })


// // export const createUserRoute = createRoute({
// //     method: 'post',
// //     path: '/users',
// //     request: {
// //         body: {
// //             content: {
// //                 'application/json': {
// //                     schema: z.object({
// //                         name: z.string().min(2, "Name must be at least 2 characters"),
// //                         email: z.string().email("Invalid email format"),
// //                         age: z.preprocess(
// //                             (val) => parseInt(val as string, 10),
// //                             z.number().min(18, "Must be at least 18 years old")
// //                         )
// //                     })
// //                 }
// //             }
// //         }
// //     },
// //     responses: {
// //         200: {
// //             content: {
// //                 'application/json': {
// //                     schema: z.object({
// //                         success: z.boolean(),
// //                         data: z.object({
// //                             user: z.object({
// //                                 id: z.string(),
// //                                 name: z.string(),
// //                                 email: z.string(),
// //                                 age: z.number()
// //                             })
// //                         })
// //                     })
// //                 }
// //             },
// //             description: 'User created successfully'
// //         }
// //     },
// //     tags: ['users'],
// //     summary: 'Create new user'
// // })

// // app.openapi(createUserRoute, async (c) => {
// //     // This gives us the validated data
// //     const data = c.req.valid('json')

// //     const newUser = {
// //         id: crypto.randomUUID(),
// //         ...data
// //     }

// //     return c.json({
// //         success: true,
// //         data: {
// //             user: newUser
// //         }
// //     })
// // })

// export const createUserRoute = createRoute({
//     method: 'post',
//     path: '/users',
//     request: {
//         body: {
//             content: {
//                 'application/json': {
//                     schema: z.object({
//                         name: z.string().min(2, "Name must be at least 2 characters again"),
//                         email: z.string().email("Invalid email format"),
//                         age: z.preprocess(
//                             (val) => parseInt(val as string, 10),
//                             z.number().min(18, "Must be at least 18 years old")
//                         )
//                     })
//                 }
//             }
//         }
//     },
//     responses: {
//         200: {
//             content: {
//                 'application/json': {
//                     schema: z.object({
//                         success: z.boolean(),
//                         data: z.object({
//                             user: z.object({
//                                 id: z.string(),
//                                 name: z.string(),
//                                 email: z.string(),
//                                 age: z.number()
//                             })
//                         })
//                     })
//                 }
//             },
//             description: 'User created successfully'
//         },
//         400: {
//             description: 'Validation Error',
//             content: {
//                 'application/json': {
//                     schema: z.object({
//                         success: z.boolean(),
//                         error: z.string(),
//                         details: z.array(z.any())
//                     })
//                 }
//             }
//         }
//     },
//     tags: ['users'],
//     summary: 'Create new user'
// })

// app.openapi(createUserRoute, async (c): Promise<any> => {
//     try {
//         console.log('qeqeqwe');
//         // Try manual validation first to see the error
//         const body = await c.req.json()
//         const schema = z.object({
//             name: z.string().min(2, "Name must be at least 2 characters again"),
//             email: z.string().email("Invalid email format"),
//             age: z.preprocess(
//                 (val) => parseInt(val as string, 10),
//                 z.number().min(18, "Must be at least 18 years old")
//             )
//         })

//         console.log('Received body:', body)
//         const result = schema.safeParse(body)

//         if (!result.success) {
//             console.log('Validation failed:', result.error)
//             throw result.error
//         }

//         // If we get here, use the validated data from Hono
//         const data = c.req.valid('json')
//         console.log('Validated data:', data)

//         const newUser = {
//             id: crypto.randomUUID(),
//             ...data
//         }

//         return c.json({
//             success: true,
//             data: {
//                 user: newUser
//             }
//         })
//     } catch (error) {
//         console.log('Caught error in handler:', error)
//         throw error
//     }
// }
// // , (result, c) => {
// //     console.log("🚀 ~ app.openapi ~ result, c:", result, c)
// //     if (!result.success) {
// //         return c.json(
// //             {
// //                 success: false,
// //                 error: 'this is error',
// //                 details: 'test',
// //             },
// //             400
// //         )
// //     }
// // }
// )


// const ParamsSchema1 = z.object({
//     id: z
//         .string()
//         .min(3)
//         .openapi({
//             param: {
//                 name: 'id',
//                 in: 'path',
//             },
//             example: '1212121',
//         }),
// })

// const BodySchema1 = z
//     .object({
//         name: z.string().openapi({
//             example: 'John Doe',
//         }),
//         age: z.number().min(18).openapi({
//             example: 42,
//         }),
//     })

// const UserSchema1 = z
//     .object({
//         id: z.string().openapi({
//             example: '123',
//         }),
//         name: z.string().openapi({
//             example: 'John Doe',
//         }),
//         age: z.number().openapi({
//             example: 42,
//         }),
//     })
//     .openapi('User')

// const ErrorSchema1 = z.object({
//     code: z.number().openapi({
//         example: 400,
//     }),
//     message: z.string().openapi({
//         example: 'Bad Request',
//     }),
// })

// const customRoute = createRoute({
//     method: 'post',
//     path: '/custom/{id}',
//     request: {
//         params: ParamsSchema1,
//         body: {
//             content: {
//                 'application/json': {
//                     schema: BodySchema1,
//                 },
//             }
//         }
//     },
//     responses: {
//         200: {
//             content: {
//                 'application/json': {
//                     schema: UserSchema1,
//                 },
//             },
//             description: 'Retrieve the user',
//         },
//         400: {
//             content: {
//                 'application/json': {
//                     schema: ErrorSchema1,
//                 },
//             },
//             description: 'Returns an error',
//         },
//     },
// });

// app.openapi(
//     customRoute,
//     (c) => {
//         const { id } = c.req.valid('param')

//         const { name, age } = c.req.valid('json')

//         // Custom validation check
//         if (name.toLowerCase().includes('margret') && age < 30) {
//             // Create a ZodError manually
//             throw CustomZodError('age', "People with 'margret' in their name must be 18 or older")
//         }

//         return c.json(
//             {
//                 id,
//                 age: age,
//                 name: name,
//             },
//             200
//         )
//     },
// )

// Example 2
const ParamsSchema2 = z.object({
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

const BodySchema2 = z
    .object({
        name: z.string().openapi({
            example: 'John Doe',
        }),
        age: z.number().min(18).openapi({
            example: 42,
        }),
    })

const UserSchema2 = z
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

// 1. First, your base response schema definition
// const successResponse = <T extends z.ZodType>(dataSchema: T) => {
//     return z.object({
//         success: z.literal(true),
//         data: dataSchema,
//         message: z.string().optional()
//     })
// }

// const sendSuccessResponse = <T extends z.ZodType, S extends StatusCode>(
//     c: Context<Env>, 
//     data: z.infer<T>,
//     message?: string,
//     status?: S
// ) => {
//     return c.json({
//         success: true as const,
//         data,
//         ...(message && { message })
//     }, status || 200);
// }

const createSuccessRoute = <T extends z.ZodType>(
    schema: T,
    description: string
) => ({
    content: {
        'application/json': {
            // schema: successResponse(schema),
            schema: SuccessResponseSchema(schema),
        },
    },
    description: description,
});

// 3. Usage in your route
const customRoute2 = createRoute({
    method: 'post',
    path: '/custom2/{id}',
    middleware: [isAuthenticated] as const,
    security: [{ bearerAuth: [] }],
    request: {
        params: ParamsSchema2,
        body: createJsonBody(BodySchema2)
    },
    responses: {
        200: createSuccessRoute(UserSchema2, 'Retrieve the user'),
        201: createSuccessRoute(UserSchema2, 'Creates the user'),
        ...defaultResponses
    },
});

app.openapi(
    customRoute2,
    (c) => {
        const { id } = c.req.valid('param')
        const { name, age } = c.req.valid('json')

        if (name.toLowerCase().includes('margret') && age < 30) {
            throw new ValidationError({field: 'age', message: "People with 'margret' in their name must be 18 or older"});
        }

        if (name.split(' ').length > 2) {
            throw new AppError(StatusCodes.PAYMENT_REQUIRED, ERROR_CODES.SUBSCRIPTION_REQUIRED, 'Subscription required to have more than 2 words name');
        }

        const data = {
            id,
            age,
            name,
        }

        // return sendSuccess<typeof UserSchema2, StatusCodes.OK>(c, data, 'Retrieve the user', StatusCodes.OK);
        return sendSuccessWithAuthUser<typeof UserSchema2, StatusCodes.CREATED>(c, data, 'Retrieve the user', StatusCodes.CREATED);
    },
)