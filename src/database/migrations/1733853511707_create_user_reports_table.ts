import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('user_reports')
    .addColumn('id', 'bigint', (col) => 
      col.primaryKey().autoIncrement()
    )
    .addColumn('reporter_id', 'bigint', (col) =>
      col.notNull()
    )
    .addColumn('reported_id', 'bigint', (col) =>
      col.notNull()
    )
    .addColumn('reason_code', 'varchar(50)', (col) =>
      col.notNull()
    )
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute()

  // Create index for looking up reports
  await db.schema
    .createIndex('idx_user_reports_users')
    .on('user_reports')
    .columns(['reporter_id', 'reported_id'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('user_reports').execute()
}