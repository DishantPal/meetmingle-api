import { config } from "@/config/index.js";
import { db } from "@/database/database.js"
import { AuthUser } from "@/types/user.js";
import { sign } from 'hono/jwt'


export const createAuthToken = async (user: AuthUser): Promise<string> => {
  const payload = {
    user: {
      id: user.id,
      email: user.email
    }
  }

  return await sign(payload, config.jwt.secret)
}

export const getUserWithProfileByEmail = async (email: string): Promise<AuthUser | null> => {
  const user = await db
    .selectFrom("users")
    .selectAll()
    .where("email", "=", email)
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

type CreateUserInput = {
  email: string,
  provider_id: string,
  provider_type: string,
}

export const createUser = async (createUserInput: CreateUserInput): Promise<void> => {
  await db
    .insertInto("users")
    .values({
      email: createUserInput.email,
      provider_type: createUserInput.provider_type,
      provider_id: createUserInput.provider_id,
    })
    .executeTakeFirst();

  // This will automatically create user profile with default profile name from email with Database trigger  
}