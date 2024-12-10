import { db } from "@/database/database.js"
import { Selectable } from "kysely"
import { Users, UserProfiles, UserBlocks, UserReports, ReportReasons } from "@/database/db.js"

export const checkUserExists = async (userId: number): Promise<boolean> => {
  const user = await db
    .selectFrom("users")
    .select("id")
    .where("id", "=", userId)
    .executeTakeFirst()

  return !!user
}

export const getUserProfileById = async (userId: number): Promise<(Selectable<Users & { profile: Selectable<UserProfiles> }>) | undefined> => {
  const user = await db
    .selectFrom("users")
    .selectAll()
    .where("id", "=", userId)
    .executeTakeFirst()

  if (!user) return undefined

  const profile = await db
    .selectFrom("user_profiles")
    .selectAll()
    .where("user_id", "=", userId)
    .executeTakeFirst()

  if (!profile) return undefined

  return {
    ...user,
    profile
  }
}

export const getUserProfileByName = async (profileName: string): Promise<(Selectable<Users & { profile: Selectable<UserProfiles> }>) | undefined> => {
  const profile = await db
    .selectFrom("user_profiles")
    .selectAll()
    .where("profile_name", "=", profileName)
    .executeTakeFirst()

  if (!profile) return undefined

  return getUserProfileById(profile.user_id)
}

export const getUserBlockStatus = async (currentUser: number, targetUser: number): Promise<boolean> => {
  const block = await db
    .selectFrom("user_blocks")
    .selectAll()
    .where("blocker_id", "=", targetUser)  // targetUser has blocked currentUser
    .where("blocked_id", "=", currentUser)
    .executeTakeFirst()

  return !!block
}

export const blockUser = async (currentUser: number, targetUser: number): Promise<void> => {
  await db
    .insertInto("user_blocks")
    .values({
      blocker_id: currentUser,
      blocked_id: targetUser
    })
    .execute()
}

export const unblockUser = async (currentUser: number, targetUser: number): Promise<void> => {
  await db
    .deleteFrom("user_blocks")
    .where("blocker_id", "=", currentUser)
    .where("blocked_id", "=", targetUser)
    .execute()
}

export const getReportReason = async (code: string): Promise<Selectable<ReportReasons> | undefined> => {
  const reason = await db
    .selectFrom("report_reasons")
    .selectAll()
    .where("code", "=", code)
    .where("is_active", "=", 1)
    .executeTakeFirst()

  return reason
}


export const checkUserReportExists = async (currentUser: number, targetUser: number): Promise<boolean> => {
  const user = await db
    .selectFrom("user_reports")
    .select("id")
    .where("reporter_id", "=", currentUser)
    .where("reported_id", "=", targetUser)
    .executeTakeFirst()

  return !!user
}


export const reportUser = async (currentUser: number, targetUser: number, code: string): Promise<void> => {
  await db
    .insertInto("user_reports")
    .values({
      reporter_id: currentUser,
      reported_id: targetUser,
      reason_code: code
    })
    .execute()
}