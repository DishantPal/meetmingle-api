import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('report_reasons')
    .addColumn('id', 'bigint', (col) => 
      col.primaryKey().autoIncrement()
    )
    .addColumn('ban_reason_code', 'varchar(50)', (col) =>
      col.notNull().unique()
    )
    .addColumn('title', 'varchar(100)', (col) =>
      col.notNull()
    )
    .addColumn('desc', 'text', (col) =>
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
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('report_reasons').execute()
}