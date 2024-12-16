import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('user_profiles')
    .addColumn('timezone', 'varchar(50)', (col) => 
      col.notNull().defaultTo('Asia/Kolkata')
    )
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('user_profiles')
    .dropColumn('timezone')
    .execute()
}