// src/modules/match/match.service.ts
import { db } from "@/database/database.js"
import { Selectable } from "kysely"
import { MatchingQueue, MatchHistory } from "@/database/db.js"

interface MatchFilters {
  call_type: 'video' | 'audio';  // mandatory
  gender?: string;
  preferred_language?: string;
  country?: string;
  age_min?: number;
  age_max?: number;
  interests?: string[];
}

// Add user to matching queue
export const addToMatchingQueue = async (
  userId: number, 
  filters: MatchFilters
): Promise<void> => {
  // First check if user is already in queue
  const existingEntry = await db
    .selectFrom('matching_queue')
    .selectAll()
    .where('user_id', '=', userId)
    .where('status', '=', 'waiting')
    .executeTakeFirst()

  if (existingEntry) {
    throw new Error('User already in queue')
  }

  // Add to queue
  await db
    .insertInto('matching_queue')
    .values({
      user_id: userId,
      call_type: filters.call_type,
      gender: filters.gender,
      preferred_language: filters.preferred_language,
      country: filters.country,
      age_min: filters.age_min,
      age_max: filters.age_max,
      interests: filters.interests ? JSON.stringify(filters.interests) : null,
      status: 'waiting',
      entry_time: new Date()
    })
    .execute()
}

// Remove user from queue
export const removeFromQueue = async (userId: number): Promise<void> => {
  await db
    .deleteFrom('matching_queue')
    .where('user_id', '=', userId)
    .execute()
}

// Check if users were matched recently (within 24 hours)
export const checkRecentMatch = async (
  user1Id: number,
  user2Id: number
): Promise<boolean> => {
  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)

  const recentMatch = await db
    .selectFrom('match_history')
    .selectAll()
    .where(eb => eb.or([
      eb.and([
        eb('user1_id', '=', user1Id),
        eb('user2_id', '=', user2Id)
      ]),
      eb.and([
        eb('user1_id', '=', user2Id),
        eb('user2_id', '=', user1Id)
      ])
    ]))
    .where('end_time', '>', oneDayAgo)
    .executeTakeFirst()

  return !!recentMatch
}

// Find a match for user
export const findMatch = async (
  userId: number, 
  userFilters: MatchFilters
): Promise<Selectable<MatchingQueue> | undefined> => {
  // Get potential matches with strict call_type matching
  const potentialMatches = await db
    .selectFrom('matching_queue')
    .selectAll()
    .where('user_id', '!=', userId)
    .where('status', '=', 'waiting')
    .where('call_type', '=', userFilters.call_type) // Strict match on call_type
    .orderBy('entry_time', 'asc')
    .execute()

  // Filter matches based on criteria
  for (const match of potentialMatches) {
    // Skip if already matched recently
    const recentlyMatched = await checkRecentMatch(userId, match.user_id)
    if (recentlyMatched) continue

    // Check blocks
    const isBlocked = await checkUserBlocks(userId, match.user_id)
    if (isBlocked) continue

    // Apply filters if they exist
    if (!await areFiltersCompatible(userFilters, match)) continue

    // Found a match!
    return match
  }

  return undefined
}

// Start new match
export const startMatch = async (
  user1Id: number,
  user2Id: number,
  callType: 'video' | 'audio'
): Promise<void> => {
  await db
    .insertInto('match_history')
    .values({
      user1_id: user1Id,
      user2_id: user2Id,
      call_type: callType,
      start_time: new Date()
    })
    .execute()

  // Remove both users from queue
  await db
    .deleteFrom('matching_queue')
    .where('user_id', 'in', [user1Id, user2Id])
    .execute()
}

// End match
export const endMatch = async (
  user1Id: number,
  user2Id: number,
  endReason: string
): Promise<void> => {
  const match = await db
    .selectFrom('match_history')
    .selectAll()
    .where(eb => eb.or([
      eb.and([
        eb('user1_id', '=', user1Id),
        eb('user2_id', '=', user2Id)
      ]),
      eb.and([
        eb('user1_id', '=', user2Id),
        eb('user2_id', '=', user1Id)
      ])
    ]))
    .orderBy('start_time', 'desc')
    .limit(1)
    .executeTakeFirst()

  if (match) {
    const endTime = new Date()
    const durationSeconds = Math.floor(
      (endTime.getTime() - match.start_time.getTime()) / 1000
    )

    await db
      .updateTable('match_history')
      .set({
        end_time: endTime,
        duration_seconds: durationSeconds,
        end_reason: endReason
      })
      .where('id', '=', match.id)
      .execute()
  }
}

// Helper function to check user blocks
const checkUserBlocks = async (
  user1Id: number, 
  user2Id: number
): Promise<boolean> => {
  const block = await db
    .selectFrom('user_blocks')
    .selectAll()
    .where(eb => eb.or([
      eb.and([
        eb('blocker_id', '=', user1Id),
        eb('blocked_id', '=', user2Id)
      ]),
      eb.and([
        eb('blocker_id', '=', user2Id),
        eb('blocked_id', '=', user1Id)
      ])
    ]))
    .executeTakeFirst()

  return !!block
}

// Helper function to check filter compatibility
const areFiltersCompatible = async (
  filters1: MatchFilters,
  queueEntry: Selectable<MatchingQueue>
): Promise<boolean> => {
  // Helper function to check if filters match when either user specifies them
  const checkFilter = <T>(filter1: T | undefined, filter2: T | undefined): boolean => {
    if (filter1 && filter2 && filter1 !== filter2) return false
    return true
  }

  // Parse queue entry filters
  const filters2 = {
    gender: queueEntry.gender,
    preferred_language: queueEntry.preferred_language,
    country: queueEntry.country,
    interests: queueEntry.interests ? JSON.parse(queueEntry.interests as string) : undefined
  }

  // Check basic filters
  if (!checkFilter(filters1.gender, filters2.gender)) return false
  if (!checkFilter(filters1.preferred_language, filters2.preferred_language)) return false
  if (!checkFilter(filters1.country, filters2.country)) return false

  // Check interests if both users specified them
  if (filters1.interests?.length && filters2.interests?.length) {
    const commonInterests = filters1.interests.filter(
      interest => filters2.interests.includes(interest)
    )
    if (commonInterests.length === 0) return false
  }

  // Check age preferences if specified
  const userProfile = await getUserProfile(queueEntry.user_id)
  if (userProfile?.dob && filters1.age_min && filters1.age_max) {
    const age = calculateAge(new Date(userProfile.dob))
    if (age < filters1.age_min || age > filters1.age_max) return false
  }

  return true
}

// Helper to get user profile
const getUserProfile = async (userId: number) => {
  return db
    .selectFrom('user_profiles')
    .selectAll()
    .where('user_id', '=', userId)
    .executeTakeFirst()
}

// Helper to calculate age
const calculateAge = (birthDate: Date): number => {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}