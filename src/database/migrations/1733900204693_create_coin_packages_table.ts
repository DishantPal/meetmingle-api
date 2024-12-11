import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('coin_packages')
    .addColumn('id', 'bigint', (col) => 
      col.primaryKey().autoIncrement()
    )
    .addColumn('name', 'varchar(255)', (col) =>
      col.notNull()
    )
    .addColumn('coins', 'integer', (col) =>
      col.notNull()
    )
    .addColumn('price', 'decimal(8, 2)', (col) =>
      col.notNull()
    )
    .addColumn('currency', 'varchar(3)', (col) =>
      col.notNull()
    )
    .addColumn('playstore_id', 'varchar(255)', (col) =>
      col.notNull()
    )
    .addColumn('icon', 'varchar(1000)', (col) =>
      col.notNull()
    )
    .addColumn('is_active', 'boolean', (col) => 
      col.notNull().defaultTo(false)
    )
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute()

  await db.schema
    .createIndex('idx_coin_packages_playstore')
    .on('coin_packages')
    .columns(['playstore_id'])
    .execute()

  await db.schema
    .createIndex('idx_coin_packages_active')
    .on('coin_packages')
    .columns(['is_active'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('coin_packages').execute()
}