import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('user_profiles')
    .addColumn('profile_completed', 'boolean', (col) => 
      col.notNull().defaultTo(false)
    )
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('user_profiles')
    .dropColumn('profile_completed')
    .execute()
}