import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('matching_queue')
		.dropColumn('age_max')
		.execute();

	await db.schema
		.alterTable('matching_queue')
		.dropColumn('age_min')
		.execute()
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('matching_queue')
		.addColumn('age_max', 'integer')
		.execute();

	await db.schema
		.alterTable('matching_queue')
		.addColumn('age_min', 'integer')
		.execute()
}
