import { CustomHono } from "@/types/app.js"
import { AppError, createJsonBody, createSuccessRouteDefinition, defaultResponses, ERROR_CODES, sendSuccess, sendSuccessWithAuthUser } from "@/utils/response.js";
import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { createAuthToken, createUser, deleteUserAccount, getBlockedUsers, getUserWithProfileByEmail, getUserWithProfileById, updateUserProfile } from "./auth.service.js";
import { StatusCodes } from "http-status-codes";
import { isAuthenticated } from "@/middlewares/authenticated.js";
import { CustomHonoAppFactory } from "@/utils/customHonoAppFactory.js";
import { UserProfiles } from "@/database/db.js";
import storeFile from "@/utils/storeFile.js";
import { Insertable } from "kysely";

const app = CustomHonoAppFactory();
export { app as authRoutes };

const moduleTag = 'auth';


// signin
const signinRequestBodySchema = z.object({
    email: z.string().email().openapi({ example: 'mark@mail.com' }),
    provider_id: z.string().openapi({ example: 'google-oauth-id123' }),
    provider_type: z.enum(['google']).openapi({ example: 'google' }),

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
    tags: [moduleTag],
    request: {
        body: createJsonBody(signinRequestBodySchema)
    },
    responses: {
        200: createSuccessRouteDefinition(signinResponseBodySchema, 'Retrieve the user'),
        ...defaultResponses
    },
});

app.openapi(signinRoute, async (c) => {
    // const { email, provider_type, provider_id, provider_token } = c.req.valid('json')
    const { email, provider_type, provider_id } = c.req.valid('json')

    // TODO: Check if provider token are available on app side to validate
    // if(!provider_token.includes('auth-token_')) {
    //     throw new AppError(StatusCodes.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED, 'Invalid provider token');
    // }

    // TODO: Check if we need unique provider id and email id validation

    let authUser = await getUserWithProfileByEmail(email)
    let newUser = false

    if (!authUser) {
        await createUser({ email, provider_type, provider_id })
        authUser = await getUserWithProfileByEmail(email)
        newUser = true
    }

    if (!authUser) {
        throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, ERROR_CODES.INTERNAL_ERROR, 'Failed to create or signin new user');
    }

    const token = await createAuthToken(authUser)

    const data = {
        token: token,
        new_user: newUser
    };

    return sendSuccessWithAuthUser(c, data, 'Login Successful');
    // return sendSuccessWithAuthUser<typeof signinResponseBodySchema, StatusCodes.OK>(c, data, 'Login Successful', StatusCodes.OK);
})


// me
const meRoute = createRoute({
    method: 'get',
    path: '/me',
    tags: [moduleTag],
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
const ProfileImageMaxSize = 5 * 1024 * 1024; // 5MB

const updateUserProfileSchema = z.object({
    profile_name: z.string().min(1).max(100).optional()
        .openapi({ example: 'John Doe' }),
    profile_image_url: z.string().optional()
        .openapi({ example: 'https://example.com/image.png' }),
    profile_image: z.instanceof(File).optional().refine(
        (file) => {
            // If no file is provided, return true (valid)
            if (!file) return true;

            // If a file is provided, check its type
            return [
                "image/png",
                "image/jpeg",
                "image/jpg",
                "image/svg+xml",
                "image/gif",
            ].includes(file.type);
        },
        { message: "Invalid image file type" }
    ).refine(
        (file) => {
            // If no file is provided, return true (valid)
            if (!file) return true;

            // If a file is provided, check its size
            return file.size <= ProfileImageMaxSize;
        },
        { message: "File size should not exceed 5MB" }
    ),
    bio: z.string().max(1000).optional()
        .openapi({ example: 'I love hiking and photography' }),
    dob: z.string().date().optional()
        .openapi({ example: '1990-01-01' }),
    gender: z.string().optional()
        .openapi({ example: 'male' }),
    country: z.string().optional()
        .openapi({ example: 'US' }),
    state: z.string().optional()
        .openapi({ example: 'CA' }),
    preferred_language: z.string().optional()
        .openapi({ example: 'en' }),
    relationship_status: z.string().optional()
        .openapi({ example: 'single' }),
    interests: z.array(z.string()).optional()
        .openapi({ example: ['photography', 'hiking', 'cooking'] }),
    hashtags: z.array(z.string()).optional()
        .openapi({ example: ['#adventure', '#foodie', '#travel'] }),
    looking_for: z.array(z.string()).optional()
        .openapi({ example: ['friendship', 'relationship', 'networking'] }),
    personality_traits: z.array(z.string()).optional()
        .openapi({ example: ['creative', 'outgoing', 'ambitious'] }),
    pet_info: z.string().optional()
        .openapi({ example: 'Dog lover, owner of 2 golden retrievers' }),
    is_drinking: z.coerce.boolean().optional()
        .openapi({ example: false }),
    is_smoking: z.coerce.boolean().optional()
        .openapi({ example: false }),
    is_fitness_enthusiast: z.coerce.boolean().optional()
        .openapi({ example: true }),
    timezone: z.string()
        .min(1)
        .max(50)
        .optional()
        .openapi({ example: 'Asia/Kolkata' }),
});

const profileUpdateResponseSchema = z.object({})

// 2. OpenAPI Route Definition
const updateProfileRoute = createRoute({
    method: 'post',
    path: '/me/update-profile',
    tags: [moduleTag],
    middleware: [isAuthenticated] as const,
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                'multipart/form-data': {
                    schema: updateUserProfileSchema
                }
            }
        }
    },
    responses: {
        200: createSuccessRouteDefinition(profileUpdateResponseSchema, 'Profile updated successfully'),
        ...defaultResponses
    },
});

const profileFormDataToJson = (formData: FormData): Partial<Insertable<UserProfiles>> => {
    const updateData: Partial<Insertable<UserProfiles>> = {};
    const arrayFields = new Map<string, string[]>();

    // First pass: collect array values
    for (const [key, value] of formData.entries()) {
        if (key === 'profile_image') continue;

        // Check if it's an array field
        const arrayMatch = key.match(/^(.*?)\[\d+\]$/);
        if (arrayMatch) {
            const fieldName = arrayMatch[1];
            if (!fieldName) continue;
            if (!arrayFields.has(fieldName)) {
                arrayFields.set(fieldName, []);
            }
            arrayFields.get(fieldName)?.push(value as string);
            continue;
        }

        const typedKey = key as keyof UserProfiles;

        // Handle non-array fields
        if (['is_drinking', 'is_smoking', 'is_fitness_enthusiast'].includes(key)) {
            updateData[typedKey] = (value === 'true' ? 1 : 0) as any;
        } else {
            updateData[typedKey] = value as any;
        }
    }

    // Second pass: add collected arrays to update data
    arrayFields.forEach((values, fieldName) => {
        const typedKey = fieldName as keyof UserProfiles;
        updateData[typedKey] = values as any;
    });

    return updateData;
}

// 3. API Handler
app.openapi(updateProfileRoute, async (c) => {
    const formData = await c.req.formData();
    const userId = c.get('user').id;

    // Handle file upload if exists
    let profileImageUrl: string | undefined;
    const profileImage = formData.get('profile_image') as File | null;

    if (profileImage) {
        const fileName = `profile-image.png`;
        const filePath = `storage/users/user_${userId}`;
        profileImageUrl = await storeFile(profileImage, filePath, fileName);
    }

    // Prepare update object
    const updateData = profileFormDataToJson(formData);

    if (profileImageUrl) {
        updateData.profile_image_url = profileImageUrl;
    }

    // Update profile
    await updateUserProfile(userId, updateData);

    // update context user here
    const user = await getUserWithProfileById(Number(userId))
    if (!user) throw new Error('User not found');
    c.set('user', user)

    return sendSuccessWithAuthUser(c, {}, 'Profile updated successfully');
});


// Delete Account
const deleteAccountResponseSchema = z.object({
    email: z.string().email()
});

const deleteAccountRoute = createRoute({
    method: 'post',
    path: '/delete-account',
    tags: [moduleTag],
    middleware: [isAuthenticated] as const,
    security: [{ bearerAuth: [] }],
    request: {
        body: createJsonBody(z.object({
            confirmation: z.literal('DELETE_MY_ACCOUNT')
                .openapi({ example: 'DELETE_MY_ACCOUNT' })
        }))
    },
    responses: {
        200: createSuccessRouteDefinition(deleteAccountResponseSchema, 'Account deleted successfully'),
        ...defaultResponses
    },
});

app.openapi(deleteAccountRoute, async (c) => {
    const { confirmation } = c.req.valid('json');
    const user = c.get('user');

    if (confirmation !== 'DELETE_MY_ACCOUNT') {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            ERROR_CODES.VALIDATION_ERROR,
            'Invalid confirmation text'
        );
    }

    await deleteUserAccount(user.id);

    return sendSuccessWithAuthUser(c, { email: user.email }, 'Account deleted successfully');
});

// Blocked Users List
const blockedUsersResponseSchema = z.object({
    blocked_users: z.array(z.object({
      id: z.number()
        .openapi({ example: 123 }),
      profile_name: z.string().nullable()
        .openapi({ example: 'john_doe' }),
      profile_image_url: z.string().nullable()
        .openapi({ example: 'https://example.com/profile.jpg' })
    }))
  })
  
  const getBlockedUsersRoute = createRoute({
    method: 'get',
    path: '/me/blocked-users',
    tags: [moduleTag],
    security: [{ bearerAuth: [] }],
    middleware: [isAuthenticated] as const,
    responses: {
      200: createSuccessRouteDefinition(blockedUsersResponseSchema, 'List of blocked users'),
      ...defaultResponses
    }
  })
  
  app.openapi(getBlockedUsersRoute, async (c) => {
    const currentUser = c.get('user').id
  
    const blockedUsers = await getBlockedUsers(currentUser)
  
    return sendSuccess(c, {
      blocked_users: blockedUsers
    }, 'Blocked users retrieved successfully')
  })