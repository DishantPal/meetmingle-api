import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Create static_pages table
  await db.schema
    .createTable('static_pages')
    .addColumn('id', 'bigint', (col) => 
      col.primaryKey().autoIncrement()
    )
    .addColumn('slug', 'varchar(100)', (col) =>
      col.notNull()
    )
    .addColumn('title', 'varchar(255)', (col) =>
      col.notNull()
    )
    .addColumn('content', 'text', (col) =>
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

  // Add unique constraint on slug
  await db.schema
    .alterTable('static_pages')
    .addUniqueConstraint('static_pages_slug_unique', ['slug'])
    .execute()

  // Create composite index on slug and is_active
  await db.schema
    .createIndex('idx_static_pages_slug')
    .on('static_pages')
    .columns(['slug', 'is_active'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('static_pages').execute()
}