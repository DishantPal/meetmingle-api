import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Create content_blocks table
  await db.schema
    .createTable('content_blocks')
    .addColumn('id', 'bigint', (col) => 
      col.primaryKey().autoIncrement()
    )
    .addColumn('purpose', 'varchar(100)', (col) =>
      col.notNull()
    )
    .addColumn('title', 'varchar(255)', (col) =>
      col.notNull()
    )
    .addColumn('content', 'json', (col) =>
      col.notNull()
    )
    .addColumn('type', 'varchar(50)', (col) =>
      col.notNull()
    )
    .addColumn('is_active', 'boolean', (col) => 
      col.notNull().defaultTo(true)
    )
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull()
    )
    .execute()

  // Add unique constraint on purpose
  await db.schema
    .alterTable('content_blocks')
    .addUniqueConstraint('content_blocks_purpose_unique', ['purpose'])
    .execute()

  // Create composite index on purpose and is_active
  await db.schema
    .createIndex('idx_content_blocks_identifier')
    .on('content_blocks')
    .columns(['purpose', 'is_active'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('content_blocks').execute()
}