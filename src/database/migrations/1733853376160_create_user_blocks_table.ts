import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('user_blocks')
    .addColumn('id', 'bigint', (col) => 
      col.primaryKey().autoIncrement()
    )
    .addColumn('blocker_id', 'bigint', (col) =>
      col.notNull()
    )
    .addColumn('blocked_id', 'bigint', (col) =>
      col.notNull()
    )
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute()

  // Create composite index for quick lookups and ensure uniqueness
  await db.schema
    .createIndex('idx_user_blocks_users')
    .on('user_blocks')
    .columns(['blocker_id', 'blocked_id'])
    .unique()
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('user_blocks').execute()
}