// src/modules/match/match.service.ts
import { db } from "@/database/database.js"
import { Selectable } from "kysely"
import { MatchingQueue, MatchHistory } from "@/database/db.js"
import { generateId } from "@/utils/generateId.js";
import CRC32 from "crc-32"

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

export const createMatchCoinTransactionForFilter = async (
  userId: number, 
  filter: 'age' | 'gender' | 'language' | 'state' | 'country'
): Promise<void> => {

  const filterPriceFromDb = await db
    .selectFrom('app_settings')
    .select('value')
    .where('group', '=', 'filter')
    .where('key', '=', `${filter}_filter_price`)
    .executeTakeFirst()

  const filterPrice = filterPriceFromDb ? parseInt(filterPriceFromDb.value) : 0;
  
  if (filterPrice <= 0) {
    return
  }

  await db.transaction().execute(async (trx) => {
    // Generate transaction ID using utility
    const transactionId = generateId()
    
    // Get current balance
    const lastTransaction = await trx
      .selectFrom("user_coin_transactions")
      .select("running_balance")
      .where("user_id", "=", userId)
      .orderBy("created_at", "desc")
      .limit(1)
      .executeTakeFirst()

    const currentBalance = lastTransaction?.running_balance || 0
    const newBalance = currentBalance - filterPrice

    // Generate checksum using CRC32
    const timestamp = new Date().toISOString()
    const checksumData = `${userId}${transactionId}${filterPrice}${timestamp}`
    const checksum = CRC32.str(checksumData).toString(16)

    // Create transaction
    await trx
      .insertInto("user_coin_transactions")
      .values({
        transaction_id: transactionId,
        user_id: userId,
        transaction_type: 'debit',
        action_type: 'match',
        amount: filterPrice,
        running_balance: newBalance,
        description: `${filter} used to match with a user`,
        reference_id: null,
        checksum: checksum
      })
      .execute()
  })
}

export const chargeFilterUsage = async (
  userId: number, 
  userFilters: MatchFilters
) => {

  if (userFilters.gender) {
    await createMatchCoinTransactionForFilter(userId, 'gender')
  }

  if (userFilters.preferred_language) {
    await createMatchCoinTransactionForFilter(userId, 'language')
  }

  if (userFilters.country) {
    await createMatchCoinTransactionForFilter(userId, 'country')
  }

  if (userFilters.state) {
    await createMatchCoinTransactionForFilter(userId, 'state')
  }

  if (userFilters.age) {
    await createMatchCoinTransactionForFilter(userId, 'age')
  }
}

export const getUserCoinBalance = async (userId: number): Promise<number> => {
  const lastTransaction = await db
    .selectFrom("user_coin_transactions")
    .select("running_balance")
    .where("user_id", "=", userId)
    .orderBy("created_at", "desc")
    .limit(1)
    .executeTakeFirst()

  return lastTransaction?.running_balance || 0
}

export const checkIfUserCanUseFilter = async (userId: number, userFilters: MatchFilters): Promise<boolean> => {

  const userBalance = await getUserCoinBalance(userId)
  
  const filterPriceCheck = async (filter: 'age' | 'gender' | 'language' | 'state' | 'country') => {
    const filterPriceFromDb = await db
        .selectFrom('app_settings')
        .select('value')
        .where('group', '=', 'filter')
        .where('key', '=', `${filter}_filter_price`)
        .executeTakeFirst()
  
      const filterPrice = filterPriceFromDb ? parseInt(filterPriceFromDb.value) : 0;
  
      if (userBalance < filterPrice) {
        return false
      } else {
        return true
      }
  }

  if (userFilters.gender) {
    if (!await filterPriceCheck('gender')) {
      return false
    }
  }

  if (userFilters.preferred_language) {
    if (!await filterPriceCheck('language')) {
      return false
    }
  }

  if (userFilters.country) {
    if (!await filterPriceCheck('country')) {
      return false
    }
  }

  if (userFilters.state) {
    if (!await filterPriceCheck('state')) {
      return false
    }
  }

  if (userFilters.age) {
    if (!await filterPriceCheck('age')) {
      return false
    }
  }

  return true
}

export const findMatch = async (
  userId: number, 
  userFilters: MatchFilters
 ): Promise<Selectable<MatchingQueue> | undefined> => {
  try {
     if(!await checkIfUserCanUseFilter(userId, userFilters)) {
       await removeFromQueue(userId)
       throw new Error('User does not have enough balance to use this filter');
     }
 
     // Start building the base query
     let query = db
       .selectFrom('matching_queue')
       .selectAll()
       .where('user_id', '!=', userId)
       .where('status', '=', 'waiting')
       .where('call_type', '=', userFilters.call_type)
       // Exclude blocked users using subquery
       .where(
         'user_id', 
         'not in', 
         db.selectFrom('user_blocks')
           .select('blocked_id')
           .where('blocker_id', '=', userId)
       )
       .where(
         'user_id',
         'not in',
         db.selectFrom('user_blocks')
           .select('blocker_id')
           .where('blocked_id', '=', userId)
       );
 
     // Add filters dynamically
     if (userFilters.gender) {
       query = query.where('gender', '=', userFilters.gender);
     }
 
     if (userFilters.preferred_language) {
       query = query.where('preferred_language', '=', userFilters.preferred_language);
     }
 
     if (userFilters.country) {
       query = query.where('country', '=', userFilters.country);
     }
 
     if (userFilters.state) {
       query = query.where('state', '=', userFilters.state);
     }
 
     // Handle age range
     if (userFilters.age_min !== undefined) {
       // User's max age should be greater than or equal to the filter's min age
       query = query.where('age_max', '>=', userFilters.age_min);
     }
 
     if (userFilters.age_max !== undefined) {
       // User's min age should be less than or equal to the filter's max age
       query = query.where('age_min', '<=', userFilters.age_max);
     }
 
     // Add sorting by wait time (entry_time)
     query = query.orderBy('entry_time', 'asc');
 
     // Execute the query
     const match = await query.executeTakeFirst();
     
     if (!match) return undefined;
 
     // Update both users' status
     await db
       .updateTable('matching_queue')
       .set({ status: 'matched' })
       .where('user_id', 'in', [userId, match.user_id])
       .execute()
 
     await chargeFilterUsage(userId, userFilters);
     await chargeFilterUsage(match.user_id, userFilters);    
 
     return match;
 
  } catch (error) {
    console.error('Error finding match:', error);
    throw error;
  }
 }

// // Find a match for user
// export const findMatch = async (
//  userId: number, 
//  userFilters: MatchFilters
// ): Promise<Selectable<MatchingQueue> | undefined> => {
//  try {

//     if(!await checkIfUserCanUseFilter(userId, userFilters)) {
//       await removeFromQueue(userId)
//       throw new Error('User does not have enough balance to use this filter');
//     }

//    // Get potential matches
//    const potentialMatches = await db
//      .selectFrom('matching_queue')
//      .selectAll()
//      .where('user_id', '!=', userId)
//      .where('status', '=', 'waiting')
//      .where('call_type', '=', userFilters.call_type) // Strict match on call_type
//      .orderBy('entry_time', 'asc')
//      .execute()

//    // Find first compatible match
//    for (const match of potentialMatches) {
//      // Skip if blocked
//      const isBlocked = await checkUserBlocks(userId, match.user_id)
//      if (isBlocked) continue

//      // Check if filters match
//      if (!await areFiltersCompatible(userFilters, match)) continue
     
//      // Found match - update both users' status
//      await db
//        .updateTable('matching_queue')
//        .set({ status: 'matched' })
//        .where('user_id', 'in', [userId, match.user_id])
//        .execute()

//       await chargeFilterUsage(userId, userFilters)
//       await chargeFilterUsage(match.user_id, userFilters)    

//       return match
//    }

//    return undefined
//  } catch (error) {
//    console.error('Error finding match:', error);
//    throw error;
//  }
// }

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

// // Helper: Check user blocks
// const checkUserBlocks = async (
//  user1Id: number, 
//  user2Id: number
// ): Promise<boolean> => {
//  try {
//    const block = await db
//      .selectFrom('user_blocks')
//      .selectAll()
//      .where(eb => eb.or([
//        eb.and([
//          eb('blocker_id', '=', user1Id),
//          eb('blocked_id', '=', user2Id)
//        ]),
//        eb.and([
//          eb('blocker_id', '=', user2Id),
//          eb('blocked_id', '=', user1Id)
//        ])
//      ]))
//      .executeTakeFirst()

//    return !!block
//  } catch (error) {
//    console.error('Error checking blocks:', error);
//    throw error;
//  }
// }

// // Helper: Check filter compatibility
// const areFiltersCompatible = async (
//  filters1: MatchFilters,
//  queueEntry: Selectable<MatchingQueue>
// ): Promise<boolean> => {
//  try {
//    const checkFilter = <T>(filter1: T | undefined, filter2: T | undefined): boolean => {
//      if (filter1 && filter2 && filter1 !== filter2) return false
//      return true
//    }

//    // Parse queue entry filters
//    const filters2 = {
//      gender: queueEntry.gender,
//      preferred_language: queueEntry.preferred_language,
//      country: queueEntry.country,
//      state: queueEntry.state,
//      interests: queueEntry.interests ? JSON.parse(queueEntry.interests as string) : undefined
//    }

//    // Check basic filters
//    if (!checkFilter(filters1.gender, filters2.gender)) return false
//    if (!checkFilter(filters1.preferred_language, filters2.preferred_language)) return false
//    if (!checkFilter(filters1.country, filters2.country)) return false
//    if (!checkFilter(filters1.state, filters2.state)) return false

//    // Check interests if both specified
//    if (filters1.interests?.length && filters2.interests?.length) {
//      const commonInterests = filters1.interests.filter(
//        interest => filters2.interests.includes(interest)
//      )
//      if (commonInterests.length === 0) return false
//    }

//    return true
//  } catch (error) {
//    console.error('Error checking filter compatibility:', error);
//    throw error;
//  }
// }