import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('rewards')
    .addColumn('id', 'bigint', (col) => 
      col.primaryKey().autoIncrement()
    )
    .addColumn('title', 'varchar(255)', (col) =>
      col.notNull()
    )
    .addColumn('description', 'text', (col) =>
      col.notNull()
    )
    .addColumn('code', 'varchar(50)', (col) =>
      col.notNull().unique()
    )
    .addColumn('coins', 'integer', (col) =>
      col.notNull()
    )
    .addColumn('icon', 'varchar(255)', (col) =>
      col.notNull()
    )
    .addColumn('link', 'varchar(255)')
    .addColumn('is_progression_based', 'boolean', (col) => 
      col.defaultTo(false)
    )
    .addColumn('is_active', 'boolean', (col) => 
      col.defaultTo(false)
    )
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute()

  await db.schema
    .createIndex('idx_rewards_code')
    .on('rewards')
    .columns(['code'])
    .execute()

  await db.schema
    .createIndex('idx_rewards_active')
    .on('rewards')
    .columns(['is_active'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('rewards').execute()
}