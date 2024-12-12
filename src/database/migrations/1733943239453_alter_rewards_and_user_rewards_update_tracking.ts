import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Modify rewards table
  await db.schema
    .alterTable('rewards')
    .addColumn('reward_type', sql`enum('one_time', 'multiple', 'daily')`, (col) =>
      col.notNull().defaultTo('one_time')
    )
    .dropColumn('is_progression_based')
    .execute()

  // Index for reward type
  await db.schema
    .createIndex('idx_rewards_type')
    .on('rewards')
    .columns(['reward_type'])
    .execute()

  // Create index for daily reward checks
  await db.schema
    .createIndex('idx_user_rewards_daily_check')
    .on('user_rewards')
    .columns(['user_id', 'reward_code', 'created_at'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop indexes first
  await db.schema
    .dropIndex('idx_user_rewards_daily_check')
    .on('user_rewards')
    .execute()

  await db.schema
    .dropIndex('idx_rewards_type')
    .on('rewards')
    .execute()

  // Revert rewards table changes
  await db.schema
    .alterTable('rewards')
    .dropColumn('reward_type')
    .addColumn('is_progression_based', 'boolean', (col) => 
      col.defaultTo(false)
    )
    .execute()
}