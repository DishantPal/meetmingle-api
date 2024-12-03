import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Create app_settings table
  await db.schema
    .createTable('app_settings')
    .addColumn('id', 'bigint', (col) => 
      col.primaryKey().autoIncrement()
    )
    .addColumn('key', 'varchar(100)', (col) =>
      col.notNull()
    )
    .addColumn('value', 'json', (col) =>
      col.notNull()
    )
    .addColumn('group', 'varchar(50)', (col) =>
      col.notNull()
    )
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull()
    )
    .execute()

  // Add unique constraint on key
  await db.schema
    .alterTable('app_settings')
    .addUniqueConstraint('app_settings_key_unique', ['key'])
    .execute()

  // Create composite index on group and key
  await db.schema
    .createIndex('idx_app_settings_group')
    .on('app_settings')
    .columns(['group', 'key'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('app_settings').execute()
}