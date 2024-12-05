import { verify } from 'hono/jwt'
import { db } from "@/database/database.js"
import { AuthUser } from "@/types/user.js"
import { config } from '@/config/index.js'

interface JWTPayload {
  user: {
    id: string
    email: string
  }
}

export const decodeAuthToken = async (token: string): Promise<any> => {
  try {
    return await verify(token, config.jwt.secret)
  } catch (error) {
    return null
  }
}

// Keeping this separate from the module's getUserWithProfileByEmail
export const getUserWithProfileByUserId = async(id: number): Promise<AuthUser | null> => {
    const user = await db
        .selectFrom("users")
        .selectAll()
        .where("id","=",id)
        .executeTakeFirst();

    if(!user) return null;

    const userProfile = await db
        .selectFrom("user_profiles")    
        .selectAll()
        .where("user_id","=",user.id)
        .executeTakeFirst();

    return {
        ...user,
        profile: userProfile
    };
}
