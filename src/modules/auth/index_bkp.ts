import { CustomHono } from "@/types/app.js"
import { createAuthSuccessResponse, createErrorResponse, createJsonBody, RESPONSE_CODES, sendError, sendSuccessWithAuthUser } from "@/utils/response.js";
import { createRoute } from "@hono/zod-openapi"
import { z } from "zod"
import { createAuthToken, getUserWithProfileByEmail } from "./auth.service.js";
import { StatusCodes } from "http-status-codes";
import { AuthUser } from "@/types/user.js";
import { isAuthenticated } from "@/middlewares/authenticated.js"

export const app = new CustomHono();

export const moduleDetails = {
    name: 'auth',
    description: 'These apis are used to deal with the authentication of the user.',
}

// signin
const signinRequestBodySchema = z.object({
    email: z.string().email()
})

const signinResponseBodySchema = z.object({
    token: z.string(),
    new_user: z.boolean().default(false),
})

const signinRoute = createRoute({
    method: 'post',
    path: '/signin',
    tags: ['auth'],
    summary: 'Sign in (Public)',
    description: 'Sign in with google account email',
    // request: {
    //     body: createJsonBody(signinRequestBodySchema),
    // },
    // responses: {
    //     ...createAuthSuccessResponse(signinResponseBodySchema, 'Successfully signed in', StatusCodes.OK),
    //     ...createErrorResponse('Invalid request parameters', StatusCodes.BAD_REQUEST),
    // },
    request: {
        body: {
            content: {
                'application/json': {
                    schema: signinRequestBodySchema
                }
            }
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: signinResponseBodySchema
                }
            },
            description: 'Successfully signed in',
        },
        400: {
            description: 'Invalid request parameters',
        },
    },
})

app.openapi(signinRoute, async (c) => {
    const {email} = c.req.valid('json')

    const authUser = await getUserWithProfileByEmail(email)

    if(!authUser) return sendError(c,'User not found',RESPONSE_CODES.NOT_FOUND,StatusCodes.NOT_FOUND);

    const token = await createAuthToken(authUser)

    const data = {
        token: token,
        new_user: false
    };

    return sendSuccessWithAuthUser(c,data,'user found');
})


// me
const meResponseSchema = z.object({
    user: z.custom<AuthUser>()  // Using the existing AuthUser type
})

const meRoute = createRoute({
    method: 'get',
    path: '/me',
    tags: ['auth'],
    summary: 'Get Current User',
    description: 'Get details of the currently logged in user',
    security: [{ Bearer: [] }],
    middleware: [isAuthenticated],  // Adding middleware here
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: meResponseSchema
                }
            },
            description: 'Successfully retrieved user details',
        },
        401: {
            description: 'Unauthorized - Invalid or missing token',
        },
        403: {
            description: 'Forbidden - User is banned',
        }
    },
})

app.openapi(meRoute, async (c) => {
    const user = c.get('user')
    return c.json({ user })
})


// me/update-profile




export default app