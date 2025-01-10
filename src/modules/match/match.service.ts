// src/modules/match/match.service.ts
import { db } from "@/database/database.js"
import { Selectable } from "kysely"
import { MatchingQueue, MatchHistory } from "@/database/db.js"

interface MatchFilters {
  call_type: 'video' | 'audio';
  gender?: string;
  preferred_language?: string;
  country?: string;
  state?: string;
  age?: string;
  age_min?: number;
  age_max?: number;
  interests?: string[];
}

// Add user to matching queue
export const addToMatchingQueue = async (
 userId: number, 
 filters: MatchFilters
): Promise<void> => {
 try {
   // Check if already in queue
   const existingEntry = await db
     .selectFrom('matching_queue')
     .selectAll()
     .where('user_id', '=', userId)
     .where('status', '=', 'waiting')
     .executeTakeFirst()

   if (existingEntry) {
     throw new Error('User already in queue')
   }

   if (filters.age) {
     const [ageMin, ageMax] = filters.age.split('-')
     filters.age_min = parseInt(ageMin || '0')
     filters.age_max = parseInt(ageMax || '100')  
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
       state: filters.state,
       age_min: filters.age_min,
       age_max: filters.age_max,
       interests: filters.interests ? JSON.stringify(filters.interests) : null,
       status: 'waiting',
       entry_time: new Date()
     })
     .execute()
 } catch (error) {
   console.error('Error adding to queue:', error);
   throw error;
 }
}

// Remove user from queue
export const removeFromQueue = async (userId: number): Promise<void> => {
 try {
   await db
     .deleteFrom('matching_queue')
     .where('user_id', '=', userId)
     .execute()
 } catch (error) {
   console.error('Error removing from queue:', error);
   throw error;
 }
}

// Find a match for user
export const findMatch = async (
 userId: number, 
 userFilters: MatchFilters
): Promise<Selectable<MatchingQueue> | undefined> => {
 try {
   // Get potential matches
   const potentialMatches = await db
     .selectFrom('matching_queue')
     .selectAll()
     .where('user_id', '!=', userId)
     .where('status', '=', 'waiting')
     .where('call_type', '=', userFilters.call_type) // Strict match on call_type
     .orderBy('entry_time', 'asc')
     .execute()

   // Find first compatible match
   for (const match of potentialMatches) {
     // Skip if blocked
     const isBlocked = await checkUserBlocks(userId, match.user_id)
     if (isBlocked) continue

     // Check if filters match
     if (!await areFiltersCompatible(userFilters, match)) continue
     
     // Found match - update both users' status
     await db
       .updateTable('matching_queue')
       .set({ status: 'matched' })
       .where('user_id', 'in', [userId, match.user_id])
       .execute()

     return match
   }

   return undefined
 } catch (error) {
   console.error('Error finding match:', error);
   throw error;
 }
}

// Start new match
export const startMatch = async (
 user1Id: number,
 user2Id: number,
 callType: 'video' | 'audio'
): Promise<void> => {
 try {
   await db.transaction().execute(async (trx) => {
     // Create match history entry
     await trx
       .insertInto('match_history')
       .values({
         user1_id: user1Id,
         user2_id: user2Id,
         call_type: callType,
         start_time: new Date()
       })
       .execute()

     // Remove both users from queue
     await trx
       .deleteFrom('matching_queue')
       .where('user_id', 'in', [user1Id, user2Id])
       .execute()
   })
 } catch (error) {
   console.error('Error starting match:', error);
   throw error;
 }
}

// Helper: Check user blocks
const checkUserBlocks = async (
 user1Id: number, 
 user2Id: number
): Promise<boolean> => {
 try {
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
 } catch (error) {
   console.error('Error checking blocks:', error);
   throw error;
 }
}

// Helper: Check filter compatibility
const areFiltersCompatible = async (
 filters1: MatchFilters,
 queueEntry: Selectable<MatchingQueue>
): Promise<boolean> => {
 try {
   const checkFilter = <T>(filter1: T | undefined, filter2: T | undefined): boolean => {
     if (filter1 && filter2 && filter1 !== filter2) return false
     return true
   }

   // Parse queue entry filters
   const filters2 = {
     gender: queueEntry.gender,
     preferred_language: queueEntry.preferred_language,
     country: queueEntry.country,
     state: queueEntry.state,
     interests: queueEntry.interests ? JSON.parse(queueEntry.interests as string) : undefined
   }

   // Check basic filters
   if (!checkFilter(filters1.gender, filters2.gender)) return false
   if (!checkFilter(filters1.preferred_language, filters2.preferred_language)) return false
   if (!checkFilter(filters1.country, filters2.country)) return false
   if (!checkFilter(filters1.state, filters2.state)) return false

   // Check interests if both specified
   if (filters1.interests?.length && filters2.interests?.length) {
     const commonInterests = filters1.interests.filter(
       interest => filters2.interests.includes(interest)
     )
     if (commonInterests.length === 0) return false
   }

   return true
 } catch (error) {
   console.error('Error checking filter compatibility:', error);
   throw error;
 }
}