import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('matching_queue')
		.addColumn('state', 'varchar(255)')
		.execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema
        .alterTable('matching_queue')
        .dropColumn('state')
        .execute()
}
