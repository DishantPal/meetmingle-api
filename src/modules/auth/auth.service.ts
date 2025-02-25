import { config } from "@/config/index.js";
import { db } from "@/database/database.js"
import { UserProfiles } from "@/database/db.js";
import { AuthUser } from "@/types/user.js";
import { sign } from 'hono/jwt'
import { Insertable, sql } from "kysely";


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
    .where("deleted_at", "is", null)
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

export const getUserWithProfileById = async (userId: number): Promise<AuthUser | null> => {
  const user = await db
    .selectFrom("users")
    .selectAll()
    .where("id", "=", userId)
    .where("deleted_at", "is", null)
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
      deleted_at: null
    })
    .executeTakeFirst();

  // This will automatically create user profile with default profile name from email with Database trigger  
}


export const updateUserProfile = async (userId: number, profileData: Partial<Insertable<UserProfiles>>): Promise<void> => {
  
  const arrayColumns = [
    "interests",
    "hashtags",
    "looking_for",
    "personality_traits",
  ];

  const dbProfileData = Object.fromEntries(Object.entries(profileData).map(([key,value]) => arrayColumns.includes(key) ? [key, JSON.stringify(value)] : [key, value])) as Partial<Insertable<UserProfiles>>;

  await db
    .updateTable("user_profiles")
    .where("user_id", "=", userId)
    .set(dbProfileData)
    .executeTakeFirst();

  return;
};

export const deleteUserAccount = async (userId: number): Promise<void> => {
  await db.transaction().execute(async (trx) => {
    const randomString = Math.random().toString(36).substring(2, 8);

    await trx
      .updateTable("users")
      .where("id", "=", userId)
      .set({
        deleted_at: sql`NOW()`,
        email: sql`CONCAT('del_', ${randomString}, '_', email)` as any
      })
      .execute();
  });
};

export const getBlockedUsers = async (userId: number): Promise<Array<{
  id: number,
  profile_name: string | null,
  profile_image_url: string | null
}>> => {
  const blockedUsers = await db
    .selectFrom("user_blocks")
    .innerJoin("users", "users.id", "user_blocks.blocked_id")
    .innerJoin("user_profiles", "user_profiles.user_id", "users.id")
    .select([
      "users.id",
      "user_profiles.profile_name",
      "user_profiles.profile_image_url"
    ])
    .where("user_blocks.blocker_id", "=", userId)
    .where("users.deleted_at", "is", null)
    .execute()

  return blockedUsers
}

export const getUserCallStats = async (userId: number): Promise<{
  daily_call_count: number;
}> => {

  const userDailyCallCount = await db
    .selectFrom("match_history")
    .select(db.fn.count<number>("id").as("count"))
    .where(sql<boolean>`(user1_id = ${userId} OR user2_id = ${userId}) and start_time >= CURRENT_DATE() AND start_time < DATE_ADD(CURRENT_DATE(), INTERVAL 1 DAY)`)
    .executeTakeFirst()

  return {
    daily_call_count: Number(userDailyCallCount?.count ?? 0)
  };
};