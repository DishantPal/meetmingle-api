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

// Helper function to calculate age from DOB
const calculateAge = (dob: Date): number => {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

export const getUserEmailFromId = async (
  userId: number
): Promise<string | null | undefined> => {
  const user = await db
    .selectFrom('users')
    .select('email')
    .where('id', '=', userId)
    .executeTakeFirst()

  return user?.email;
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
      .executeTakeFirst();

    if (existingEntry) {
      throw new Error('User already in queue');
    }

    // Fetch user's profile data
    const userProfile = await db
      .selectFrom('user_profiles')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!userProfile) {
      throw new Error('User profile not found');
    }

    // Calculate age if DOB exists
    const age = userProfile.dob ? calculateAge(userProfile.dob) : null;

    // Parse age filter if provided
    let filter_age_min: number | null = null;
    let filter_age_max: number | null = null;
    if (filters.age) {
      const [ageMin, ageMax] = filters.age.split('-');
      filter_age_min = parseInt(ageMin || '0');
      filter_age_max = parseInt(ageMax || '100');
    }

    // Add to queue
    await db
      .insertInto('matching_queue')
      .values({
        user_id: userId,
        call_type: filters.call_type,
        // User's actual attributes from profile
        gender: userProfile.gender,
        preferred_language: userProfile.preferred_language,
        country: userProfile.country,
        state: userProfile.state,
        age: age,
        interests: userProfile.interests ? JSON.stringify(userProfile.interests) : null,
        // Filter preferences
        filter_gender: filters.gender || null,
        filter_language: filters.preferred_language || null,
        filter_country: filters.country || null,
        filter_state: filters.state || null,
        filter_age_min: filters.age_min || filter_age_min,
        filter_age_max: filters.age_max || filter_age_max,
        status: 'waiting',
        entry_time: new Date()
      })
      .execute();
  } catch (error) {
    console.error('Error adding to queue:', error);
    throw error;
  }
};

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
        description: `${filter} filter used to match with a user`,
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


// Find match
export const findMatch = async (
  userId: number,
  userFilters: MatchFilters
): Promise<Selectable<MatchingQueue> | undefined> => {
  try {
    if (!await checkIfUserCanUseFilter(userId, userFilters)) {
      await removeFromQueue(userId);
      throw new Error('User does not have enough balance to use this filter');
    }

    // Query 1: Find users that match our filter requirements based on their profiles
    let potentialMatchesQuery = db
      .selectFrom('matching_queue')
      .selectAll()
      .where('user_id', '!=', userId)
      .where('status', '=', 'waiting')
      .where('call_type', '=', userFilters.call_type)
      // Exclude blocked users
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

    // Add profile-based filters
    if (userFilters.gender) {
      potentialMatchesQuery = potentialMatchesQuery.where('gender', '=', userFilters.gender);
    }
    if (userFilters.preferred_language) {
      potentialMatchesQuery = potentialMatchesQuery.where('preferred_language', '=', userFilters.preferred_language);
    }
    if (userFilters.country) {
      potentialMatchesQuery = potentialMatchesQuery.where('country', '=', userFilters.country);
    }
    if (userFilters.state) {
      potentialMatchesQuery = potentialMatchesQuery.where('state', '=', userFilters.state);
    }
    if (userFilters.age) {
      const [ageMin, ageMax] = userFilters.age.split('-').map(age => parseInt(age));
      if (ageMin && !isNaN(ageMin)) {
        potentialMatchesQuery = potentialMatchesQuery.where('age', '>=', ageMin);
      }
      if (ageMax && !isNaN(ageMax)) {
        potentialMatchesQuery = potentialMatchesQuery.where('age', '<=', ageMax);
      }
    }

    // Get IDs of potential matches
    const potentialMatches = await potentialMatchesQuery.execute();

    if (potentialMatches.length === 0) {
      return undefined;
    }

    // Get current user's queue entry
    const currentUser = await db
      .selectFrom('matching_queue')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!currentUser) {
      throw new Error('Current user not found in queue');
    }

    // Query 2: From potential matches, find users whose filters match our profile
    const match = await db
      .selectFrom('matching_queue')
      .selectAll()
      .where('user_id', 'in', potentialMatches.map(m => m.user_id))
      .where(eb => eb.or([
        eb('filter_gender', 'is', null),
        eb('filter_gender', '=', currentUser.gender)
      ]))
      .where(eb => eb.or([
        eb('filter_language', 'is', null),
        eb('filter_language', '=', currentUser.preferred_language)
      ]))
      .where(eb => eb.or([
        eb('filter_country', 'is', null),
        eb('filter_country', '=', currentUser.country)
      ]))
      .where(eb => eb.or([
        eb('filter_state', 'is', null),
        eb('filter_state', '=', currentUser.state)
      ]))
      .where(eb => eb.or([
        eb.and([
          eb('filter_age_min', 'is', null),
          eb('filter_age_max', 'is', null)
        ]),
        eb.and([
          eb('filter_age_min', '<=', currentUser.age),
          eb('filter_age_max', '>=', currentUser.age)
        ])
      ]))
      .orderBy('entry_time', 'asc')
      .executeTakeFirst();

    if (!match) return undefined;

    // Update both users' status
    await db
      .updateTable('matching_queue')
      .set({ status: 'matched' })
      .where('user_id', 'in', [userId, match.user_id])
      .execute();

    await chargeFilterUsage(userId, userFilters);
    await chargeFilterUsage(match.user_id, userFilters);

    return match;

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