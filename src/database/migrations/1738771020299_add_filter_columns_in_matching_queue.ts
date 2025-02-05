import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('matching_queue')
    .addColumn('filter_gender', 'text')
    .addColumn('filter_language', 'text')
    .addColumn('filter_country', 'text')
    .addColumn('filter_state', 'text')
    .addColumn('filter_age_min', 'integer')
    .addColumn('filter_age_max', 'integer')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('matching_queue')
    .dropColumn('filter_gender')
    .dropColumn('filter_language')
    .dropColumn('filter_country')
    .dropColumn('filter_state')
    .dropColumn('filter_age_min')
    .dropColumn('filter_age_max')
    .execute()
}