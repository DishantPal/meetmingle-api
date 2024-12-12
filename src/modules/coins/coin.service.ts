import { db } from "@/database/database.js"
import { Selectable, sql } from "kysely"
import { CoinPackages, Rewards, UserCoinTransactions, UserRewards } from "@/database/db.js"
import CRC32 from "crc-32"
import { generateId } from "@/utils/generateId.js"

export const getActivePackages = async (): Promise<Selectable<CoinPackages>[]> => {
  const packages = await db
    .selectFrom("coin_packages")
    .selectAll()
    .where("is_active", "=", 1)
    .orderBy("coins", "asc")
    .execute()

  return packages
}

// Get all active rewards
export const getActiveRewards = async (): Promise<Selectable<Rewards>[]> => {
  const rewards = await db
    .selectFrom("rewards")
    .selectAll()
    .where("is_active", "=", 1)
    .orderBy("rewards.reward_type", "asc")
    .orderBy("coins", "desc")
    .execute()

  return rewards
}

// Get user's reward statuses
export const getUserRewardStatuses = async (userId: number): Promise<Selectable<UserRewards>[]> => {
  const dailyRewards = await db
    .selectFrom("user_rewards")
    .selectAll()
    .innerJoin("rewards", "rewards.code", "user_rewards.reward_code")
    .where("user_rewards.user_id", "=", userId)
    .where("rewards.reward_type", "=", "daily")
    .where("user_rewards.created_at", ">", () => sql`CURRENT_DATE`)
    .execute()

  const nonDailyRewards = await db
    .selectFrom("user_rewards")
    .selectAll()
    .innerJoin("rewards", "rewards.code", "user_rewards.reward_code")
    .where("user_rewards.user_id", "=", userId)
    .where("rewards.reward_type", "<>", "daily")
    .where("user_rewards.status", "=", "awarded")
    .execute()

  return [...dailyRewards, ...nonDailyRewards]
}

export const getRewardByCode = async (code: string): Promise<Selectable<Rewards> | undefined> => {
  return db
    .selectFrom("rewards")
    .selectAll()
    .where("code", "=", code)
    .where("is_active", "=", 1)
    .executeTakeFirst()
}

export const isRewardClaimed = async (userId: number, code: string, rewardType: string): Promise<boolean> => {
  // For one_time rewards
  if (rewardType === 'one_time') {
    const claimed = await db
      .selectFrom("user_rewards")
      .select("id")
      .where("user_id", "=", userId)
      .where("reward_code", "=", code)
      .where("status", "=", "awarded")
      .executeTakeFirst()

    return !!claimed
  }

  // For daily rewards
  if (rewardType === 'daily') {
    const claimedToday = await db
      .selectFrom("user_rewards")
      .select("id")
      .where("user_id", "=", userId)
      .where("reward_code", "=", code)
      .where('created_at', '>=', () => sql`CURRENT_DATE`)
      .executeTakeFirst()

    return !!claimedToday
  }

  return false
}

export const createRewardClaim = async (userId: number, code: string): Promise<void> => {
  await db
    .insertInto("user_rewards")
    .values({
      user_id: userId,
      reward_code: code,
      status: "awarded",
    })
    .execute()
}

export const createCoinTransaction = async (
  userId: number, 
  amount: number,
  rewardCode: string,
  rewardTitle: string
): Promise<void> => {
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
    const newBalance = currentBalance + amount

    // Generate checksum using CRC32
    const timestamp = new Date().toISOString()
    const checksumData = `${userId}${transactionId}${amount}${timestamp}`
    const checksum = CRC32.str(checksumData).toString(16)

    // Create transaction
    await trx
      .insertInto("user_coin_transactions")
      .values({
        transaction_id: transactionId,
        user_id: userId,
        transaction_type: 'credit',
        action_type: 'reward',
        amount: amount,
        running_balance: newBalance,
        description: `Earned ${amount} coins from ${rewardTitle}`,
        reference_id: rewardCode,
        checksum: checksum
      })
      .execute()
  })
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


interface TransactionFilters {
  transaction_type?: 'credit' | 'debit' | null;
  action_type?: string;
  sort_by?: 'asc' | 'desc';
  page: number;
  limit: number;
}

export const getUserTransactions = async (
  userId: number, 
  filters: TransactionFilters
): Promise<{ transactions: Selectable<UserCoinTransactions>[], total: number }> => {
  // Base conditions for both queries
  const baseConditions = (qb: any) => {
    qb = qb.where("user_id", "=", userId)
    
    if (filters.transaction_type) {
      qb = qb.where("transaction_type", "=", filters.transaction_type)
    }

    if (filters.action_type) {
      qb = qb.where("action_type", "=", filters.action_type)
    }
    
    return qb
  }

  // Get total count
  const { count } = await baseConditions(
    db.selectFrom("user_coin_transactions")
    .select(db.fn.count<number>("id").as("count"))
  ).executeTakeFirst() as { count: number }

  // Get paginated transactions
  const transactions = await baseConditions(
    db.selectFrom("user_coin_transactions")
    .selectAll()
  )
    .orderBy("created_at", filters.sort_by || "desc")
    .limit(filters.limit)
    .offset((filters.page - 1) * filters.limit)
    .execute()

  return {
    transactions,
    total: count
  }
}