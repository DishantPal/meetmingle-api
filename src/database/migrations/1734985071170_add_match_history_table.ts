// add_match_history_table.ts
import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('match_history')
    .addColumn('id', 'bigint', (col) => 
      col.primaryKey().autoIncrement()
    )
    .addColumn('user1_id', 'bigint', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('user2_id', 'bigint', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('call_type', 'varchar(10)', (col) =>
      col.notNull()  // 'video' or 'audio'
    )
    .addColumn('start_time', 'timestamp', (col) => 
      col.notNull()
    )
    .addColumn('end_time', 'timestamp')  // Nullable as match might be ongoing
    .addColumn('duration_seconds', 'integer')  // Calculated when call ends
    .addColumn('end_reason', 'varchar(50)')  // null if ongoing, otherwise 'completed', 'rejected', 'timeout', etc.
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute()

  // Index for recent match checks
  await db.schema
    .createIndex('idx_match_history_recent')
    .on('match_history')
    .columns(['user1_id', 'user2_id', 'end_time'])
    .execute()

  // Index for user history lookup
  await db.schema
    .createIndex('idx_match_history_users')
    .on('match_history')
    .columns(['user1_id', 'user2_id'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('match_history').execute()
}