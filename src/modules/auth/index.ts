import { CustomHono } from "@/types/app.js"
import { AppError, createJsonBody, createSuccessRouteDefinition, defaultResponses, ERROR_CODES, sendSuccessWithAuthUser } from "@/utils/response.js";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { createAuthToken, createUser, getUser, getUserWithProfileByEmail } from "./auth.service.js";
import { StatusCodes } from "http-status-codes";
import { isAuthenticated } from "@/middlewares/authenticated.js";
import { CustomHonoAppFactory } from "@/utils/customHonoAppFactory.js";

export const app = CustomHonoAppFactory();

export const moduleDetails = {
    name: 'auth',
    description: 'These apis are used to deal with the authentication of the user.',
}

// signin
const signinRequestBodySchema = z.object({
    email: z.string().email().openapi({example: 'mark@mail.com'}),
    provider_id: z.string().openapi({example: 'google-oauth-id123'}),
    provider_type: z.enum(['google']).openapi({example: 'google'}),

    // TODO: Check if provider token are available on app side to validate
    // provider_token: z.string().openapi({example: 'auth-token_1234567890'}),
})

const signinResponseBodySchema = z.object({
    token: z.string(),
    new_user: z.boolean().default(false),
})


const signinRoute = createRoute({
    method: 'post',
    path: '/signin',
    tags: ['auth'],
    request: {
        body: createJsonBody(signinRequestBodySchema)
    },
    responses: {
        200: createSuccessRouteDefinition(signinResponseBodySchema, 'Retrieve the user'),
        ...defaultResponses
    },
});

app.openapi(signinRoute, async (c) => {
    const {email, provider_type, provider_id, provider_token} = c.req.valid('json')

    // TODO: Check if provider token are available on app side to validate
    // if(!provider_token.includes('auth-token_')) {
    //     throw new AppError(StatusCodes.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED, 'Invalid provider token');
    // }

    // TODO: Check if we need unique provider id and email id validation

    let authUser = await getUserWithProfileByEmail(email)
    let newUser = false

    if(!authUser) {
        await createUser({email, provider_type, provider_id})
        authUser = await getUserWithProfileByEmail(email)
        newUser = true
    }

    if(!authUser) {
        throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, ERROR_CODES.INTERNAL_ERROR, 'Failed to create or signin new user');
    }

    const token = await createAuthToken(authUser)

    const data = {
        token: token,
        new_user: newUser
    };

    return sendSuccessWithAuthUser(c,data,'Login Successful');
    // return sendSuccessWithAuthUser<typeof signinResponseBodySchema, StatusCodes.OK>(c, data, 'Login Successful', StatusCodes.OK);
})


// me
const meRoute = createRoute({
    method: 'get',
    path: '/me',
    tags: ['auth'],
    middleware: [isAuthenticated] as const,
    security: [{ bearerAuth: [] }],
    responses: {
        200: createSuccessRouteDefinition(z.object({}), 'Retrieve the user'),
        ...defaultResponses
    },
});

app.openapi(meRoute, async (c) => {
    return sendSuccessWithAuthUser(c, {}, 'User details');
})

// me/update-profile
