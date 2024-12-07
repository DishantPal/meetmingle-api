import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { AuthUser } from '@/types/user.js'
import { verify } from 'hono/jwt'
import { db } from "@/database/database.js"
import { config } from '@/config/index.js'
import { AppError, ERROR_CODES } from '@/utils/response.js'
import { StatusCodes } from 'http-status-codes'
import { Env } from '@/types/app.js'

const decodeAuthToken = async (token: string): Promise<any> => {
    try {
        return await verify(token, config.jwt.secret)
    } catch (error) {
        return null
    }
}

const getUserWithProfileByUserId = async (id: number): Promise<AuthUser | null> => {
    const user = await db
        .selectFrom("users")
        .selectAll()
        .where("id", "=", id)
        .executeTakeFirst();

    if (!user) return null;

    const userProfile = await db
        .selectFrom("user_profiles")
        .selectAll()
        .where("user_id", "=", user.id)
        .executeTakeFirst();

    return {
        ...user,
        profile: userProfile
    };
}

export const isAuthenticated = async (c: Context<Env>, next: Next) => {
    const authHeader = c.req.header('Authorization')

    if (!authHeader?.startsWith('Bearer ')) {
        throw new AppError(StatusCodes.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED, 'Authorization header missing or invalid');
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
        throw new AppError(StatusCodes.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED, 'Authorization header missing or invalid');
    }

    // const decoded = await decodeAuthToken(token)

    // if (!decoded?.user?.id) {
    //     throw new AppError(StatusCodes.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED, 'Authorization header missing or invalid');
    // }

    // const user = await getUserWithProfileByUserId(Number(decoded.user.id))
    
    const user = await getUserWithProfileByUserId(Number(1))

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND, 'User not found');
    }

    if (user.is_banned) {
        throw new AppError(StatusCodes.FORBIDDEN, ERROR_CODES.FORBIDDEN, 'User access forbidden');
    }

    c.set('user', user)
    await next()
}