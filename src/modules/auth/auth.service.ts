import { config } from "@/config/index.js";
import { db } from "@/database/database.js"
import { AuthUser } from "@/types/user.js";
import {sign} from 'hono/jwt'


export const createAuthToken = async (user: AuthUser): Promise<string> => {
    const payload = {
      user: {
        id: user.id,
        email: user.email
      }
    }
    
    return await sign(payload, config.jwt.secret)
  }

export const getUserWithProfileByEmail = async(email: string): Promise<AuthUser | null> => {
    const user = await db
        .selectFrom("users")
        .selectAll()
        .where("email","=",email)
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
