// add_matching_queue_table.ts
import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('matching_queue')
    .addColumn('id', 'bigint', (col) => 
      col.primaryKey().autoIncrement()
    )
    .addColumn('user_id', 'bigint', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    // Only mandatory field
    .addColumn('call_type', 'varchar(10)', (col) =>    // 'video' or 'audio'
      col.notNull()
    )
    // Optional filters
    .addColumn('gender', 'varchar(20)')
    .addColumn('preferred_language', 'varchar(50)')
    .addColumn('country', 'varchar(100)')
    .addColumn('age_min', 'integer')
    .addColumn('age_max', 'integer')
    .addColumn('interests', 'json')
    // Queue management
    .addColumn('status', 'varchar(20)', (col) =>
      col.notNull().defaultTo('waiting')
    )
    .addColumn('entry_time', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute()

  // Index for basic matching (call_type + status)
  await db.schema
    .createIndex('idx_matching_queue_basic')
    .on('matching_queue')
    .columns(['call_type', 'status', 'entry_time'])
    .execute()

  // Index for user lookup
  await db.schema
    .createIndex('idx_matching_queue_user')
    .on('matching_queue')
    .columns(['user_id'])
    .execute()

  // Composite index for common filter combinations
  await db.schema
    .createIndex('idx_matching_queue_filters')
    .on('matching_queue')
    .columns(['status', 'call_type', 'gender', 'preferred_language', 'country'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('matching_queue').execute()
}