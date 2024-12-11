import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('user_rewards')
    .addColumn('id', 'bigint', (col) => 
      col.primaryKey().autoIncrement()
    )
    .addColumn('user_id', 'bigint', (col) =>
      col.notNull()
    )
    .addColumn('reward_code', 'varchar(50)', (col) =>
      col.notNull()
    )
    .addColumn('status', sql`enum('pending', 'awarded', 'declined', 'expired')`, (col) =>
      col.notNull()
    )
    .addColumn('progress', 'integer')
    .addColumn('expires_at', 'timestamp')
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute()

  await db.schema
    .createIndex('idx_user_reward')
    .on('user_rewards')
    .columns(['user_id', 'reward_code'])
    .execute()

  await db.schema
    .createIndex('idx_user_rewards_status')
    .on('user_rewards')
    .columns(['status'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('user_rewards').execute()
}